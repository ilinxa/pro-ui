# expandable-text — consumer guide

> Stage 3: usage notes for hosts. Current for **v0.3.0**.
>
> See [description](./expandable-text-procomp-description.md) for what & why; [plan](./expandable-text-procomp-plan.md) for how it's built.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/expandable-text
```

Optional fixtures (sample strings — short / long in English, Turkish and Arabic):

```bash
pnpm dlx shadcn@latest add @ilinxa/expandable-text-fixtures
```

Zero peer deps beyond React. The component pulls no shadcn primitives at install time (the demo's `tabs` is a docs-site dep, not part of the shipped artifact).

## When to reach for it

Any user-authored multi-line text where the surface budget is bounded:

- Post bodies (the originating use case)
- Comment bodies — composes inside `comment-thread`; post bodies inside `post-card`
- Event description blocks (currently `event-detail-page-01` uses raw `<p>` with no truncation)
- News content excerpts in feeds (currently `news-card` uses static CSS `line-clamp-2` with no expand)
- Product description blocks
- Profile bios

Links and mentions go in as `children` (your own safe renderer) — see recipe 7. For editing, or for Markdown / HTML / Plate JSON documents, use [`rich-text-editor`](../../../src/registry/components/data/rich-text-editor/).

## The why behind measure-and-toggle

Pure CSS `line-clamp-N` clips silently — it has no signal about whether truncation actually occurred. A short post that fits in 2 lines shouldn't grow a "show more" button; a long one should. This component measures `scrollHeight` against `lineHeight × maxLines` after mount and on every container resize (via `ResizeObserver`), and **only renders the toggle when content actually exceeds the budget**.

If you don't need the conditional toggle (you always want the "show more" affordance regardless of content length), Tailwind's static `line-clamp-3` + a manual `<button>` is simpler.

## API at a glance

```ts
type ExpandableTextProps = {
  content?: string | null;              // plain text, in a <p>
  children?: ReactNode;                 // rich content, in a <div>; wins over content
  measureKey?: unknown;                 // re-measure when it changes
  maxLines?: number;                    // default 3
  dir?: "auto" | "ltr" | "rtl";         // default "auto"
  expanded?: boolean;                   // controlled
  defaultExpanded?: boolean;            // uncontrolled initial
  onExpandedChange?: (next: boolean) => void;
  labels?: { showMore?: string; showLess?: string };
  renderToggle?: (props: { isExpanded; setExpanded }) => ReactNode;
  className?: string;          // wrapping <div>
  contentClassName?: string;   // the content element (<p> / <div>)
  toggleClassName?: string;    // default <button> only (ignored when renderToggle is supplied)
};
```

## Common recipes

### 1. Minimal usage

```tsx
<ExpandableText content={post.body} />
```

That's it. `maxLines={3}` default, English labels, internal expand state.

### 2. Per-context maxLines

Different surfaces need different thresholds:

```tsx
<ExpandableText content={comment.body} maxLines={2} />   // tight comments
<ExpandableText content={post.body} maxLines={3} />      // feed posts (default)
<ExpandableText content={article.lede} maxLines={5} />   // article preview
<ExpandableText content={profile.bio} maxLines={6} />    // profile bio
```

### 3. Default-expanded (one-off use)

For surfaces where the text should start expanded but still be collapsible:

```tsx
<ExpandableText content={user.bio} defaultExpanded />
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
        <ExpandableText
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

<ExpandableText content={post.body} labels={TR_LABELS} />
```

**Hoist the labels object to module scope** — defining it inline busts the internal `React.memo` (new object identity every render).

### 6. Custom toggle (chevron icon)

The `renderToggle` slot fully replaces the default text button:

```tsx
import { ChevronDown, ChevronUp } from "lucide-react";

<ExpandableText
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
import { useLineClampDetect } from "@/components/expandable-text";

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

The hook's `content` parameter is typed `unknown` — pass any primitive or stable identity that changes when re-measurement is needed (string, version counter, content hash, etc.). `observeMutations: true` also re-measures on DOM changes inside the element; `isMeasured` is `false` until the first measurement (always on the server).

### 8. Rich children — links and mentions inside the clamp

```tsx
<ExpandableText maxLines={3}>
  <MentionText content={post.content} mentions={post.mentions} />
</ExpandableText>
```

- `children` wins over `content` and renders in a `<div>`, so block children (a `<p>` per paragraph) are valid.
- Changes inside the children are re-measured automatically (MutationObserver). Pass `measureKey` for a change that
  alters no DOM — e.g. a web font finishing loading: `measureKey={fontsReady}`.
- Keyboard focus moving onto a link hidden below the clamp expands the text (controlled: `onExpandedChange(true)` —
  adopt it, or the focused link stays hidden). A link on a visible line, or a mouse click, does not expand.
