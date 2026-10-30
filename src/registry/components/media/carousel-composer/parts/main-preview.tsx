"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CarouselCropOffset, MediaCarouselItem } from "../types";
import { clampOffset } from "../lib/aspect";

export interface MainPreviewProps {
  item: MediaCarouselItem | null;
  /** CSS `aspect-ratio` value for the frame (the shared carousel aspect). */
  aspectCss: string;
  /** True when the editing add-on is wired and this item may be edited. */
  canEdit: boolean;
  /** True when the editing add-on is wired. Without it the preview shows no edit UI. */
  editingEnabled?: boolean;
  labels: { edit: string; videoNotEditable: string };
  /** The aspect switch, shown over the top-start corner of the frame. */
  aspectSwitch?: ReactNode;
  onEdit: () => void;
  /** Shared aspect as width / height (`null` = free / none). Pan needs a fixed ratio. */
  ratio?: number | null;
  /** Pan (`enablePan`): the accessible name and the commit callback. Absent = no pan. */
  pan?: { label: string; onCommit: (id: string, offset: CarouselCropOffset) => void };
}

/** Arrow-key step of a pan (a fraction of the overflow); Shift takes the large one. */
const PAN_STEP = 0.05;
const PAN_STEP_LARGE = 0.2;

/** Frame size, displayed (cover-fitted) overflow of the image in CSS px. */
function overflowOf(frame: HTMLElement, w: number, h: number) {
  const r = frame.getBoundingClientRect();
  const scale = Math.max(r.width / w, r.height / h);
  // The fitted axis comes out as float noise (w * (r.width / w) - r.width ≈ 1e-14), not 0:
  // under half a pixel is "no overflow", so an arrow on that axis is ignored.
  const snap = (v: number) => (v < 0.5 ? 0 : v);
  return {
    x: snap(w * scale - r.width),
    y: snap(h * scale - r.height),
  };
}

/**
 * The large preview of the currently-selected item, with an Edit affordance.
 * Images fill the shared-aspect frame (`object-cover`); videos keep their own
 * aspect on a media-overlay mat (`object-contain`). A video is never editable — instead
 * of a disabled (unfocusable, unreadable) button we show a static caption that
 * IS in the reading order, so keyboard + screen-reader users get the reason.
 */
