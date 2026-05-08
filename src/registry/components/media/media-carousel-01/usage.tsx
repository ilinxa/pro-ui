export default function MediaCarousel01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mt-0 mb-2 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Anywhere a swipeable horizontal strip of mixed images + videos is
        needed — Instagram-style post media (gallery), product galleries
        (linear), event photo strips, news article photo sets, real estate
        listings. The <code>gallery</code> variant matches kasder&apos;s
        Instagram-post peek-scale aesthetic; the <code>linear</code> variant
        is full-width snap. Single-item posts bypass the carousel entirely
        (no nav, no indicators, no scale). Built-in image + video handlers;{" "}
        <code>renderItem</code> slot for full per-slide takeover.
      </p>

      <h3 className="mt-6 mb-2 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { MediaCarousel01 } from "@/components/media-carousel-01";

export function PostMedia({ post }: { post: Post }) {
  return <MediaCarousel01 items={post.media} variant="gallery" />;
}`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Linear variant (product gallery)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel01
  items={product.photos}
  variant="linear"
  aspect="video"
  loop={false}
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Cross-folder import: video items get full <code>video-player-01</code>
      </h3>
      <p className="text-muted-foreground">
        The built-in video item handler imports{" "}
        <code>video-player-01</code> directly. shadcn{" "}
        <code>registryDependencies</code> ensures both install when you run{" "}
        <code>pnpm dlx shadcn@latest add @ilinxa/media-carousel-01</code>.
        Videos in inactive slides pause cleanly via the{" "}
        <code>isActive</code> contract — no consumer wiring needed.
      </p>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Custom <code>renderItem</code> slot
      </h3>
      <p className="text-muted-foreground">
        Replaces both built-in handlers. Receives{" "}
        <code>{"(item, { isActive, index })"}</code> — consumer renders
        whatever (HLS player, 360° viewer, branded controls).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel01
  items={items}
  variant="gallery"
  renderItem={(item, { isActive, index }) =>
    item.type === "panorama" ? (
      <PanoramaViewer src={item.url} active={isActive} />
    ) : (
      <DefaultRenderer item={item} isActive={isActive} />
    )
  }
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Imperative ref handle
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const carouselRef = useRef<MediaCarousel01Handle>(null);

<MediaCarousel01 ref={carouselRef} items={items} variant="gallery" />
<button onClick={() => carouselRef.current?.scrollTo(2)}>
  Jump to slide 3
</button>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Double-tap-to-like integration
      </h3>
      <p className="text-muted-foreground">
        Unified <code>onDoubleTap(item, index)</code> fires for both image
        and video items. Use to trigger heart-burst overlays (composes with{" "}
        <code>engagement-bar-01</code>&apos;s{" "}
        <code>EngagementHeartBurst</code> sub-export) or analytics.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel01
  items={post.media}
  variant="gallery"
  onDoubleTap={(item, idx) => {
    setBurstKey((k) => k + 1);
    onLike(post.id);
    analytics.track("post.double_tap", { id: post.id, idx });
  }}
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        <code>onSlideChange</code> for analytics
      </h3>
      <p className="text-muted-foreground">
        Fires only on Embla&apos;s <code>select</code> event (post-snap, not
        during drag). Mount-sync does NOT fire — first-render is silent so
        analytics consumers don&apos;t track a phantom &quot;view slide
        0&quot; on every page load.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel01
  items={post.media}
  variant="gallery"
  onSlideChange={(idx) =>
    analytics.track("post.slide", { id: post.id, idx })
  }
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Localized labels</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const TR_LABELS = {
  carouselLabel: "Medya galerisi",
  previousSlide: "Önceki",
  nextSlide: "Sonraki",
  goToSlide: "Slayta git",
  slideAriaLabel: "Slayt {index} / {total}",
} as const;

<MediaCarousel01 items={items} variant="gallery" labels={TR_LABELS} />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Anti-patterns</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Don&apos;t add extra fields to <code>MediaItem</code></strong>{" "}
          — strict discriminated union. Custom shapes go via{" "}
          <code>renderItem</code> with TS intersection.
        </li>
        <li>
          <strong>Don&apos;t expect virtualization</strong> — kasder posts
          ≤10 media; v0.2 candidate (<code>lazyVideoDistance</code>) for
          larger sets.
        </li>
        <li>
          <strong>Don&apos;t expect a fullscreen lightbox</strong> on
          slide-click — separate UX (would be{" "}
          <code>image-lightbox-01</code>).
        </li>
        <li>
          <strong>Don&apos;t expect <code>feature-strip</code> variant</strong>{" "}
          in v0.1 — deferred (no concrete consumer in this scope; story-rail
          uses raw Embla).
        </li>
        <li>
          <strong>Don&apos;t pass inline objects</strong> to{" "}
          <code>labels</code>: bust <code>React.memo</code>. Hoist to
          module scope.
        </li>
      </ul>

      <h3 className="mt-6 mb-2 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Carousel root: <code>role=&quot;region&quot;</code> +{" "}
          <code>aria-roledescription=&quot;carousel&quot;</code> per WAI-ARIA
          APG.
        </li>
        <li>
          Each slide: <code>role=&quot;group&quot;</code> +{" "}
          <code>aria-roledescription=&quot;slide&quot;</code> +{" "}
          <code>aria-label=&quot;Slide N of M&quot;</code> (template
          configurable via <code>labels.slideAriaLabel</code>).
        </li>
        <li>
          Indicator dots get <code>aria-current=&quot;true&quot;</code> when
          active.
        </li>
        <li>
          Embla provides arrow-key keyboard nav natively when the viewport
          has focus.
        </li>
        <li>
          RTL: pass <code>rtl={`{true}`}</code> — Embla handles drag
          direction; chevrons flip via <code>rtl:rotate-180</code>.
        </li>
      </ul>
    </div>
  );
}
