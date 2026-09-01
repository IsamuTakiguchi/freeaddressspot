import { query, queryOne, toIso } from "@/lib/db";
import type { UserStatus } from "@/lib/database.types";
import type { ActiveSession, ProfileLite } from "@/lib/map-types";

// ---- マップ・チェックインで使う読み取りヘルパ ----

export interface FloorRow {
  id: string;
  name: string;
  image_updated_at: string;
  image_width: number;
  image_height: number;
  sort_order: number;
}

export async function listFloors(): Promise<FloorRow[]> {
  const rows = await query<{
    id: string;
    name: string;
    image_updated_at: Date;
    image_width: number;
    image_height: number;
    sort_order: number;
  }>(
    `select id, name, image_updated_at, image_width, image_height, sort_order
       from floors order by sort_order, created_at`
  );
  return rows.map((r) => ({ ...r, image_updated_at: toIso(r.image_updated_at)! }));
}

export interface SeatRow {
  id: string;
  floor_id: string;
  label: string;
  x: number;
  y: number;
  is_active: boolean;
}

export async function listSeats(options?: {
  floorId?: string;
  activeOnly?: boolean;
}): Promise<SeatRow[]> {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (options?.floorId) {
    params.push(options.floorId);
    conds.push(`floor_id = $${params.length}`);
  }
  if (options?.activeOnly) conds.push("is_active = true");
  const where = conds.length ? `where ${conds.join(" and ")}` : "";
  const rows = await query<{
    id: string;
    floor_id: string;
    label: string;
    x: string;
    y: string;
    is_active: boolean;
  }>(
    `select id, floor_id, label, x, y, is_active from seats ${where} order by label`,
    params
  );
  return rows.map((r) => ({ ...r, x: Number(r.x), y: Number(r.y) }));
}

export async function listActiveSessions(): Promise<ActiveSession[]> {
  const rows = await query<{
    id: string;
    seat_id: string;
    user_id: string;
    checked_in_at: Date;
  }>(
    `select id, seat_id, user_id, checked_in_at
       from seat_sessions where checked_out_at is null`
  );
  return rows.map((r) => ({ ...r, checked_in_at: toIso(r.checked_in_at)! }));
}

export async function listProfilesLite(): Promise<ProfileLite[]> {
  return query<{
    id: string;
    display_name: string;
    department: string | null;
    avatar_url: string | null;
    status: UserStatus | null;
  }>(
    `select id, display_name, department, avatar_url, status from profiles
      order by display_name`
  );
}

export async function getSeat(seatId: string) {
  return queryOne<{
    id: string;
    floor_id: string;
    label: string;
    is_active: boolean;
  }>(`select id, floor_id, label, is_active from seats where id = $1`, [seatId]);
}

export async function getFloorName(floorId: string): Promise<string> {
  const row = await queryOne<{ name: string }>(
    `select name from floors where id = $1`,
    [floorId]
  );
  return row?.name ?? "";
}

// 席の現在の占有者（いなければnull）
export async function getSeatOccupant(seatId: string) {
  return queryOne<{ user_id: string; display_name: string }>(
    `select ss.user_id, p.display_name
       from seat_sessions ss join profiles p on p.id = ss.user_id
      where ss.seat_id = $1 and ss.checked_out_at is null`,
    [seatId]
  );
}

// 自分のアクティブ着席（席ラベル付き）
export async function getMyActiveSeat(userId: string) {
  return queryOne<{ seat_id: string; label: string }>(
    `select ss.seat_id, s.label
       from seat_sessions ss join seats s on s.id = ss.seat_id
      where ss.user_id = $1 and ss.checked_out_at is null`,
    [userId]
  );
}
