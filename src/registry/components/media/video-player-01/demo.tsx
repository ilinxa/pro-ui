"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { VideoPlayer01 } from "./video-player-01";
import {
  SAMPLE_LOOP_VIDEO_URL,
  SAMPLE_POSTER_URL,
  SAMPLE_TRACKS_EN,
  SAMPLE_VIDEO_URL,
  SAMPLE_VIDEO_URL_B,
  SAMPLE_VIDEO_URL_C,
} from "./dummy-data";
import type { VideoState } from "./types";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CustomControlsRenderer({
  isPlaying,
  duration,
  currentTime,
  togglePlay,
}: VideoState) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end">
      <div className="pointer-events-auto bg-linear-to-t from-black/70 to-transparent p-3">
        <div className="mb-2 flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            )}
          </Button>
          <span className="font-mono text-xs text-white tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CarouselDemo() {
  const videos = [SAMPLE_VIDEO_URL, SAMPLE_VIDEO_URL_B, SAMPLE_VIDEO_URL_C];
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {videos.map((src, idx) => (
          <div
            key={src}
            className={cn(
              "aspect-video overflow-hidden rounded-md ring-2 transition-all",
              idx === activeIdx
                ? "ring-primary"
                : "opacity-60 ring-transparent",
            )}
          >
            <VideoPlayer01 src={src} isActive={idx === activeIdx} autoPlay />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Active slide:</span>
        {videos.map((_, idx) => (
          <Button
            key={idx}
            type="button"
            size="sm"
            variant={idx === activeIdx ? "default" : "outline"}
            onClick={() => setActiveIdx(idx)}
          >
            Video {idx + 1}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Only the active slide plays. Switching pauses the previous video
        cleanly via the <code>isActive</code> prop — exactly the contract
        that <code>media-carousel-01</code> will use.
      </p>
    </div>
  );
}

export default function VideoPlayer01Demo() {
  return (
    <Tabs defaultValue="default">
      <TabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="custom-controls">Custom controls</TabsTrigger>
        <TabsTrigger value="captions">Captions</TabsTrigger>
        <TabsTrigger value="decorative">Decorative</TabsTrigger>
        <TabsTrigger value="carousel">isActive (carousel)</TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="mt-6">
        <div className="aspect-video overflow-hidden rounded-md">
          <VideoPlayer01 src={SAMPLE_VIDEO_URL} poster={SAMPLE_POSTER_URL} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Click the big play button → controls auto-hide after 2s during
          playback. Hover or move the mouse to bring them back.
        </p>
      </TabsContent>

      <TabsContent value="custom-controls" className="mt-6">
        <div className="aspect-video overflow-hidden rounded-md">
          <VideoPlayer01
            src={SAMPLE_VIDEO_URL}
            poster={SAMPLE_POSTER_URL}
            renderControls={(state) => <CustomControlsRenderer {...state} />}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The default control overlay is fully replaced via{" "}
          <code>renderControls</code> — slot receives full{" "}
          <code>VideoState</code> (isPlaying, currentTime, duration,
          togglePlay, etc.).
        </p>
      </TabsContent>

      <TabsContent value="captions" className="mt-6">
        <div className="aspect-video overflow-hidden rounded-md">
          <VideoPlayer01
            src={SAMPLE_VIDEO_URL}
            poster={SAMPLE_POSTER_URL}
            tracks={SAMPLE_TRACKS_EN}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Caption track rendered via the <code>tracks</code> prop. Browsers
          expose them in their native subtitle UI (CC button in fullscreen).
          Sample track URL is a placeholder — verifies the{" "}
          <code>&lt;track&gt;</code> element renders.
        </p>
      </TabsContent>

      <TabsContent value="decorative" className="mt-6">
        <div className="aspect-video overflow-hidden rounded-md">
          <VideoPlayer01
            src={SAMPLE_LOOP_VIDEO_URL}
            controls={false}
            autoPlay
            loop
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <code>controls=&#123;false&#125;</code> + <code>autoPlay</code> +{" "}
          <code>loop</code> — silent decorative background. No control
          overlay; click-to-toggle still works. Keyboard (Space, M) still
          works if focused.
        </p>
      </TabsContent>

      <TabsContent value="carousel" className="mt-6">
        <CarouselDemo />
      </TabsContent>
    </Tabs>
  );
}
