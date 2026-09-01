import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

// フロア図面の配信（社内限定のため認証必須）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ floorId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const { floorId } = await params;
  const row = await queryOne<{
    image_data: Buffer;
    image_mime: string;
    image_updated_at: Date;
  }>(
    `select image_data, image_mime, image_updated_at from floors where id = $1`,
    [floorId]
  );
  if (!row) return new NextResponse("not found", { status: 404 });

  const etag = `"${row.image_updated_at.getTime()}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return new NextResponse(new Uint8Array(row.image_data), {
    headers: {
      "Content-Type": row.image_mime,
      ETag: etag,
      // URLに ?v= バスターが付くため immutable でよい
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
