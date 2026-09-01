"use client";

import { useEffect, useRef } from "react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import type { FloorLite, Occupant, SeatLite } from "@/lib/map-types";
import SeatMarker from "@/components/SeatMarker";

export default function FloorMap({
  floor,
  seats,
  occupantsBySeat,
  myUserId,
  highlightSeatId,
  onSeatClick,
}: {
  floor: FloorLite;
  seats: SeatLite[];
  occupantsBySeat: Map<string, Occupant>;
  myUserId: string;
  highlightSeatId: string | null;
  onSeatClick: (seat: SeatLite) => void;
}) {
  const wrapperRef = useRef<ReactZoomPanPinchRef>(null);

  // 検索ヒット時に該当座席へズーム
  useEffect(() => {
    if (!highlightSeatId) return;
    const t = setTimeout(() => {
      wrapperRef.current?.zoomToElement(`seat-${highlightSeatId}`, 2, 300);
    }, 50);
    return () => clearTimeout(t);
  }, [highlightSeatId, floor.id]);

  return (
    <TransformWrapper
      ref={wrapperRef}
      minScale={1}
      maxScale={6}
      doubleClick={{ mode: "zoomIn" }}
      wheel={{ step: 0.15 }}
    >
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%" }}
        contentStyle={{ width: "100%" }}
      >
        <div
          className="relative w-full select-none"
          style={{ aspectRatio: `${floor.image_width} / ${floor.image_height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={floor.image_url}
            alt={floor.name}
            className="absolute inset-0 h-full w-full"
            draggable={false}
          />
          {seats.map((seat) => (
            <SeatMarker
              key={seat.id}
              seat={seat}
              occupant={occupantsBySeat.get(seat.id) ?? null}
              isMe={occupantsBySeat.get(seat.id)?.profile.id === myUserId}
              highlighted={seat.id === highlightSeatId}
              onClick={() => onSeatClick(seat)}
            />
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
