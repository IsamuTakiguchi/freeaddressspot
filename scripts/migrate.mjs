// 純SQLマイグレーションランナー
// db/migrations/*.sql を辞書順に適用し、適用済みは schema_migrations に記録する。
// Railwayでは Pre-Deploy Command として `node scripts/migrate.mjs` を実行する想定。
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "db",
  "migrations"
);
const LOCK_KEY = 727274; // 任意の固定値（多重デプロイ時の直列化用）

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL が設定されていません");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: process.env.PGSSL === "1" ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);
  await client.query(`
    create table if not exists schema_migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    )`);

  const applied = new Set(
    (await client.query("select filename from schema_migrations")).rows.map(
      (r) => r.filename
    )
  );
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`applying ${file} ...`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into schema_migrations (filename) values ($1)",
        [file]
      );
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }
  console.log("migrations up to date");
} finally {
  await client.query("select pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
  await client.end();
}
