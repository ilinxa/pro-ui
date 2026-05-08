export default function CommentThread01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>CommentThread01</code> when you need a recursive comment
        panel under any content surface — posts, news articles, events, product
        reviews, document annotations. It composes <code>expandable-text-01</code>{" "}
        for long bodies and <code>engagement-bar-01</code>{" "}
        <code>variant=&quot;compact&quot;</code> for the per-row like action.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Footgun: the `comments` prop is mount-only</h3>
      <p className="text-muted-foreground">
        Component takes <code>comments</code> as initial state on mount only.
        Subsequent prop reference changes are <strong>ignored</strong>. To push
        external updates, use the imperative handle&apos;s{" "}
        <code>reset(next)</code> or <code>dispatch(action)</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<CommentThread01Handle>(null);
useEffect(() => {
  ref.current?.reset(externalComments);
}, [externalComments]);

<CommentThread01 ref={ref} comments={externalComments} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CommentThread01 } from "@/components/comment-thread-01";

export function Example() {
  return (
    <CommentThread01
      comments={post.comments}
      currentUser={{ id: viewer.id, name: viewer.name, avatar: viewer.avatarUrl }}
      onAddComment={async (content, parentId) => {
        const created = await api.addComment(post.id, { content, parentId });
        return created; // component swaps temp comment for real one
      }}
      onLikeComment={(id, nextLiked) => api.likeComment(id, nextLiked)}
      onDeleteComment={(id) => api.deleteComment(id)}
      onReportComment={(id) => openReportDialog(id)}
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Realtime via subscribe</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const subscribe = useCallback<Subscribe<CommentDelta>>(
  (handler) => channel.on("comment", handler),
  [channel],
);

<CommentThread01
  comments={post.initialComments}
  currentUser={viewer}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("comment-delta", d)}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Hosts must memoize <code>subscribe</code> via{" "}
        <code>useCallback</code> — identity changes trigger a clean teardown +
        re-call. Same contract as <code>engagement-bar-01</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom kebab actions</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CommentThread01
  comments={comments}
  currentUser={viewer}
  commentActions={(comment, { isOwn }) => [
    isOwn && { label: "Pin", onClick: () => api.pinComment(comment.id) },
    isOwn && { label: "Delete", destructive: true, onClick: () => api.deleteComment(comment.id) },
    !isOwn && { label: "Block author", onClick: () => api.block(comment.author.id) },
    { label: "Report", onClick: () => openReportDialog(comment.id) },
  ].filter(Boolean) as CommentMenuItem[]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Standalone composer</h3>
      <p className="text-muted-foreground">
        <code>CommentComposer</code> ships standalone for hosts that want the
        composer without the thread (article-page hero CTAs):
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CommentComposer } from "@/components/comment-thread-01";

<CommentComposer
  currentUser={viewer}
  placeholder="Share your thoughts…"
  onSubmit={async (content) => api.addArticleComment(article.id, content)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>maxDepth</code> defaults to 2; past it, &quot;view N
          replies&quot; inline-expands. Override the link via{" "}
          <code>renderViewReplies</code> for navigate-to-detail mode.
        </li>
        <li>
          <code>currentUser</code> absent → bottom composer hidden. Render a
          sign-in CTA via <code>composerEmptyState</code>.
        </li>
        <li>
          Default kebab&apos;s &quot;Delete&quot; only shows on the viewer&apos;s
          own comments. Wire <code>commentActions</code> for moderator
          semantics.
        </li>
        <li>
          Realtime <code>CommentDelta.edited</code> is part of the v0.1 contract
          (so future v0.2 edit-affordance UI doesn&apos;t break realtime), but
          the v0.1 UI does not surface an Edit affordance.
        </li>
        <li>
          <code>renderNode</code>, <code>renderViewReplies</code>, and{" "}
          <code>renderComposer</code> are full-takeover slots.
        </li>
      </ul>
    </div>
  );
}
