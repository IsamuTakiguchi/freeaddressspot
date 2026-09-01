"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { query } from "@/lib/db";
import { isUserStatus } from "@/lib/status";

// 表示名・部署の自己編集
export async function updateProfileAction(formData: FormData) {
  const user = await requireUser("/map");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  if (!displayName) throw new Error("表示名を入力してください");

  await query(
    `update profiles set display_name = $1, department = $2 where id = $3`,
    [displayName, department || null, user.id]
  );
  revalidatePath("/map");
}

// ステータス切替（null = 通常に戻す）
export async function setStatusAction(status: string | null) {
  const user = await requireUser("/map");
  const value = status && isUserStatus(status) ? status : null;

  await query(
    `update profiles set status = $1, status_changed_at = now() where id = $2`,
    [value, user.id]
  );
  revalidatePath("/map");
}
