// OpenNext (Cloudflare Workers) 設定
// 本アプリは全ページ動的レンダリングのため、ISRキャッシュ用のR2/KVバインディングは不要
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
