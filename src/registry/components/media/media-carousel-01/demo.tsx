"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { MediaCarousel01 } from "./media-carousel-01";
import {
  DUMMY_MIXED_MEDIA,
  DUMMY_PRODUCT_PHOTOS,
  DUMMY_SINGLE_IMAGE,
  DUMMY_SINGLE_VIDEO,
} from "./dummy-data";
import type { MediaCarousel01Handle } from "./types";

function ImperativeRefDemo() {
  const ref = useRef<MediaCarousel01Handle>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  return (
    <div className="space-y-3">
      <MediaCarousel01
        ref={ref}
        items={DUMMY_MIXED_MEDIA}
        variant="gallery"
        onSlideChange={(idx) => setCurrentIdx(idx)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Active: <span className="font-mono">{currentIdx + 1}</span> /{" "}
          {DUMMY_MIXED_MEDIA.length}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => ref.current?.scrollPrev()}
        >
          Prev
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => ref.current?.scrollNext()}
        >
          Next
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => ref.current?.scrollTo(0)}
        >
          Jump to 1
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => ref.current?.scrollTo(2)}
        >
          Jump to 3 (video)
        </Button>
      </div>
    </div>
  );
}

export default function MediaCarousel01Demo() {
  return (
    <Tabs defaultValue="gallery">
      <SwipeTabsList>
        <TabsTrigger value="gallery">Gallery (mixed)</TabsTrigger>
        <TabsTrigger value="linear">Linear (photos)</TabsTrigger>
        <TabsTrigger value="single">Single-item shortcut</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
        <TabsTrigger value="imperative">Imperative ref</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="gallery" className="mt-6 space-y-3">
        <MediaCarousel01
          items={DUMMY_MIXED_MEDIA}
          variant="gallery"
          onDoubleTap={(item, idx) =>
            console.log("[demo] double-tap", item.id, idx)
          }
        />
        <p className="text-xs text-muted-foreground">
          Instagram-style peek-scale gallery. Double-tap any slide → console
          log. The video at index 3 auto-pauses when you swipe to other
          slides — that&apos;s the <code>isActive</code> contract from{" "}
          <code>video-player-01</code>.
        </p>
      </TabsContent>

      <TabsContent value="linear" className="mt-6 space-y-3">
        <MediaCarousel01
          items={DUMMY_PRODUCT_PHOTOS}
          variant="linear"
          aspect="video"
          loop={false}
        />
        <p className="text-xs text-muted-foreground">
          Linear snap variant — full-width slides, no peek, no loop. Default
          for product galleries / photo sets where each slide is independent.
        </p>
      </TabsContent>

      <TabsContent value="single" className="mt-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Single image (no nav, no indicators, no scale)
          </p>
          <MediaCarousel01
            items={DUMMY_SINGLE_IMAGE}
            variant="gallery"
            onDoubleTap={(item) => console.log("[demo] single tap", item.id)}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Single video (no nav, no indicators, no scale)
          </p>
          <MediaCarousel01 items={DUMMY_SINGLE_VIDEO} variant="gallery" />
        </div>
      </TabsContent>

      <TabsContent value="custom" className="mt-6 space-y-3">
        <MediaCarousel01
          items={DUMMY_MIXED_MEDIA}
          variant="gallery"
          renderItem={(item, ctx) => (
            <div className="relative h-full w-full">
              {item.type === "image" ? (
                <>
                  <img
                    src={item.url}
                    alt={item.alt ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-xs text-white tabular-nums">
                    {ctx.index + 1} / {DUMMY_MIXED_MEDIA.length}
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground">
                    [video item: custom render not implemented]
                  </span>
                </div>
              )}
            </div>
          )}
        />
        <p className="text-xs text-muted-foreground">
          The <code>renderItem</code> slot replaces both built-in handlers.
          Here we draw a slide-counter overlay on each image. Video items
          fall to the consumer&apos;s placeholder (in real apps, wire your
          own video player here).
        </p>
      </TabsContent>

      <TabsContent value="imperative" className="mt-6">
        <ImperativeRefDemo />
        <p className="mt-3 text-xs text-muted-foreground">
          Imperative ref handle: <code>scrollTo(idx)</code> /{" "}
          <code>scrollPrev()</code> / <code>scrollNext()</code> /{" "}
          <code>getCurrentIndex()</code>. Use for programmatic navigation
          (e.g., &quot;jump to media that has the comment user mentioned&quot;).
        </p>
      </TabsContent>
    </Tabs>
  );
}
