import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { queryOne, toIso } from "@/lib/db";
import { listSeats } from "@/lib/queries";
import { floorImageUrl } from "@/lib/floor-image";
import FloorEditor from "@/components/admin/FloorEditor";

export const dynamic = "force-dynamic";

export default async function FloorEditPage({
  params,
}: {
  params: Promise<{ floorId: string }>;
}) {
  const { floorId } = await params;
  await requireAdmin(`/admin/floors/${floorId}`);

  const floor = await queryOne<{
    id: string;
    name: string;
    image_updated_at: Date;
    image_width: number;
    image_height: number;
  }>(
    `select id, name, image_updated_at, image_width, image_height
       from floors where id = $1`,
    [floorId]
  );
  if (!floor) notFound();

  const seats = await listSeats({ floorId });

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">
          座席配置: {floor.name}
        </h1>
        <Link href="/admin" className="text-sm text-blue-700 hover:underline">
          ← フロア管理
        </Link>
      </header>
      <FloorEditor
        floor={{
          id: floor.id,
          name: floor.name,
          image_url: floorImageUrl({
            id: floor.id,
            image_updated_at: toIso(floor.image_updated_at)!,
          }),
          image_width: floor.image_width,
          image_height: floor.image_height,
        }}
        initialSeats={seats}
      />
    </main>
  );
}
