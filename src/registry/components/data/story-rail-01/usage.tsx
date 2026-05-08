export default function StoryRail01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>StoryRail01</code> when you need a horizontal stories
        rail at the top of a feed — kasder-style portrait thumbnails with a
        gradient ring (unread) or muted ring (read), drag-free skim-scroll, and
        edge-fade gradients. Decoupled from the viewer:{" "}
        <code>onItemClick(item, index)</code> hands off to whatever your host
        renders (your own viewer, the future <code>story-viewer-01</code>, a
        navigation push, etc.).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Footgun: the `items` prop is mount-only
      </h3>
      <p className="text-muted-foreground">
        Component captures <code>items</code> as initial state on mount;
        subsequent prop reference changes are <strong>ignored</strong>. Realtime{" "}
        <code>subscribe</code> mutates the internal store; for external pushes
        use the imperative handle&apos;s <code>reset(next)</code> or surgical{" "}
        <code>dispatch(action)</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal usage</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { StoryRail01 } from "@/components/story-rail-01";

<StoryRail01
  items={stories}
  onItemClick={(item, index) => openViewer(index)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        With AddStoryThumbnail (kasder UX)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  StoryRail01,
  AddStoryThumbnail,
} from "@/components/story-rail-01";

<StoryRail01
  items={stories}
  leading={
    <AddStoryThumbnail
      userAvatar={viewer.avatar}
      onClick={() => openStoryComposer()}
    />
  }
  onItemClick={(item, index) => openViewer(index)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Realtime via subscribe</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import type {
  Subscribe,
  StoryRailDelta,
} from "@/components/story-rail-01";

const subscribe = useCallback<Subscribe<StoryRailDelta>>(
  (handler) => channel.on("stories", handler),
  [channel],
);

<StoryRail01
  items={stories}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("story-rail-delta", d)}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Hosts must memoize <code>subscribe</code> via <code>useCallback</code> —
        identity changes trigger a clean teardown + re-call (same convention as{" "}
        <code>engagement-bar-01</code> / <code>comment-thread-01</code> /{" "}
        <code>post-card-01</code>).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Mark viewed (from your viewer&apos;s onClose)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const railRef = useRef<StoryRail01Handle>(null);

<StoryRail01
  ref={railRef}
  items={stories}
  onItemClick={(item, index) => {
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
        <code>markViewed(itemId)</code> when their viewer closes.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom thumbnail render</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StoryRail01
  items={stories}
  renderThumbnail={(item, isUnread, { onClick, baseId }) => (
    <BrandedStoryThumbnail
      item={item}
      isUnread={isUnread}
      onClick={onClick}
      ariaLabelledBy={baseId}
    />
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Bare (no card frame)</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StoryRail01 items={stories} framed={false} className="px-4" />`}</code>
      </pre>
      <p className="text-muted-foreground">
        With <code>framed: false</code>, the card chrome is removed and the
        edge gradients use <code>from-background</code> + <code>left-0/right-0</code>{" "}
        so they blend with whatever container you embed in.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Embla used inline with <code>align: &quot;start&quot;</code>,{" "}
          <code>containScroll: &quot;trimSnaps&quot;</code>,{" "}
          <code>dragFree: true</code> (kasder-exact). No indicator dots — story
          rails are skim-scroll, not snap carousels.
        </li>
        <li>
          Thumbnail dimensions locked to <code>w-20 h-28</code> (80×112). For
          different sizes, use the <code>renderThumbnail</code> slot.
        </li>
        <li>
          Unread ring:{" "}
          <code>bg-linear-to-br from-accent via-warning to-destructive</code>.
          Read ring: <code>bg-muted</code>.
        </li>
        <li>
          Edge gradients are <code>aria-hidden</code> +{" "}
          <code>pointer-events-none</code>; don&apos;t intercept drag.
        </li>
        <li>
          <code>StoryRailItem.previewImage</code> is required (no placeholder
          fallback in v0.1). Hosts ensure preview URLs exist before passing.
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
