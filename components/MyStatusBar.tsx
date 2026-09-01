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
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        onClick={() => setEditOpen((v) => !v)}
        className="font-medium text-gray-900 underline decoration-dotted underline-offset-2"
        title="表示名・部署を編集"
      >
        {me.display_name}
      </button>
      {mySeatLabel ? (
        <>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            {mySeatLabel} に着席中
          </span>
          <button
            onClick={() => run(checkOutAction)}
            disabled={pending}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
          >
            退席する
          </button>
        </>
      ) : me.status ? (
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
          {STATUS_LABELS[me.status]}
        </span>
      ) : (
        <span className="text-xs text-gray-400">未着席</span>
      )}

      <div className="flex items-center gap-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => run(() => setStatusAction(me.status === s ? null : s))}
            disabled={pending}
            className={`rounded-full border px-2 py-0.5 text-xs disabled:opacity-50 ${
              me.status === s
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
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
          className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
        >
          <input
            name="display_name"
            defaultValue={me.display_name}
            placeholder="表示名"
            required
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            name="department"
            defaultValue={me.department ?? ""}
            placeholder="部署（検索に使われます）"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            保存
          </button>
        </form>
      )}
    </div>
  );
}
