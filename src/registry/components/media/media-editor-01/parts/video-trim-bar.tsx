"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import type { StoryComposer01Labels } from "../types";

export interface VideoTrimBarProps {
  /** Source video URL (object URL from a Blob is fine). */
  videoUrl: string;
  /** Trim range in seconds — controlled. */
  startSec: number;
  endSec: number;
  /** Authoritative duration from the source video. */
  durationSec: number;
  /** Number of preview thumbnails to generate (default 8). */
  thumbnailCount?: number;
  labels: Required<StoryComposer01Labels>;
  onChange: (next: { startSec: number; endSec: number }) => void;
  className?: string;
}

interface FrameThumb {
  t: number;
  url: string;
}

const MIN_DURATION_SEC = 0.5;

/**
 * Two-handle trim bar with auto-generated frame previews.
 *
 * Thumbnails are produced once on mount by seeking an off-DOM <video>
 * to N evenly-spaced timestamps and snapping each frame to a canvas.
 */
export function VideoTrimBar({
  videoUrl,
  startSec,
  endSec,
  durationSec,
  thumbnailCount = 8,
  labels,
  onChange,
  className,
}: VideoTrimBarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [thumbs, setThumbs] = useState<FrameThumb[]>([]);
  const draggingRef = useRef<"start" | "end" | null>(null);

  // ─── Generate frame thumbnails ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!videoUrl || durationSec <= 0) return;

    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    const onLoaded = async () => {
      const canvas = document.createElement("canvas");
      const w = 64;
      const h = 96;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        return;
      }
      const out: FrameThumb[] = [];
      for (let i = 0; i < thumbnailCount; i++) {
        const t = (i / (thumbnailCount - 1 || 1)) * durationSec;
        await seekTo(video, t);
        if (cancelled) return;
        ctx.drawImage(video, 0, 0, w, h);
        const url = canvas.toDataURL("image/jpeg", 0.6);
        out.push({ t, url });
      }
      if (!cancelled) setThumbs(out);
      cleanup();
    };

    video.addEventListener("loadedmetadata", onLoaded, { once: true });

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onLoaded);
      cleanup();
    };
  }, [videoUrl, durationSec, thumbnailCount]);

  // ─── Drag handlers ──────────────────────────────────────────────────
  const positionForX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return ratio * durationSec;
    },
    [durationSec],
  );

  const handlePointerDown = useCallback(
    (which: "start" | "end") => (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      draggingRef.current = which;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const next = positionForX(e.clientX);
      if (draggingRef.current === "start") {
        const clamped = Math.min(next, endSec - MIN_DURATION_SEC);
        onChange({ startSec: Math.max(0, clamped), endSec });
      } else {
        const clamped = Math.max(next, startSec + MIN_DURATION_SEC);
        onChange({ startSec, endSec: Math.min(durationSec, clamped) });
      }
    },
    [endSec, startSec, durationSec, onChange, positionForX],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────
  const startPct = durationSec > 0 ? (startSec / durationSec) * 100 : 0;
  const endPct = durationSec > 0 ? (endSec / durationSec) * 100 : 100;

  const placeholders = useMemo(
    () => Array.from({ length: thumbnailCount }, (_, i) => i),
    [thumbnailCount],
  );

  return (
    <div className={cn("flex flex-col gap-2 select-none", className)}>
      <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
        <span>{labels.trimStart}: {startSec.toFixed(1)}s</span>
        <span>{labels.trimEnd}: {endSec.toFixed(1)}s</span>
      </div>
      <div
        ref={trackRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-16 rounded-md overflow-hidden bg-black/40 ring-1 ring-white/10"
      >
        {/* Frame strip */}
        <div className="absolute inset-0 flex">
          {(thumbs.length ? thumbs : placeholders).map((entry, i) =>
            typeof entry === "number" ? (
              <div
                key={i}
                className="flex-1 bg-gradient-to-b from-white/5 to-white/10 animate-pulse"
              />
            ) : (
              <div
                key={i}
                className="flex-1 bg-cover bg-center"
                style={{ backgroundImage: `url(${entry.url})` }}
              />
            ),
          )}
        </div>
        {/* Dim out trimmed regions */}
        <div
          className="absolute inset-y-0 left-0 bg-black/60"
          style={{ width: `${startPct}%` }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 bg-black/60"
          style={{ width: `${100 - endPct}%` }}
          aria-hidden
        />
        {/* Selection outline */}
        <div
          className="absolute inset-y-0 border-y-2 border-white pointer-events-none"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
          aria-hidden
        />
        {/* Start handle */}
        <button
          type="button"
          aria-label={labels.trimStart}
          onPointerDown={handlePointerDown("start")}
          className="absolute top-0 bottom-0 w-3 -ml-1.5 grid place-items-center bg-white text-black cursor-ew-resize touch-none"
          style={{ left: `${startPct}%` }}
        >
          <span className="block h-6 w-0.5 bg-black/60" aria-hidden />
        </button>
        {/* End handle */}
        <button
          type="button"
          aria-label={labels.trimEnd}
          onPointerDown={handlePointerDown("end")}
          className="absolute top-0 bottom-0 w-3 -ml-1.5 grid place-items-center bg-white text-black cursor-ew-resize touch-none"
          style={{ left: `${endPct}%` }}
        >
          <span className="block h-6 w-0.5 bg-black/60" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    try {
      video.currentTime = Math.min(t, Math.max(0, video.duration || t));
    } catch {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    }
  });
}