export function MainPreview({
  item,
  aspectCss,
  canEdit,
  editingEnabled = false,
  labels,
  aspectSwitch,
  onEdit,
  ratio = null,
  pan,
}: MainPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Pending pan: the drag in progress, then (after pointerup / a key press) the offset we
  // committed, kept until the item's own `cropOffset` matches it — a controlled host that
  // echoes late must not see a snap-back. Bound to the image it was made for (id + size).
  const [live, setLive] = useState<{
    id: string;
    w: number;
    h: number;
    x: number;
    y: number;
  } | null>(null);
  const drag = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    from: CarouselCropOffset;
    last: CarouselCropOffset;
  } | null>(null);

  const imgW = item?.width ?? 0;
  const imgH = item?.height ?? 0;
  const pannable =
    pan !== undefined &&
    item !== null &&
    item.kind === "image" &&
    ratio !== null &&
    imgW > 0 &&
    imgH > 0 &&
    Math.abs(imgW / imgH - ratio) / ratio >= 0.002;

  const liveOffset: CarouselCropOffset | null =
    live && item && live.id === item.id && live.w === imgW && live.h === imgH
      ? { x: live.x, y: live.y }
      : null;
  // Drop a pending pan once it is stale (another item / a new size) or the host caught up.
  if (
    live &&
    (liveOffset === null ||
      (clampOffset(item?.cropOffset?.x) === live.x && clampOffset(item?.cropOffset?.y) === live.y))
  ) {
    setLive(null);
  }

  const current = (): CarouselCropOffset => ({
    x: clampOffset((liveOffset ?? item?.cropOffset)?.x),
    y: clampOffset((liveOffset ?? item?.cropOffset)?.y),
  });
  const pend = (id: string, o: CarouselCropOffset) =>
    setLive({ id, w: imgW, h: imgH, x: o.x, y: o.y });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!pannable || !item || !pan) return;
    // A second pointer must not overwrite the drag in progress.
    if (drag.current) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Overlay controls (aspect switch, Edit) keep their own clicks.
    if ((e.target as Element).closest("button, a, input, [role='radio'], [role='button']")) return;
    const from = current();
    drag.current = {
      id: item.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      from,
      last: from,
    };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* capture unsupported — the drag still works inside the frame */
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId || !frameRef.current) return;
    const o = overflowOf(frameRef.current, imgW, imgH);
    // Dragging the photo right reveals more of its left: the focal point moves the other way.
    const next = {
      x: o.x > 0 ? clampOffset(d.from.x - (e.clientX - d.startX) / o.x) : d.from.x,
      y: o.y > 0 ? clampOffset(d.from.y - (e.clientY - d.startY) / o.y) : d.from.y,
    };
    d.last = next;
    pend(d.id, next);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>, commit: boolean) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* already released */
    }
    if (commit && (d.last.x !== d.from.x || d.last.y !== d.from.y)) {
      // The pending offset stays (see `live`) until the committed value arrives.
      pan?.onCommit(d.id, d.last);
    } else {
      setLive(null);
    }
  };

  // Keyboard: each key commits (one onCropOffsetChange per press, no debounce). Arrow keys
  // move the VIEW WINDOW: Right / Down raise x / y. Physical axes (a photo does not mirror).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!pannable || !item || !pan || e.target !== e.currentTarget) return;
    if (e.nativeEvent.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const step = e.shiftKey ? PAN_STEP_LARGE : PAN_STEP;
    const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
    const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
    if (dx === 0 && dy === 0) return;
    const frame = frameRef.current;
    const o = frame ? overflowOf(frame, imgW, imgH) : { x: 1, y: 1 };
    const cur = current();
    const next = {
      x: dx !== 0 && o.x > 0 ? clampOffset(cur.x + dx) : cur.x,
      y: dy !== 0 && o.y > 0 ? clampOffset(cur.y + dy) : cur.y,
    };
    if ((dx !== 0 && o.x <= 0) || (dy !== 0 && o.y <= 0)) return;
    e.preventDefault();
    if (next.x !== cur.x || next.y !== cur.y) {
      // Step from the pending offset next time, even before the host echoes this one.
      pend(item.id, next);
      pan.onCommit(item.id, next);
    }
  };
  if (!item) {
    return (
      <div
        className="grid w-full place-items-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground"
        style={{ aspectRatio: aspectCss }}
      >
        <ImageIcon className="size-8" aria-hidden />
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-muted",
        pannable &&
          // One overflow axis by construction: leave the OTHER axis to the browser, so a
          // phone can still scroll the page past the preview. Never `touch-none`.
          (imgW / imgH > (ratio as number) ? "touch-pan-y" : "touch-pan-x"),
        pannable &&
          "cursor-grab select-none outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
      )}
      style={{ aspectRatio: aspectCss }}
      {...(pannable
        ? {
            role: "group",
            tabIndex: 0,
            "aria-label": pan?.label,
            "data-pan": "",
            onPointerDown,
            onPointerMove,
            onPointerUp: (e: PointerEvent<HTMLDivElement>) => endDrag(e, true),
            onPointerCancel: (e: PointerEvent<HTMLDivElement>) => endDrag(e, false),
            onLostPointerCapture: (e: PointerEvent<HTMLDivElement>) => endDrag(e, false),
            onKeyDown,
          }
        : {})}
    >
      {item.kind === "video" ? (
        <video
          src={item.url}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            try {
              e.currentTarget.currentTime = 0.1;
            } catch {
              /* seeking unsupported — leave as-is */
            }
          }}
          poster={item.posterUrl}
          aria-label={item.alt || undefined}
          className="size-full bg-media-overlay object-contain"
        />
      ) : (
        <img
          src={item.url}
          alt={item.alt ?? item.fileName ?? ""}
          draggable={pannable ? false : undefined}
          style={
            liveOffset || item.cropOffset
              ? {
                  objectPosition: `${current().x * 100}% ${current().y * 100}%`,
                }
              : undefined
          }
          className="size-full object-cover"
        />
      )}

      {aspectSwitch ? <div className="absolute start-3 top-3">{aspectSwitch}</div> : null}

      {canEdit ? (
        <div className="absolute end-3 top-3">
          <Button type="button" size="sm" onClick={onEdit} data-edit-button="">
            <Pencil className="size-4" aria-hidden />
            {labels.edit}
          </Button>
        </div>
      ) : editingEnabled && item.kind === "video" ? (
        <div className="absolute end-3 top-3">
          <span className="rounded-full bg-media-overlay px-2.5 py-1 text-xs font-medium text-media-overlay-foreground">
            {labels.videoNotEditable}
          </span>
        </div>
      ) : null}
    </div>
  );
}
