"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import type { ProfileLite } from "@/lib/map-types";

// 未着席だが在宅勤務・外出中のメンバーを表示するリスト
export default function OffsiteList({ profiles }: { profiles: ProfileLite[] }) {
  if (profiles.length === 0) return null;

  return (
    <details className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)] dark:bg-[#1c1c1e]">
      <summary className="cursor-pointer text-sm font-bold text-gray-800 dark:text-gray-200">
        オフィス外（在宅・外出） {profiles.length}名
      </summary>
      <ul className="mt-2 flex flex-wrap gap-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs dark:border-white/10 dark:bg-white/5"
          >
            <span
              className={`h-2 w-2 rounded-full ${p.status ? STATUS_COLORS[p.status] : "bg-gray-300"}`}
            />
            <span className="font-medium text-gray-800 dark:text-gray-200">{p.display_name}</span>
            {p.department && (
              <span className="text-gray-500">{p.department}</span>
            )}
            {p.status && (
              <span className="text-gray-500">
                {STATUS_LABELS[p.status]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
