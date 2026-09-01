"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Floor } from "@/lib/database.types";

type FloorRow = Pick<
  Floor,
  "id" | "name" | "image_path" | "image_width" | "image_height" | "sort_order"
>;

// 画像ファイルから実寸を取得する
function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("画像を読み込めません"));
    img.src = url;
  });
}

export default function FloorAdminList({
  initialFloors,
}: {
  initialFloors: FloorRow[];
}) {
  const router = useRouter();
  const [floors, setFloors] = useState(initialFloors);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFloor(e: React.FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value.trim();
    const file = fileRef.current?.files?.[0];
    if (!name || !file) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { width, height } = await readImageSize(file);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("floors")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data, error: insErr } = await supabase
        .from("floors")
        .insert({
          name,
          image_path: path,
          image_width: width,
          image_height: height,
          sort_order: floors.length,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      setFloors([...floors, data]);
      if (nameRef.current) nameRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeFloor(floor: FloorRow) {
    if (
      !confirm(
        `「${floor.name}」を削除しますか？\nこのフロアの座席と着席履歴もすべて削除されます。`
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("floors")
        .delete()
        .eq("id", floor.id);
      if (delErr) throw delErr;
      // Storage上の画像も削除（seed由来のパスは対象外）
      if (!floor.image_path.startsWith("/") && !floor.image_path.startsWith("http")) {
        await supabase.storage.from("floors").remove([floor.image_path]);
      }
      setFloors(floors.filter((f) => f.id !== floor.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <ul className="space-y-2">
        {floors.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3"
          >
            <div>
              <p className="font-medium text-gray-900">{f.name}</p>
              <p className="text-xs text-gray-500">
                {f.image_width}×{f.image_height}px
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/floors/${f.id}`}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                座席を配置
              </Link>
              <button
                onClick={() => removeFloor(f)}
                disabled={busy}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                削除
              </button>
            </div>
          </li>
        ))}
        {floors.length === 0 && (
          <li className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            フロアが未登録です。下のフォームから図面を追加してください。
          </li>
        )}
      </ul>

      <form
        onSubmit={addFloor}
        className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
      >
        <h2 className="text-sm font-bold text-gray-900">フロアを追加</h2>
        <input
          ref={nameRef}
          placeholder="フロア名（例: 本社 3F）"
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          required
          className="w-full text-sm"
        />
        <p className="text-xs text-gray-500">
          オフィス図面の画像（PNG/JPEG/SVG/WebP）をアップロードします
        </p>
        <button
          disabled={busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "追加中..." : "フロアを追加"}
        </button>
      </form>
    </div>
  );
}
