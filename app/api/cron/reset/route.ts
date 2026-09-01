import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// 深夜リセットの予備経路（外部スケジューラやGitHub Actionsから叩ける）。
// 主系は Railway cron + scripts/nightly-reset.mjs
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new NextResponse("CRON_SECRET is not configured", { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  await query(
    `update seat_sessions
        set checked_out_at = now(), check_out_reason = 'auto_reset'
      where checked_out_at is null`
  );
  await query(
    `update profiles set status = null, status_changed_at = now()
      where status is not null`
  );
  return NextResponse.json({ ok: true });
}
