"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveSession, ProfileLite } from "@/lib/map-types";

const POLL_INTERVAL_MS = 10_000;

// 在席状況とプロフィール一覧をポーリングで最新に保つフック。
// /api/state を 10秒間隔 + タブ復帰時（visibilitychange）に取得する。
// 数百人規模ならレスポンスは数KBで、この間隔でも体感はほぼリアルタイム。
export function useOccupancy(
  initialSessions: ActiveSession[],
  initialProfiles: ProfileLite[]
) {
  const [sessions, setSessions] = useState<ActiveSession[]>(initialSessions);
  const [profiles, setProfiles] = useState<ProfileLite[]>(initialProfiles);
  const inFlightRef = useRef(false);

  const refetch = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) return; // 401等は静かにスキップ（次のナビゲーションでloginへ）
      const data: { sessions: ActiveSession[]; profiles: ProfileLite[] } =
        await res.json();
      setSessions(data.sessions);
      setProfiles(data.profiles);
    } catch {
      // ネットワーク一時障害は次のポーリングに任せる
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refetch, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetch]);

  return { sessions, profiles, refetch };
}
