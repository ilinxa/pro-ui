"use client";

import type { KeyboardEvent, ReactEventHandler, SyntheticEvent } from "react";
import { cn } from "@/lib/utils";
import type { VideoDirection, VideoTrack } from "../types";

interface VideoEventHandlers {
  onPlay: ReactEventHandler<HTMLVideoElement>;
  onPause: ReactEventHandler<HTMLVideoElement>;
  onEnded: ReactEventHandler<HTMLVideoElement>;
  onLoadedMetadata: ReactEventHandler<HTMLVideoElement>;
  onTimeUpdate: ReactEventHandler<HTMLVideoElement>;
  onProgress: ReactEventHandler<HTMLVideoElement>;
  onWaiting: ReactEventHandler<HTMLVideoElement>;
  onStalled: ReactEventHandler<HTMLVideoElement>;
  onPlaying: ReactEventHandler<HTMLVideoElement>;
  onCanPlay: ReactEventHandler<HTMLVideoElement>;
  onError: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onVolumeChange: ReactEventHandler<HTMLVideoElement>;
}

interface VideoElementProps {
  videoRef: (node: HTMLVideoElement | null) => void;
  eventHandlers: VideoEventHandlers;
  src: string;
  poster?: string;
  tracks: VideoTrack[];
  crossOrigin?: "anonymous" | "use-credentials";
  loop: boolean;
  muted: boolean;
  playsInline: boolean;
  preload: "none" | "metadata" | "auto";
  autoPlay: boolean;
  objectFit: "cover" | "contain";
  ariaLabel: string;
  videoClassName?: string;
  /** Click on the video. Omitted when the player defers single taps for a double tap. */
  onClick?: () => void;
  onTogglePlay: () => void;
  /** Called for the M keyboard shortcut. */
  onToggleMute: () => void;
  /**
   * ← / → seek by this many seconds (direction-aware). Unset when the player renders no controls,
   * so a host's own arrow-key handling (story-viewer navigation) is never pre-empted.
   */
  seekStep?: number;
  dir: VideoDirection;
  onSeekBy: (delta: number) => void;
}

export function VideoElement({
  videoRef,
  eventHandlers,
  src,
  poster,
  tracks,
  crossOrigin,
  loop,
  muted,
  playsInline,
  preload,
  autoPlay,
  objectFit,
  ariaLabel,
  videoClassName,
  onClick,
  onTogglePlay,
  onToggleMute,
  seekStep,
  dir,
  onSeekBy,
}: VideoElementProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLVideoElement>) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      onTogglePlay();
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      onToggleMute();
    } else if (seekStep && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      // Handled here, so a carousel / viewer around the player ignores it (`defaultPrevented`).
      e.preventDefault();
      const forward = (e.key === "ArrowRight") === (dir === "ltr");
      onSeekBy(forward ? seekStep : -seekStep);
    }
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      crossOrigin={crossOrigin}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      autoPlay={autoPlay}
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...eventHandlers}
      className={cn(
        "h-full w-full cursor-pointer",
        objectFit === "cover" ? "object-cover" : "object-contain",
        videoClassName,
      )}
    >
      {tracks.map((t, i) => (
        <track
          key={`${t.kind}-${t.srcLang}-${i}`}
          kind={t.kind}
          src={t.src}
          srcLang={t.srcLang}
          label={t.label}
          default={t.default}
        />
      ))}
    </video>
  );
}
