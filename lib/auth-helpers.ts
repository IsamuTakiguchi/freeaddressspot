import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { queryOne } from "@/lib/db";

// ログイン必須ページ/アクションの共通ガード。未ログインなら /login へ
export async function requireUser(next?: string): Promise<{ id: string }> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }
  return { id: uid };
}

// 管理者ガード。is_admin はJWTに入れず毎回DBで確認する（権限剥奪の即時反映のため）
export async function requireAdmin(next?: string): Promise<{ id: string }> {
  const user = await requireUser(next);
  const row = await queryOne<{ is_admin: boolean }>(
    "select is_admin from profiles where id = $1",
    [user.id]
  );
  if (!row?.is_admin) redirect("/map");
  return user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const row = await queryOne<{ is_admin: boolean }>(
    "select is_admin from profiles where id = $1",
    [userId]
  );
  return row?.is_admin ?? false;
}
