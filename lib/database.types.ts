// DBスキーマの型定義（db/migrations/0001_init.sql と対応）

export type UserStatus = "away" | "meeting" | "remote" | "out";
export type CheckOutReason = "manual" | "moved" | "auto_reset" | "takeover";

export interface Profile {
  id: string;
  google_sub: string;
  email: string;
  display_name: string;
  department: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  status: UserStatus | null;
  status_changed_at: string | null;
  created_at: string;
}

// 画像バイナリ（image_data）は配信ルート以外では取得しない
export interface Floor {
  id: string;
  name: string;
  image_mime: string;
  image_updated_at: string;
  image_width: number;
  image_height: number;
  sort_order: number;
  created_at: string;
}

export interface Seat {
  id: string;
  floor_id: string;
  label: string;
  x: number;
  y: number;
  is_active: boolean;
  created_at: string;
}

export interface SeatSession {
  id: string;
  seat_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  check_out_reason: CheckOutReason | null;
}

export type CheckInResult =
  | { status: "ok" }
  | { status: "already_here" }
  | { status: "occupied"; occupant: string }
  | { status: "conflict" }
  | { status: "invalid_seat" };
