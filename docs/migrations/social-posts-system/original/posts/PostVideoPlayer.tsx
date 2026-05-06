"use client";
import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  isActive?: boolean;
}

export function PostVideoPlayer({ src, poster, className, isActive = true }: PostVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    setShowControls(true);
    togglePlay();
  };

  return (
    <div 
      className={cn("relative w-full h-full bg-black", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover cursor-pointer"
        onClick={handleVideoClick}
        muted={isMuted}
        loop
        playsInline
      />

      {/* Play/Pause Overlay */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {!isPlaying && (
          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full bg-background/80 hover:bg-background/90"
            onClick={togglePlay}
          >
            <Play className="h-6 w-6 fill-current" />
          </Button>
        )}
      </div>

      {/* Bottom Controls */}
      <div 
        className={cn(
          "absolute bottom-3 right-3 flex gap-2 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-background/70 hover:bg-background/90"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Pause indicator (brief flash) */}
      {isPlaying && showControls && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-background/70 hover:bg-background/90"
          onClick={togglePlay}
        >
          <Pause className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
