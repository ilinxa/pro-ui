"use client";

import { cn } from "@/lib/utils";
import { VideoPlayerCaptionsButton } from "./captions-button";
import { VideoPlayerFullscreenButton } from "./fullscreen-button";
import { VideoPlayerMuteButton } from "./mute-button";
import { VideoPlayerPlayButton } from "./play-button";
import { VideoPlayerSeekBar } from "./seek-bar";
import { VideoPlayerStatus } from "./status";
import { VideoPlayerDurationBadge, VideoPlayerTime } from "./time";
import { useVideoPlayer } from "./video-player-context";

interface DefaultControlsProps {
  showSeekBar: boolean;
  showTime: boolean;
  showFullscreen: boolean;
  controlsClassName?: string;
}

export function DefaultControls({
  showSeekBar,
  showTime,
  showFullscreen,
  controlsClassName,
}: DefaultControlsProps) {
  const { state, controlsVisible } = useVideoPlayer();
  const { isPlaying, hasStarted, hasError, isBuffering } = state;

  // Auto-hidden groups: fade out, and while hidden stay pointer-events-none so a click lands on the
  // video. Visible: only the interactive controls take pointer input — a tap on the time chip, the
  // duration badge or the spacer still reaches the video (play / pause, double tap).
  const fade = cn(
    "pointer-events-none motion-safe:transition-opacity motion-safe:duration-300",
    controlsVisible
      ? "opacity-100 [&_button]:pointer-events-auto [&_[role=slider]]:pointer-events-auto [&_[role=menu]]:pointer-events-auto"
      : "opacity-0",
  );

  return (
    <div className={cn("pointer-events-none absolute inset-0", controlsClassName)}>
      <VideoPlayerStatus />

      {!isPlaying && !hasError && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <VideoPlayerPlayButton size="lg" className="pointer-events-auto" />
        </div>
      )}

      {/* The error overlay owns the frame — no controls over a failed video. */}
      {hasError ? null : !hasStarted ? (
        <>
          <div className={cn("absolute end-3 top-3", fade)}>
            <VideoPlayerDurationBadge />
          </div>
          <div className={cn("absolute end-3 bottom-(--video-player-controls-bottom,0.75rem)", fade)}>
            <VideoPlayerMuteButton />
          </div>
        </>
      ) : (
        <div className={cn("absolute inset-x-3 bottom-(--video-player-controls-bottom,0.75rem) flex items-center gap-2", fade)}>
          {isPlaying && <VideoPlayerPlayButton size="sm" />}
          {showSeekBar ? <VideoPlayerSeekBar className="flex-1" /> : <div className="flex-1" />}
          {showTime && <VideoPlayerTime />}
          <VideoPlayerCaptionsButton />
          {showFullscreen && <VideoPlayerFullscreenButton />}
          <VideoPlayerMuteButton />
        </div>
      )}
    </div>
  );
}
