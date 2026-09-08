import type { MetadataRoute } from "next";

// PWAマニフェスト: ホーム画面追加時のアプリ名・アイコン・表示モード
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "座席マップ",
    short_name: "座席マップ",
    description: "フリーアドレスオフィスの在席状況を図面上で確認",
    start_url: "/map",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
