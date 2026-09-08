import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "座席マップ | フリーアドレスオフィス",
  description:
    "フリーアドレスオフィスで、誰がどこに座っているかを図面上で確認できます",
  // ホーム画面追加時のアプリ名（これが無いとタイトル頭文字が仮アイコンになる）
  appleWebApp: {
    title: "座席マップ",
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f4f6f9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
