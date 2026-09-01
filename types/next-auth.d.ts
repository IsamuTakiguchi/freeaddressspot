import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      // profiles.id（内部uuid）。auth.ts の session callback で設定される
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
