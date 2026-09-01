import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkIn, checkOut } from "@/lib/checkin";

export const dynamic = "force-dynamic";

// 開発環境専用: チェックインAPIの直接呼び出し（同時実行テスト等に使う）。
// 本番では常に404（チェックインは /checkin/[seatId] の server action のみ）
export async function POST(request: Request) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEV_LOGIN !== "1"
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    seatId?: string;
    force?: boolean;
    checkout?: boolean;
  };
  if (body.checkout) {
    await checkOut(session.user.id);
    return NextResponse.json({ status: "checked_out" });
  }
  if (!body.seatId) return new NextResponse("seatId required", { status: 400 });

  const result = await checkIn(session.user.id, body.seatId, !!body.force);
  return NextResponse.json(result);
}
