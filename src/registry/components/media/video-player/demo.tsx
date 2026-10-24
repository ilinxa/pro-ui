"use client";

import { useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "./video-player";
import {
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBar,
  VideoPlayerStatus,
  VideoPlayerTime,
} from "./index";
import {
  SAMPLE_CAPTIONED_VIDEO_URL,
  SAMPLE_LOOP_VIDEO_URL,
  SAMPLE_POSTER_URL,
  SAMPLE_RTL_CAPTION,
  SAMPLE_TRACKS_EN,
  SAMPLE_TRACKS_MULTI,
  SAMPLE_VIDEO_URL,
  SAMPLE_VIDEO_URL_B,
  SAMPLE_VIDEO_URL_C,
} from "./dummy-data";
import type { VideoPlayerHandle, VideoState } from "./types";

/** A URL that 404s on purpose, for the error-refresh demo. */
const BROKEN_VIDEO_URL = "https://test-videos.co.uk/vids/does-not-exist.mp4";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="aspect-video overflow-hidden rounded-md">{children}</div>;
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
            <VideoPlayer src={src} isActive={idx === activeIdx} autoPlay />
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
        that <code>media-carousel</code> will use.
      </p>
    </div>
  );
}

function ErrorRefreshDemo() {
  const [refreshes, setRefreshes] = useState(0);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Frame>
          <VideoPlayer
            src={BROKEN_VIDEO_URL}
            onMediaError={() => {
              setRefreshes((n) => n + 1);
              return new Promise<string>((resolve) =>
                setTimeout(() => resolve(SAMPLE_VIDEO_URL), 1500),
              );
            }}
          />
        </Frame>
        <p className="text-xs text-muted-foreground">
          Refreshes requested: {refreshes}. The 404 calls{" "}
          <code>onMediaError</code> once; the spinner shows for 1.5 s, then
          the returned URL plays.
        </p>
      </div>
      <div className="space-y-2">
        <Frame>
          <VideoPlayer src={BROKEN_VIDEO_URL} onMediaError={() => undefined} />
        </Frame>
        <p className="text-xs text-muted-foreground">
          <code>onMediaError</code> returns nothing, so the error overlay
          shows with a Retry button.
        </p>
      </div>
    </div>
  );
}

function AutoplayGroupDemo() {
  const clips = [SAMPLE_VIDEO_URL, SAMPLE_VIDEO_URL_B, SAMPLE_VIDEO_URL_C];
  return (
    <div className="space-y-3">
      <div className="max-h-96 space-y-6 overflow-y-auto rounded-md border border-border p-3">
        {clips.map((src) => (
          <Frame key={src}>
            <VideoPlayer src={src} autoPlayInView autoplayGroup="demo-feed" />
          </Frame>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Scroll the column: a player plays (muted) once half of it is visible
        and pauses when it leaves. All three share{" "}
        <code>autoplayGroup=&quot;demo-feed&quot;</code>, so only one plays at
        a time. Reduced motion turns autoplay-in-view off.
      </p>
    </div>
  );
}

function ControlledMuteDemo() {
  const [muted, setMuted] = useState(true);
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={!muted} onCheckedChange={(on) => setMuted(!on)} />
        Sound on (feed-wide)
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Frame>
          <VideoPlayer src={SAMPLE_VIDEO_URL} muted={muted} onMutedChange={setMuted} />
        </Frame>
        <Frame>
          <VideoPlayer src={SAMPLE_VIDEO_URL_B} muted={muted} onMutedChange={setMuted} />
        </Frame>
      </div>
      <p className="text-xs text-muted-foreground">
        One <code>muted</code> state shared by two players. Each mute button
        calls <code>onMutedChange</code> instead of changing the element, so
        the switch and both players stay in step.
      </p>
    </div>
  );
}

function ComposedDemo() {
  const ref = useRef<VideoPlayerHandle>(null);
  return (
    <div className="space-y-3">
      <Frame>
        <VideoPlayer
          ref={ref}
          src={SAMPLE_VIDEO_URL}
          poster={SAMPLE_POSTER_URL}
          renderControls={() => (
            <>
              <VideoPlayerStatus />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3">
                <VideoPlayerSeekBar />
                <div className="flex items-center gap-2">
                  <VideoPlayerPlayButton />
                  <VideoPlayerTime />
                  <VideoPlayerMuteButton className="ms-auto" />
                </div>
              </div>
            </>
          )}
        />
      </Frame>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void ref.current?.play()}>
          play()
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.pause()}>
          pause()
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.seek(5)}>
          seek(5)
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        A lighter overlay built from the flat parts (status, seek bar, play,
        time, mute) and placed with logical utilities. The buttons drive the
        player through its <code>ref</code> handle.
      </p>
    </div>
  );
}

