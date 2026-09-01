import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginButton from "./login-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  let next = params.next ?? "/map";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/map";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="text-center text-xl font-bold text-gray-900">
          フリーアドレス座席マップ
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          会社のGoogleアカウントでログインしてください
        </p>
        {params.error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {params.error}
          </p>
        )}
        <div className="mt-6">
          <LoginButton next={next} />
        </div>
      </div>
    </main>
  );
}
