export default function PostCardUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>PostCard</code> when you need a social-post surface in
        any of four shapes: <code>feed</code> (Instagram-post),{" "}
        <code>compact</code> (sidebar widget), <code>list</code> (admin / search
        row), or <code>detail</code> (full page with embedded comment thread).
        Composes all five Tier-1 social primitives —{" "}
        <code>expandable-text</code>, <code>media-carousel</code>,{" "}
        <code>engagement-bar</code>, <code>comment-thread</code>, plus{" "}
        <code>video-player</code> transitively — and ships with kasder-style
        inline engagement panels (likes / comments / share) on by default.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Inline engagement panels (default)
      </h3>
      <p className="text-muted-foreground">
        Out of the box, every variant except <code>detail</code> wires
        kasder-style inline panels:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Tap heart</strong> → toggle like (and auto-open likers panel
          on a fresh like, controlled by <code>openLikersOnLike</code>).
        </li>
        <li>
          <strong>Tap like count</strong> → open inline likers strip (horizontal
          swipable avatar list with paginating <code>+N</code> pill).
        </li>
        <li>
          <strong>Tap comment icon</strong> → open inline{" "}
          <code>&lt;CommentThread&gt;</code> with composer; scrollable, height
          configurable via <code>inlineCommentsMaxHeight</code> (default{" "}
          <code>24rem</code>).
        </li>
        <li>
          <strong>Tap share icon</strong> → open inline searchable user list
          (when <code>shareSuggestions</code> provided); local filter or async{" "}
          <code>onShareSearch</code>.
        </li>
      </ul>
      <p className="text-muted-foreground">
        Pass <code>engagementMode=&quot;navigate&quot;</code> to deactivate the
        panels and revert to single-button like / <code>onComment(id)</code>{" "}
        navigation. The detail variant ignores <code>engagementMode</code> — its
        thread is always embedded.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        `post`: controlled, or read once at mount
      </h3>
      <p className="text-muted-foreground">
        Without <code>onPostChange</code> the card reads <code>post</code> once,
        at mount, and keeps a local mirror: likes, bookmarks, poll votes and
        realtime <code>engagementSubscribe</code> deltas change the mirror. A
        handler that returns a promise makes the change optimistic — a rejection
        rolls it back (only the latest request per action decides). To push an
        external post in, use the handle&apos;s <code>reset(next)</code>.
      </p>
      <p className="text-muted-foreground">
        With <code>onPostChange</code> the post is <strong>controlled</strong>:{" "}
        <code>post</code> wins on every render. A like, bookmark or poll vote
        shows over it while the handler&apos;s promise is in flight (turn that
        off with <code>optimistic=&#123;false&#125;</code>); once the promise
        resolves — at once for a handler that returns nothing, and for a
        realtime delta — the card calls{" "}
        <code>onPostChange(next, change)</code>. It never applies the change
        itself; a rejection drops the overlay and reports nothing.{" "}
        <code>change</code> is{" "}
        <code>
          &#123; kind: &quot;like&quot; | &quot;bookmark&quot; |
          &quot;poll-vote&quot; | &quot;delta&quot;, … &#125;
        </code>
        . <code>reset(next)</code> also works here: it drops in-flight changes
        and the sensitive reveal. <code>getCurrentPost()</code> returns the post
        as shown.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [post, setPost] = useState(initialPost);

<PostCard
  variant="feed"
  post={post}
  onPostChange={(next, change) => setPost(next)}    // controlled
  onLike={(id, liked) => api.like(id, liked)}        // return the promise: rolled back on reject
  onBookmark={(id, b) => api.bookmark(id, b)}
  onVotePoll={(id, optionId) => api.vote(id, optionId)}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>likers</code> goes straight to the likers strip: it shows the prop
        on every render plus the pages it loaded through{" "}
        <code>onLoadMoreLikers</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Reactions</h3>
      <p className="text-muted-foreground">
        Pass <code>reactions</code> and the default actions show a reaction
        picker in place of the like. <code>counts</code> merge into the kinds,{" "}
        <code>totalCount</code> / <code>viewerReaction</code> /{" "}
        <code>clearOnTap</code> pass through, and a pick calls{" "}
        <code>onReact(post.id, kind | null)</code> (return a promise to roll back
        on reject). Pass <code>viewerReaction</code> (a key or <code>null</code>)
        to control it. Double-tap on the media applies <code>defaultKind</code>{" "}
        (default: the first kind) when the viewer has no reaction yet, and plays
        the heart burst once; with a reaction set it only bursts — it never
        clears one. The burst is wired when <code>onLike</code> or{" "}
        <code>reactions.onReact</code> is set. Without <code>reactions</code> the
        like path is unchanged.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard
  variant="feed"
  post={post}
  reactions={{
    kinds: [{ key: "like", icon: "👍", label: "Like" }, { key: "love", icon: "❤️", label: "Love" }],
    counts: { like: 212, love: 131 },
    totalCount: 343,
    viewerReaction,                       // string | null: controlled
    defaultKind: "love",                  // what double-tap applies
    onReact: (id, kind) => api.react(id, kind),
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Header</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>getAuthorHref(author, post)</code> — the avatar and the name
          become links rendered with <code>linkComponent</code> (default{" "}
          <code>a</code>), stacked above the card&apos;s overlay link. Only the
          name link is focusable; the avatar link is{" "}
          <code>aria-hidden</code> with <code>tabIndex=-1</code>.
        </li>
        <li>
          <code>subtitle</code> (a node or <code>(post) =&gt; node</code>) — a
          line under the name. <code>noticeSlot(post)</code> — a notice above
          the content (every variant that renders content); return{" "}
          <code>null</code> for none.
        </li>
        <li>
          <code>labels.kebabAriaLabel</code> names the actions menu (default
          &quot;Post actions&quot;).{" "}
          <code>renderHeader(post, &#123; currentUser, kebab &#125;)</code> —{" "}
          <code>kebab</code> is the built actions menu (or <code>null</code>
          when it has no visible items), so a custom header keeps it.
        </li>
        <li>
          <code>extraKebabActions(post)</code> — items appended after the
          default ones (after the destructive group; not gated by{" "}
          <code>canModerate</code>); ignored when <code>kebabActions</code> takes
          over. A menu item with <code>hidden: true</code> is left out, and a
          menu with only hidden items is not rendered.
        </li>
        <li>
          <code>permissions.disabled</code> —{" "}
          <code>&#123; delete: true &#125;</code> keeps the item visible but
          disabled (legacy handler-driven and role-aware modes). It never allows
          an action the matrix denies; a <code>permissions</code> object that
          carries only <code>disabled</code> keeps the legacy items.
        </li>
      </ul>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard
  variant="feed"
  post={post}
  viewerMode="owner"
  permissions={{ disabled: { delete: true } }}
  getAuthorHref={(a) => \`/people/\${a.username}\`}
  subtitle="Community manager"
  noticeSlot={(p) => (underReview.has(p.id) ? <p role="status">Under review</p> : null)}
  extraKebabActions={(p) => [{ label: "Boost post", onClick: () => api.boost(p.id) }]}
  renderHeader={(p, { kebab }) => <MyHeader post={p}>{kebab}</MyHeader>}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Locale, time zone and the clock
      </h3>
      <p className="text-muted-foreground">
        <code>locale</code> (default <code>&quot;en&quot;</code>) reaches the
        carousel, the engagement bar, the likers strip, the share menu and the
        comment thread; counts use{" "}
        <code>Intl.NumberFormat(locale, &#123; notation: &quot;compact&quot;
        &#125;)</code> unless you pass <code>formatCount</code>. Relative times
        use English &quot;Just now&quot; / &quot;5m&quot; / &quot;2h&quot; for{" "}
        <code>&quot;en&quot;</code> (a <code>timeZone</code> only moves the
        absolute dates), <code>Intl.RelativeTimeFormat</code> for any other
        locale, and a spelled-out date after five weeks; <code>formatRelativeTime</code> replaces the
        formatter (the old <code>labels.formatRelativeTime</code> is still
        honoured when the prop is not set). The edited timestamp&apos;s tooltip
        follows <code>locale</code> and <code>timeZone</code>.
      </p>
      <p className="text-muted-foreground">
        The card never reads the clock while rendering. Pass{" "}
        <code>now</code> for a fixed &quot;now&quot; (tests, server rendering);
        without it the server render and the first client render print no
        relative text (an empty <code>&lt;time&gt;</code>), and the clock is read
        right after mount and every minute. A poll&apos;s closed check and
        countdown use the same <code>now</code> (before it is known the poll
        counts as open, with no countdown). Direction comes from the
        surrounding element: wrap the card in{" "}
        <code>&lt;div dir=&quot;rtl&quot; lang=&quot;ar&quot;&gt;</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Forwarding to the parts
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>mediaProps</code> — <code>aspect</code>, <code>minRatio</code>,{" "}
          <code>maxRatio</code>, <code>loop</code>, <code>showCounter</code>,{" "}
          <code>onMediaError</code>, <code>labels</code>… spread onto every
          carousel the card renders (<code>items</code>, <code>variant</code>{" "}
          and the double-tap stay the card&apos;s).
        </li>
        <li>
          <code>engagementBarProps</code> — <code>formatCount</code>,{" "}
          <code>optimistic</code>, <code>likersPreview</code>,{" "}
          <code>reactionsPreview</code>, <code>trailing</code>,{" "}
          <code>onReactionPickerOpenChange</code>, <code>className</code>,{" "}
          <code>actionClassName</code> — spread onto the built-in bar.
        </li>
        <li>
          <code>commentThreadProps</code> — everything else the thread takes
          (cursor paging <code>onLoadMoreCursor</code>,{" "}
          <code>onLoadReplies</code>, <code>onCommentsChange</code>,{" "}
          <code>onEditComment</code>, <code>moderation</code>,{" "}
          <code>extraActions</code>, reactions…). The card&apos;s own comment
          props (<code>onAddComment</code>, <code>commentActions</code>,{" "}
          <code>commentPageSize</code>…) win when defined; the card&apos;s{" "}
          <code>locale</code> / <code>timeZone</code> / <code>now</code> are the
          default; <code>labels.commentLabels</code> is laid over{" "}
          <code>commentThreadProps.labels</code>. The inline panel and the
          detail variant share one props object and one stable{" "}
          <code>comments</code> array (an empty one when you pass none).
        </li>
        <li>
          Nested labels: <code>labels.engagementLabels</code>,{" "}
          <code>commentLabels</code>, <code>likersLabels</code>,{" "}
          <code>shareLabels</code>, <code>textLabels</code> pass through to the
          bar, the thread, the likers strip, the share menu and the body&apos;s
          &quot;Show more&quot; toggle. The flat keys (<code>likersHeading</code>
          , <code>hidePanelLabel</code>, <code>shareHeading</code>…) still work;
          the nested ones win.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Breaking in 0.6.0: label functions
      </h3>
      <p className="text-muted-foreground">
        Labels that carry a value are functions now; no placeholder is filled by{" "}
        <code>.replace</code>. <code>formatted</code> is the count in{" "}
        <code>locale</code>.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`// before (0.5.x)                                  after (0.6.0)
likersMoreLabel: "+{count} more"                   likersMoreLabel: (count, formatted) => \`+\${formatted} more\`
pollTotalVotesLabel: "{count} votes"               pollTotalVotesLabel: (count, formatted) => \`\${formatted} \${count === 1 ? "vote" : "votes"}\`
pollClosesAtLabel: "Closes {time}"                 pollClosesAtLabel: (time) => \`Closes \${time}\`
// list variant meta ("12 likes · 3 comments · 2 shares") is new:
listLikes / listComments / listShares: (count, formatted) => string
// new: kebabAriaLabel (string)`}</code>
      </pre>
      <p className="text-muted-foreground">
        <strong>Visible English change:</strong> the list meta counts and the
        poll total are now compact-formatted in <code>locale</code> (or by{" "}
        <code>formatCount</code>): 8,700 likes reads &quot;8.7K likes&quot;,
        where 0.5.x printed the raw number. A single vote still reads
        &quot;1 vote&quot;. Pass <code>formatCount=&#123;(n) =&gt;
        String(n)&#125;</code> to keep plain numbers. Poll percentages follow{" "}
        <code>locale</code> too (&quot;42%&quot; in English, &quot;%42&quot; in
        Turkish).
      </p>
      <p className="text-muted-foreground">
        A value that is not a function for one of these keys is ignored (the
        default stays) and a development build logs one warning per key. <code>defaultPostCardLabels</code> and the{" "}
        <code>ResolvedPostCardLabels</code> type are exported;{" "}
        <code>DEFAULT_POST_CARD_LABELS</code> is a deprecated alias.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic feed</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard
  variant="feed"
  post={post}
  currentUser={viewer}
  likers={preloadedLikers}              // enables inline likers panel
  commentThread={preloadedComments}     // enables inline comments panel
  shareSuggestions={recentContacts}     // enables inline share menu
  onLike={(id, liked) => api.likePost(id, liked)}
  onBookmark={(id, b) => api.bookmark(id, b)}
  onShareTo={(id, user) => api.shareTo(id, user)}
  onAddComment={(content, parentId) => api.addComment(post.id, { content, parentId })}
  onLikeComment={api.likeComment}
  onLoadMoreLikers={() => api.fetchMoreLikers(post.id)}
  getHref={(p) => \`/posts/\${p.id}\`}    // overlay-link + Copy-link kebab item
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Detail with embedded thread + realtime
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const engagementSubscribe = useCallback<Subscribe<EngagementDelta>>(
  (h) => channel.on(\`post-\${post.id}-engagement\`, h),
  [post.id, channel],
);
const commentSubscribe = useCallback<Subscribe<CommentDelta>>(
  (h) => channel.on(\`post-\${post.id}-comments\`, h),
  [post.id, channel],
);

<PostCard
  variant="detail"
  post={post}
  currentUser={viewer}
  commentThread={preloadedComments}
  engagementSubscribe={engagementSubscribe}
  commentSubscribe={commentSubscribe}
  onLike={api.likePost}
  onAddComment={(content, parentId) => api.addComment(post.id, { content, parentId })}
  onLikeComment={api.likeComment}
  onDeleteComment={api.deleteComment}
  onLoadMoreComments={(page) => api.fetchComments(post.id, page)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Navigate mode (no inline panels)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard
  variant="feed"
  post={post}
  engagementMode="navigate"
  onLike={api.likePost}
  onComment={(id) => router.push(\`/posts/\${id}#comments\`)}
  onShare={(id) => navigator.share?.({ url: \`/posts/\${id}\` })}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Custom engagement actions (extending defaults)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { defaultPostEngagementActions } from "@/components/post-card";

<PostCard
  variant="feed"
  post={post}
  engagementActions={(p, h, v) => [
    ...defaultPostEngagementActions(p, h, v),
    { kind: "custom", id: "remix", label: "Remix", icon: <Wand2 />, onClick: () => openRemix(p.id) },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Custom kebab actions (full takeover)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard
  variant="list"
  post={post}
  kebabActions={(p) => [
    { label: "Pin", onClick: () => api.pin(p.id) },
    { label: "Take down", destructive: true, onClick: () => api.takeDown(p.id) },
    { label: "Block author", onClick: () => api.block(p.author.id) },
  ]}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>kebabActions</code> is full-takeover — it bypasses the role-aware
        default assembly entirely. For an <em>additive</em> moderator section
        on top of the default kebab, use <code>moderatorActions</code> below.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        v0.3.0 — Moderator section (ILX-3)
      </h3>
      <p className="text-muted-foreground">
        Moderation is orthogonal to <code>viewerMode</code> — a moderator is
        usually a viewer (or sometimes an owner) with extra capability. Opt
        the viewer in via <code>permissions.canModerate: true</code> (or the
        universal <code>canPerformAction(&quot;moderate&quot;, post)</code>{" "}
        predicate) AND supply the menu items via{" "}
        <code>moderatorActions(post)</code>. The library renders them as a
        section between common items (Bookmark / Share / Copy link / Translate)
        and viewer-destructive items (Mute / Block / Report), with a divider
        above. Setting <code>kebabActions</code> still wins (full takeover).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard
  variant="feed"
  post={post}
  currentUser={viewer}
  viewerMode="viewer"
  permissions={{ canModerate: viewer.role === "mod" || viewer.role === "admin" }}
  moderatorActions={(p) => [
    { label: "Feature post", icon: <Star className="h-4 w-4" />, onClick: () => api.feature(p.id) },
    { label: "Lock comments", icon: <Lock className="h-4 w-4" />, onClick: () => api.lockThread(p.id) },
    { label: "Remove post", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: () => api.removePost(p.id) },
  ]}
  // viewer-side defaults still resolve:
  onReport={api.report}
  onBlockAuthor={api.block}
  onMuteAuthor={api.mute}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Resolution: <code>moderatorActions</code> runs only when{" "}
        <code>canPerformAction(&quot;moderate&quot;, post)</code> returns true
        (wins) OR <code>permissions.canModerate === true</code>. Default for
        both viewer modes is <code>false</code> — moderators must be opted in
        explicitly; never auto-derived from <code>viewerMode</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">i18n</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard
  locale="tr"
  labels={{
    // header / kebab
    bookmark: "Kaydet", unbookmark: "Kaldır", share: "Paylaş",
    copyLink: "Bağlantıyı kopyala", report: "Şikayet et",
    kebabAriaLabel: "Gönderi işlemleri",
    // inline panels
    likersHeading: "Beğenenler",
    likersMoreLabel: (count, formatted) => \`\${formatted} kişi daha\`,
    shareHeading: "Şununla paylaş…",
    shareSearchPlaceholder: "Kişi ara…",
    shareEmptyLabel: "Eşleşme yok.",
    hidePanelLabel: "Gizle",
    // poll + list meta
    pollTotalVotesLabel: (count, formatted) => \`\${formatted} oy\`,
    pollClosesAtLabel: (time) => \`Bitiş: \${time}\`,
    listLikes: (count, formatted) => \`\${formatted} beğeni\`,
    // forwarded
    engagementLabels: { /* engagement-bar labels */ },
    commentLabels: { /* comment-thread labels */ },
    textLabels: { showMore: "Devamını gör", showLess: "Daha az" },
    likersLabels: { /* wins over the flat likers keys */ },
    shareLabels: { /* wins over the flat share keys */ },
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>engagementMode</code> defaults to <code>&quot;inline&quot;</code> —
          tap-to-open panels everywhere. Pass <code>&quot;navigate&quot;</code>{" "}
          to deactivate.
        </li>
        <li>
          Heart-burst auto-wires when <code>post.media?.length &gt; 0</code> AND{" "}
          <code>onLike</code> (or <code>reactions.onReact</code>) is provided AND{" "}
          <code>variant ∈ {"{feed, detail}"}</code>. Opt out via{" "}
          <code>disableHeartBurst</code>.
        </li>
        <li>
          <code>getHref</code> double-duty: makes the card clickable via
          overlay-link in feed / compact / list AND adds a &quot;Copy link&quot;
          kebab item. Detail variant ignores overlay-link.
        </li>
        <li>
          Default kebab is &quot;Bookmark / Share / Copy link / Report&quot; —
          each item only appears when its handler is wired (or for Copy link,
          when <code>getHref</code> is provided).
        </li>
        <li>
          v0.3.0 — <code>moderatorActions(post)</code> +{" "}
          <code>permissions.canModerate</code> +{" "}
          <code>&quot;moderate&quot;</code> action discriminator. Orthogonal to
          <code> viewerMode</code> (never auto-derived). The section sits between
          common items and viewer-destructive items with a divider above.
          <code> kebabActions</code> full-takeover still wins.
        </li>
        <li>
          The split heart-vs-count behavior comes from{" "}
          <code>engagement-bar</code>&apos;s like action (
          <code>onCountClick</code> on the action) — it&apos;s the bar feature,
          not card-specific. Hosts using the bar directly can wire the same
          split.
        </li>
        <li>
          <code>renderHeader</code>, <code>renderContent</code>,{" "}
          <code>renderMedia</code>, <code>renderEngagementBar</code>,{" "}
          <code>renderCommentSection</code> are full-takeover slots at every
          connective seam.
        </li>
        <li>
          List variant&apos;s thumbnail stretches to fill the card height
          edge-to-edge; content area gets its own padding so the seams stay
          flush.
        </li>
        <li>
          Realtime: two separate subscribe props.{" "}
          <code>engagementSubscribe</code> is owned by the card (delta routes to
          mirror); <code>commentSubscribe</code> forwards directly to the
          embedded <code>CommentThread</code> in detail variant or to the
          inline thread when opened.
        </li>
      </ul>
    </div>
  );
}
