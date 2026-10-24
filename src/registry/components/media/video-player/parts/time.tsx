"use client";

import { cn } from "@/lib/utils";
import { useVideoPlayer } from "./video-player-context";

const CHIP = "rounded-full bg-media-overlay px-2 py-0.5 text-media-overlay-foreground";

export function VideoPlayerTime({ className }: { className?: string }) {
  const { state, labels, formatTime } = useVideoPlayer();
  if (!Number.isFinite(state.duration)) return null;
  return (
    <span className={cn("tabular-nums text-xs", CHIP, className)}>
      {labels.timeDisplay(formatTime(state.currentTime), formatTime(state.duration))}
    </span>
  );
}

export function VideoPlayerDurationBadge({ className }: { className?: string }) {
  const { state, labels, formatTime } = useVideoPlayer();
  const { duration, hasStarted } = state;
  if (hasStarted || !Number.isFinite(duration) || duration <= 0) return null;
  return (
    <span className={cn("tabular-nums text-xs", CHIP, className)}>
      <span aria-hidden="true">{formatTime(duration)}</span>
      <span className="sr-only">{labels.durationBadge(duration, formatTime(duration))}</span>
    </span>
  );
}
