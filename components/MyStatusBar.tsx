"use client";

import { useState, useTransition } from "react";
import { checkOutAction } from "@/app/checkin/actions";
import { setStatusAction, updateProfileAction } from "@/app/profile/actions";
import { STATUS_LABELS } from "@/lib/status";
import type { UserStatus } from "@/lib/database.types";
import type { ProfileLite } from "@/lib/map-types";

const STATUS_OPTIONS: UserStatus[] = ["away", "meeting", "remote", "out"];

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

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      onChanged();
    });
  }

  return (
    <div className="space-y-2">
      {/* 自分の名前・在席状況・退席ボタン */}
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2">
        <button
          onClick={() => setEditOpen((v) => !v)}
          className="py-2 text-sm font-medium text-gray-900 underline decoration-dotted underline-offset-2"
          title="表示名・部署を編集"
        >
          {me.display_name}
        </button>
        {mySeatLabel ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800">
            {mySeatLabel} に着席中
          </span>
        ) : me.status ? (
          <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-800">
            {STATUS_LABELS[me.status]}
          </span>
        ) : (
          <span className="text-sm text-gray-400">未着席</span>
        )}
        {mySeatLabel && (
          <button
            onClick={() => run(checkOutAction)}
            disabled={pending}
            className="ml-auto min-h-11 rounded-full bg-black/5 px-6 text-sm font-semibold text-blue-600 transition-colors active:bg-black/10 disabled:opacity-50"
          >
            退席する
          </button>
        )}
      </div>

      {/* ステータス切替（4等分・タップしやすい高さ） */}
      <div className="grid grid-cols-4 gap-1.5">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => run(() => setStatusAction(me.status === s ? null : s))}
            disabled={pending}
            className={`min-h-11 rounded-full px-1 text-sm font-medium transition-colors disabled:opacity-50 ${
              me.status === s
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-black/5 text-gray-700 active:bg-black/10"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {editOpen && (
        <form
          action={(fd) => {
            setEditOpen(false);
            run(() => updateProfileAction(fd));
          }}
          className="flex flex-wrap items-center gap-2 rounded-2xl bg-black/5 p-3"
        >
          <input
            name="display_name"
            defaultValue={me.display_name}
            placeholder="表示名"
            required
            className="min-h-11 min-w-36 flex-1 rounded-xl border-0 bg-white px-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/40"
          />
          <input
            name="department"
            defaultValue={me.department ?? ""}
            placeholder="部署（検索に使われます）"
            className="min-h-11 min-w-36 flex-1 rounded-xl border-0 bg-white px-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/40"
          />
          <button
            type="submit"
            className="min-h-11 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white active:bg-blue-700"
          >
            保存
          </button>
        </form>
      )}
    </div>
  );
}
