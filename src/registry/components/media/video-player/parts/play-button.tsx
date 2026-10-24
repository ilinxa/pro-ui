"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVideoPlayer } from "./video-player-context";

export function VideoPlayerPlayButton({
  size = "sm",
  className,
}: {
  size?: "sm" | "lg";
  className?: string;
}) {
  const { state, labels } = useVideoPlayer();
  const large = size === "lg";
  const iconClass = large ? "h-6 w-6" : "h-4 w-4";
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        "rounded-full hover:bg-background/90",
        large ? "h-14 w-14 bg-background/80" : "h-8 w-8 bg-background/70",
        className,
      )}
      onClick={state.togglePlay}
      aria-label={state.isPlaying ? labels.pause : labels.play}
    >
      {state.isPlaying ? (
        <Pause className={iconClass} aria-hidden="true" />
      ) : (
        <Play className={cn(iconClass, "fill-current")} aria-hidden="true" />
      )}
    </Button>
  );
}
