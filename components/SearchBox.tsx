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
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="名前・部署で検索"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
      />
      {hits.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {hits.map((e) => (
            <li key={e.profile.id}>
              <button
                onClick={() => {
                  onSelect(e);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
              >
                <span className="min-w-0">
                  <span className="font-medium text-gray-900">
                    {e.profile.display_name}
                  </span>
                  {e.profile.department && (
                    <span className="ml-1 text-xs text-gray-500">
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
                    <span className="text-gray-400">不在</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && hits.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          該当する人が見つかりません
        </div>
      )}
    </div>
  );
}
