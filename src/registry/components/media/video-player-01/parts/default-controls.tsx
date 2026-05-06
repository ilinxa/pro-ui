"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoPlayer01Labels, VideoState } from "../types";

interface DefaultControlsProps {
  state: VideoState;
  labels: Required<VideoPlayer01Labels>;
  controlsAutoHideMs: number;
  controlsClassName?: string;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};

const getReducedMotionSnapshot = () =>
  typeof window === "undefined"
    ? false
    : window.matchMedia(REDUCED_MOTION_QUERY).matches;

const getReducedMotionServerSnapshot = () => false;

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

export function DefaultControls({
  state,
  labels,
  controlsAutoHideMs,
  controlsClassName,
}: DefaultControlsProps) {
  const { isPlaying, isMuted, togglePlay, toggleMute } = state;
  const reducedMotion = usePrefersReducedMotion();

  // Controls are always visible when paused / auto-hide disabled / reduced-motion.
  const alwaysVisible =
    !isPlaying || controlsAutoHideMs <= 0 || reducedMotion;

  // Only used in auto-hide mode. Bumped via `wakeKey` to re-arm the timer.
  const [hidden, setHidden] = useState(false);
  const [wakeKey, setWakeKey] = useState(0);

  const showControls = alwaysVisible || !hidden;

  useEffect(() => {
    if (alwaysVisible) return;
    const t = setTimeout(() => setHidden(true), controlsAutoHideMs);
    return () => clearTimeout(t);
  }, [alwaysVisible, controlsAutoHideMs, wakeKey]);

  const wakeControls = useCallback(() => {
    setHidden(false);
    setWakeKey((k) => k + 1);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        controlsClassName,
      )}
      onMouseEnter={wakeControls}
      onMouseMove={wakeControls}
    >
      {/* Big center play button — always visible when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="pointer-events-auto h-14 w-14 rounded-full bg-background/80 hover:bg-background/90"
            onClick={togglePlay}
            aria-label={labels.play}
          >
            <Play className="h-6 w-6 fill-current" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Bottom-right mute toggle — auto-hides during playback */}
      <div
        className={cn(
          "absolute right-3 bottom-3 flex gap-2 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="pointer-events-auto h-8 w-8 rounded-full bg-background/70 hover:bg-background/90"
          onClick={toggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? labels.unmute : labels.mute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Bottom-left small pause indicator — only when playing + showing controls */}
      {isPlaying && showControls && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="pointer-events-auto absolute bottom-3 left-3 h-8 w-8 rounded-full bg-background/70 hover:bg-background/90"
          onClick={togglePlay}
          aria-label={labels.pause}
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
