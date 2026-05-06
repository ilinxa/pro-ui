# expandable-text-01 — consumer guide

> Stage 3: usage notes for hosts. Authored alongside implementation.
>
> See [description](./expandable-text-01-procomp-description.md) for what & why; [plan](./expandable-text-01-procomp-plan.md) for how it's built.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/expandable-text-01
```

Optional fixtures (4 sample strings — short EN, long EN, short TR, long TR):

```bash
pnpm dlx shadcn@latest add @ilinxa/expandable-text-01-fixtures
```

Zero peer deps beyond React. The component pulls no shadcn primitives at install time (the demo's `tabs` is a docs-site dep, not part of the shipped artifact).

## When to reach for it

Any user-authored multi-line text where the surface budget is bounded:

- Post bodies (the originating use case)
- Comment bodies — composes inside `comment-thread-01` (next ship in the social-posts arc)
- Event description blocks (currently `event-detail-page-01` uses raw `<p>` with no truncation)
- News content excerpts in feeds (currently `content-card-news-01` uses static CSS `line-clamp-2` with no expand)
- Product description blocks
- Profile bios

**Not** for rich content (Markdown / HTML / Plate JSON) — use [`article-body-01`](../../../src/registry/components/data/article-body-01/) instead. The measurement-based detection requires a stable text node, so `content` is locked to `string`.

## The why behind measure-and-toggle

Pure CSS `line-clamp-N` clips silently — it has no signal about whether truncation actually occurred. A short post that fits in 2 lines shouldn't grow a "show more" button; a long one should. This component measures `scrollHeight` against `lineHeight × maxLines` after mount and on every container resize (via `ResizeObserver`), and **only renders the toggle when content actually exceeds the budget**.

If you don't need the conditional toggle (you always want the "show more" affordance regardless of content length), Tailwind's static `line-clamp-3` + a manual `<button>` is simpler.

## API at a glance

```ts
type ExpandableText01Props = {
  content: string | null | undefined;  // empty/null → renders nothing
  maxLines?: number;                    // default 3
  expanded?: boolean;                   // controlled
  defaultExpanded?: boolean;            // uncontrolled initial
  onExpandedChange?: (next: boolean) => void;
  labels?: { showMore?: string; showLess?: string };
  renderToggle?: (props: { isExpanded; setExpanded }) => ReactNode;
  className?: string;          // wrapping <div>
  contentClassName?: string;   // <p>
  toggleClassName?: string;    // default <button> only (ignored when renderToggle is supplied)
};
```

## Common recipes

### 1. Minimal usage

```tsx
<ExpandableText01 content={post.body} />
```

That's it. `maxLines={3}` default, English labels, internal expand state.

### 2. Per-context maxLines

Different surfaces need different thresholds:

```tsx
<ExpandableText01 content={comment.body} maxLines={2} />   // tight comments
<ExpandableText01 content={post.body} maxLines={3} />      // feed posts (default)
<ExpandableText01 content={article.lede} maxLines={5} />   // article preview
<ExpandableText01 content={profile.bio} maxLines={6} />    // profile bio
```

### 3. Default-expanded (one-off use)

For surfaces where the text should start expanded but still be collapsible:

```tsx
<ExpandableText01 content={user.bio} defaultExpanded />
```

### 4. Controlled mode (feed virtualization)

When using a virtualized feed, posts unmount on scroll and lose their expand state. Persist it in a host-level map:

```tsx
function Feed({ posts }: { posts: Post[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string, next: boolean) => {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      next ? copy.add(id) : copy.delete(id);
      return copy;
    });
  };

  return (
    <VirtualList items={posts}>
      {(post) => (
        <ExpandableText01
          content={post.body}
          expanded={expandedIds.has(post.id)}
          onExpandedChange={(next) => toggle(post.id, next)}
        />
      )}
    </VirtualList>
  );
}
```

### 5. Localized labels

```tsx
const TR_LABELS = {
  showMore: "Daha fazla göster",
  showLess: "Daha az göster",
} as const;

<ExpandableText01 content={post.body} labels={TR_LABELS} />
```

**Hoist the labels object to module scope** — defining it inline busts the internal `React.memo` (new object identity every render).

### 6. Custom toggle (chevron icon)

The `renderToggle` slot fully replaces the default text button:

```tsx
import { ChevronDown, ChevronUp } from "lucide-react";

