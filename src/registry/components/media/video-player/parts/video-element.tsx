"use client";

import type { ReactEventHandler, SyntheticEvent } from "react";
import { cn } from "@/lib/utils";
import type { VideoTrack } from "../types";

interface VideoEventHandlers {
  onPlay: ReactEventHandler<HTMLVideoElement>;
  onPause: ReactEventHandler<HTMLVideoElement>;
  onEnded: ReactEventHandler<HTMLVideoElement>;
  onLoadStart: ReactEventHandler<HTMLVideoElement>;
  onLoadedMetadata: ReactEventHandler<HTMLVideoElement>;
  onTimeUpdate: ReactEventHandler<HTMLVideoElement>;
  onError: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onVolumeChange: ReactEventHandler<HTMLVideoElement>;
}

interface VideoElementProps {
  videoRef: (node: HTMLVideoElement | null) => void;
  eventHandlers: VideoEventHandlers;
  src: string;
  poster?: string;
  tracks: VideoTrack[];
  loop: boolean;
  muted: boolean;
  playsInline: boolean;
  preload: "none" | "metadata" | "auto";
  autoPlay: boolean;
  objectFit: "cover" | "contain";
  ariaLabel: string;
  videoClassName?: string;
  /** Called when the user clicks the video element (NOT a control button). */
  onTogglePlay: () => void;
  /** Called for the M keyboard shortcut. */
  onToggleMute: () => void;
}

export function VideoElement({
  videoRef,
  eventHandlers,
  src,
  poster,
  tracks,
  loop,
  muted,
  playsInline,
  preload,
  autoPlay,
  objectFit,
  ariaLabel,
  videoClassName,
  onTogglePlay,
  onToggleMute,
}: VideoElementProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLVideoElement>) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      onTogglePlay();
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      onToggleMute();
    }
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      autoPlay={autoPlay}
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onTogglePlay}
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
