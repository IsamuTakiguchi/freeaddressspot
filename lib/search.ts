// 人物検索用の文字列正規化とフィルタ
// NFKC正規化（全角/半角の吸収）+ 小文字化 + カタカナ→ひらがな変換

export function normalizeForSearch(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    )
    .replace(/\s+/g, "");
}

export function matchesQuery(
  query: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const q = normalizeForSearch(query);
  if (!q) return false;
  return fields.some((f) => f && normalizeForSearch(f).includes(q));
}
