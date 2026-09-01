"use server";

import { signIn } from "@/auth";

function safeNext(next: unknown): string {
  const n = String(next ?? "/map");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/map";
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeNext(formData.get("next")) });
}

// 開発用ログイン（ENABLE_DEV_LOGIN=1 のときのみ auth.ts 側でプロバイダが有効）
export async function devSignInAction(formData: FormData) {
  await signIn("dev-login", {
    email: String(formData.get("email") ?? ""),
    redirectTo: safeNext(formData.get("next")),
  });
}
