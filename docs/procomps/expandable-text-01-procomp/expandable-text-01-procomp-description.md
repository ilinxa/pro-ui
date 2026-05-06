# expandable-text-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/social-posts-system/`](../../migrations/social-posts-system/) — derived from kasder `PostContent.tsx` (55 LOC), the truncate-and-expand text block used inside post cards.
>
> First of 8 components in the social-posts-system migration. Smallest, no peer deps, no realtime concerns — gets the cadence going at the lowest possible scale and establishes the labels-object + controlled-or-uncontrolled patterns for the rest of the scope.

## Problem

Long blocks of user-authored text (post bodies, comment bodies, event descriptions, news excerpts in feeds) need a "show more / show less" affordance: clip after N lines, reveal a toggle button, expand on click. The trick is **detection** — pure CSS `line-clamp` clips silently with no signal about whether truncation actually happened. A short post that fits in 2 lines shouldn't grow a "show more" button; a long one should. This means measuring `scrollHeight` against `lineHeight × maxLines` after mount and after content changes.

Built ad-hoc across kasder (`PostContent.tsx`) and likely repeated in any feed-shaped product: hardcoded `maxLines`, hardcoded Turkish strings (`Daha fazla göster` / `Daha az göster`), no controlled-or-uncontrolled escape hatch, no labels object, no semantic level for the toggle.

## In scope

- **Measure-and-toggle line-clamp** — `useEffect` reads `getComputedStyle(el).lineHeight`, compares `el.scrollHeight > lineHeight × maxLines`, sets `isTruncated` state. Toggle button only renders when truncated.
- **Configurable max lines** — `maxLines?: number` prop (default 3). Re-measures on `[content, maxLines]` change.
- **Controlled-or-uncontrolled `expanded` state** — mirrors React form-input convention. Pass `expanded` + `onExpandedChange` for controlled (e.g., persist across virtualization remounts in a feed); pass `defaultExpanded` for initial uncontrolled state; pass neither and it defaults to collapsed.
- **i18n labels** — `labels?: { showMore?, showLess? }` with English defaults (`"Show more"` / `"Show less"`). Replaces kasder's hardcoded Turkish strings.
- **CSS-only line-clamp implementation** — `display: -webkit-box` + `WebkitLineClamp` + `WebkitBoxOrient: vertical` + `overflow: hidden`. Cross-browser including Safari. Tailwind's `line-clamp-N` would work for static N, but we need a dynamic `maxLines` prop, so inline `style` is correct.
- **Whitespace + line-break preservation** — `whitespace-pre-wrap break-words` on the `<p>`, so user-authored newlines render and long URLs wrap.
- **Toggle button styling** — minimal: `text-sm font-medium text-muted-foreground hover:text-foreground` button below the text. Opt-in `className` override.
- **Empty / null content guard** — when `content` is empty or null, render nothing (no toggle, no `<p>` shell).
- **Render slot for the trigger** — `renderToggle?: (state: { isExpanded; setExpanded }) => ReactNode` for hosts wanting a custom trigger (e.g. a chevron-icon button instead of plain text). Default is the small text button.
- **a11y** — toggle is a real `<button>` with `aria-expanded={isExpanded}` and `aria-controls={contentId}` (id from `useId`); content `<p>` carries `id={contentId}`. Reduced-motion respected for any future expand/collapse transition.

## Out of scope

- **Rich text** — this is plain-string content only. For HTML / Plate JSON / Markdown bodies, consumers use `article-body-01` (which has its own viewer). `expandable-text-01` is for the simple "expand a paragraph" case.
- **Per-character / per-word truncation** — line-based only. Word-truncation with ellipsis mid-word is a different UX (typically used in single-line table cells, not multi-line text blocks).
- **Auto-collapse on click outside** — one-shot expand; user collapses by clicking the toggle.
- **Read-more navigation to a detail page** — that's a host concern (link styling, routing). The toggle here only controls inline expansion.
- **Animated height transition on expand** — `expanded ? "visible" : "hidden"` swap is instant in v0.1. Adding a smooth height animation requires either measuring the unclamped height (extra render pass) or using `interpolate-size: allow-keywords` (limited browser support). v0.2 candidate if real demand surfaces.
- **Show-more inside an inline-flow container** — the toggle renders as a block button under the text. Inline "...more" continuation (Twitter style) is out of scope.
- **Markdown link / mention / hashtag rendering** — pure text. If consumers want auto-linkification, they preprocess `content` themselves or use `article-body-01`.

## Target consumers

- Post card body text (the originating use case in the social-posts-system scope)
- Comment thread node bodies (within `comment-thread-01`)
- Event description blocks (currently kasder uses raw `prose whitespace-pre-line`, which has no truncation)
- News content excerpts in feeds (currently `content-card-news-01` uses CSS-only `line-clamp-2`, no expand)
- Product description blocks
- Any user-generated multi-line text where the surface budget is bounded

