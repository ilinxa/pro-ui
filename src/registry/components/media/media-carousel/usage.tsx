export default function MediaCarouselUsage() {
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
        <code>{`import { MediaCarousel } from "@/components/media-carousel";

export function PostMedia({ post }: { post: Post }) {
  return <MediaCarousel items={post.media} variant="gallery" />;
}`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Linear variant (product gallery)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel
  items={product.photos}
  variant="linear"
  aspect="video"
  loop={false}
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Cross-folder import: video items get full <code>video-player</code>
      </h3>
      <p className="text-muted-foreground">
        The built-in video item handler imports{" "}
        <code>video-player</code> directly. shadcn{" "}
        <code>registryDependencies</code> ensures both install when you run{" "}
        <code>pnpm dlx shadcn@latest add @ilinxa/media-carousel</code>.
        Videos in inactive slides pause cleanly via the{" "}
        <code>isActive</code> contract — no consumer wiring needed.
      </p>

      <h3 className="mt-6 mb-2 text-base font-semibold">
        Custom <code>renderItem</code> slot
      </h3>
      <p className="text-muted-foreground">
        Replaces both built-in handlers. Receives{" "}
        <code>{"(item, { isActive, inView, index })"}</code> — consumer renders
        whatever (HLS player, 360° viewer, branded controls).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel
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
        <code>{`const carouselRef = useRef<MediaCarouselHandle>(null);

<MediaCarousel ref={carouselRef} items={items} variant="gallery" />
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
        <code>engagement-bar</code>&apos;s{" "}
        <code>EngagementHeartBurst</code> sub-export) or analytics.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel
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
        <code>{`<MediaCarousel
  items={post.media}
  variant="gallery"
  onSlideChange={(idx) =>
    analytics.track("post.slide", { id: post.id, idx })
  }
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Captions and any aspect</h3>
      <p className="text-muted-foreground">A <code>caption</code> on an item shows under its frame, inside its slide (read once with it), clamped to <code>captionLines</code> (default 2) with a Show more. The carousel takes the active slide&apos;s height, so an item without a caption takes no space. <code>aspect</code> also takes any <code>&quot;W:H&quot;</code>; <code>labels.video</code> and <code>locale</code> reach every video, and a video item&apos;s <code>alt</code> names it.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel
  items={[
    { id: "a", type: "image", url: "/a.jpg", alt: "Harbour at dusk", caption: "First evening" },
    { id: "b", type: "video", url: "/b.mp4", alt: "Ferry crossing" },
  ]}
  variant="gallery"
  aspect="4:5"
  labels={{ captionShowMore: "Devamı", captionShowLess: "Daha az", video: { play: "Oynat" } }}
  locale="tr"
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Natural-clamped aspect + dimensions</h3>
      <p className="text-muted-foreground">Give image and video items their intrinsic <code>width</code> / <code>height</code> (plus optional <code>srcSet</code> / <code>sizes</code> on images). The frame is reserved before load, and <code>aspect=&quot;natural-clamped&quot;</code> uses the first item&apos;s ratio clamped to <code>[minRatio, maxRatio]</code> (default 4/5 to 1.91): 3:4 becomes 4:5, 16:9 stays, 3:1 becomes 1.91:1. Without dimensions the loaded natural size is used (one layout change). <code>aspect</code> applies to both variants and to a single item; in a gallery every slide shares the first item&apos;s frame. A video&apos;s <code>width</code> / <code>height</code> only feed the frame ratio.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel
  items={[
    { id: "a", type: "image", url, alt: "Forest", width: 600, height: 800 },
    { id: "b", type: "video", url: mp4, poster, width: 1280, height: 720 },
  ]}
  variant="gallery"
  aspect="natural-clamped"
  minRatio={4 / 5}
  maxRatio={1.91}
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Labels: function forms</h3>
      <p className="text-muted-foreground"><code>slideAriaLabel(position, total)</code>, <code>goToSlide(position)</code> and <code>counter(position, total, format)</code> take functions (positions are 1-based; <code>format</code> renders a number in <code>locale</code>). New text labels: <code>carouselRoleDescription</code>, <code>slideRoleDescription</code>. The 0.2 string forms (<code>&quot;Slide {`{index}`} of {`{total}`}&quot;</code>, <code>&quot;Go to slide&quot;</code>) are deprecated but still accepted. An <code>undefined</code> value keeps the default. Hoist the object to module scope.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const TR_LABELS: MediaCarouselLabels = {
  carouselLabel: "Medya galerisi",
  previousSlide: "Önceki slayt",
  nextSlide: "Sonraki slayt",
  goToSlide: (n) => \`\${n}. slayta git\`,
  slideAriaLabel: (n, total) => \`Slayt \${n} / \${total}\`,
  counter: (n, total, format) => \`\${format(n)}/\${format(total)}\`,
  carouselRoleDescription: "galeri",
  slideRoleDescription: "slayt",
};

<MediaCarousel items={items} variant="gallery" labels={TR_LABELS} />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Locale + counter</h3>
      <p className="text-muted-foreground"><code>showCounter</code> adds a &quot;2/5&quot; chip (default off) built by <code>labels.counter</code>. <code>locale</code> (BCP 47, default &quot;en&quot;; an invalid tag falls back to &quot;en&quot;) formats its numbers, e.g. Arabic-Indic digits for <code>&quot;ar&quot;</code>.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel items={items} variant="gallery" showCounter locale="ar" labels={AR_LABELS} />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Direction</h3>
      <p className="text-muted-foreground">By default the direction is read from the element after mount, so an ancestor <code>dir=&quot;rtl&quot;</code> is enough. Pass <code>dir=&quot;ltr&quot; | &quot;rtl&quot;</code> to force it. Embla, arrow keys, chevrons, nav-button sides, peek margins and edge fades all follow the one resolved value. <code>rtl</code> is a deprecated alias, honoured only when set (<code>rtl={`{false}`}</code> still forces LTR).</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<div dir="rtl" lang="ar">
  <MediaCarousel items={items} variant="gallery" locale="ar" labels={AR_LABELS} />
</div>

// or explicitly
<MediaCarousel items={items} variant="linear" dir="rtl" />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Controlled index</h3>
      <p className="text-muted-foreground">Pass <code>index</code> + <code>onIndexChange</code> to control the slide: the prop wins on every render, so a swipe calls back and the carousel settles back to the held index unless the parent adopts the change (the snap-back runs after the drag settles, never mid-drag). <code>index</code> without <code>onIndexChange</code> is read-only. <code>onIndexChange</code> is silent for the settle-back and for prop-driven scrolls. Uncontrolled: <code>defaultIndex</code> sets the start. <code>onSlideChange</code> keeps firing as before.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [index, setIndex] = useState(0);

<MediaCarousel items={items} variant="gallery" index={index} onIndexChange={setIndex} />
<button onClick={() => setIndex((i) => Math.max(0, i - 1))}>Prev</button>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Refreshing expired media: <code>onMediaError</code></h3>
      <p className="text-muted-foreground">Called when a built-in image or video fails to load (expired signed URL and the like). Resolve a new URL string to retry once with it; a second failure for the same item does not call again, and a new <code>url</code> from the host resets the item. A recovered image drops its <code>srcSet</code> / <code>sizes</code>; a video shows its loading state meanwhile and resumes at the same time and play state. Not called for <code>renderItem</code> slides.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel
  items={post.media}
  variant="gallery"
  onMediaError={async (item) => {
    const { url } = await api.refreshMediaUrl(item.id);
    return url; // retried once
  }}
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Nav buttons on fine pointers</h3>
      <p className="text-muted-foreground"><code>showNavButtons</code> is <code>true</code> by default; <code>&quot;fine-pointer&quot;</code> renders the side buttons only under <code>(pointer: fine)</code> (mouse / trackpad), resolved after mount, so touch devices swipe without them.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel items={items} variant="gallery" showNavButtons="fine-pointer" />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">CSS variables</h3>
      <p className="text-muted-foreground"><code>--media-carousel-fade</code> sets the edge-fade colour (default <code>var(--background)</code>); <code>--media-carousel-inactive-blur</code> sets the blur of inactive gallery slides (default <code>1px</code>). Set them through <code>className</code> or on any ancestor. The platform post prototype is the defaults plus <code>--media-carousel-inactive-blur: 0px</code>.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<div style={{ "--media-carousel-inactive-blur": "0px" } as React.CSSProperties}>
  <MediaCarousel items={items} variant="gallery" showCounter aspect="natural-clamped" />
</div>

// or via a class
<MediaCarousel className="[--media-carousel-fade:var(--card)]" items={items} variant="gallery" />`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Video: in-view pausing and <code>RenderItemContext.inView</code></h3>
      <p className="text-muted-foreground">Built-in video slides show their <code>poster</code> before play, never autoplay, and play only when the slide is active <em>and</em> the carousel is at least ~50 % in the viewport: scroll the post away and the playing video pauses. <code>isActive</code> still means &quot;the centred slide&quot; (a half-scrolled post does not dim its active slide); the separate <code>inView</code> field is true on the server and on first render. A custom video in <code>renderItem</code> should play on <code>isActive &amp;&amp; inView</code>.</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<MediaCarousel
  items={items}
  variant="gallery"
  renderItem={(item, { isActive, inView, index }) =>
    item.type === "video" ? (
      <MyPlayer src={item.url} playing={isActive && inView} />
    ) : (
      <img src={item.url} alt={item.alt ?? ""} />
    )
  }
/>`}</code>
      </pre>

      <h3 className="mt-6 mb-2 text-base font-semibold">Upgrading from 0.2</h3>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-2 font-medium">0.2</th>
              <th className="p-2 font-medium">0.3</th>
            </tr>
          </thead>
          <tbody className="[&_td]:border-t [&_td]:border-border [&_td]:p-2 [&_td]:align-top">
            <tr>
              <td><code>labels.slideAriaLabel</code> / <code>goToSlide</code> as strings</td>
              <td>Functions <code>(n, total) =&gt; string</code> / <code>(n) =&gt; string</code>; strings still work (deprecated)</td>
            </tr>
            <tr>
              <td><code>rtl</code></td>
              <td><code>dir=&quot;rtl&quot;</code> or an ancestor <code>dir</code>; <code>rtl</code> deprecated</td>
            </tr>
            <tr>
              <td><code>aspect</code> ignored by <code>variant=&quot;gallery&quot;</code></td>
              <td><code>aspect</code> applies to the gallery too (default stays <code>square</code>): a host passing both sees the frame change</td>
            </tr>
            <tr>
              <td>Single item in <code>linear</code> always square</td>
              <td>Honours <code>aspect</code></td>
            </tr>
            <tr>
              <td><code>DEFAULT_MEDIA_CAROUSEL_LABELS</code></td>
              <td><code>defaultMediaCarouselLabels</code> (old name kept, deprecated)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-2 text-base font-semibold">Anti-patterns</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Don&apos;t add extra fields to <code>MediaItem</code></strong>{" "}
          — strict discriminated union. Custom shapes go via{" "}
          <code>renderItem</code> with TS intersection.
        </li>
        <li>
          <strong>Don&apos;t expect virtualization</strong> — kasder posts
          ≤10 media; <code>lazyVideoDistance</code> is not implemented (possible
          future addition) for larger sets.
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
          <code>aria-label=&quot;Slide N of M&quot;</code> (function
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
          RTL: set <code>dir=&quot;rtl&quot;</code> or an ancestor{" "}
          <code>dir</code> — Embla direction, arrow keys, chevrons and nav
          sides follow it.
        </li>
      </ul>
    </div>
  );
}
