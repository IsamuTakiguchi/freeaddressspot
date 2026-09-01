import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { queryOne } from "@/lib/db";

// 許可メールドメイン（未設定 or '*' で全許可）
const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;

// 開発用ログイン（メールアドレスだけでログイン）。
// production ビルドでは環境変数が設定されていても常に無効になる
const devLoginEnabled =
  process.env.ENABLE_DEV_LOGIN === "1" &&
  process.env.NODE_ENV !== "production";

function domainAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  if (!allowedDomain || allowedDomain === "*") return true;
  return email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`);
}

// Google sub（またはdevログインのキー）から profiles を upsert して内部uuidを返す
async function upsertProfile(input: {
  googleSub: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `insert into profiles (google_sub, email, display_name, avatar_url)
     values ($1, $2, $3, $4)
     on conflict (google_sub) do update
       set email = excluded.email,
           avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url)
       -- display_name はユーザーの自己編集を尊重して上書きしない
     returning id`,
    [
      input.googleSub,
      input.email,
      input.name?.trim() || input.email.split("@")[0],
      input.avatarUrl ?? null,
    ]
  );
  return row!.id;
}

const config: NextAuthConfig = {
  providers: [
    Google,
    ...(devLoginEnabled
      ? [
          Credentials({
            id: "dev-login",
            name: "開発用ログイン",
            credentials: { email: { label: "メールアドレス" } },
            async authorize(credentials) {
              const email = String(credentials?.email ?? "").trim().toLowerCase();
              if (!email.includes("@") || !domainAllowed(email)) return null;
              return { id: `dev:${email}`, email, name: email.split("@")[0] };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "dev-login") return true; // authorizeで検証済み
      return domainAllowed(user.email);
    },
    async jwt({ token, account, user }) {
      // 初回サインイン時のみ profiles を upsert して内部uuidをJWTへ
      if (account) {
        const googleSub =
          account.provider === "dev-login"
            ? String(user.id)
            : account.providerAccountId;
        token.uid = await upsertProfile({
          googleSub,
          email: user.email!,
          name: user.name,
          avatarUrl: user.image,
        });
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
