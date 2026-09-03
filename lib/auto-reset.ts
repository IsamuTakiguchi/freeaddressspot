import { query } from "@/lib/db";

// 深夜リセット（アプリ内蔵スケジューラ）
// 不変条件:「JST 4:00 をまたいだ着席・ステータスは残さない」
// 直近の JST 4:00（境界）より前に始まったアクティブ着席を auto_reset でクローズする。
// 毎分チェックする冪等な処理なので、再起動・多重実行があっても安全。

const JST_OFFSET_MS = 9 * 3600_000;
const RESET_HOUR_JST = 4;

// 直近の「JST 4:00」をUTCのDateで返す
export function lastResetBoundary(now = Date.now()): Date {
  const jst = new Date(now + JST_OFFSET_MS);
  let boundary =
    Date.UTC(
      jst.getUTCFullYear(),
      jst.getUTCMonth(),
      jst.getUTCDate(),
      RESET_HOUR_JST
    ) - JST_OFFSET_MS;
  if (boundary > now) boundary -= 86400_000; // まだ今日の4時前なら前日の4時
  return new Date(boundary);
}

export async function runAutoReset(): Promise<void> {
  const boundary = lastResetBoundary();

  const sessions = await query(
    `update seat_sessions
        set checked_out_at = now(), check_out_reason = 'auto_reset'
      where checked_out_at is null and checked_in_at < $1
      returning id`,
    [boundary]
  );
  const statuses = await query(
    `update profiles
        set status = null, status_changed_at = now()
      where status is not null
        and (status_changed_at is null or status_changed_at < $1)
      returning id`,
    [boundary]
  );

  if (sessions.length > 0 || statuses.length > 0) {
    console.log(
      `[auto-reset] closed ${sessions.length} sessions, cleared ${statuses.length} statuses (boundary: ${boundary.toISOString()})`
    );
  }
}
