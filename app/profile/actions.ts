"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUserStatus } from "@/lib/status";

// 表示名・部署の自己編集
export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインしてください");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  if (!displayName) throw new Error("表示名を入力してください");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      department: department || null,
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/map");
}

// ステータス切替（null = 通常に戻す）
export async function setStatusAction(status: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインしてください");

  const value = status && isUserStatus(status) ? status : null;

  const { error } = await supabase
    .from("profiles")
    .update({ status: value, status_changed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/map");
}
