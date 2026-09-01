import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveRange } from "@/lib/report-range";

// 出社ログのCSVダウンロード（管理者のみ）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) return new NextResponse("forbidden", { status: 403 });

  const range = resolveRange(searchParams.get("range") ?? undefined);
  const { data, error } = await supabase
    .from("attendance_days")
    .select("day, display_name, department")
    .gte("day", range.from)
    .lte("day", range.to)
    .order("day");
  if (error) return new NextResponse(error.message, { status: 500 });

  const esc = (v: string | null) =>
    v == null ? "" : /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const rows = [
    "日付,氏名,部署",
    ...(data ?? []).map(
      (r) => `${r.day},${esc(r.display_name)},${esc(r.department)}`
    ),
  ];
  // ExcelでのUTF-8認識のためBOM付き
  const csv = "\uFEFF" + rows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance_${range.from}_${range.to}.csv"`,
    },
  });
}
