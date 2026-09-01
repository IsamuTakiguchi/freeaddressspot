import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listActiveSessions, listProfilesLite } from "@/lib/queries";

export const dynamic = "force-dynamic";

// マップのポーリング用: 在席セッション + 全プロフィール
// （floors/seats は変更頻度が低いためページ初期propsで渡し、ここには含めない）
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const [sessions, profiles] = await Promise.all([
    listActiveSessions(),
    listProfilesLite(),
  ]);

  return NextResponse.json(
    { sessions, profiles },
    { headers: { "Cache-Control": "no-store" } }
  );
}
