"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import type { ProfileLite } from "@/lib/map-types";

// 未着席だが在宅勤務・外出中のメンバーを表示するリスト
export default function OffsiteList({ profiles }: { profiles: ProfileLite[] }) {
  if (profiles.length === 0) return null;

  return (
    <details className="anim-rise-3 glass rounded-3xl p-4">
      <summary className="cursor-pointer text-sm font-bold text-gray-800 dark:text-gray-200">
        オフィス外（在宅・外出） {profiles.length}名
      </summary>
      <ul className="mt-2 flex flex-wrap gap-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="glass-thin flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
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
