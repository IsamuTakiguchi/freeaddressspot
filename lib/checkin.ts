import { getPool } from "@/lib/db";
import type { CheckInResult } from "@/lib/database.types";

// チェックイン処理
// - 対象席のアクティブ行を FOR UPDATE でロックして直列化
// - 「1人1席・1席1人」は partial unique index が最終防衛線（同時タップは 23505 で敗者確定）
export async function checkIn(
  userId: string,
  seatId: string,
  force: boolean
): Promise<CheckInResult> {
  const client = await getPool().connect();
  try {
    await client.query("begin");

    const seat = await client.query<{ id: string; is_active: boolean }>(
      "select id, is_active from seats where id = $1",
      [seatId]
    );
    if (!seat.rows[0]?.is_active) {
      await client.query("rollback");
      return { status: "invalid_seat" };
    }

    const occupant = await client.query<{
      id: string;
      user_id: string;
      display_name: string;
    }>(
      `select ss.id, ss.user_id, p.display_name
         from seat_sessions ss join profiles p on p.id = ss.user_id
        where ss.seat_id = $1 and ss.checked_out_at is null
        for update of ss`,
      [seatId]
    );

    const current = occupant.rows[0];
    if (current && current.user_id === userId) {
      await client.query("commit");
      return { status: "already_here" }; // 同じ席の再タップは冪等
    }
    if (current) {
      if (!force) {
        await client.query("rollback");
        return { status: "occupied", occupant: current.display_name };
      }
      // 前の利用者がタップせず離れた場合の救済（強制着席）
      await client.query(
        `update seat_sessions
            set checked_out_at = now(), check_out_reason = 'takeover'
          where id = $1`,
        [current.id]
      );
    }

    // 自分の既存着席は「移動」としてクローズ
    await client.query(
      `update seat_sessions
          set checked_out_at = now(), check_out_reason = 'moved'
        where user_id = $1 and checked_out_at is null`,
      [userId]
    );

    await client.query(
      "insert into seat_sessions (seat_id, user_id) values ($1, $2)",
      [seatId, userId]
    );

    // 着席したら在宅/外出等のステータスは解除
    await client.query(
      `update profiles set status = null, status_changed_at = now()
        where id = $1 and status is not null`,
      [userId]
    );

    await client.query("commit");
    return { status: "ok" };
  } catch (e) {
    await client.query("rollback").catch(() => {});
    if ((e as { code?: string }).code === "23505") {
      return { status: "conflict" }; // 同時タップの敗者
    }
    throw e;
  } finally {
    client.release();
  }
}

export async function checkOut(userId: string): Promise<void> {
  await getPool().query(
    `update seat_sessions
        set checked_out_at = now(), check_out_reason = 'manual'
      where user_id = $1 and checked_out_at is null`,
    [userId]
  );
}
