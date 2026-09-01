import type { UserStatus } from "@/lib/database.types";

export const STATUS_LABELS: Record<UserStatus, string> = {
  away: "離席中",
  meeting: "会議中",
  remote: "在宅勤務",
  out: "外出中",
};

// マーカーバッジ・リスト表示用の色
export const STATUS_COLORS: Record<UserStatus, string> = {
  away: "bg-gray-400",
  meeting: "bg-amber-400",
  remote: "bg-sky-400",
  out: "bg-purple-400",
};

// 未着席でもマップ横の「オフィス外」リストに出すステータス
export const OFFSITE_STATUSES: UserStatus[] = ["remote", "out"];

export function isUserStatus(v: string): v is UserStatus {
  return v === "away" || v === "meeting" || v === "remote" || v === "out";
}
