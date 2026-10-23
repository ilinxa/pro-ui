const PRE =
  "overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs";
const H3 = "mb-2 mt-6 text-base font-semibold";

export default function StoryRailUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>StoryRail</code> when you need a horizontal stories
        rail at the top of a feed — portrait thumbnails with a gradient ring
        (unread) or muted ring (read), drag-free skim-scroll, scroll-aware edge
        fades and optional prev / next arrows. Decoupled from the viewer:{" "}
        <code>onItemClick({"{"} item, index {"}"})</code> hands off to whatever
        your host renders (your own viewer, <code>story-viewer</code>, a
        navigation push, etc.).
      </p>

      <h3 className={H3}>Items: uncontrolled, controlled, legacy</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Uncontrolled</strong> — <code>defaultItems</code> seeds the
          rail once on mount. <code>markViewed</code>, <code>dispatch</code>,{" "}
          <code>reset</code> and realtime <code>subscribe</code> deltas mutate
          the rail&apos;s internal list.
        </li>
        <li>
          <strong>Controlled</strong> — pass <code>items</code> together with{" "}
          <code>onItemsChange</code>. The prop wins on every render. Every
          mutation (<code>markViewed</code>, <code>dispatch</code>,{" "}
          <code>reset</code>, subscribe deltas) is computed from the latest
          prop and reported through <code>onItemsChange(next)</code>; the DOM
          changes only when your <code>items</code> do. Two deltas before a
          re-render both land. To discard a reported change, re-render with a
          fresh array; until <code>items</code> changes identity the rail keeps
          building on the last list it reported.
        </li>
        <li>
          <strong>Notified uncontrolled</strong> — <code>defaultItems</code>{" "}
          plus <code>onItemsChange</code>: the rail keeps its own list and also
          reports every next list.
        </li>
        <li>
          <strong>Legacy</strong> — <code>items</code> alone (no{" "}
          <code>onItemsChange</code>) is read once on mount and later changes
          are ignored. It still works, and a dev-only warning points you at{" "}
          <code>defaultItems</code> or <code>onItemsChange</code>.
        </li>
      </ul>

      <h3 className={H3}>Minimal usage (uncontrolled)</h3>
      <pre className={PRE}>
        <code>{`import { StoryRail } from "@/components/story-rail";

<StoryRail
  defaultItems={stories}
  onItemClick={({ item, index }) => openViewer(index)}
/>`}</code>
      </pre>

      <h3 className={H3}>Controlled</h3>
      <pre className={PRE}>
        <code>{`const [stories, setStories] = useState(initialStories);
const railRef = useRef<StoryRailHandle>(null);

<StoryRail
  ref={railRef}
  items={stories}
  onItemsChange={setStories}
  onItemClick={({ item, index }) => openViewer(index)}
/>

// viewer.onStoryViewed -> railRef.current?.markViewed(id)
// -> onItemsChange(next) -> setStories(next) -> rail re-renders`}</code>
      </pre>

      <h3 className={H3}>With AddStoryThumbnail</h3>
      <pre className={PRE}>
        <code>{`import {
  StoryRail,
  AddStoryThumbnail,
} from "@/components/story-rail";

<StoryRail
  defaultItems={stories}
  leading={
    <AddStoryThumbnail
      userAvatar={viewer.avatar}
      onClick={() => openStoryComposer()}
    />
  }
  onItemClick={({ item, index }) => openViewer(index)}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Inside a rail, <code>AddStoryThumbnail</code> reads{" "}
        <code>labels.addStoryLabel</code> and{" "}
        <code>labels.addStoryAriaLabel</code> from the rail through context, so
        you localize once. Its own <code>label</code> / <code>ariaLabel</code>{" "}
        props still win. Used standalone (outside a rail) it uses the English
        defaults. It shows a visible focus ring on keyboard focus.
      </p>

      <h3 className={H3}>Missing, broken or expired previews</h3>
      <pre className={PRE}>
        <code>{`<StoryRail
  defaultItems={stories}           // previewImage is optional
  onPreviewError={async (item) => {
    // Resolve a fresh URL (e.g. re-signed) -> retried once.
    // Resolve nothing, or reject -> avatar card.
    return await api.refreshStoryPreview(item.id);
  }}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>previewImage</code> is optional. When it is absent, or it fails
        and <code>onPreviewError</code> cannot refresh it, the tile renders an
        avatar card: the author&apos;s avatar (initials fallback) centred on{" "}
        <code>bg-muted</code>, same 80×112 size. A new <code>previewImage</code>{" "}
        on the item resets the state. Pass <code>previewSrcSet</code> /{" "}
        <code>previewSizes</code> (sizes defaults to <code>80px</code>) for
        responsive previews.
      </p>

      <h3 className={H3}>Muted authors</h3>
      <pre className={PRE}>
        <code>{`{ id: "9", username: "burak", hasUnread: true, muted: true, ... }`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>muted: true</code> draws the grey ring even when the story is
        unread, and renders the tile and name at reduced opacity. Ordering
        stays yours. The default aria label reads &quot;{"{"}username{"}"},
        muted&quot;.
      </p>

      <h3 className={H3}>Arrows</h3>
      <pre className={PRE}>
        <code>{`<StoryRail defaultItems={stories} arrows="fine-pointer" />`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>arrows</code> is <code>&quot;none&quot;</code> (default),{" "}
        <code>&quot;fine-pointer&quot;</code> (mouse / trackpad only, resolved
        after mount so the first render matches the server) or{" "}
        <code>&quot;always&quot;</code>. An arrow is hidden when the rail
        cannot scroll that way. Each press scrolls a page, arrows mirror in
        RTL, and <code>prefers-reduced-motion</code> jumps instead of
        animating. Names come from <code>labels.previousLabel</code> /{" "}
        <code>labels.nextLabel</code>. Without arrows, a mouse can only
        click-drag (there is no wheel / trackpad-swipe scrolling), so desktop
        layouts usually want <code>&quot;fine-pointer&quot;</code>. Arrows sit
        on the default tile&apos;s centre; set{" "}
        <code>--story-rail-arrow-top</code> for custom tiles.
      </p>

      <h3 className={H3}>RTL and localization</h3>
      <pre className={PRE}>
        <code>{`<div dir="rtl">
  <StoryRail
    defaultItems={stories}
    arrows="always"
    leading={<AddStoryThumbnail userAvatar={viewer.avatar} />}
    labels={{
      railLabel: "القصص",
      addStoryLabel: "أضف قصة",
      addStoryAriaLabel: "أضف قصة جديدة",
      previousLabel: "القصص السابقة",
      nextLabel: "القصص التالية",
      emptyState: "لا توجد قصص بعد.",
    }}
  />
</div>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Direction comes from the <code>dir</code> prop, else the nearest{" "}
        <code>[dir]</code> ancestor (resolved after mount), and feeds Embla.
        Fades, the arrows and the Add badge use logical positions. Every
        string lives in <code>labels</code> (defaults in{" "}
        <code>DEFAULT_STORY_RAIL_LABELS</code>), including the{" "}
        <code>thumbnailAriaLabel(item)</code> function.
      </p>

      <h3 className={H3}>Realtime via subscribe</h3>
      <pre className={PRE}>
        <code>{`import type {
  Subscribe,
  StoryRailDelta,
} from "@/components/story-rail";

const subscribe = useCallback<Subscribe<StoryRailDelta>>(
  (handler) => channel.on("stories", handler),
  [channel],
);

<StoryRail
  defaultItems={stories}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("story-rail-delta", d)}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Hosts must memoize <code>subscribe</code> via <code>useCallback</code>{" "}
        — identity changes trigger a clean teardown + re-call. In controlled
        mode each delta is reported through <code>onItemsChange</code> instead
        of being applied internally.
      </p>

      <h3 className={H3}>Mark viewed (from your viewer)</h3>
      <pre className={PRE}>
        <code>{`const railRef = useRef<StoryRailHandle>(null);

<StoryRail
  ref={railRef}
  defaultItems={stories}
  onItemClick={({ item, index }) => {
    setActiveStoryIndex(index);
    setViewerOpen(true);
  }}
/>

<MyStoryViewer
  open={viewerOpen}
  story={stories[activeStoryIndex]}
  onClose={() => {
    setViewerOpen(false);
    railRef.current?.markViewed(stories[activeStoryIndex].id);
  }}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Click does NOT auto-mark-viewed (matches Instagram — the ring stays
        until the user actually completes the story). Host calls{" "}
        <code>markViewed(itemId)</code> when their viewer closes.{" "}
        <code>ref.scrollTo(index)</code> takes an index into{" "}
        <code>items</code>; the <code>leading</code> slot is not counted.
      </p>

      <h3 className={H3}>Custom thumbnail render</h3>
      <pre className={PRE}>
        <code>{`<StoryRail
  defaultItems={stories}
  renderThumbnail={(item, isUnread, { onClick, baseId, showRing }) => (
    <BrandedStoryThumbnail
      item={item}
      preview={item.previewImage /* string | undefined */}
      ring={showRing /* hasUnread && !muted; isUnread is raw hasUnread */}
      onClick={onClick}
      ariaLabelledBy={baseId}
    />
  )}
/>`}</code>
      </pre>

      <h3 className={H3}>Bare (no card frame)</h3>
      <pre className={PRE}>
        <code>{`<StoryRail defaultItems={stories} framed={false} className="px-4" />`}</code>
      </pre>
      <p className="text-muted-foreground">
        With <code>framed: false</code>, the card chrome is removed and the
        edge fades use <code>from-background</code> so they blend with whatever
        container you embed in.
      </p>

      <h3 className={H3}>Theming</h3>
      <pre className={PRE}>
        <code>{`:root {
  --story-ring-from: oklch(0.80 0.20 132);
  --story-ring-to: oklch(0.70 0.18 60);
  --story-rail-fade-width: 2rem; /* default 3rem */
}
.dark {
  --story-ring-from: oklch(0.86 0.18 132);
  --story-ring-to: oklch(0.75 0.16 60);
}`}</code>
      </pre>
      <p className="text-muted-foreground">
        The unread ring is a gradient from <code>--story-ring-from</code> to{" "}
        <code>--story-ring-to</code>. Define them in your <code>:root</code> /{" "}
        <code>.dark</code>; the install adds <code>--color-story-ring-*</code>{" "}
        mappings with fallbacks that never override yours. The edge fades are
        scroll-aware: each shows only on a side the rail can scroll toward, so
        at rest the first tile and its focus ring are never covered. Width is{" "}
        <code>--story-rail-fade-width</code>.
      </p>

      <h3 className={H3}>Upgrading from 0.3</h3>
      <div className="rounded-md border border-border bg-muted/50 p-4">
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <code>previewImage</code> is optional: in{" "}
            <code>renderThumbnail</code> and any reducer reader it is now{" "}
            <code>string | undefined</code>. Guard before using it as an{" "}
            <code>img src</code>.
          </li>
          <li>
            Move <code>items=</code> to <code>defaultItems=</code> (or add{" "}
            <code>onItemsChange</code> to control it). Bare <code>items</code>{" "}
            still works but dev-warns.
          </li>
          <li>
            Ring colours are token-driven. The old{" "}
            <code>from-accent via-warning to-destructive</code> classes are
            gone; set <code>--story-ring-from</code> /{" "}
            <code>--story-ring-to</code>.
          </li>
          <li>Edge fades are scroll-aware instead of always showing.</li>
          <li>
            <code>ref.scrollTo(index)</code> now targets the item index even
            when <code>leading</code> is mounted.
          </li>
        </ul>
      </div>

      <h3 className={H3}>Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Embla used inline with <code>align: &quot;start&quot;</code>,{" "}
          <code>containScroll: &quot;trimSnaps&quot;</code>,{" "}
          <code>dragFree: true</code>. No indicator dots — story rails are
          skim-scroll, not snap carousels.
        </li>
        <li>
          Thumbnail dimensions are fixed at <code>w-20 h-28</code> (80×112).
          For different sizes, use the <code>renderThumbnail</code> slot.
        </li>
        <li>
          Edge fades are <code>aria-hidden</code> +{" "}
          <code>pointer-events-none</code>; they don&apos;t intercept drag.
        </li>
        <li>
          <code>linkComponent</code> + <code>getHref</code> co-exist with{" "}
          <code>onItemClick</code> — both fire on click. Use this for analytics
          on a navigation-mode rail.
        </li>
        <li>
          For external state coordination, the <code>storyRailReducer</code>{" "}
          and <code>useStoryRailState</code> are publicly exported.
        </li>
      </ul>
    </div>
  );
}
