import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

// Railwayのヘルスチェック用（認証不要）。DB接続まで確認して200/503を返す
export async function GET() {
  try {
    await queryOne("select 1 as ok");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
