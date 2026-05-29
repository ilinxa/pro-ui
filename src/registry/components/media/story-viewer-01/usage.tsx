export default function StoryViewer01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>StoryViewer01</code> when you need an Instagram-style
        full-screen modal viewer for sequential stories. Pairs with{" "}
        <code>StoryRail01</code>: rail fires <code>onItemClick(item, index)</code>;
        host opens <code>&lt;StoryViewer01 isOpen ... /&gt;</code> with the
        matching index. The viewer&apos;s <code>onStoryViewed(storyId)</code>{" "}
        feeds back into <code>railRef.current.markViewed(storyId)</code> so the
        unread ring clears.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Footgun: the `stories` prop is mount-only
      </h3>
      <p className="text-muted-foreground">
        Component captures <code>stories</code> as initial state on mount;
        subsequent prop reference changes are <strong>ignored</strong>. Realtime{" "}
        <code>subscribe</code> mutates the internal store; for external pushes
        use the imperative handle&apos;s <code>reset(next)</code> or surgical{" "}
        <code>dispatch(action)</code>. Cursor is ID-anchored (not index-based),
        so insertions / removals don&apos;t desync your position.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Cursor reset semantics
      </h3>
      <p className="text-muted-foreground">
        Cursor resets to <code>(initialStoryIndex, 0)</code> whenever the{" "}
        <code>(initialStoryIndex, isOpen)</code> pair changes — opening with a
        different index re-seeds; re-opening with the same index also goes back
        to item 0. Mid-view, in-component nav (tap zones / arrows / keyboard) is
        preserved across renders.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal usage</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { StoryViewer01 } from "@/components/story-viewer-01";

<StoryViewer01
  stories={stories}
  initialStoryIndex={activeStoryIndex}
  isOpen={open}
  onClose={() => setOpen(false)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Wired with story-rail-01 (canonical)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const railRef = useRef<StoryRail01Handle>(null);
const [activeIdx, setActiveIdx] = useState(-1);

<StoryRail01
  ref={railRef}
  items={stories}
  onItemClick={(_item, index) => setActiveIdx(index)}
/>

{activeIdx >= 0 ? (
  <StoryViewer01
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
} from "@/components/story-viewer-01";

const subscribe = useCallback<Subscribe<StoryViewerDelta>>(
  (handler) => channel.on("stories", handler),
  [channel],
);

<StoryViewer01
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
        <code>{`const ref = useRef<StoryViewer01Handle>(null);

ref.current?.goToStory(2);
ref.current?.goToItem(1);
ref.current?.setPaused(true);
ref.current?.dispatch({
  kind: "patch-story",
  storyId: "story-1",
  partial: { username: "newName" },
});
ref.current?.reset(updatedStories);`}</code>
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
        <code>{`<StoryViewer01
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
        thread (typically <code>CommentThread01</code>). Tapping the
        comment icon opens a bottom-sheet (~62% viewer height) — the visual
        stack above scales to 55% and translates up; tap on the shrunk
        visual closes the panel. Always-mounted so the consumer&apos;s draft
        state survives open/close. The story timer auto-pauses while the
        panel is open. Set <code>disableComments</code> to fall back to the
        v0.2.x behavior (comment icon focuses the DM input).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<StoryViewer01
  /* … */
  renderCommentsPanel={(story, item, helpers) => (
    <CommentThread01
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
        <code>ShareMenu</code> from <code>@ilinxa/engagement-bar-01</code>).
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
