"use client";

import { useMemo, useState } from "react";
import { matchesQuery } from "@/lib/search";
import { STATUS_LABELS } from "@/lib/status";
import type { ProfileLite, SeatLite } from "@/lib/map-types";

export interface SearchEntry {
  profile: ProfileLite;
  seat: SeatLite | null;
  floorName: string | null;
}

export default function SearchBox({
  entries,
  onSelect,
}: {
  entries: SearchEntry[];
  onSelect: (entry: SearchEntry) => void;
}) {
  const [query, setQuery] = useState("");

  const hits = useMemo(() => {
    if (!query.trim()) return [];
    return entries
      .filter((e) =>
        matchesQuery(query, e.profile.display_name, e.profile.department)
      )
      .slice(0, 20);
  }, [query, entries]);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="名前・部署で検索"
        className="min-h-11 w-full rounded-xl border-0 bg-black/5 pl-10 pr-3 text-sm transition-colors placeholder:text-gray-400 focus:bg-white focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/40 dark:bg-white/10 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-[#2c2c2e]"
      />
      {hits.length > 0 && (
        <ul className="anim-drop absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-2xl border border-black/5 bg-white shadow-xl dark:border-white/10 dark:bg-[#1c1c1e]">
          {hits.map((e) => (
            <li key={e.profile.id}>
              <button
                onClick={() => {
                  onSelect(e);
                  setQuery("");
                }}
                className="flex min-h-11 w-full items-center justify-between gap-2 px-3.5 text-left text-sm hover:bg-blue-50 active:bg-blue-50 dark:hover:bg-white/10 dark:active:bg-white/10"
              >
                <span className="min-w-0">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {e.profile.display_name}
                  </span>
                  {e.profile.department && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      {e.profile.department}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs">
                  {e.seat ? (
                    <span className="text-emerald-700">
                      {e.floorName} {e.seat.label}
                    </span>
                  ) : e.profile.status ? (
                    <span className="text-sky-700">
                      {STATUS_LABELS[e.profile.status]}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">不在</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && hits.length === 0 && (
        <div className="anim-drop absolute z-30 mt-1.5 w-full rounded-2xl border border-black/5 bg-white px-3.5 py-3 text-sm text-gray-500 shadow-xl dark:border-white/10 dark:bg-[#1c1c1e] dark:text-gray-400">
          該当する人が見つかりません
        </div>
      )}
    </div>
  );
}
