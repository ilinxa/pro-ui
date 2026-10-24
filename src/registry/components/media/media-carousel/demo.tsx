"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { MediaCarousel } from "./media-carousel";
import {
  DUMMY_MIXED_MEDIA,
  DUMMY_PRODUCT_PHOTOS,
  DUMMY_SINGLE_IMAGE,
  DUMMY_SINGLE_VIDEO,
  arLabels,
  errorRefreshItems,
  mixedRatioItems,
  prototypeItems,
  refreshedImageUrl,
  trLabels,
  videoItems,
} from "./dummy-data";
import type { MediaCarouselHandle } from "./types";

function ImperativeRefDemo() {
  const ref = useRef<MediaCarouselHandle>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  return (
    <div className="space-y-3">
      <MediaCarousel
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

const PROTOTYPE_STYLE = {
  "--media-carousel-inactive-blur": "0px",
} as CSSProperties;

function ControlledDemo() {
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const last = prototypeItems.length - 1;
  const go = (next: number) => setIndex(Math.min(last, Math.max(0, next)));

  return (
    <div className="space-y-3">
      <MediaCarousel
        items={prototypeItems}
        variant="gallery"
        loop={false}
        index={index}
        onIndexChange={(next) => {
          if (!locked) setIndex(next);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          index = <span className="font-mono">{index}</span>
        </span>
        <Button type="button" size="sm" variant="outline" onClick={() => go(index - 1)}>
          Prev
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => go(index + 1)}>
          Next
        </Button>
        <Button
          type="button"
          size="sm"
          variant={locked ? "default" : "outline"}
          aria-pressed={locked}
          onClick={() => setLocked((v) => !v)}
        >
          {locked ? "Locked (not adopting)" : "Lock"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        <code>index</code> + <code>onIndexChange</code> held in state: the prop wins on every
        render. Turn on <strong>Lock</strong> and swipe — the parent ignores the change, so the
        carousel settles back to the held index. External Prev / Next always work.
      </p>
    </div>
  );
}

function ErrorRefreshDemo() {
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="space-y-3">
      <MediaCarousel
        items={errorRefreshItems}
        variant="linear"
        aspect="natural-clamped"
        onMediaError={async (item) => {
          setLog((l) => [...l, `onMediaError(${item.id}) called`]);
          await new Promise((r) => setTimeout(r, 800));
          setLog((l) => [...l, `resolved a fresh URL for ${item.id}`]);
          return refreshedImageUrl;
        }}
      />
      <div className="rounded-md border border-border bg-muted p-3 font-mono text-xs" aria-live="polite">
        {log.length === 0 ? (
          <span className="text-muted-foreground">No calls yet.</span>
        ) : (
          log.map((line, i) => <div key={i}>{line}</div>)
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Slide 1&apos;s <code>url</code> is dead (<code>/__missing__/expired.jpg</code>).{" "}
        <code>onMediaError</code> fires once, resolves a new URL after 800 ms, and the image is
        retried with it. A second failure for the same item would not call again.
      </p>
    </div>
  );
}

export default function MediaCarouselDemo() {
  return (
    <Tabs defaultValue="gallery">
      <SwipeTabsList>
        <TabsTrigger value="gallery">Gallery (mixed)</TabsTrigger>
        <TabsTrigger value="linear">Linear (photos)</TabsTrigger>
        <TabsTrigger value="single">Single-item shortcut</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
        <TabsTrigger value="imperative">Imperative ref</TabsTrigger>
        <TabsTrigger value="prototype">Prototype</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
        <TabsTrigger value="tr">Turkish</TabsTrigger>
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="error">Error refresh</TabsTrigger>
        <TabsTrigger value="video">Video</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="gallery" className="mt-6 space-y-3">
        <MediaCarousel
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
          <code>video-player</code>.
        </p>
      </TabsContent>

      <TabsContent value="linear" className="mt-6 space-y-3">
        <MediaCarousel
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
          <MediaCarousel
            items={DUMMY_SINGLE_IMAGE}
            variant="gallery"
            onDoubleTap={(item) => console.log("[demo] single tap", item.id)}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Single video (no nav, no indicators, no scale)
          </p>
          <MediaCarousel items={DUMMY_SINGLE_VIDEO} variant="gallery" />
        </div>
      </TabsContent>

      <TabsContent value="custom" className="mt-6 space-y-3">
        <MediaCarousel
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
                  <div className="absolute right-2 bottom-2 rounded-full bg-foreground/70 px-2 py-0.5 font-mono text-xs text-background tabular-nums">
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

      <TabsContent value="prototype" className="mt-6 space-y-3">
        <div className="mx-auto max-w-md" style={PROTOTYPE_STYLE}>
          <MediaCarousel
            items={prototypeItems}
            variant="gallery"
            showCounter
            showNavButtons="fine-pointer"
            aspect="natural-clamped"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The platform post carousel: <code>aspect=&quot;natural-clamped&quot;</code> (frame from the
          first item&apos;s 3:2, mixed sizes after it), counter chip, nav buttons only under a mouse,
          and <code>--media-carousel-inactive-blur: 0px</code> set through a style object on a
          wrapper.
        </p>
      </TabsContent>

      <TabsContent value="rtl" className="mt-6 space-y-3">
        <div dir="rtl" lang="ar" className="rounded-xl border border-border bg-card p-4">
          <MediaCarousel
            items={mixedRatioItems}
            variant="gallery"
            showCounter
            locale="ar"
            labels={arLabels}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          No <code>dir</code> prop: the direction comes from the ancestor <code>dir=&quot;rtl&quot;</code>.
          Slides lay out right-to-left, <kbd>←</kbd> goes to the next slide, chevrons and nav buttons
          swap sides, and the counter and labels use Arabic (function-form <code>slideAriaLabel</code>,{" "}
          <code>goToSlide</code>, <code>counter</code>).
        </p>
      </TabsContent>

      <TabsContent value="tr" className="mt-6 space-y-3">
        <MediaCarousel
          items={mixedRatioItems}
          variant="linear"
          aspect="natural-clamped"
          showCounter
          locale="tr"
          labels={trLabels}
        />
        <p className="text-xs text-muted-foreground">
          <code>locale=&quot;tr&quot;</code> with Turkish function-form labels and the counter chip.
          Inspect the slides: <code>aria-label=&quot;Slayt 1 / 3&quot;</code>, dots{" "}
          <code>1. slayta git</code>.
        </p>
      </TabsContent>

      <TabsContent value="controlled" className="mt-6">
        <ControlledDemo />
      </TabsContent>

      <TabsContent value="error" className="mt-6">
        <ErrorRefreshDemo />
      </TabsContent>

      <TabsContent value="video" className="mt-6 space-y-3">
        <MediaCarousel items={videoItems} variant="gallery" aspect="video" showCounter />
        <p className="text-xs text-muted-foreground">
          Two videos (poster before play) and an image. Only the active slide&apos;s video can play,
          and the active video pauses when the carousel is scrolled out of view (below ~50 % visible)
          — start one, then scroll the page.
        </p>
      </TabsContent>
    </Tabs>
  );
}
