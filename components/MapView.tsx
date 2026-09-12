"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOccupancy } from "@/hooks/useOccupancy";
import type {
  ActiveSession,
  FloorLite,
  Occupant,
  ProfileLite,
  SeatLite,
} from "@/lib/map-types";
import { OFFSITE_STATUSES, STATUS_LABELS } from "@/lib/status";
import FloorMap from "@/components/FloorMap";
import MyStatusBar from "@/components/MyStatusBar";
import OffsiteList from "@/components/OffsiteList";
import LogoutButton from "@/components/LogoutButton";
import { LogoType } from "@/components/Logo";

// マップ枠の高さ上限（ヘッダー・ステータスバー・余白を除いた画面の残り）
const MAP_MAX_HEIGHT = "calc(100dvh - 16rem)";

export default function MapView({
  floors,
  seats,
  initialSessions,
  initialProfiles,
  myUserId,
  isAdmin,
}: {
  floors: FloorLite[];
  seats: SeatLite[];
  initialSessions: ActiveSession[];
  initialProfiles: ProfileLite[];
  myUserId: string;
  isAdmin: boolean;
}) {
  const { sessions, profiles, refetch } = useOccupancy(
    initialSessions,
    initialProfiles
  );
  const [floorId, setFloorId] = useState<string | null>(
    floors[0]?.id ?? null
  );
  const [highlightSeatId, setHighlightSeatId] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatLite | null>(null);

  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles]
  );
  const seatById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);
  const floorById = useMemo(
    () => new Map(floors.map((f) => [f.id, f])),
    [floors]
  );

  // seat_id -> 在席者
  const occupantsBySeat = useMemo(() => {
    const map = new Map<string, Occupant>();
    for (const session of sessions) {
      const profile = profileById.get(session.user_id);
      if (profile) map.set(session.seat_id, { session, profile });
    }
    return map;
  }, [sessions, profileById]);

  const me = profileById.get(myUserId) ?? null;
  const mySession = sessions.find((s) => s.user_id === myUserId) ?? null;
  const mySeat = mySession ? seatById.get(mySession.seat_id) ?? null : null;
  const mySeatLabel = mySeat
    ? `${floorById.get(mySeat.floor_id)?.name ?? ""} ${mySeat.label}`.trim()
    : null;

  const offsiteProfiles = useMemo(() => {
    const seatedIds = new Set(sessions.map((s) => s.user_id));
    return profiles.filter(
      (p) =>
        !seatedIds.has(p.id) && p.status && OFFSITE_STATUSES.includes(p.status)
    );
  }, [profiles, sessions]);

  const currentFloor = floorId ? floorById.get(floorId) ?? null : null;
  const currentSeats = useMemo(
    () => seats.filter((s) => s.floor_id === floorId),
    [seats, floorId]
  );
  const selectedOccupant = selectedSeat
    ? occupantsBySeat.get(selectedSeat.id) ?? null
    : null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f5f5f7]/75 backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <h1>
            <LogoType />
          </h1>
          <nav className="flex items-center gap-1 text-sm">
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-1.5 font-medium text-blue-600 active:opacity-60"
                >
                  管理
                </Link>
                <Link
                  href="/reports"
                  className="rounded-full px-3 py-1.5 font-medium text-blue-600 active:opacity-60"
                >
                  レポート
                </Link>
              </>
            )}
            <span className="px-1.5">
              <LogoutButton />
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-3 p-3 sm:p-4">
      {me && (
        <div className="anim-rise rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)] dark:bg-[#1c1c1e]">
          <MyStatusBar me={me} mySeatLabel={mySeatLabel} onChanged={refetch} />
        </div>
      )}

      {floors.length > 1 && (
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-black/5 p-1 dark:bg-white/10">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFloorId(f.id);
                setHighlightSeatId(null);
                setSelectedSeat(null);
              }}
              className={`min-h-10 shrink-0 flex-1 rounded-lg px-4 text-sm font-medium transition-colors ${
                f.id === floorId
                  ? "bg-white text-gray-900 shadow-sm dark:bg-[#3a3a3c] dark:text-gray-100"
                  : "text-gray-500 active:bg-white/60 dark:text-gray-400 dark:active:bg-white/10"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <div
        className="anim-rise-2 relative mx-auto w-full overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)] dark:bg-[#1c1c1e]"
        style={
          currentFloor
            ? {
                // 図面と同じ縦横比の枠にして余白をなくす。
                // 画面に収まらないときは高さを上限にし、幅も比率どおり縮める
                aspectRatio: `${currentFloor.image_width} / ${currentFloor.image_height}`,
                maxHeight: MAP_MAX_HEIGHT,
                maxWidth: `calc(${MAP_MAX_HEIGHT} * ${
                  currentFloor.image_width / currentFloor.image_height
                })`,
              }
            : { height: "50vh" }
        }
      >
        {currentFloor ? (
          <FloorMap
            floor={currentFloor}
            seats={currentSeats}
            occupantsBySeat={occupantsBySeat}
            myUserId={myUserId}
            highlightSeatId={highlightSeatId}
            onSeatClick={(seat) => {
              setSelectedSeat(seat);
              setHighlightSeatId(null);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            フロアが未登録です。管理画面から図面を登録してください。
          </div>
        )}

        {selectedSeat && (
          <div className="anim-sheet absolute inset-x-2 bottom-2 z-20 flex items-center justify-between gap-2 rounded-2xl border border-black/5 bg-white/85 p-3.5 text-sm shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/85">
            <div className="min-w-0">
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {selectedSeat.label}
              </span>
              {selectedOccupant ? (
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  {selectedOccupant.profile.display_name}
                  {selectedOccupant.profile.department && (
                    <span className="ml-1 text-xs text-gray-500">
                      {selectedOccupant.profile.department}
                    </span>
                  )}
                  {selectedOccupant.profile.status && (
                    <span className="ml-1 text-xs text-amber-700">
                      {STATUS_LABELS[selectedOccupant.profile.status]}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-gray-400">
                    {new Date(
                      selectedOccupant.session.checked_in_at
                    ).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    〜
                  </span>
                </span>
              ) : (
                <span className="ml-2 text-gray-500 dark:text-gray-400">空席</span>
              )}
            </div>
            <button
              onClick={() => setSelectedSeat(null)}
              className="press shrink-0 rounded-full px-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <OffsiteList profiles={offsiteProfiles} />

      <p className="pb-2 text-center text-xs text-gray-400">
        座席のNFCタグをスマホでタップするとチェックインできます
      </p>
      </div>
    </div>
  );
}
