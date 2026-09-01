import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { query, queryOne } from "@/lib/db";
import { resolveRange } from "@/lib/report-range";

export const dynamic = "force-dynamic";

// 出社ログのCSVダウンロード（管理者のみ）
export async function GET(request: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return new NextResponse("unauthorized", { status: 401 });

  const me = await queryOne<{ is_admin: boolean }>(
    "select is_admin from profiles where id = $1",
    [uid]
  );
  if (!me?.is_admin) return new NextResponse("forbidden", { status: 403 });

  const { searchParams } = new URL(request.url);
  const range = resolveRange(searchParams.get("range") ?? undefined);

  const data = await query<{
    day: string;
    display_name: string;
    department: string | null;
  }>(
    `select day::text, display_name, department
       from attendance_days where day between $1 and $2
      order by day, display_name`,
    [range.from, range.to]
  );

  const esc = (v: string | null) =>
    v == null ? "" : /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const rows = [
    "日付,氏名,部署",
    ...data.map((r) => `${r.day},${esc(r.display_name)},${esc(r.department)}`),
  ];
  // ExcelでのUTF-8認識のためBOM付き
  const csv = "﻿" + rows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance_${range.from}_${range.to}.csv"`,
    },
  });
}
