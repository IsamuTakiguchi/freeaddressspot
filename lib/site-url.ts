// NFCタグに書き込むチェックインURLのベース。
// 本番では NEXT_PUBLIC_SITE_URL を設定する（未設定時はブラウザの origin）
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function checkinUrl(seatId: string): string {
  return `${siteUrl()}/checkin/${seatId}`;
}
