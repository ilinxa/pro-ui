"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_VIDEO_PLAYER_LABELS,
  type VideoPlayer01Labels,
  type VideoPlayer01Props,
  type VideoState,
} from "./types";
import { useVideoState } from "./hooks/use-video-state";
import { useDoubleTap } from "./hooks/use-double-tap";
import { VideoElement } from "./parts/video-element";
import { DefaultControls } from "./parts/default-controls";

function VideoPlayer01Inner({
  src,
  poster,
  tracks = [],
  isActive = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "metadata",
  autoPlay = false,
  objectFit = "cover",
  controls = true,
  renderControls,
  controlsAutoHideMs = 2000,
  onDoubleTap,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  onError,
  labels: labelsProp,
  className,
  videoClassName,
  controlsClassName,
}: VideoPlayer01Props) {
  const labels = useMemo<Required<VideoPlayer01Labels>>(
    () => ({ ...DEFAULT_VIDEO_PLAYER_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const { state, videoRef, togglePlay, toggleMute, videoEventHandlers } =
    useVideoState({
      initialMuted: muted,
      isActive,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onLoadedMetadata,
      onError,
    });

  // (isActive auto-pause now lives inside useVideoState — hook owns video DOM.)
  const handleDoubleTap = useDoubleTap(onDoubleTap);

  const stateForRender: VideoState = {
    ...state,
    isActive,
    togglePlay,
    toggleMute,
  };

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-black",
        className,
      )}
      onClick={handleDoubleTap}
    >
      <VideoElement
        videoRef={videoRef}
        eventHandlers={videoEventHandlers}
        src={src}
        poster={poster}
        tracks={tracks}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        preload={preload}
        autoPlay={autoPlay}
        objectFit={objectFit}
        ariaLabel={labels.videoLabel}
        videoClassName={videoClassName}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
      />

      {controls &&
        (renderControls ? (
          renderControls(stateForRender)
        ) : (
          <DefaultControls
            state={stateForRender}
            labels={labels}
            controlsAutoHideMs={controlsAutoHideMs}
            controlsClassName={controlsClassName}
          />
        ))}
    </div>
  );
}

const VideoPlayer01 = memo(VideoPlayer01Inner);
VideoPlayer01.displayName = "VideoPlayer01";

export { VideoPlayer01 };
export default VideoPlayer01;
