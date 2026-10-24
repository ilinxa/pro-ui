export default function ExpandableTextUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ExpandableText</code> for any user-authored multi-line
        text where the surface budget is bounded — post bodies, comment bodies,
        event descriptions, news excerpts in feeds, profile bios. Pure CSS{" "}
        <code>line-clamp</code> clips silently; this component measures{" "}
        <code>scrollHeight</code> against{" "}
        <code>lineHeight × maxLines</code> after mount and on resize, so the
        &quot;show more&quot; toggle <strong>only appears when content actually
        exceeds the budget</strong>. Links and mentions go in as{" "}
        <code>children</code> (your own safe renderer). For editing or HTML /
        Plate JSON / Markdown documents, use <code>rich-text-editor</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Rich children (links, mentions)</h3>
      <p className="text-muted-foreground">
        <code>children</code> wins over <code>content</code> and renders in a{" "}
        <code>&lt;div&gt;</code>, so block children are valid. Changes inside it
        are re-measured automatically (MutationObserver); pass{" "}
        <code>measureKey</code> for a change that alters no DOM (a web font
        finishing loading). Keyboard focus moving onto a link below the clamp
        expands the text (controlled: <code>onExpandedChange(true)</code>), so
        focus never lands on hidden text.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ExpandableText maxLines={3} measureKey={post.updatedAt}>
  <MentionText content={post.content} mentions={post.mentions} />
</ExpandableText>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Direction</h3>
      <p className="text-muted-foreground">
        The text element has <code>dir=&quot;auto&quot;</code> by default, so an
        Arabic post in an LTR feed starts at the right. Pass{" "}
        <code>dir=&quot;ltr&quot;</code> / <code>&quot;rtl&quot;</code> to force one.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Upgrading to 0.3.0</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          The text is clamped from the first paint (the server cannot measure),
          so there is no full-text flash and layout shift on hydration; the
          toggle still appears only when the text is truncated.
        </li>
        <li>
          <code>dir=&quot;auto&quot;</code> on the text element (was none).
        </li>
        <li>
          <code>content</code> is optional; nothing renders only when there is
          neither content nor children.
        </li>
        <li>
          <code>DEFAULT_EXPANDABLE_TEXT_LABELS</code> →{" "}
          <code>defaultExpandableTextLabels</code> (alias kept); an{" "}
          <code>undefined</code> label keeps its default.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ExpandableText } from "@/components/expandable-text";

export function Example() {
  return <ExpandableText content={post.body} />;
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom maxLines</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ExpandableText content={comment.body} maxLines={4} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Controlled mode (feed virtualization)
      </h3>
      <p className="text-muted-foreground">
        For virtualized feeds where posts unmount on scroll, persist the expand
        state in a host-level map so it survives re-mount.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const expandedSet = useExpandedSet(); // host's per-post state map

<ExpandableText
  content={post.body}
  expanded={expandedSet.has(post.id)}
  onExpandedChange={(next) => expandedSet.toggle(post.id, next)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Localized labels</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ExpandableText
  content={post.body}
  labels={{
    showMore: "Daha fazla göster",
    showLess: "Daha az göster",
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Custom toggle (chevron icon)
      </h3>
      <p className="text-muted-foreground">
        The <code>renderToggle</code> slot replaces the default text button.
        Receives <code>isExpanded</code> + <code>setExpanded</code>; consumers
        wire their own UI but should preserve <code>aria-expanded</code> +{" "}
        <code>aria-label</code> for accessibility.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ChevronDown, ChevronUp } from "lucide-react";

<ExpandableText
  content={comment.body}
  maxLines={2}
  renderToggle={({ isExpanded, setExpanded }) => (
    <button
      type="button"
      onClick={() => setExpanded(!isExpanded)}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? "Collapse" : "Expand"}
    >
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </button>
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Standalone hook (advanced)
      </h3>
      <p className="text-muted-foreground">
        <code>useLineClampDetect</code> is exported for hosts that want to
        detect truncation without using our component (e.g., to show a small
        &quot;...&quot; indicator in a different style). The{" "}
        <code>content</code> parameter is typed{" "}
        <code>unknown</code> — pass any primitive or stable identity that
        changes when re-measurement is needed.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { useLineClampDetect } from "@/components/expandable-text";

function MyTextBlock({ text }: { text: string }) {
  const { ref, isTruncated } = useLineClampDetect({
    maxLines: 3,
    content: text,
  });
  return (
    <div>
      <p ref={ref} className="line-clamp-3">{text}</p>
      {isTruncated && <span>...</span>}
    </div>
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Anti-patterns</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Don&apos;t pass untrusted HTML</strong> as children — render
          links / mentions with your own safe components. Use{" "}
          <code>rich-text-editor</code> for Markdown / Plate JSON / HTML documents.
        </li>
        <li>
          <strong>Don&apos;t expect auto-collapse on click outside</strong> —
          one-shot expand; user collapses by clicking the toggle.
        </li>
        <li>
          <strong>Don&apos;t expect animated height transition</strong> on
          expand/collapse — the swap is instant. Animation requires
          extra browser support and is not implemented.
        </li>
        <li>
          <strong>Don&apos;t define inline labels objects</strong> if you care
          about <code>React.memo</code> — the inline object identity changes
          every render, busting memo. Hoist the labels object to module scope.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Default toggle is a real <code>&lt;button type=&quot;button&quot;&gt;</code>
          {" "}— keyboard activation via Enter / Space comes free.
        </li>
        <li>
          <code>aria-expanded</code> on the toggle reflects state;{" "}
          <code>aria-controls</code> links to the content&apos;s{" "}
          <code>id</code> (computed via <code>useId</code>).
        </li>
        <li>
          Custom <code>renderToggle</code> is the consumer&apos;s
          responsibility — preserve <code>aria-expanded</code> +{" "}
          <code>aria-label</code> on icon-only triggers.
        </li>
      </ul>
    </div>
  );
}