export default function VideoPlayerDemo() {
  return (
    <Tabs defaultValue="default">
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="captions">Captions</TabsTrigger>
        <TabsTrigger value="fullscreen">Fullscreen</TabsTrigger>
        <TabsTrigger value="error">Error refresh</TabsTrigger>
        <TabsTrigger value="autoplay">Autoplay group</TabsTrigger>
        <TabsTrigger value="muted">Controlled mute</TabsTrigger>
        <TabsTrigger value="composed">Composed controls</TabsTrigger>
        <TabsTrigger value="custom-controls">Custom controls</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
        <TabsTrigger value="decorative">Decorative</TabsTrigger>
        <TabsTrigger value="carousel">isActive (carousel)</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default" className="mt-6">
        <Frame>
          <VideoPlayer src={SAMPLE_VIDEO_URL} poster={SAMPLE_POSTER_URL} />
        </Frame>
        <p className="mt-3 text-xs text-muted-foreground">
          Seek bar and time are on by default; before playback the idle
          duration badge shows. The corner pause and mute buttons are the
          prototype look. Controls auto-hide after 2s during playback — hover
          or move the mouse to bring them back.
        </p>
      </TabsContent>

      <TabsContent value="captions" className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Frame>
            <VideoPlayer
              src={SAMPLE_CAPTIONED_VIDEO_URL}
              tracks={SAMPLE_TRACKS_MULTI}
              crossOrigin="anonymous"
            />
          </Frame>
          <Frame>
            <VideoPlayer
              src={SAMPLE_CAPTIONED_VIDEO_URL}
              tracks={SAMPLE_TRACKS_EN}
              crossOrigin="anonymous"
            />
          </Frame>
        </div>
        <p className="text-xs text-muted-foreground">
          Left: two tracks give a captions menu. Right: one track gives a
          toggle. Cross-origin caption files need{" "}
          <code>crossOrigin=&quot;anonymous&quot;</code> and a CORS-enabled
          video host; never set it on a clip served without CORS headers.
        </p>
      </TabsContent>

      <TabsContent value="fullscreen" className="mt-6">
        <Frame>
          <VideoPlayer src={SAMPLE_VIDEO_URL} poster={SAMPLE_POSTER_URL} showFullscreen />
        </Frame>
        <p className="mt-3 text-xs text-muted-foreground">
          <code>showFullscreen</code> adds the button; it stays hidden where
          no fullscreen API exists.
        </p>
      </TabsContent>

      <TabsContent value="error" className="mt-6">
        <ErrorRefreshDemo />
      </TabsContent>

      <TabsContent value="autoplay" className="mt-6">
        <AutoplayGroupDemo />
      </TabsContent>

      <TabsContent value="muted" className="mt-6">
        <ControlledMuteDemo />
      </TabsContent>

      <TabsContent value="composed" className="mt-6">
        <ComposedDemo />
      </TabsContent>

      <TabsContent value="custom-controls" className="mt-6">
        <Frame>
          <VideoPlayer
            src={SAMPLE_VIDEO_URL}
            poster={SAMPLE_POSTER_URL}
            renderControls={(state) => <CustomControlsRenderer {...state} />}
          />
        </Frame>
        <p className="mt-3 text-xs text-muted-foreground">
          The default control overlay is fully replaced via{" "}
          <code>renderControls</code> — slot receives full{" "}
          <code>VideoState</code> (isPlaying, currentTime, duration,
          togglePlay, etc.).
        </p>
      </TabsContent>

      <TabsContent value="rtl" className="mt-6 space-y-3">
        <div dir="rtl" lang="ar" className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm">{SAMPLE_RTL_CAPTION}</p>
          <Frame>
            <VideoPlayer src={SAMPLE_VIDEO_URL} poster={SAMPLE_POSTER_URL} />
          </Frame>
        </div>
        <p className="text-xs text-muted-foreground">
          No <code>dir</code> prop: direction comes from the ancestor{" "}
          <code>dir=&quot;rtl&quot;</code>. The seek bar fills from the right
          and the arrow keys are mirrored.
        </p>
        <div className="max-w-md space-y-2">
          <Frame>
            <VideoPlayer src={SAMPLE_VIDEO_URL_B} locale="tr" />
          </Frame>
          <p className="text-xs text-muted-foreground">
            <code>locale=&quot;tr&quot;</code> formats the time text for
            Turkish.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="decorative" className="mt-6">
        <Frame>
          <VideoPlayer
            src={SAMPLE_LOOP_VIDEO_URL}
            controls={false}
            autoPlay
            loop
          />
        </Frame>
        <p className="mt-3 text-xs text-muted-foreground">
          <code>controls=&#123;false&#125;</code> + <code>autoPlay</code> +{" "}
          <code>loop</code> — silent decorative background. No control
          overlay and no seek keys; click-to-toggle and Space / M still work
          when focused.
        </p>
      </TabsContent>

      <TabsContent value="carousel" className="mt-6">
        <CarouselDemo />
      </TabsContent>
    </Tabs>
  );
}