- Block children (several `<p>`) are bounded by `maxLines × line-height` (CSS `lh` unit) as well as the line clamp,
  because `-webkit-line-clamp` alone does not hold for block children; the cut is at a line boundary when the children
  share the container's line height. Browsers without the `lh` unit fall back to the line clamp alone.
- Any element counts as content — a child component that renders nothing still wins over `content` (an empty box).
  Pass `children` only when there is something to show.
- Render untrusted text through your own safe components — never as raw HTML.

### 9. Direction

The text element has `dir="auto"` by default: each body is bidi-isolated, so an Arabic post in an LTR feed starts at
the right (and vice versa). Force one with `dir="ltr"` / `dir="rtl"`. The toggle sits below the text, at the start
edge of the page's direction.

How `dir="auto"` decides (the HTML rule): the **first strong character** wins, and a body with none (only emoji,
numbers or a URL) is **LTR — even on an RTL page**. So:

- an Arabic post that starts with a Latin `@mention` lays out LTR — wrap mentions in `<bdi>` in your children, or pass
  `dir` from the post's own language;
- on an RTL page, emoji-only or number-only bodies left-align — pass `dir="rtl"` (or the page direction) if that
  matters for your feed.

## Upgrading to 0.3.0

| Change | What to do |
|---|---|
| The text is clamped from the first paint (no full-text flash / layout shift after hydration) | nothing |
| `dir="auto"` on the text element | `dir="ltr"` restores the old behaviour for a mixed-script body |
| `content` is optional; nothing renders only with neither content nor children | nothing |
| `DEFAULT_EXPANDABLE_TEXT_LABELS` renamed | use `defaultExpandableTextLabels` (alias kept); an `undefined` label now keeps its default |

## Anti-patterns

| Don't | Why |
|---|---|
| Pass raw HTML as children | Render links / mentions with your own safe components. Use `rich-text-editor` for HTML / Markdown / Plate documents. |
| Define `labels={{ ... }}` inline | Busts `React.memo` (new object identity every render). Hoist to module scope. |
| Expect auto-collapse on click outside | One-shot expand; user collapses by clicking the toggle. |
| Expect animated height transition | The expand/collapse swap is instant. Not implemented. |
| Override the inline `style` for `display` / `WebkitLineClamp` | The component owns these for measurement. Use `contentClassName` for fonts / colors / spacing. |

## Accessibility

- Default toggle is a real `<button type="button">` — keyboard activation via Enter / Space comes free.
- `aria-expanded={expanded}` on the toggle announces state to AT.
- `aria-controls={contentId}` on the toggle, `id={contentId}` on the content element — links them programmatically (id from `useId` for SSR uniqueness).
- Keyboard focus never lands on hidden text: tabbing onto a link below the clamp expands it (recipe 8).
- `dir="auto"` lets screen readers and the layout follow each body's own script.
- Custom `renderToggle` is the consumer's responsibility — preserve `aria-expanded` + `aria-label` (or visible text) on icon-only triggers.
- No `aria-live` needed — the toggle is user-initiated, not a content update.

## Limitations / caveats

- **`display: -webkit-box` is always applied** on the content element (toggling only `WebkitLineClamp` between `maxLines` and `"unset"`). It participates in webkit-box layout — minor implication for surrounding flexbox parents that care about baseline alignment.
- **The toggle appears after hydration** — the server cannot measure, so the text is clamped from the first paint (no layout shift) and the "show more" toggle appears once the client has measured. Short text unclamps at that moment. Printing and browsers without scripting show the full text (no toggle can run there); if a measurement is impossible (no line height), the text is shown in full rather than cut off.
- **`line-height: normal`** is measured as ~1.2 × the font size (browsers resolve "normal" per font; the approximation is close for common fonts).
- **Sub-pixel rounding** — measurement uses `scrollHeight > maxHeight + 1` slop to prevent oscillation on exact-fit content.

## Composition siblings

- [`comment-thread`](../comment-thread-procomp/) — composes this for comment bodies (`content`)
- [`post-card`](../post-card-procomp/) — composes this for post bodies in all four variants (`content`; its mention highlighting does not use `children` yet)
- [`rich-text-editor`](../rich-text-editor-procomp/) — for editing, or Markdown / Plate / HTML documents

## Not implemented

No version promised: animated height transition; an inline `<span>` "…more" continuation (Twitter style); an
`expandSnap` prop that scrolls the toggle into view when expanded.

## Cross-folder import contract

When this component composes another registry component (cross-folder import), it imports only from the OTHER component's `<slug>.tsx` file — never from `lib/`, `hooks/`, or `parts/` sub-folders. Conversely, when other registry components compose `expandable-text`, they import only from `expandable-text.tsx`.

The constraint comes from how `pnpm dlx shadcn add` rewrites import paths in installed copies; sub-folder paths often don't survive cleanly. Anything you want shareable across folder boundaries MUST be re-exported from `<slug>.tsx`.

See [`docs/component-guide.md` §11.6](../../component-guide.md) — *Cross-folder import constraint*.
