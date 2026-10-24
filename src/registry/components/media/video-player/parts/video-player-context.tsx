"use client";

import { createContext, useContext } from "react";
import type { ResolvedVideoPlayerLabels, VideoState } from "../types";

export interface VideoPlayerContextValue {
  state: VideoState;
  labels: ResolvedVideoPlayerLabels;
  /** Resolved locale (`"en"` for an invalid tag). */
  locale: string;
  /** `formatDuration` bound to the locale. */
  formatTime: (seconds: number) => string;
  /** Seconds per arrow-key step. */
  seekStep: number;
  /** The overlay is showing (auto-hide). Hidden controls must not take pointer input. */
  controlsVisible: boolean;
  /** Show the controls and re-arm auto-hide. */
  wake: () => void;
  /** A part's popup (the captions menu) opened / closed — auto-hide waits while one is open. */
  setMenuOpen: (open: boolean) => void;
}

export const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

/**
 * The player's state, labels and formatters — for the flat parts (`VideoPlayerSeekBar`, …),
 * which render inside `<VideoPlayer>` (its default controls, or your `renderControls`).
 */
export function useVideoPlayer(): VideoPlayerContextValue {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) {
    throw new Error("VideoPlayer parts must render inside <VideoPlayer> (default controls or renderControls).");
  }
  return ctx;
}
