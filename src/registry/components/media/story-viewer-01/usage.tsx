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
    </div>
  );
}
