import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FloorAdminList from "@/components/admin/FloorAdminList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          管理者権限がありません。管理者に is_admin の付与を依頼してください。
        </p>
        <Link href="/map" className="mt-4 block text-sm text-blue-700">
          ← 座席マップへ戻る
        </Link>
      </main>
    );
  }

  const { data: floors } = await supabase
    .from("floors")
    .select("id, name, image_path, image_width, image_height, sort_order")
    .order("sort_order");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">フロア管理</h1>
        <Link href="/map" className="text-sm text-blue-700 hover:underline">
          ← 座席マップ
        </Link>
      </header>
      <FloorAdminList initialFloors={floors ?? []} />
    </main>
  );
}
