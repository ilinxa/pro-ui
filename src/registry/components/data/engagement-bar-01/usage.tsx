export default function EngagementBar01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Anywhere a row of like / comment / share / bookmark / view-count
        actions is needed under content. Designed for social posts but
        retrofits cleanly into news cards, event cards, video overlays, and
        product cards via the <code>actions</code> slot pattern.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal usage</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { EngagementBar01 } from "@/registry/components/data/engagement-bar-01"

<EngagementBar01
  actions={[
    { kind: "like", count: 142, liked: false, onToggle: (next) => onLike(post.id, next) },
    { kind: "comment", count: 23, onClick: () => openComments(post.id) },
    { kind: "share", onClick: () => share(post.id) },
    { kind: "bookmark", bookmarked: false, onToggle: (next) => onBookmark(post.id, next) },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Split heart vs count (kasder UX)
      </h3>
      <p className="text-muted-foreground">
        Pass <code>onCountClick</code> on a <code>like</code> action and the
        bar splits the heart icon and the count number into two separate click
        targets. Heart fires <code>onToggle</code>; count fires{" "}
        <code>onCountClick</code>. Typical use: heart toggles like, count opens
        a likers panel.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<EngagementBar01
  actions={[
    {
      kind: "like",
      count: 142,
      liked: false,
      onToggle: (next) => onLike(post.id, next),
      onCountClick: () => openLikersPanel(post.id),
    },
    { kind: "comment", count: 23, onClick: () => openComments(post.id) },
  ]}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Backwards-compatible: omit <code>onCountClick</code> and the bar
        renders the heart + count as a single button (the original behavior).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Controlled vs uncontrolled (per action)</h3>
      <p className="text-muted-foreground">
        Per-action: pass <code>liked</code> / <code>bookmarked</code> →
        controlled (host owns state, must update on toggle). Omit them →
        uncontrolled (component flips state internally on click).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`// Uncontrolled — component manages liked/bookmarked internally
<EngagementBar01
  actions={[
    { kind: "like", count: 0, onToggle: console.log },
    { kind: "bookmark", onToggle: console.log },
  ]}
/>

// Controlled — host owns state
const [liked, setLiked] = useState(false)
<EngagementBar01
  actions={[
    { kind: "like", count: 142, liked, onToggle: setLiked },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Realtime via subscribe</h3>
      <p className="text-muted-foreground">
        Pass a memoized <code>subscribe</code> function. In{" "}
        <strong>uncontrolled</strong> mode, deltas patch internal state. In{" "}
        <strong>controlled</strong> mode, deltas only fire{" "}
        <code>onSubscribeDelta</code> — you translate them into prop updates.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const subscribe = useCallback(
  (handler) => channel.on("post.delta", handler),
  [channel],
)

<EngagementBar01
  actions={[...]}
  subscribe={subscribe}
  onSubscribeDelta={(delta) => analytics.track("post.delta", delta)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Heart-burst (Instagram-style)</h3>
      <p className="text-muted-foreground">
        <code>EngagementHeartBurst</code> is a sibling sub-export — RSC
        compatible (no <code>&quot;use client&quot;</code>), CSS-keyframe
        driven. Host increments a counter to trigger; <code>key=&#123;trigger&#125;</code>{" "}
        remounts the burst, restarting the animation.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { EngagementBar01, EngagementHeartBurst } from "@/registry/components/data/engagement-bar-01"

const barRef = useRef<EngagementBar01Handle>(null)
const [burstKey, setBurstKey] = useState(0)

<div className="relative">
  <MediaCarousel01
    items={post.media}
    onDoubleTap={() => {
      barRef.current?.triggerLike()
      setBurstKey((k) => k + 1)
    }}
  />
  <EngagementHeartBurst
    trigger={burstKey}
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
  />
</div>
<EngagementBar01 ref={barRef} actions={[...]} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom action</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Wand2 } from "lucide-react"

<EngagementBar01
  actions={[
    { kind: "like", count: 89, onToggle },
    {
      kind: "custom",
      id: "remix",
      label: "Remix",
      icon: <Wand2 className="h-5 w-5" />,
      onClick: openRemixSheet,
    },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">News-card retrofit</h3>
      <p className="text-muted-foreground">
        Drop into <code>content-card-news-01</code>&apos;s <code>actions</code>{" "}
        slot. <code>variant=&quot;compact&quot;</code> keeps the bar tight; no
        framer-motion cost (heart-burst not imported).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ContentCardNews01
  title={article.title}
  /* ... */
  actions={
    <EngagementBar01
      variant="compact"
      actions={[
        { kind: "like", count: article.likes, liked: article.viewerLiked, onToggle },
        { kind: "share", onClick: () => share(article) },
        { kind: "bookmark", bookmarked: article.saved, onToggle },
      ]}
    />
  }
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>actions</code> order is preserved within each align group.
          Default rule: <code>bookmark</code> + <code>view-count</code> right;
          everything else left. Per-action <code>align</code> overrides.
        </li>
        <li>
          Stacked variant ignores <code>align</code> — actions render in a
          single vertical column.
        </li>
        <li>
          Memoize <code>subscribe</code> via <code>useCallback</code>. New
          identity = re-subscription (clean teardown + re-call).
        </li>
        <li>
          <code>engagementReducer</code> + <code>useEngagementState</code> are
          public exports — drive your own state machine if you need cross-component
          coordination.
        </li>
        <li>
          Heart-burst CSS lives in a sibling <code>.css</code> file shipped via
          shadcn <code>registry:file</code>. Import is automatic; consumer&apos;s{" "}
          <code>globals.css</code> is untouched.
        </li>
      </ul>
    </div>
  );
}
