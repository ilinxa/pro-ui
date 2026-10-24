"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVideoPlayer } from "./video-player-context";

export function VideoPlayerMuteButton({ className }: { className?: string }) {
  const { state, labels } = useVideoPlayer();
  const { isMuted, toggleMute } = state;
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn("h-8 w-8 rounded-full bg-background/70 hover:bg-background/90", className)}
      onClick={toggleMute}
      aria-pressed={isMuted}
      aria-label={isMuted ? labels.unmute : labels.mute}
    >
      {isMuted ? (
        <VolumeX className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
