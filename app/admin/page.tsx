import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { query, toIso } from "@/lib/db";
import { listFloors } from "@/lib/queries";
import FloorAdminList from "@/components/admin/FloorAdminList";
import AllowedEmailList from "@/components/admin/AllowedEmailList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin("/admin");
  const [floors, allowedEmails] = await Promise.all([
    listFloors(),
    query<{ email: string; note: string | null; created_at: Date }>(
      `select email, note, created_at from allowed_emails order by created_at`
    ),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">管理</h1>
        <Link href="/map" className="text-sm text-blue-700 hover:underline">
          ← 座席マップ
        </Link>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-bold text-gray-900">フロア管理</h2>
        <FloorAdminList initialFloors={floors} />
      </section>

      <AllowedEmailList
        initialEmails={allowedEmails.map((x) => ({
          ...x,
          created_at: toIso(x.created_at)!,
        }))}
        allowedDomain={process.env.ALLOWED_EMAIL_DOMAIN ?? null}
      />
    </main>
  );
}
