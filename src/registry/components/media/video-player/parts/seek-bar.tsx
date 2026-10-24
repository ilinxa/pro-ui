"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { useVideoPlayer } from "./video-player-context";

const THUMB_HALF_PX = 6;

export function VideoPlayerSeekBar({ className }: { className?: string }) {
  const { state, labels, formatTime, seekStep } = useVideoPlayer();
  const { duration, buffered, dir } = state;
  const rtl = dir === "rtl";
  const enabled = Number.isFinite(duration) && duration > 0;
  const total = enabled ? duration : 0;

  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const rawValue = dragValue ?? state.currentTime;
  const value = enabled ? Math.min(Math.max(Number.isFinite(rawValue) ? rawValue : 0, 0), total) : 0;
  const pct = enabled ? (value / total) * 100 : 0;

  const seekFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    let fraction = (e.clientX - rect.left) / rect.width;
    if (rtl) fraction = 1 - fraction;
    fraction = Math.min(Math.max(fraction, 0), 1);
    const seconds = fraction * total;
    setDragValue(seconds);
    state.seek(seconds);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const el = e.currentTarget;
    if (typeof el.setPointerCapture === "function") {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // pointer already gone — the drag still works through move events on the element
      }
    }
    draggingRef.current = true;
    seekFromPointer(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    seekFromPointer(e);
  };

  const endDrag = () => {
    draggingRef.current = false;
    setDragValue(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const forward = rtl ? -seekStep : seekStep;
    let target: number | null = null;
    switch (e.key) {
      case "ArrowRight":
        target = value + forward;
        break;
      case "ArrowLeft":
        target = value - forward;
        break;
      case "ArrowUp":
        target = value + seekStep;
        break;
      case "ArrowDown":
        target = value - seekStep;
        break;
      case "PageUp":
        target = value + total * 0.1;
        break;
      case "PageDown":
        target = value - total * 0.1;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = total;
        break;
      default:
        return;
    }
    e.preventDefault();
    state.seek(Math.min(Math.max(target, 0), total));
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={labels.seek}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={labels.position(value, total, {
        current: formatTime(value),
        total: formatTime(total),
      })}
      aria-disabled={enabled ? undefined : "true"}
      tabIndex={enabled ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative flex h-6 min-w-0 touch-pan-y items-center rounded-full",
        enabled ? "cursor-pointer" : "cursor-default",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative h-1 w-full rounded-full bg-media-overlay-foreground/30">
        {enabled &&
          buffered.map((range, i) => {
            const startPct = Math.min(Math.max((range.start / total) * 100, 0), 100);
            const endPct = Math.min(Math.max((range.end / total) * 100, 0), 100);
            if (endPct <= startPct) return null;
            return (
              <div
                key={i}
                className="absolute inset-y-0 rounded-full bg-media-overlay-foreground/50"
                style={{ insetInlineStart: `${startPct}%`, width: `${endPct - startPct}%` }}
              />
            );
          })}
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary"
          style={{ insetInlineStart: `calc(${pct}% - ${THUMB_HALF_PX}px)` }}
        />
      </div>
    </div>
  );
}
