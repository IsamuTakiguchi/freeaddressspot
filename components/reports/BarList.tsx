// テーブル + CSSバーの簡易横棒グラフ
export default function BarList({
  items,
  unit,
}: {
  items: { label: string; sub?: string; value: number; display?: string }[];
  unit?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span className="w-32 shrink-0 truncate text-gray-700" title={item.label}>
            {item.label}
            {item.sub && (
              <span className="ml-1 text-xs text-gray-400">{item.sub}</span>
            )}
          </span>
          <span className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
            <span
              className="absolute inset-y-0 left-0 rounded bg-blue-500/80"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="w-20 shrink-0 text-right text-xs tabular-nums text-gray-600">
            {item.display ?? `${item.value}${unit ?? ""}`}
          </span>
        </li>
      ))}
      {items.length === 0 && (
        <li className="text-sm text-gray-400">期間内のデータがありません</li>
      )}
    </ul>
  );
}
