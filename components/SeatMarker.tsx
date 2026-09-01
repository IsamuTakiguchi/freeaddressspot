"use client";

import type { Occupant, SeatLite } from "@/lib/map-types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";

// user_id から安定した色を割り当てる
const PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
];
function colorFor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}

function initials(name: string): string {
  const trimmed = name.trim();
  // 日本語名は先頭1文字、スペース区切りなら姓名の頭文字
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && /^[A-Za-z]/.test(trimmed)) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 1);
}

export default function SeatMarker({
  seat,
  occupant,
  isMe,
  highlighted,
  onClick,
}: {
  seat: SeatLite;
  occupant: Occupant | null;
  isMe: boolean;
  highlighted: boolean;
  onClick: () => void;
}) {
  const status = occupant?.profile.status ?? null;

  return (
    <button
      id={`seat-${seat.id}`}
      onClick={onClick}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${seat.x * 100}%`, top: `${seat.y * 100}%` }}
      title={
        occupant
          ? `${seat.label}: ${occupant.profile.display_name}${status ? `（${STATUS_LABELS[status]}）` : ""}`
          : `${seat.label}: 空席`
      }
    >
      {highlighted && (
        <span className="absolute top-0 h-8 w-8 -translate-y-1 animate-ping rounded-full bg-red-400 opacity-75" />
      )}
      {occupant ? (
        <>
          <span
            className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md ${colorFor(occupant.profile.id)} ${
              isMe ? "ring-2 ring-blue-600 ring-offset-1" : ""
            } ${highlighted ? "ring-2 ring-red-500 ring-offset-1" : ""}`}
          >
            {occupant.profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={occupant.profile.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initials(occupant.profile.display_name)
            )}
            {status && (
              <span
                className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border border-white ${STATUS_COLORS[status]}`}
              />
            )}
          </span>
          <span className="mt-0.5 max-w-24 truncate rounded bg-white/90 px-1 text-[10px] leading-tight text-gray-800 shadow-sm">
            {occupant.profile.display_name}
          </span>
        </>
      ) : (
        <span
          className={`h-3.5 w-3.5 rounded-full border-2 border-gray-400 bg-white/80 ${
            highlighted ? "ring-2 ring-red-500" : ""
          }`}
        />
      )}
    </button>
  );
}
