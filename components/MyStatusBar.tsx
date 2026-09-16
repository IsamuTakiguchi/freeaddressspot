"use client";

import { useEffect, useState, useTransition } from "react";
import { checkOutAction } from "@/app/checkin/actions";
import { setStatusAction, updateProfileAction } from "@/app/profile/actions";
import { STATUS_LABELS } from "@/lib/status";
import type { UserStatus } from "@/lib/database.types";
import type { ProfileLite } from "@/lib/map-types";

const STATUS_OPTIONS: UserStatus[] = ["away", "meeting", "remote", "out"];

// ステータス切替は grid-cols-4 + gap-1.5、外枠は p-1。
// 選択カプセルはこのレイアウトに合わせて絶対配置し、translateXで滑らせる
const CELL_WIDTH = "calc((100% - 0.5rem - 1.125rem) / 4)";
const CELL_STEP = "calc(100% + 0.375rem)";

export default function MyStatusBar({
  me,
  mySeatLabel,
  onChanged,
}: {
  me: ProfileLite;
  mySeatLabel: string | null; // 例: "1F A-12"、未着席は null
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const activeIndex = me.status ? STATUS_OPTIONS.indexOf(me.status) : -1;
  // 解除したときはその場で縮ませたいので、最後に選ばれていた位置を覚えておく
  const [restIndex, setRestIndex] = useState(Math.max(activeIndex, 0));
  useEffect(() => {
    if (activeIndex >= 0) setRestIndex(activeIndex);
  }, [activeIndex]);
  const capsuleIndex = activeIndex >= 0 ? activeIndex : restIndex;

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      onChanged();
    });
  }

  return (
    <div className="space-y-2.5">
      {/* 自分の名前・在席状況・退席ボタン */}
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2">
        <button
          onClick={() => setEditOpen((v) => !v)}
          className="press py-2 text-sm font-semibold tracking-tight text-gray-900 underline decoration-dotted underline-offset-4 dark:text-gray-100"
          title="表示名・部署を編集"
        >
          {me.display_name}
        </button>
        {mySeatLabel ? (
          <span className="glass-thin flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {mySeatLabel} に着席中
          </span>
        ) : me.status ? (
          <span className="glass-thin rounded-full px-3 py-1.5 text-sm font-semibold text-sky-700">
            {STATUS_LABELS[me.status]}
          </span>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">未着席</span>
        )}
        {mySeatLabel && (
          <button
            onClick={() => run(checkOutAction)}
            disabled={pending}
            className="press sheen glass-thin ml-auto min-h-11 rounded-full px-6 text-sm font-semibold text-blue-600 disabled:opacity-50"
          >
            退席する
          </button>
        )}
      </div>

      {/* ステータス切替（選択カプセルが液体のように移動する） */}
      <div className="glass relative grid grid-cols-4 gap-1.5 rounded-full p-1">
        <span
          className="lg-indicator"
          aria-hidden
          style={{
            left: "0.25rem",
            top: "0.25rem",
            bottom: "0.25rem",
            width: CELL_WIDTH,
            transform: `translateX(calc(${CELL_STEP} * ${capsuleIndex})) scale(${
              activeIndex >= 0 ? 1 : 0.55
            })`,
            opacity: activeIndex >= 0 ? 1 : 0,
          }}
        />
        {STATUS_OPTIONS.map((s) => {
          const selected = me.status === s;
          return (
            <button
              key={s}
              onClick={() => run(() => setStatusAction(selected ? null : s))}
              disabled={pending}
              aria-pressed={selected}
              className={`press sheen relative z-10 min-h-11 rounded-full px-1 text-sm font-semibold transition-colors duration-300 disabled:opacity-50 ${
                selected
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      {editOpen && (
        <form
          action={(fd) => {
            setEditOpen(false);
            run(() => updateProfileAction(fd));
          }}
          className="anim-drop glass flex flex-wrap items-center gap-2 rounded-2xl p-3"
        >
          <input
            name="display_name"
            defaultValue={me.display_name}
            placeholder="表示名"
            required
            className="glass-field min-h-11 min-w-36 flex-1 rounded-xl border-0 px-3.5 text-sm dark:text-gray-100"
          />
          <input
            name="department"
            defaultValue={me.department ?? ""}
            placeholder="部署"
            className="glass-field min-h-11 min-w-36 flex-1 rounded-xl border-0 px-3.5 text-sm dark:text-gray-100"
          />
          <button
            type="submit"
            className="press sheen glass-accent min-h-11 rounded-full px-6 text-sm font-semibold"
          >
            保存
          </button>
        </form>
      )}
    </div>
  );
}
