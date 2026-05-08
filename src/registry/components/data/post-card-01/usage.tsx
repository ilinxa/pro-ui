export default function PostCard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>PostCard01</code> when you need a social-post surface in
        any of four shapes: <code>feed</code> (Instagram-post),{" "}
        <code>compact</code> (sidebar widget), <code>list</code> (admin / search
        row), or <code>detail</code> (full page with embedded comment thread).
        Composes all five Tier-1 social primitives —{" "}
        <code>expandable-text-01</code>, <code>media-carousel-01</code>,{" "}
        <code>engagement-bar-01</code>, <code>comment-thread-01</code>, plus{" "}
        <code>video-player-01</code> transitively — and ships with kasder-style
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
          <code>&lt;CommentThread01&gt;</code> with composer; scrollable, height
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
        Footgun: the `post` prop is mount-only
      </h3>
      <p className="text-muted-foreground">
        Component captures <code>post</code> as initial state on mount;
        subsequent prop reference changes are <strong>ignored</strong>. Realtime
        <code>engagementSubscribe</code> + optimistic{" "}
        <code>onLike</code>/<code>onBookmark</code> mutate the internal mirror.
        To push external updates, use the imperative handle&apos;s{" "}
        <code>reset(next)</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<PostCard01Handle>(null);
useEffect(() => {
  ref.current?.reset(externalPost);
}, [externalPost]);

<PostCard01 ref={ref} variant="feed" post={externalPost} ... />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic feed</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard01
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

<PostCard01
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
        <code>{`<PostCard01
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
        <code>{`import { defaultPostEngagementActions } from "@/components/post-card-01";

<PostCard01
  variant="feed"
  post={post}
  engagementActions={(p, h, v) => [
    ...defaultPostEngagementActions(p, h, v),
    { kind: "custom", id: "remix", label: "Remix", icon: <Wand2 />, onClick: () => openRemix(p.id) },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Custom kebab actions (moderator surfaces)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PostCard01
  variant="list"
  post={post}
  kebabActions={(p) => [
    { label: "Pin", onClick: () => api.pin(p.id) },
    { label: "Take down", destructive: true, onClick: () => api.takeDown(p.id) },
    { label: "Block author", onClick: () => api.block(p.author.id) },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">i18n</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`labels={{
  // header / kebab
  bookmark: "Kaydet", unbookmark: "Kaldır", share: "Paylaş",
  copyLink: "Bağlantıyı kopyala", report: "Şikayet et",
  // inline panels
  likersHeading: "Beğenenler",
  shareHeading: "Şununla paylaş…",
  shareSearchPlaceholder: "Kişi ara…",
  shareEmptyLabel: "Eşleşme yok.",
  hidePanelLabel: "Gizle",
  // forwarded
  engagementLabels: { /* engagement-bar-01 labels */ },
  commentLabels: { /* comment-thread-01 labels */ },
}}`}</code>
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
          <code>onLike</code> is provided AND{" "}
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
          The split heart-vs-count behavior comes from{" "}
          <code>engagement-bar-01</code>&apos;s like action (
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
          embedded <code>CommentThread01</code> in detail variant or to the
          inline thread when opened.
        </li>
      </ul>
    </div>
  );
}
