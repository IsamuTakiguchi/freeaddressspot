import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google OAuth コールバック: code をセッションに交換して元のページへ戻す
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/map";
  // open redirect 防止: アプリ内パスのみ許可
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/map";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // ドメイン制限トリガーで拒否された場合など
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`
    );
  }

  const errorDescription = searchParams.get("error_description");
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(errorDescription ?? "ログインに失敗しました")}&next=${encodeURIComponent(next)}`
  );
}
