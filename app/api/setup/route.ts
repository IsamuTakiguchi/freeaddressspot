import { NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPool, query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

// 運用セットアップAPI（CRON_SECRETで保護）。
// DBコンソールに触れない環境からでも、HTTPS経由で初期セットアップと診断ができる。
//   { "action": "status" }                          … テーブル/件数の診断
//   { "action": "migrate" }                         … 未適用マイグレーションの適用
//   { "action": "grant_admin", "email": "..." }     … 管理者権限の付与
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new NextResponse("CRON_SECRET is not configured", { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  let body: { action?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  switch (body.action) {
    case "status": {
      const tables = await query<{ table_name: string }>(
        `select table_name from information_schema.tables
          where table_schema = 'public' order by table_name`
      );
      const tableNames = tables.map((t) => t.table_name);
      const counts: Record<string, number> = {};
      for (const t of ["profiles", "floors", "seats", "seat_sessions"]) {
        if (tableNames.includes(t)) {
          const row = await queryOne<{ n: string }>(
            `select count(*)::text as n from ${t}`
          );
          counts[t] = Number(row?.n ?? 0);
        }
      }
      const profiles = tableNames.includes("profiles")
        ? await query<{ email: string; is_admin: boolean }>(
            `select email, is_admin from profiles order by created_at limit 20`
          )
        : [];
      return NextResponse.json({
        tables: tableNames,
        counts,
        profiles,
        env: {
          allowed_email_domain: process.env.ALLOWED_EMAIL_DOMAIN ?? null,
          auth_url: process.env.AUTH_URL ?? null,
          auth_trust_host: process.env.AUTH_TRUST_HOST ?? null,
          has_google_id: !!process.env.AUTH_GOOGLE_ID,
          has_google_secret: !!process.env.AUTH_GOOGLE_SECRET,
          has_auth_secret: !!process.env.AUTH_SECRET,
          site_url: process.env.NEXT_PUBLIC_SITE_URL ?? null,
        },
      });
    }

    case "migrate": {
      const dir = join(process.cwd(), "db", "migrations");
      const client = await getPool().connect();
      const applied: string[] = [];
      try {
        await client.query("select pg_advisory_lock(727274)");
        await client.query(`
          create table if not exists schema_migrations (
            filename   text primary key,
            applied_at timestamptz not null default now()
          )`);
        const done = new Set(
          (await client.query("select filename from schema_migrations")).rows.map(
            (r: { filename: string }) => r.filename
          )
        );
        const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
        for (const file of files) {
          if (done.has(file)) continue;
          const sql = await readFile(join(dir, file), "utf8");
          await client.query("begin");
          try {
            await client.query(sql);
            await client.query(
              "insert into schema_migrations (filename) values ($1)",
              [file]
            );
            await client.query("commit");
            applied.push(file);
          } catch (e) {
            await client.query("rollback");
            throw e;
          }
        }
      } finally {
        await client.query("select pg_advisory_unlock(727274)").catch(() => {});
        client.release();
      }
      return NextResponse.json({ ok: true, applied });
    }

    case "grant_admin": {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email.includes("@")) {
        return NextResponse.json({ error: "email required" }, { status: 400 });
      }
      const row = await queryOne<{ id: string }>(
        `update profiles set is_admin = true where lower(email) = $1 returning id`,
        [email]
      );
      if (!row) {
        return NextResponse.json({
          ok: false,
          message:
            "該当ユーザーが見つかりません。先に一度アプリにGoogleログインしてください。",
        });
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
