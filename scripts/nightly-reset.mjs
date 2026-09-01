// 深夜リセット: 全アクティブ着席をクローズし、ステータスも解除する。
// Railway の Cron Schedule（例: 0 19 * * * = JST 4:00）で実行する想定。
// 実行後は必ずプロセス終了すること（Railway cronの要件）。
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "1" ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  const sessions = await client.query(
    `update seat_sessions
        set checked_out_at = now(), check_out_reason = 'auto_reset'
      where checked_out_at is null`
  );
  const statuses = await client.query(
    `update profiles set status = null, status_changed_at = now()
      where status is not null`
  );
  console.log(
    `nightly reset done: ${sessions.rowCount} sessions closed, ${statuses.rowCount} statuses cleared`
  );
} finally {
  await client.end();
}
