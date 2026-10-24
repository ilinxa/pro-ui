"use client";

import { useCallback, useEffect, useState } from "react";

/** iOS Safari exposes fullscreen on the `<video>` only. */
type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/**
 * Fullscreen for the player: the container's `requestFullscreen`, else the `<video>`'s
 * `webkitEnterFullscreen` (iOS). `canFullscreen` is resolved after mount (false on the server and
 * the hydrating render), so the button never appears and vanishes on hydration.
 */
export function useFullscreen(
  containerRef: React.RefObject<HTMLElement | null>,
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current as WebkitVideo | null;
    const standard =
      !!container &&
      typeof container.requestFullscreen === "function" &&
      document.fullscreenEnabled !== false;
    setCanFullscreen(standard || typeof video?.webkitEnterFullscreen === "function");

    const onChange = () =>
      setIsFullscreen(!!container && document.fullscreenElement === container);
    const onBegin = () => setIsFullscreen(true);
    const onEnd = () => setIsFullscreen(false);
    document.addEventListener("fullscreenchange", onChange);
    video?.addEventListener("webkitbeginfullscreen", onBegin);
    video?.addEventListener("webkitendfullscreen", onEnd);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      video?.removeEventListener("webkitbeginfullscreen", onBegin);
      video?.removeEventListener("webkitendfullscreen", onEnd);
    };
  }, [containerRef, videoRef]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current as WebkitVideo | null;
    if (container && document.fullscreenElement === container) {
      void document.exitFullscreen?.().catch(() => {});
      return;
    }
    if (container && typeof container.requestFullscreen === "function") {
      void Promise.resolve(container.requestFullscreen()).catch(() => {
        // Refused (not from a user gesture, or blocked by a permissions policy).
      });
      return;
    }
    video?.webkitEnterFullscreen?.();
  }, [containerRef, videoRef]);

  return { canFullscreen, isFullscreen, toggleFullscreen };
}
