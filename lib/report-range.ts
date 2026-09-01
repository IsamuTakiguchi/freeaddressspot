// レポートの期間指定（JST基準）

export interface ReportRange {
  from: string; // YYYY-MM-DD（含む）
  to: string; // YYYY-MM-DD（含む）
  label: string;
}

function jstToday(): Date {
  // JSTの「今日」を UTC Date として得る
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 3600_000);
  return new Date(
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate())
  );
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolveRange(rangeParam: string | undefined): ReportRange {
  const today = jstToday();

  if (rangeParam?.startsWith("month:")) {
    const [y, m] = rangeParam.slice(6).split("-").map(Number);
    if (y && m >= 1 && m <= 12) {
      const from = new Date(Date.UTC(y, m - 1, 1));
      const to = new Date(Date.UTC(y, m, 0));
      return { from: fmt(from), to: fmt(to), label: `${y}年${m}月` };
    }
  }

  const days = rangeParam === "7" ? 7 : rangeParam === "90" ? 90 : 30;
  const from = new Date(today.getTime() - (days - 1) * 86400_000);
  return { from: fmt(from), to: fmt(today), label: `直近${days}日` };
}

// 期間内の営業日数（土日を除く。祝日は考慮しない簡易版）
export function businessDays(from: string, to: string): number {
  let count = 0;
  const end = new Date(`${to}T00:00:00Z`).getTime();
  for (
    let t = new Date(`${from}T00:00:00Z`).getTime();
    t <= end;
    t += 86400_000
  ) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