<ExpandableText01
  content={comment.body}
  maxLines={2}
  renderToggle={({ isExpanded, setExpanded }) => (
    <button
      type="button"
      onClick={() => setExpanded(!isExpanded)}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? "Collapse" : "Expand"}
      className="..."
    >
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </button>
  )}
/>
```

The slot receives `isExpanded` + `setExpanded` so it works seamlessly in both controlled and uncontrolled modes. Preserve `aria-expanded` + `aria-label` (or visible text) for accessibility.

### 7. Standalone hook (advanced)

`useLineClampDetect` is exported for hosts that want detection without the component:

```tsx
import { useLineClampDetect } from "@ilinxa/expandable-text-01";

function MyTextBlock({ text }: { text: string }) {
  const { ref, isTruncated } = useLineClampDetect({ maxLines: 3, content: text });

  return (
    <div>
      <p ref={ref} className="line-clamp-3">{text}</p>
      {isTruncated && <button>...</button>}
    </div>
  );
}
```

The hook's `content` parameter is typed `unknown` — pass any primitive or stable identity that changes when re-measurement is needed (string, version counter, content hash, etc.).

## Anti-patterns

| Don't | Why |
|---|---|
| Pass `ReactNode` as `content` | Measurement requires a stable text node. Use `article-body-01` for rich content. |
| Define `labels={{ ... }}` inline | Busts `React.memo` (new object identity every render). Hoist to module scope. |
| Expect auto-collapse on click outside | One-shot expand; user collapses by clicking the toggle. |
| Expect animated height transition | The expand/collapse swap is instant in v0.1. v0.2 candidate. |
| Override the inline `style` for `display` / `WebkitLineClamp` | The component owns these for measurement. Use `contentClassName` for fonts / colors / spacing. |
| Server-render + expect zero flash | First server render assumes `isTruncated: false` (no DOM, no measurement). Toggle pop-in after hydration is small but exists. Live with it or use static `line-clamp-N` without the toggle. |

## Accessibility

- Default toggle is a real `<button type="button">` — keyboard activation via Enter / Space comes free.
- `aria-expanded={expanded}` on the toggle announces state to AT.
- `aria-controls={contentId}` on the toggle, `id={contentId}` on the `<p>` — links them programmatically (id from `useId` for SSR uniqueness).
- Custom `renderToggle` is the consumer's responsibility — preserve `aria-expanded` + `aria-label` (or visible text) on icon-only triggers.
- No `aria-live` needed — the toggle is user-initiated, not a content update.

## Limitations / caveats

- **`display: -webkit-box` is always applied** on the content `<p>` (toggling only `WebkitLineClamp` between `maxLines` and `"unset"`). This means the `<p>` participates in webkit-box layout — minor implication for surrounding flexbox parents that care about baseline alignment.
- **No SSR truncation** — first server render has no DOM access, so `isTruncated: false`. The toggle appears after client hydration. Acceptable for v0.1; matches kasder behavior.
- **`getComputedStyle.lineHeight` returning `"normal"`** — bails out of measurement (no toggle). The component's default `leading-relaxed` resolves to a px value in evergreen browsers; consumers overriding with `style={{ lineHeight: "normal" }}` will hit this edge. Avoid.
- **Sub-pixel rounding** — measurement uses `scrollHeight > maxHeight + 1` slop to prevent oscillation on exact-fit content.

## Composition siblings

- [`comment-thread-01`](../comment-thread-01-procomp/) (next ship) — composes this for comment bodies
- [`post-card-01`](../post-card-01-procomp/) (later) — composes this for post bodies
- [`article-body-01`](../article-body-01-procomp/) — sibling for **rich** content (Markdown / Plate / HTML); use that instead when the input isn't plain string

## v0.2 candidates

- Animated height transition on expand/collapse (gated on `interpolate-size: allow-keywords` browser support)
- Server-side truncation estimate via character heuristic for zero-flash SSR
- Inline `<span>` mode with `...more` continuation (Twitter style)
- `expandSnap` prop — scroll the toggle into view when expanded (avoid jumping the page)
