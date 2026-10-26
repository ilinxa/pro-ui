export default function CommentThreadUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>CommentThread</code> when you need a recursive comment
        panel under any content surface — posts, news articles, events, product
        reviews, document annotations. It composes <code>expandable-text</code>{" "}
        for long bodies and <code>engagement-bar</code>{" "}
        <code>variant=&quot;compact&quot;</code> for the per-row like or
        reaction action.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CommentThread } from "@/components/comment-thread";

export function Example() {
  return (
    <CommentThread
      comments={post.comments}
      currentUser={{ id: viewer.id, name: viewer.name, avatar: viewer.avatarUrl }}
      onAddComment={async (content, parentId, options) => {
        const created = await api.addComment(post.id, { content, parentId, clientId: options?.clientId });
        return created; // swaps the pending comment for the real one
      }}
      onLikeComment={(id, nextLiked) => api.likeComment(id, nextLiked)}
      onDeleteComment={(id) => api.deleteComment(id)}
      onReportComment={(id) => openReportDialog(id)}
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Controlled or read-once</h3>
      <p className="text-muted-foreground">
        Pass <code>onCommentsChange</code> and <code>comments</code> is
        controlled: it wins on every render, and accepted changes are
        <strong> reported</strong> as <code>(next, change)</code> — never
        applied locally. A change is accepted after its promise resolves (at
        once for a handler that returns nothing, and for realtime deltas,
        loaded pages and handle calls); until then it shows as an overlay, and
        a rejection drops the overlay and reports nothing. Without{" "}
        <code>onCommentsChange</code> the tree is read once at mount (use the
        handle&apos;s <code>reset(next)</code> to push updates); changing{" "}
        <code>comments</code> then logs one development warning.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [comments, setComments] = useState(initial);

<CommentThread
  comments={comments}
  onCommentsChange={(next, change) => setComments(next)}
  currentUser={viewer}
  onLikeComment={(id, liked) => api.like(id, liked)} // may return a promise
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Posting, pending comments and failures</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>onAddComment(content, parentId, {`{ clientId }`})</code> — send
          the <code>clientId</code> to your server and echo it in the realtime{" "}
          <code>added</code> broadcast: the echo then replaces your pending
          comment instead of duplicating it. Matching uses the comment id
          first, then the <code>clientId</code>.
        </li>
        <li>
          A pending comment shows <code>labels.sending</code> instead of a
          time. The built-in actions (like, reaction, reply, delete, report)
          are disabled and Edit is not offered while it is pending, so your handlers never
          receive its temporary id from them. Your own actions
          (<code>extraActions</code>, <code>commentActions</code>,{" "}
          <code>engagementActions</code>, <code>renderNode</code>) get{" "}
          <code>helpers.isPending</code> and must check it. Without an{" "}
          <code>onAddComment</code> handler a posted comment is a normal,
          local comment.
        </li>
        <li>
          A rejected <code>onAddComment</code> removes the pending comment,
          calls <code>onError</code>, keeps the text in the composer and shows{" "}
          <code>labels.postFailed</code> (<code>role=&quot;alert&quot;</code>).
          Returning nothing keeps the pending comment until a delta or{" "}
          <code>reset</code> brings the real one (controlled: it is removed
          when the call returns).
        </li>
        <li>
          <code>onLikeComment</code>, <code>onReactComment</code>,{" "}
          <code>onDeleteComment</code> and <code>onEditComment</code> may
          return a promise; a rejection rolls the change back (a deleted
          subtree returns to its old position). Only the latest request per
          comment decides.
        </li>
        <li>
          <code>optimistic={`{false}`}</code> — no pending comment; likes and
          deletes wait for their promise.
        </li>
        <li>
          <code>onError(error, {`{ kind, commentId?, parentId? }`})</code> —
          every failure above, plus <code>load-more</code> and{" "}
          <code>load-replies</code>.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Paging and replies</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CommentThread
  comments={page1.items}
  nextCursor={page1.nextCursor}          // first cursor; wins on every render
  hasMore={page1.hasMore}                // optional; wins over every heuristic
  onLoadMoreCursor={(cursor) => api.comments(post.id, cursor)} // { items, nextCursor, hasMore? }
  onLoadReplies={(commentId, cursor) => api.replies(commentId, cursor)}
/>`}</code>
      </pre>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>onLoadMoreCursor</code> wins over the page-number{" "}
          <code>onLoadMore(page)</code>. For the page-number loader, Load more
          shows while the thread holds at least <code>pageSize</code>{" "}
          top-level comments and the last page was full.
        </li>
        <li>
          A comment with <code>replyCount</code> larger than its loaded{" "}
          <code>replies</code> shows &quot;View N replies&quot; when{" "}
          <code>onLoadReplies</code> is wired. Its first cursor is{" "}
          <code>comment.repliesCursor</code>; &quot;View more replies&quot;
          follows while more exist.
        </li>
        <li>
          A failed load shows an alert and a Retry button; a loading button
          is <code>aria-busy</code> and keeps focus. Pages are de-duplicated.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Permissions and the kebab</h3>
      <p className="text-muted-foreground">
        Each comment&apos;s <code>permissions</code> beat the defaults:{" "}
        <code>canDelete</code> / <code>canEdit</code> = you wrote it,{" "}
        <code>canReply</code> = signed in, <code>canReact</code> = true,{" "}
        <code>canReport</code> = you did <em>not</em> write it (Report no longer
        shows on your own comments), <code>canPin</code> / <code>canHide</code>{" "}
        = false (they reach your slots through the helpers).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CommentThread
  comments={comments}
  currentUser={viewer}
  // appended after the defaults:
  extraActions={(comment, { permissions }) => [
    { label: "Hide", hidden: !permissions.canHide, separatorBefore: true,
      onClick: () => api.hide(comment.id) },
  ]}
  // or take the whole menu over:
  // commentActions={(comment, { isOwn, permissions, isPending }) => [...]}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>CommentMenuItem.hidden</code> leaves an item out (a menu with
        nothing left renders no kebab) and <code>separatorBefore</code> draws a
        divider.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Reactions per row</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CommentThread
  comments={comments}            // comment.reactions = { viewerReaction, counts, totalCount }
  reactionKinds={[{ key: "love", icon: <Heart />, label: "Love" }]}
  onReactComment={(id, reaction) => api.react(id, reaction)} // string | null (clear)
  // engagementActions={(comment, { defaultActions }) => [...defaultActions, myAction]}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Without <code>reactionKinds</code> + <code>onReactComment</code> each
        row keeps the like. <code>Comment.likes</code> may be <code>null</code>:
        the count is withheld (no number, none in the accessible name).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Moderation add-on</h3>
      <p className="text-muted-foreground">
        Inline edit, tombstones and the pinned marker ship separately:{" "}
        <code>pnpm dlx shadcn@latest add @ilinxa/comment-thread-moderation</code>.
        The thread never imports it — pass it in.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { commentModeration } from "@/components/comment-thread/features/moderation";

<CommentThread
  comments={comments}
  moderation={commentModeration}
  onEditComment={(id, content) => api.edit(id, content)} // promise rolls back on reject
  removedMode="tombstone"   // a removed delta keeps the comment as a tombstone, replies below
/>`}</code>
      </pre>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Edit appears for comments with <code>permissions.canEdit</code> (your
          own by default) once <code>onEditComment</code> is wired. Save is
          optimistic (<code>content</code>, <code>edited: true</code>); a
          failure rolls back and the editor shows <code>labels.editFailed</code>.
        </li>
        <li>
          A comment whose <code>state</code> is not <code>&quot;visible&quot;</code>{" "}
          renders as a tombstone and keeps its replies. Without the add-on such
          comments are left out with their replies (one development warning),
          <code> onEditComment</code> shows no Edit item, and{" "}
          <code>isPinned</code> is ignored.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Labels, locale and time</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Every string is in <code>labels</code> (an omitted or{" "}
          <code>undefined</code> key keeps the English default, exported as{" "}
          <code>defaultCommentThreadLabels</code>); strings that carry a value
          are functions: <code>kebabAriaLabel(name)</code>,{" "}
          <code>replyTo(name)</code>, <code>viewReplies(count)</code>,{" "}
          <code>tombstone(state)</code>.
        </li>
        <li>
          <code>locale</code> (default <code>&quot;en&quot;</code>) drives
          relative times and counts: English keeps &quot;5m&quot;; other
          locales use <code>Intl.RelativeTimeFormat</code> and a long date past
          five weeks (<code>timeZone</code> fixes the zone).{" "}
          <code>formatRelativeTime</code> / <code>formatCount</code> override
          them; <code>createRelativeTimeFormatter(locale, timeZone)</code> is
          exported.
        </li>
        <li>
          Relative text needs &quot;now&quot;: pass <code>now</code>, or the
          thread reads the clock after mount and every minute — the server
          render and the first client render print no relative text, so
          hydration matches.
        </li>
        <li>
          Layout is RTL-safe (indent uses the inline-start edge). Wrap the
          thread in <code>dir=&quot;rtl&quot;</code> and pass <code>dir</code>{" "}
          for the reaction pickers&apos; arrow keys.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Realtime via subscribe</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const subscribe = useCallback<Subscribe<CommentDelta>>(
  (handler) => channel.on("comment", handler),
  [channel],
);

<CommentThread
  comments={post.initialComments}
  currentUser={viewer}
  subscribe={subscribe}
  onSubscribeDelta={(d) => analytics.track("comment-delta", d)}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Hosts must memoize <code>subscribe</code> via{" "}
        <code>useCallback</code> — identity changes trigger a clean teardown +
        re-call. Deltas are idempotent (a repeated <code>added</code> changes
        nothing) and also include <code>state</code> and <code>reacted</code>.
        An <code>added</code> delta whose <code>parentId</code> is unknown is
        dropped with one development warning.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Standalone composer</h3>
      <p className="text-muted-foreground">
        <code>CommentComposer</code> ships standalone for hosts that want the
        composer without the thread. A rejected <code>onSubmit</code> keeps the
        text and shows <code>labels.postFailed</code> (style it with{" "}
        <code>errorClassName</code>, observe it with <code>onError</code>):
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CommentComposer } from "@/components/comment-thread";

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
          <code>renderNode</code>, <code>renderViewReplies</code>, and{" "}
          <code>renderComposer</code> are full-takeover slots. The composer
          slot&apos;s <code>submit</code> never rejects; a failure shows as{" "}
          <code>state.hasError</code>.
        </li>
        <li>
          <code>Comment.edited</code> renders an <code>(edited)</code> suffix;
          the realtime <code>{`{ kind: "edited" }`}</code> delta sets it.
        </li>
      </ul>
    </div>
  );
}