## Rough API sketch

```tsx
<ExpandableText01 content={post.body} />
```

Most posts fit; the `maxLines={3}` default + auto-measure handles them all. For a profile bio that should default expanded:

```tsx
<ExpandableText01 content={user.bio} defaultExpanded />
```

Controlled mode for feed virtualization (preserve expand state across remount):

```tsx
const [expanded, setExpanded] = useState(false);
<ExpandableText01
  content={post.body}
  expanded={expanded}
  onExpandedChange={setExpanded}
/>
```

Custom trigger (e.g. chevron icon instead of text):

```tsx
import { ChevronDown, ChevronUp } from "lucide-react";

<ExpandableText01
  content={comment.body}
  maxLines={2}
  renderToggle={({ isExpanded, setExpanded }) => (
    <button onClick={() => setExpanded(!isExpanded)} aria-label={isExpanded ? "Collapse" : "Expand"}>
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </button>
  )}
/>
```

Localized:

```tsx
<ExpandableText01
  content={post.body}
  labels={{ showMore: "Daha fazla göster", showLess: "Daha az göster" }}
/>
```

## Example usages

**1. Post-card body** (the originating use case):
```tsx
<article className="bg-card rounded-2xl p-4">
  <PostHeader author={post.author} timestamp={post.createdAt} />
  <ExpandableText01 content={post.body} maxLines={3} className="mt-3" />
  <MediaCarousel01 items={post.media} variant="gallery" />
  <EngagementBar01 actions={[/*...*/]} />
</article>
```

**2. Comment-thread node body** (composed inside `comment-thread-01`):
```tsx
<div className="bg-muted/50 rounded-xl px-3 py-2">
  <header>{comment.author.name}</header>
  <ExpandableText01 content={comment.body} maxLines={4} />
</div>
```

**3. Event description with custom heading-as semantic**:
```tsx
<section aria-labelledby="event-description-heading">
  <h2 id="event-description-heading">About this event</h2>
  <ExpandableText01
    content={event.description}
    maxLines={5}
    defaultExpanded
  />
</section>
```

**4. Feed virtualization with controlled state** (host preserves expand state per post across scroll):
```tsx
const expandedSet = useExpandedSet();  // host's per-post state map

<VirtualList items={posts}>
  {(post) => (
    <PostCard
      post={post}
      bodySlot={
        <ExpandableText01
          content={post.body}
          expanded={expandedSet.has(post.id)}
          onExpandedChange={(next) => expandedSet.toggle(post.id, next)}
        />
      }
    />
  )}
</VirtualList>
```

## Public exports (from `index.ts`)

```ts
export { ExpandableText01 } from "./expandable-text-01";
export type {
  ExpandableText01Props,
  ExpandableText01Labels,
} from "./types";
export { DEFAULT_EXPANDABLE_TEXT_LABELS } from "./types";
export { useLineClampDetect } from "./hooks/use-line-clamp-detect";  // exported for advanced hosts
export { meta } from "./meta";
```

## Open questions for the plan stage

1. **Expose `useLineClampDetect` hook publicly?** Yes — useful for hosts wanting to detect truncation without using our specific component (e.g., to show a small "..." indicator in a different style). Cheap to export; ~15 LOC standalone hook.
2. **`renderToggle` slot or two separate button-styled props (`showMoreLabel` / `showLessLabel`)?** I propose **`renderToggle` slot** as the single escape hatch; for the simple label-only customization, `labels` already covers it. Avoids prop proliferation.
3. **`onExpand` / `onCollapse` separate callbacks vs single `onExpandedChange(next: boolean)`?** Single callback with boolean — matches React form-input convention (`onCheckedChange`, `onValueChange`).
4. **Inline `style` for `WebkitLineClamp` vs Tailwind `line-clamp-N` class lookup?** Inline `style` because `maxLines` is dynamic. Tailwind generates static classes only.
5. **Re-measure on window resize?** Yes — line-height can change with responsive font scaling. Add a `ResizeObserver` on the content element, debounced. Cheap. Lock in plan.
6. **Default `maxLines` value?** 3 (matches kasder). Could argue for 4 for comments. Plan-stage decision.
7. **Should `content` accept `ReactNode` instead of `string`?** No — measurement requires a stable text node. Rich content is `article-body-01`'s job. Lock to `string`.
8. **Component category?** `data` (matches sibling primitives like `progress-timeline-01`, `info-list-01`, `schedule-list-01`).

---

**Awaiting your sign-off before I draft the plan doc** (`expandable-text-01-procomp-plan.md`). The plan will lock the open questions above, spec the file tree, define the 4 demo sub-tabs, and pin the implementation order (Phase A: lib + hooks + scaffolding; Phase B: component + parts; Phase C: demo + usage + meta + ship).
