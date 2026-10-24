"use client";

import type { MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVideoPlayer } from "./video-player-context";

/** Clicks on the error panel are not taps on the video (no play toggle, no double tap). */
const stop = (e: MouseEvent) => e.stopPropagation();

export function VideoPlayerStatus() {
  const { state, labels } = useVideoPlayer();
  const buffering = state.isBuffering && !state.hasError;
  return (
    <>
      {/* Always mounted: screen readers announce a live region's CHANGE, not one inserted already filled. */}
      <div role="status" className="sr-only">
        {buffering ? labels.buffering : null}
      </div>
      {state.hasError ? (
        <div
          className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 bg-media-overlay p-4 text-center text-media-overlay-foreground"
          onClick={stop}
        >
          <p role="alert" className="text-sm">
            {labels.error}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={state.retry}>
            {labels.retry}
          </Button>
        </div>
      ) : buffering ? (
        <div
          data-video-player-spinner=""
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Loader2 className="size-8 text-media-overlay-foreground motion-safe:animate-spin" />
        </div>
      ) : null}
    </>
  );
}
