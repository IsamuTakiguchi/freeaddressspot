"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActiveSession, ProfileLite } from "@/lib/map-types";

const POLL_INTERVAL_MS = 30_000;

// 在席状況とプロフィール一覧をリアルタイム維持するフック。
// Realtimeイベントは「変更通知」としてのみ使い、payloadは使わず必ず再フェッチする
// （JOIN済みデータの差分パッチはバグ源になるため。数百人規模なら全件再取得で十分軽い）。
// フォールバック: 30秒ポーリング + タブ復帰時の即時再フェッチ
// （モバイルブラウザはバックグラウンドでWebSocketを切るため、後者が実質最重要）。
export function useOccupancy(initialSessions: ActiveSession[], initialProfiles: ProfileLite[]) {
  const [sessions, setSessions] = useState<ActiveSession[]>(initialSessions);
  const [profiles, setProfiles] = useState<ProfileLite[]>(initialProfiles);
  const supabaseRef = useRef(createClient());

  const refetch = useCallback(async () => {
    const supabase = supabaseRef.current;
    const [sessionsRes, profilesRes] = await Promise.all([
      supabase
        .from("seat_sessions")
        .select("id, seat_id, user_id, checked_in_at")
        .is("checked_out_at", null),
      supabase
        .from("profiles")
        .select("id, display_name, department, avatar_url, status"),
    ]);
    if (!sessionsRes.error && sessionsRes.data) setSessions(sessionsRes.data);
    if (!profilesRes.error && profilesRes.data) setProfiles(profilesRes.data);
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel("occupancy")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seat_sessions" },
        () => refetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => refetch()
      )
      .subscribe();

    const interval = setInterval(refetch, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetch]);

  return { sessions, profiles, refetch };
}
