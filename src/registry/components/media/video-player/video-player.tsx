"use client";

import { memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { cn } from "@/lib/utils";
import type { VideoPlayerProps, VideoState, VideoTrack } from "./types";
import { createDurationFormatter, resolveLabels, resolveLocale } from "./lib/format";
import { useVideoState } from "./hooks/use-video-state";
import { useDoubleTap } from "./hooks/use-double-tap";
import { useDirection } from "./hooks/use-direction";
import { useFullscreen } from "./hooks/use-fullscreen";
import { useControlsVisibility } from "./hooks/use-controls-visibility";
import { usePrefersReducedMotion, useVisibility } from "./hooks/use-environment";
import { VideoElement } from "./parts/video-element";
import { DefaultControls } from "./parts/default-controls";
import { VideoPlayerContext, type VideoPlayerContextValue } from "./parts/video-player-context";

const NO_TRACKS: VideoTrack[] = [];

function VideoPlayerInner({
  src,
  poster,
  tracks = NO_TRACKS,
  crossOrigin,
  isActive = true,
  loop: loopProp,
  muted = true,
  onMutedChange,
  playsInline = true,
  preload = "metadata",
  autoPlay = false,
  durationHint,
  autoPlayInView = false,
  autoPlayThreshold = 0.5,
  autoplayGroup,
  objectFit = "cover",
  dir: dirProp,
  controls = true,
  renderControls,
  controlsAutoHideMs = 2000,
  showSeekBar = true,
  showTime = true,
  showFullscreen = false,
  seekStep = 5,
  onDoubleTap,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onProgress,
  onLoadedMetadata,
  onError,
  onMediaError,
  labels: labelsProp,
  locale: localeProp,
  formatDuration,
  className,
  videoClassName,
  controlsClassName,
  ref,
}: VideoPlayerProps) {
  // `onEnded` with the default `loop` could never fire — the callback asks for a non-looping video.
  const loop = loopProp ?? onEnded === undefined;

  const labels = useMemo(() => resolveLabels(labelsProp), [labelsProp]);
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const defaultFormat = useMemo(() => createDurationFormatter(locale), [locale]);
  const formatTime = useCallback(
    (seconds: number) => (formatDuration ? formatDuration(seconds, locale) : defaultFormat(seconds)),
    [formatDuration, locale, defaultFormat],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const dir = useDirection(rootRef, dirProp);
  const reducedMotion = usePrefersReducedMotion();
  const autoplayOn = autoPlayInView && !reducedMotion;
  const visible = useVisibility(rootRef, autoPlayThreshold, autoplayOn);

  const video = useVideoState({
    src,
    muted,
    onMutedChange,
    isActive,
    tracks,
    autoplayGroup,
    autoPlayInView: autoplayOn,
    visible,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onProgress,
    onLoadedMetadata,
    onError,
    onMediaError,
  });
  const { canFullscreen, isFullscreen, toggleFullscreen } = useFullscreen(rootRef, video.videoElRef);
  // Auto-hide pauses while keyboard focus sits on a control or a menu is open (VP6).
  const [focusPinned, setFocusPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { visible: controlsVisible, wake } = useControlsVisibility(
    video.state.isPlaying,
    controlsAutoHideMs,
    reducedMotion,
    focusPinned || menuOpen,
  );
  const handleFocus = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      wake();
      // React types `target` as the handler's element; on a bubbled focus it is any descendant.
      const target = e.target as Element;
      let keyboard = false;
      try {
        keyboard = target.matches(":focus-visible");
      } catch {
        // `:focus-visible` unsupported — treat as pointer focus.
      }
      setFocusPinned(keyboard && target !== video.videoElRef.current);
    },
    [wake, video.videoElRef],
  );
  const handleBlur = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      const next = e.relatedTarget;
      if (!(next instanceof Node) || !rootRef.current?.contains(next) || next === video.videoElRef.current) {
        setFocusPinned(false);
      }
    },
    [video.videoElRef],
  );

  const { play, pause, seek, togglePlay, toggleMute, retry, setActiveTrack } = video;
  useImperativeHandle(
    ref,
    () => ({ play, pause, seek, toggleMute, toggleFullscreen }),
    [play, pause, seek, toggleMute, toggleFullscreen],
  );

  // With `onDoubleTap`, a single tap waits out the double-tap window before toggling (VP7).
  const handleTap = useDoubleTap(onDoubleTap, { onSingleTap: togglePlay });

  const stateForRender: VideoState = {
    ...video.state,
    duration: video.state.isLoaded ? video.state.duration : (durationHint ?? video.state.duration),
    isActive,
    dir,
    tracks,
    activeTrack: video.activeTrack,
    canFullscreen,
    isFullscreen,
    togglePlay,
    toggleMute,
    seek,
    retry,
    setActiveTrack,
    toggleFullscreen,
  };

  const context: VideoPlayerContextValue = {
    state: stateForRender,
    labels,
    locale,
    formatTime,
    seekStep,
    controlsVisible,
    wake,
    setMenuOpen,
  };

  const { videoElRef } = video;
  const seekBy = useCallback(
    (delta: number) => seek((videoElRef.current?.currentTime ?? 0) + delta),
    [seek, videoElRef],
  );

  return (
    <div
      ref={rootRef}
      dir={dirProp}
      className={cn("relative h-full w-full overflow-hidden bg-black", className)}
      onClick={onDoubleTap ? handleTap : undefined}
      onPointerMove={controls ? wake : undefined}
      onPointerDown={controls ? wake : undefined}
      onFocus={controls ? handleFocus : undefined}
      onBlur={controls ? handleBlur : undefined}
      onKeyDown={controls ? wake : undefined}
    >
      <VideoElement
        videoRef={video.videoRef}
        eventHandlers={video.videoEventHandlers}
        src={video.effectiveSrc}
        poster={poster}
        tracks={tracks}
        crossOrigin={crossOrigin}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        preload={preload}
        autoPlay={autoPlay}
        objectFit={objectFit}
        ariaLabel={labels.videoLabel}
        videoClassName={videoClassName}
        onClick={onDoubleTap ? undefined : togglePlay}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
        seekStep={controls ? seekStep : undefined}
        dir={dir}
        onSeekBy={seekBy}
      />

      {controls && (
        <VideoPlayerContext.Provider value={context}>
          {renderControls ? (
            renderControls(stateForRender)
          ) : (
            <DefaultControls
              showSeekBar={showSeekBar}
              showTime={showTime}
              showFullscreen={showFullscreen}
              controlsClassName={controlsClassName}
            />
          )}
        </VideoPlayerContext.Provider>
      )}
    </div>
  );
}

const VideoPlayer = memo(VideoPlayerInner);
VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
export default VideoPlayer;
