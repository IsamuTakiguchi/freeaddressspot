"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  createSeatAction,
  deleteSeatAction,
  toggleSeatActiveAction,
  updateSeatLabelAction,
  updateSeatPositionAction,
  type AdminSeat,
} from "@/app/admin/actions";
import { checkinUrl } from "@/lib/site-url";
import type { FloorLite } from "@/lib/map-types";

type EditorSeat = AdminSeat;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function FloorEditor({
  floor,
  initialSeats,
}: {
  floor: FloorLite;
  initialSeats: EditorSeat[];
}) {
  const [seats, setSeats] = useState(initialSeats);
  const [mode, setMode] = useState<"edit" | "add">("edit");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const downPosRef = useRef<{ x: number; y: number } | null>(null);

  const relFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = contentRef.current!.getBoundingClientRect();
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    };
  }, []);

  // ドラッグ移動（編集モード）
  useEffect(() => {
    if (!dragId) return;
    const onMove = (e: PointerEvent) => {
      const { x, y } = relFromPointer(e.clientX, e.clientY);
      setSeats((prev) =>
        prev.map((s) => (s.id === dragId ? { ...s, x, y } : s))
      );
    };
    const onUp = async (e: PointerEvent) => {
      const { x, y } = relFromPointer(e.clientX, e.clientY);
      setDragId(null);
      const result = await updateSeatPositionAction({ seatId: dragId, x, y });
      if (!result.ok) setError(result.error);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragId, relFromPointer]);

  function nextLabel(): string {
    let n = seats.length + 1;
    while (seats.some((s) => s.label === `S-${n}`)) n++;
    return `S-${n}`;
  }

  // 図面クリックで座席追加（追加モード）
  async function onMapClick(e: React.MouseEvent) {
    if (mode !== "add") return;
    // パン操作後のclickは無視（移動量で判定）
    const down = downPosRef.current;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;

    const { x, y } = relFromPointer(e.clientX, e.clientY);
    const result = await createSeatAction({
      floorId: floor.id,
      label: nextLabel(),
      x,
      y,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSeats([...seats, result.data]);
    setSelectedId(result.data.id);
  }

  async function updateLabel(id: string, label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const result = await updateSeatLabelAction({ seatId: id, label: trimmed });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSeats(seats.map((s) => (s.id === id ? { ...s, label: trimmed } : s)));
  }

  async function toggleActive(seat: EditorSeat) {
    const result = await toggleSeatActiveAction({
      seatId: seat.id,
      isActive: !seat.is_active,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSeats(
      seats.map((s) =>
        s.id === seat.id ? { ...s, is_active: !s.is_active } : s
      )
    );
  }

  async function removeSeat(seat: EditorSeat) {
    if (
      !confirm(
        `座席「${seat.label}」を削除しますか？\n着席履歴も削除されます。NFCタグを再利用する場合は新しい座席のURLを書き込み直してください。`
      )
    )
      return;
    const result = await deleteSeatAction(seat.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSeats(seats.filter((s) => s.id !== seat.id));
    if (selectedId === seat.id) setSelectedId(null);
  }

  async function copyUrl(seat: EditorSeat) {
    await navigator.clipboard.writeText(checkinUrl(seat.id));
    setCopiedId(seat.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const selected = seats.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setMode("edit")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "edit"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white text-gray-700"
          }`}
        >
          選択・移動
        </button>
        <button
          onClick={() => setMode("add")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "add"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white text-gray-700"
          }`}
        >
          ＋ クリックで座席追加
        </button>
        <span className="text-xs text-gray-500">
          {mode === "add"
            ? "図面上のデスク位置をクリックすると座席が追加されます"
            : "マーカーをドラッグで移動、クリックで選択できます"}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="h-[60vh] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <TransformWrapper
          minScale={1}
          maxScale={6}
          panning={{ disabled: !!dragId, excluded: ["seat-drag"] }}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%" }}
          >
            <div
              ref={contentRef}
              onClick={onMapClick}
              onPointerDown={(e) =>
                (downPosRef.current = { x: e.clientX, y: e.clientY })
              }
              className={`relative w-full select-none ${mode === "add" ? "cursor-crosshair" : ""}`}
              style={{
                aspectRatio: `${floor.image_width} / ${floor.image_height}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={floor.image_url}
                alt={floor.name}
                className="absolute inset-0 h-full w-full"
                draggable={false}
              />
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  onPointerDown={(e) => {
                    if (mode !== "edit") return;
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedId(seat.id);
                    setDragId(seat.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`seat-drag absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-move items-center justify-center rounded-full text-[9px] font-bold shadow ${
                    seat.id === selectedId
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : seat.is_active
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-300 text-gray-600"
                  }`}
                  style={{
                    left: `${seat.x * 100}%`,
                    top: `${seat.y * 100}%`,
                    touchAction: "none",
                  }}
                  title={seat.label}
                >
                  {seat.label.length <= 4 ? seat.label : "●"}
                </button>
              ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {selected && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <input
            key={selected.id}
            defaultValue={selected.label}
            onBlur={(e) => updateLabel(selected.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-28 rounded border border-gray-300 px-2 py-1"
          />
          <button
            onClick={() => copyUrl(selected)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50"
          >
            {copiedId === selected.id ? "コピーしました ✓" : "チェックインURLをコピー"}
          </button>
          <button
            onClick={() => toggleActive(selected)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50"
          >
            {selected.is_active ? "無効化" : "有効化"}
          </button>
          <button
            onClick={() => removeSeat(selected)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            削除
          </button>
        </div>
      )}

      <details className="rounded-lg border border-gray-200 bg-white p-4" open>
        <summary className="cursor-pointer text-sm font-bold text-gray-900">
          座席一覧とNFCタグ用URL（{seats.length}席）
        </summary>
        <p className="mt-2 text-xs text-gray-500">
          各URLを「NFC Tools」等のアプリでNFCタグ（NTAG213以上を推奨）にURLレコードとして書き込み、
          該当する座席に貼り付けてください。書き込み後は読み取り専用ロックを推奨します。
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500">
                <th className="py-1.5 pr-3">座席</th>
                <th className="py-1.5 pr-3">チェックインURL</th>
                <th className="py-1.5">操作</th>
              </tr>
            </thead>
            <tbody>
              {seats.map((seat) => (
                <tr key={seat.id} className="border-b border-gray-100">
                  <td className="py-1.5 pr-3 font-medium">
                    {seat.label}
                    {!seat.is_active && (
                      <span className="ml-1 text-xs text-gray-400">(無効)</span>
                    )}
                  </td>
                  <td className="max-w-xs truncate py-1.5 pr-3 font-mono text-xs text-gray-600">
                    {checkinUrl(seat.id)}
                  </td>
                  <td className="py-1.5">
                    <button
                      onClick={() => copyUrl(seat)}
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-50"
                    >
                      {copiedId === seat.id ? "✓" : "コピー"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
