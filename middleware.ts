import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 全リクエストで Supabase セッションをリフレッシュする（@supabase/ssr の定石）
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() の呼び出しがトークンリフレッシュを発火させる
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 静的アセット以外すべて
    "/((?!_next/static|_next/image|favicon.ico|floors/).*)",
  ],
};
