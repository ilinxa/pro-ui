"use client";

import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVideoPlayer } from "./video-player-context";

export function VideoPlayerFullscreenButton({ className }: { className?: string }) {
  const { state, labels } = useVideoPlayer();
  if (!state.canFullscreen) return null;
  const { isFullscreen, toggleFullscreen } = state;
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn("h-8 w-8 rounded-full bg-background/70 hover:bg-background/90", className)}
      onClick={toggleFullscreen}
      aria-pressed={isFullscreen}
      aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
    >
      {isFullscreen ? (
        <Minimize className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Maximize className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
