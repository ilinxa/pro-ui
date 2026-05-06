import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { VideoState } from "../types";

type VideoStateValue = Pick<
  VideoState,
  "isPlaying" | "isMuted" | "isLoaded" | "duration" | "currentTime"
>;

type VideoAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "set-muted"; muted: boolean }
  | { type: "loadstart" }
  | { type: "loaded"; duration: number }
  | { type: "set-current-time"; currentTime: number }
  | { type: "ended" }
  | { type: "reset" };

const initialState: VideoStateValue = {
  isPlaying: false,
  isMuted: true,
  isLoaded: false,
  duration: NaN,
  currentTime: 0,
};

function videoReducer(
  state: VideoStateValue,
  action: VideoAction,
): VideoStateValue {
  switch (action.type) {
    case "play":
      return state.isPlaying ? state : { ...state, isPlaying: true };
    case "pause":
      return state.isPlaying ? { ...state, isPlaying: false } : state;
    case "set-muted":
      return state.isMuted === action.muted
        ? state
        : { ...state, isMuted: action.muted };
    case "loadstart":
      return { ...initialState, isMuted: state.isMuted };
    case "loaded":
      return { ...state, isLoaded: true, duration: action.duration };
    case "set-current-time":
      return state.currentTime === action.currentTime
        ? state
        : { ...state, currentTime: action.currentTime };
    case "ended":
      return { ...state, isPlaying: false, currentTime: 0 };
    case "reset":
      return { ...initialState, isMuted: state.isMuted };
    default:
      return state;
  }
}

export interface UseVideoStateOptions {
  initialMuted: boolean;
  isActive: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onError?: (error: MediaError | null) => void;
}

export function useVideoState({
  initialMuted,
  isActive,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  onError,
}: UseVideoStateOptions) {
  const [state, dispatch] = useReducer(videoReducer, {
    ...initialState,
    isMuted: initialMuted,
  });

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElRef.current = node;
  }, []);

  // Stable refs for callbacks (avoid effect cascade on identity change).
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onEndedRef = useRef(onEnded);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onLoadedMetadataRef = useRef(onLoadedMetadata);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onEndedRef.current = onEnded;
    onTimeUpdateRef.current = onTimeUpdate;
    onLoadedMetadataRef.current = onLoadedMetadata;
    onErrorRef.current = onError;
  });

  // rAF cleanup on unmount.
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Pause when isActive flips false. Hook owns video DOM, single dep.
  useEffect(() => {
    if (!isActive) videoElRef.current?.pause();
  }, [isActive]);

  // Memoized handlers — empty deps because all state is in stable refs.
  const handleVideoPlay = useCallback(() => {
    dispatch({ type: "play" });
    onPlayRef.current?.();
  }, []);

  const handleVideoPause = useCallback(() => {
    dispatch({ type: "pause" });
    onPauseRef.current?.();
  }, []);

  const handleVideoEnded = useCallback(() => {
    dispatch({ type: "ended" });
    onEndedRef.current?.();
  }, []);

  const handleVideoLoadStart = useCallback(() => {
    dispatch({ type: "loadstart" });
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    dispatch({ type: "loaded", duration: el.duration });
    onLoadedMetadataRef.current?.(el.duration);
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = videoElRef.current;
      if (!el) return;
      dispatch({ type: "set-current-time", currentTime: el.currentTime });
      onTimeUpdateRef.current?.(el.currentTime, el.duration);
    });
  }, []);

  const handleVideoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      onErrorRef.current?.(el.error);
    },
    [],
  );

  const handleVideoVolumeChange = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    dispatch({ type: "set-muted", muted: el.muted });
  }, []);

  const videoEventHandlers = useMemo(
    () => ({
      onPlay: handleVideoPlay,
      onPause: handleVideoPause,
      onEnded: handleVideoEnded,
      onLoadStart: handleVideoLoadStart,
      onLoadedMetadata: handleVideoLoadedMetadata,
      onTimeUpdate: handleVideoTimeUpdate,
      onError: handleVideoError,
      onVolumeChange: handleVideoVolumeChange,
    }),
    [
      handleVideoPlay,
      handleVideoPause,
      handleVideoEnded,
      handleVideoLoadStart,
      handleVideoLoadedMetadata,
      handleVideoTimeUpdate,
      handleVideoError,
      handleVideoVolumeChange,
    ],
  );

  const togglePlay = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {
        // Browser autoplay policy may reject; user gesture is required.
      });
    } else {
      el.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    el.muted = !el.muted;
    // onVolumeChange event will fire and dispatch set-muted.
  }, []);

  return { state, videoRef, togglePlay, toggleMute, videoEventHandlers };
}
