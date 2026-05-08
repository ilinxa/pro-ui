export default function ExpandableText01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ExpandableText01</code> for any user-authored multi-line
        text where the surface budget is bounded — post bodies, comment bodies,
        event descriptions, news excerpts in feeds, profile bios. Pure CSS{" "}
        <code>line-clamp</code> clips silently; this component measures{" "}
        <code>scrollHeight</code> against{" "}
        <code>lineHeight × maxLines</code> after mount and on resize, so the
        &quot;show more&quot; toggle <strong>only appears when content actually
        exceeds the budget</strong>. For HTML / Plate JSON / Markdown bodies,
        use <code>article-body-01</code> instead.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ExpandableText01 } from "@/components/expandable-text-01";

export function Example() {
  return <ExpandableText01 content={post.body} />;
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom maxLines</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ExpandableText01 content={comment.body} maxLines={4} />`}</code>
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

<ExpandableText01
  content={post.body}
  expanded={expandedSet.has(post.id)}
  onExpandedChange={(next) => expandedSet.toggle(post.id, next)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Localized labels</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ExpandableText01
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

<ExpandableText01
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
        <code>{`import { useLineClampDetect } from "@/components/expandable-text-01";

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
          <strong>Don&apos;t pass <code>ReactNode</code></strong> as{" "}
          <code>content</code> — measurement requires a stable text node. Use{" "}
          <code>article-body-01</code> for rich content (Markdown / Plate JSON
          / HTML).
        </li>
        <li>
          <strong>Don&apos;t expect auto-collapse on click outside</strong> —
          one-shot expand; user collapses by clicking the toggle.
        </li>
        <li>
          <strong>Don&apos;t expect animated height transition</strong> on
          expand/collapse in v0.1 — the swap is instant. Animation requires
          extra browser support and lands in v0.2.
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
