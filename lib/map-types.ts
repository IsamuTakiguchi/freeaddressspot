import type { UserStatus } from "@/lib/database.types";

// マップ表示に必要な最小限の形（クライアントでJOINして使う）

export interface ProfileLite {
  id: string;
  display_name: string;
  department: string | null;
  avatar_url: string | null;
  status: UserStatus | null;
}

export interface ActiveSession {
  id: string;
  seat_id: string;
  user_id: string;
  checked_in_at: string;
}

export interface FloorLite {
  id: string;
  name: string;
  image_url: string;
  image_width: number;
  image_height: number;
}

export interface SeatLite {
  id: string;
  floor_id: string;
  label: string;
  x: number;
  y: number;
}

// 在席者（セッション+プロフィールの結合結果）
export interface Occupant {
  session: ActiveSession;
  profile: ProfileLite;
}
