import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { listFloors } from "@/lib/queries";
import FloorAdminList from "@/components/admin/FloorAdminList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin("/admin");
  const floors = await listFloors();

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">フロア管理</h1>
        <Link href="/map" className="text-sm text-blue-700 hover:underline">
          ← 座席マップ
        </Link>
      </header>
      <FloorAdminList initialFloors={floors} />
    </main>
  );
}
