export default function EngagementBarUsage() {
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
        <code>{`import { EngagementBar } from "@/components/engagement-bar"

<EngagementBar
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
        <code>{`<EngagementBar
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
        Per-action: pass <code>liked</code> / <code>bookmarked</code> /{" "}
        <code>viewerReaction</code> →
        controlled (host owns state, must update on toggle). Omit them →
        uncontrolled (component flips state internally on click). Promise
        handlers and reaction counts are covered below.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`// Uncontrolled — component manages liked/bookmarked internally
<EngagementBar
  actions={[
    { kind: "like", count: 0, onToggle: console.log },
    { kind: "bookmark", onToggle: console.log },
  ]}
/>

// Controlled — host owns state
const [liked, setLiked] = useState(false)
<EngagementBar
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

<EngagementBar
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
        <code>{`import { EngagementBar, EngagementHeartBurst } from "@/components/engagement-bar"

const barRef = useRef<EngagementBarHandle>(null)
const [burstKey, setBurstKey] = useState(0)

<div className="relative">
  <MediaCarousel
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
<EngagementBar ref={barRef} actions={[...]} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom action</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Wand2 } from "lucide-react"

<EngagementBar
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
        Drop into <code>news-card</code>&apos;s <code>actions</code>{" "}
        slot. <code>variant=&quot;compact&quot;</code> keeps the bar tight; no
        framer-motion cost (heart-burst not imported).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<NewsCard
  title={article.title}
  /* ... */
  actions={
    <EngagementBar
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

      <h3 className="mb-2 mt-6 text-base font-semibold">Withheld counts</h3>
      <p className="text-muted-foreground">
        <code>count: null</code> (or leaving <code>count</code> out) withholds
        the count: no number renders, nothing reaches the accessible name, and
        a split count button is not rendered. <code>count: 0</code> renders
        &quot;0&quot;. A withheld count stays withheld through toggles and
        deltas. The same goes for a reaction&apos;s <code>totalCount</code> and
        each <code>kinds[i].count</code>.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`{ kind: "like", count: 0 }      // "0"
{ kind: "like", count: null }   // no number
{ kind: "comment" }             // no number
{ kind: "reaction", kinds: kinds.map((k) => ({ ...k, count: null })), totalCount: null }`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Controlled data + promise handlers
      </h3>
      <p className="text-muted-foreground">
        Controlled per action, never for the whole bar. <strong>like</strong>:
        pass <code>liked</code> and <code>count</code> together.{" "}
        <strong>bookmark</strong>: pass <code>bookmarked</code>.{" "}
        <strong>reaction</strong>: pass <code>viewerReaction</code> (a key or{" "}
        <code>null</code>) together with every <code>kinds[i].count</code> and{" "}
        <code>totalCount</code> — all of them win on every render, and the bar
        no longer applies <code>reaction-changed</code> deltas itself (you still
        receive them through <code>onSubscribeDelta</code>). Comment, share and
        view-count are always prop-driven; a matching delta shows until the
        prop next changes.
      </p>
      <p className="text-muted-foreground">
        <code>onToggle</code> / <code>onSelect</code> may return a promise. With{" "}
        <code>optimistic</code> (default <code>true</code>) the change shows at
        once; when the promise settles it keeps (uncontrolled) or defers to
        your props (controlled), and a rejection rolls back. Only the latest
        request decides. <code>optimistic=&#123;false&#125;</code> renders only
        the props (controlled) or only a settled change (uncontrolled). A
        synchronous handler behaves as before.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<EngagementBar
  actions={[
    {
      kind: "like",
      liked,
      count,
      onToggle: async (next) => {
        await api.setLike(post.id, next)   // reject -> the bar rolls back
        setLiked(next)
        setCount((c) => c + (next ? 1 : -1))
      },
    },
    {
      kind: "reaction",
      kinds,                // each with its own count
      totalCount,
      viewerReaction,
      onSelect: async (key) => { await api.react(post.id, key); refetch() },
    },
  ]}
  optimistic
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Gating: disabled / hidden
      </h3>
      <p className="text-muted-foreground">
        Every action accepts <code>disabled</code> and <code>hidden</code>.
        Disabled sets <code>aria-disabled=&quot;true&quot;</code>, stays
        focusable and never calls its handler (click, keyboard, long-press, or{" "}
        <code>triggerLike</code> / <code>triggerBookmark</code> /{" "}
        <code>triggerReaction</code>); the reaction picker does not open.
        Hidden renders nothing, and the handle methods ignore it.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`{ kind: "like", count: 12, disabled: !user.canReact }
{ kind: "bookmark", hidden: !user }`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Trailing slot</h3>
      <p className="text-muted-foreground">
        <code>trailing</code> renders inside the action row, after the
        end-aligned actions (stacked variant: after the last action), in DOM and
        Tab order. Use it for menus the built-in actions cannot express.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<EngagementBar actions={actions} trailing={<ReportMenu postId={post.id} />} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Direction, locale and count format
      </h3>
      <p className="text-muted-foreground">
        <code>align</code> takes <code>&quot;start&quot;</code> /{" "}
        <code>&quot;end&quot;</code> / <code>&quot;auto&quot;</code>.{" "}
        <code>&quot;auto&quot;</code> (or omitted) is the per-kind default:
        bookmark and view-count at the end, the rest at the start.{" "}
        <code>&quot;left&quot;</code> / <code>&quot;right&quot;</code> are
        deprecated aliases of start / end. Put the bar inside{" "}
        <code>dir=&quot;rtl&quot;</code> and the row mirrors; the reaction
        picker&apos;s ← / → keys follow the direction (Home / End jump to the
        ends). Pass <code>dir</code> to set it explicitly, otherwise the
        element&apos;s direction is read after mount.
      </p>
      <p className="text-muted-foreground">
        <code>locale</code> (default <code>&quot;en&quot;</code>) drives the
        default count formatter,{" "}
        <code>Intl.NumberFormat(locale, &#123; notation: &quot;compact&quot; &#125;)</code>:
        1200 is &quot;1.2K&quot; in English, &quot;1,2 B&quot; in Turkish.
        Pass <code>formatCount</code> to replace it. Initials are upper-cased
        with the locale too.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<div dir="rtl" lang="ar">
  <EngagementBar actions={actions} labels={arLabels} locale="ar" />
</div>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessible names</h3>
      <p className="text-muted-foreground">
        The visible count is part of the name: the like button reads &quot;Like
        12&quot; (&quot;Like&quot; when the count is withheld). The same applies
        to comment, share, view-count, the reaction trigger, picker kinds and
        split count buttons. <code>labels</code> overrides still apply; every
        key is optional and falls back to{" "}
        <code>defaultEngagementBarLabels</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        LikersStrip and ShareMenu
      </h3>
      <p className="text-muted-foreground">
        Both take <code>labels</code> (partial; <code>undefined</code> keeps
        the default) and <code>locale</code>. LikersStrip labels:{" "}
        <code>heading</code>, <code>close</code>, <code>loading</code>,{" "}
        <code>loadMore</code>, <code>moreAriaLabel(count, formatted)</code>,{" "}
        <code>morePill(formatted)</code>. ShareMenu labels:{" "}
        <code>heading</code>, <code>searchPlaceholder</code>,{" "}
        <code>searchLabel</code> (the search input&apos;s accessible name),{" "}
        <code>empty</code>, <code>close</code>. ShareMenu&apos;s{" "}
        <code>onSearch</code> is latest-request-wins and falls back to the local
        filter if it rejects.
      </p>
      <p className="text-muted-foreground">
        LikersStrip data: <code>likers</code> + <code>onLikersChange</code> is
        controlled (load-more calls{" "}
        <code>onLikersChange([...likers, ...loaded])</code>);{" "}
        <code>defaultLikers</code> is uncontrolled; <code>likers</code> alone is
        shown on every render plus anything the strip loaded.{" "}
        <code>totalCount: null</code> shows the pill without a number;{" "}
        <code>hasMore</code> overrides the count-derived pill.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<LikersStrip
  totalCount={null}
  likers={likers}
  onLikersChange={setLikers}
  onLoadMore={() => api.moreLikers(post.id)}
  hasMore={hasMore}
  labels={{ heading: "الإعجابات", close: "إخفاء" }}
  locale="ar"
/>
<ShareMenu users={users} onShareTo={send} labels={{ searchLabel: "بحث" }} locale="ar" />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Migrating from 0.4.x
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>EngagementState</code> counts (<code>likeCount</code>,{" "}
          <code>commentCount</code>, <code>reactionCounts[key]</code>, …) are{" "}
          <code>number | null</code> — null-check before doing arithmetic.
        </li>
        <li>
          A controlled reaction (<code>viewerReaction</code> passed) now takes
          its counts from the props; the bar no longer applies{" "}
          <code>reaction-changed</code> to it.
        </li>
        <li>
          English counts are &quot;1.2K&quot; / &quot;11K&quot; (was
          &quot;1.2k&quot; / &quot;10.5k&quot;); accessible names now include
          the count.
        </li>
        <li>
          <code>DEFAULT_ENGAGEMENT_BAR_LABELS</code> →{" "}
          <code>defaultEngagementBarLabels</code>;{" "}
          <code>labels.formatCount</code> → the <code>formatCount</code> prop
          (both old forms still work, deprecated).
        </li>
        <li>
          <code>align</code> &quot;left&quot; / &quot;right&quot; →
          &quot;start&quot; / &quot;end&quot;. <code>ReactionPicker</code> and{" "}
          <code>ReactionAction</code> are now exported.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>actions</code> order is preserved within each align group.
          Default rule: <code>bookmark</code> + <code>view-count</code> at the
          end; everything else at the start. Per-action <code>align</code>{" "}
          overrides.
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
