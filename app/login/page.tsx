import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { devSignInAction, googleSignInAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: process.env.ALLOWED_EMAIL_DOMAIN
    ? `会社のGoogleアカウント（@${process.env.ALLOWED_EMAIL_DOMAIN}）でログインしてください`
    : "このアカウントではログインできません",
  Configuration: "認証の設定に問題があります。管理者にお問い合わせください。",
  Verification: "ログインの有効期限が切れました。もう一度お試しください。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  let next = params.next ?? "/map";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/map";

  const session = await auth();
  if (session?.user?.id) redirect(next);

  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? "ログインに失敗しました")
    : null;
  const devLogin =
    process.env.ENABLE_DEV_LOGIN === "1" &&
    process.env.NODE_ENV !== "production";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="text-center text-xl font-bold text-gray-900">
          フリーアドレス座席マップ
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          会社のGoogleアカウントでログインしてください
        </p>
        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        <form action={googleSignInAction} className="mt-6">
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Googleアカウントでログイン
          </button>
        </form>

        {devLogin && (
          <form
            action={devSignInAction}
            className="mt-6 space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3"
          >
            <p className="text-xs font-medium text-amber-800">
              開発用ログイン（ENABLE_DEV_LOGIN=1）
            </p>
            <input type="hidden" name="next" value={next} />
            <input
              name="email"
              type="email"
              required
              placeholder="dev@example.co.jp"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              このメールアドレスでログイン
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
