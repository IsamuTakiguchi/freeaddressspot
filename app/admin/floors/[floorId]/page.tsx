import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { floorImageUrl } from "@/lib/floor-image";
import FloorEditor from "@/components/admin/FloorEditor";

export const dynamic = "force-dynamic";

export default async function FloorEditPage({
  params,
}: {
  params: Promise<{ floorId: string }>;
}) {
  const { floorId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/floors/${floorId}`)}`);

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/admin");

  const { data: floor } = await supabase
    .from("floors")
    .select("id, name, image_path, image_width, image_height")
    .eq("id", floorId)
    .maybeSingle();
  if (!floor) notFound();

  const { data: seats } = await supabase
    .from("seats")
    .select("id, floor_id, label, x, y, is_active")
    .eq("floor_id", floorId)
    .order("label");

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
          image_url: floorImageUrl(floor),
          image_width: floor.image_width,
          image_height: floor.image_height,
        }}
        initialSeats={(seats ?? []).map((s) => ({
          ...s,
          x: Number(s.x),
          y: Number(s.y),
        }))}
      />
    </main>
  );
}
