export default function StoryViewerUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>StoryViewer</code> when you need an Instagram-style
        full-screen modal viewer for sequential stories. Pairs with{" "}
        <code>StoryRail</code>: rail fires <code>onItemClick({"{ item, index }"})</code>;
        host opens <code>&lt;StoryViewer isOpen ... /&gt;</code> with the
        matching index. The viewer&apos;s <code>onStoryViewed(storyId)</code>{" "}
        feeds back into <code>railRef.current.markViewed(storyId)</code> so the
        unread ring clears.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Uncontrolled or controlled <code>stories</code>
      </h3>
      <p className="text-muted-foreground">
        Without <code>onStoriesChange</code>, the component captures{" "}
        <code>stories</code> on mount and later prop changes are{" "}
        <strong>ignored</strong>: realtime <code>subscribe</code> mutates the
        internal store, and external pushes use the handle&apos;s{" "}
        <code>reset(next)</code> or <code>dispatch(action)</code>. Pass{" "}
        <code>onStoriesChange</code> (0.6.0) and the prop wins on every render
        — the viewer reports changes instead of applying them. Either way the
        cursor is ID-anchored, and removing the on-screen item shows the
        unavailable notice (<code>unavailableNoticeMs</code>, default 1500)
        before moving on.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Media you resolve (0.6.0)
      </h3>
      <p className="text-muted-foreground">
        Items may omit <code>src</code>: <code>resolveMedia(item)</code>{" "}
        returns <code>{"{ src, poster }"}</code> (or <code>null</code> =
        unavailable) for the current and next item only. Item-level handlers
        (<code>onDeleteStory</code>, <code>onReport</code>,{" "}
        <code>onCopyLink</code>, <code>onSaveToHighlights</code>,{" "}
        <code>onShareToFeed</code>) receive <code>{"{ story, item }"}</code>;{" "}
        <code>onLoadViewers(itemId, cursor)</code> returns{" "}
        <code>{"{ items, nextCursor }"}</code>. See the guide&apos;s migration
        table.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Media lifetime, preload, backdrop (0.7.0)
      </h3>
      <p className="text-muted-foreground">
        A <code>resolveMedia</code> answer may carry <code>maxAgeMs</code> /{" "}
        <code>expiresAt</code> (asked again once it ages out) and{" "}
        <code>srcSet</code> / <code>sizes</code>;{" "}
        <code>ref.current.invalidateMedia(itemId?, storyId?)</code> forgets
        resolved answers (items with their own <code>src</code> are unaffected). The
        next item is warmed off-screen (<code>preloadNext</code>, default on).{" "}
        <code>backdrop=&quot;ambient&quot;</code> fills the desktop window with
        the current photo, blurred; <code>renderBackdrop</code> draws your own.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Opening and counting views
      </h3>
      <p className="text-muted-foreground">
        The cursor is set when the viewer opens: <code>initialStoryIndex</code>{" "}
        and <code>initialItemIndex</code> (0.7.0, default 0); re-opening goes
        back there (it also re-seeds if <code>initialStoryIndex</code> changes while
        open); otherwise mid-view nav is preserved.{" "}
        <code>onItemReady(storyId, itemId)</code> fires when an item starts to
        count down; <code>onItemViewed</code>&apos;s 5th argument carries{" "}
        <code>direction</code> — count a view on <code>&quot;forward&quot;</code>{" "}
        only.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StoryViewer
  stories={stories}
  initialStoryIndex={storyIndex}
  initialItemIndex={firstUnseen}
  isOpen={open}
  onClose={() => setOpen(false)}
  onItemViewed={(storyId, itemId, _i, _cause, { direction }) => {
    if (direction === "forward") markSeen(storyId, itemId);
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal usage</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { StoryViewer } from "@/components/story-viewer";

<StoryViewer
  stories={stories}
  initialStoryIndex={activeStoryIndex}
  isOpen={open}
  onClose={() => setOpen(false)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Wired with story-rail (canonical)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const railRef = useRef<StoryRailHandle>(null);
const [activeIdx, setActiveIdx] = useState(-1);

<StoryRail
  ref={railRef}
  defaultItems={stories}
  onItemClick={({ index }) => setActiveIdx(index)}
/>

{activeIdx >= 0 ? (
  <StoryViewer
    stories={stories}
    initialStoryIndex={activeIdx}
    isOpen
    onClose={() => setActiveIdx(-1)}
    onStoryViewed={(id) => railRef.current?.markViewed(id)}
  />
) : null}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Forward-only viewed semantics</h3>
      <p className="text-muted-foreground">
        <code>onStoryViewed</code> fires only on <em>forward</em> completion
        (last item OR forward navigation OR auto-close at end). Backward
        navigation does NOT mark stories viewed — matches Instagram.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Realtime via subscribe</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import type {
  Subscribe,
  StoryViewerDelta,
} from "@/components/story-viewer";

const subscribe = useCallback<Subscribe<StoryViewerDelta>>(
  (handler) => channel.on("stories", handler),
  [channel],
);

<StoryViewer
  stories={stories}
  initialStoryIndex={0}
  isOpen={open}
  onClose={onClose}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("story-viewer-delta", d)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<StoryViewerHandle>(null);

ref.current?.goToStory(2);
ref.current?.goToItem(1);
ref.current?.setPaused(true);
ref.current?.dispatch({
  kind: "patch-story",
  storyId: "story-1",
  partial: { username: "newName" },
});
ref.current?.reset(updatedStories);
ref.current?.invalidateMedia(itemId); // 0.7.0 - its signed URL expired`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom item rendering</h3>
      <p className="text-muted-foreground">
        Pass <code>renderItem</code> for full takeover (Lottie items, polls,
        sponsored placements, etc.). Hosts using this MUST set{" "}
        <code>item.duration</code> explicitly for non-video items, since the
        video metadata fallback only applies to the default video branch. Hosts
        wanting to mix custom + default rendering should branch inside their{" "}
        <code>renderItem</code> and re-implement the image / video defaults
        themselves.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Role-aware mode (v0.2.0)
      </h3>
      <p className="text-muted-foreground">
        Pass <code>viewerMode=&quot;viewer&quot;</code> to opt into the
        engagement overlay + DM composer + kebab. Pass{" "}
        <code>viewerMode=&quot;owner&quot;</code> for owners (no engagement;
        owner overlay with view-count + viewers list instead). Per-action
        overrides go through <code>permissions</code> (e.g.{" "}
        <code>{`{ canReact: false }`}</code>) or the universal{" "}
        <code>canPerformAction(action, story, item)</code> predicate, which
        wins over both. Resolution order: predicate → matrix →
        viewerMode-derived defaults.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Engagement overlay (v0.2.0)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StoryViewer
  stories={stories}
  initialStoryIndex={0}
  isOpen={open}
  onClose={onClose}
  viewerMode="viewer"
  currentUser={{ id: "u1", name: "Hessam", avatar: "/me.png" }}
  reactionKinds={[
    { key: "love", icon: <Heart />, label: "Love", count: 0 },
    { key: "laugh", icon: <Laugh />, label: "Laugh", count: 0 },
  ]}
  onLikeStory={(storyId, itemId, nextLiked) => api.like(storyId, itemId, nextLiked)}
  onReactStory={(storyId, itemId, kind) => api.react(storyId, itemId, kind)}
  onShareStory={(storyId, itemId) => api.share(storyId, itemId)}
  onAddReply={(storyId, itemId, content) => api.dm(storyId, itemId, content)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Comments panel (v0.3.0)
      </h3>
      <p className="text-muted-foreground">
        Wire <code>renderCommentsPanel</code> to host the per-item comment
        thread (typically <code>CommentThread</code>). Tapping the
        comment icon opens a bottom-sheet (~62% viewer height) — the visual
        stack above scales to 55% and translates up; tap on the shrunk
        visual closes the panel. Always-mounted so the consumer&apos;s draft
        state survives open/close. The story timer auto-pauses while the
        panel is open. Set <code>disableComments</code> to fall back to the
        v0.2.x behavior (comment icon focuses the DM input).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StoryViewer
  /* … */
  renderCommentsPanel={(story, item, helpers) => (
    <CommentThread
      comments={getCommentsFor(story.id, item.id)}
      onAddComment={(content) => api.addComment(story.id, item.id, content)}
      onLoadMore={() => api.loadMoreComments(story.id, item.id)}
    />
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Share panel (v0.3.1)
      </h3>
      <p className="text-muted-foreground">
        Same shape as <code>renderCommentsPanel</code> — wire{" "}
        <code>renderSharePanel</code> to a share UI (typically{" "}
        <code>ShareMenu</code> from <code>@ilinxa/engagement-bar</code>).
        Comments + share panels are mutually exclusive (opening one closes
        the other). <code>disableSharePanel</code> falls back to firing{" "}
        <code>onShareStory</code> directly (v0.2.x system-share behavior).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Story-to-story 3D cube + swipe (v0.4)
      </h3>
      <p className="text-muted-foreground">
        Story-to-story navigation (auto-advance + nav arrows + tap-zone
        spillover + keyboard + programmatic <code>goToStory</code>)
        animates an Instagram-canonical 3D cube with{" "}
        <code>rotateY 0 → ∓90°</code> over 400ms and Apple-spring easing.
        Item-to-item navigation within a story stays a hard cut. The cube
        is also finger-drivable: drag-left to advance, drag-right to
        return; release commits past 30% width or 0.5 px/ms velocity. Pass{" "}
        <code>storyTransitionDurationMs</code> to tune (default 400) or{" "}
        <code>disableStoryTransition</code> to revert to v0.3.x hard cuts.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Public types &amp; helpers
      </h3>
      <p className="text-muted-foreground">
        The barrel exports every public type referenced by props +
        callbacks — <code>Story</code> / <code>StoryItem</code> /{" "}
        <code>StoryItemLink</code> / <code>StoryViewerMode</code> /{" "}
        <code>StoryViewerPermissions</code> /{" "}
        <code>StoryEngagementReactionKind</code> /{" "}
        <code>StoryKebabMenuItem</code> /{" "}
        <code>ViewerListItem</code> /{" "}
        <code>StoryCurrentUser</code> /{" "}
        <code>StoryEngagementDelta</code> + companions. Three internal
        hooks are also exported standalone for advanced consumers (custom
        viewers reusing the same reducer / progress timer / keyboard nav):{" "}
        <code>useStoryViewerState</code>, <code>useStoryProgress</code>,{" "}
        <code>useStoryKeyboardNav</code>. <code>useCubeTransition</code>{" "}
        and <code>useLongPressPause</code> stay internal — they&apos;re
        tightly coupled to this viewer&apos;s render shape.
      </p>
    </div>
  );
}
