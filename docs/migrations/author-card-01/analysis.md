# author-card-01 — migration analysis

> Extraction pass for [`docs/migrations/author-card-01/`](./). Filled by the assistant after reading [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) and [`source-notes.md`](./source-notes.md). Reviewed and signed off by user before the procomp gate begins.
>
> Pipeline: [`docs/migrations/README.md`](../README.md).

## Design DNA to PRESERVE

1. **Card-framed surface** — `rounded-2xl p-6 border border-border/50` on `bg-card`. Visually lifts above the article body without dominating.
2. **Editorial header rhythm** — `text-lg font-serif font-bold` heading at the top, matching `newsletter-card-01` / `category-cloud-01` / `filter-bar-01`. Pro-ui consistency mandate.
3. **Identity row two-column shape** — avatar on the left (16×16 circle), name + role stacked on the right, `gap-4` rhythm. Linear left-to-right scan order matches reading flow.
4. **Avatar tint pairing** — when icon-fallback is used, the circle is `bg-primary/10` with `text-primary` icon. Tonal pairing (10% bg + full-saturation icon) reads as a soft surface lift, not a stamp.
5. **Bio block placement** — separated from the identity row by `mt-4`, secondary tone (`text-muted-foreground`), `text-sm` size — clearly subordinate to the name without disappearing.
6. **Soft border** — `border-border/50` (50% opacity on `--border`) — present but unobtrusive.

## Structural debt to REWRITE

1. **Inline JSX with no boundaries** — the entire block lives directly inside `<aside>` in `page.tsx`. No file-level component to import, no props, no contract. Rewrite as sealed-folder pro-comp.
2. **Hardcoded heading text** (`"Yazar Hakkında"`) — Turkish embedded in the page. → English defaults + `labels?: { heading?: string }` override.
3. **Hardcoded role string** (`"Kıdemli Editör"`) — not data-driven. → required `role` prop.
4. **Hardcoded bio sentence** — copy in JSX. → required `bio` prop (or optional, hide section when absent).
5. **No image support** — only `User` icon fallback. → optional `imageSrc` + `imageAlt`; falls back to icon when absent.
6. **No clickable variant** — author name is plain text, can't link to the author's page. → polymorphic root via `linkComponent?: ElementType` with `href` (matches `content-card-news-01` overlay-link pattern conceptually but simpler — whole card is the link target).
7. **No heading-level config** — `<h3>` always. → `headingAs?: "h2" | "h3" | "h4"` (default `h3`).
8. **No memoization** — re-renders on parent re-render even when props are reference-equal. → `React.memo` wrap.
9. **Tone fixed to primary** — `bg-primary/10` + `text-primary` baked in. → `tone?: "primary" | "accent" | "muted"` matching `newsletter-card-01`'s tone resolver pattern.

## Dependency audit

| Dep | Source uses | Plan |
|---|---|---|
| `react` | yes | yes — declared root |
| `lucide-react` | `User` icon | yes — declared dep, `User` as default `fallbackIcon` |
| `@/components/ui/button` | no (no button in this block) | not needed |
| `@/components/ui/avatar` | no (uses raw div + img + icon) | **decision:** stay with raw div + img + icon to preserve the kasder visual (10% tint circle, exact size). shadcn Avatar uses Radix Avatar primitive which has different fallback semantics — not a 1:1 visual match without overrides. Lower dep count, simpler component. |
| `@/lib/utils` (`cn`) | no | yes — for `tone` resolver + `className` merge |
| `next/link` | no (block itself doesn't link) | not used directly; consumers pass `linkComponent` if they want clickable |

No new shadcn primitives needed. No third-party deps beyond `lucide-react` (already in pro-ui peer set).

## Dynamism gaps

1. Heading text → `labels.heading?` (default: `"About the author"`).
2. Role string → required `role` prop (string).
3. Bio → optional `bio` prop (string); hidden when absent.
4. Avatar → optional `imageSrc` + `imageAlt`; falls back to icon (default `User`).
5. Whole card linkable → optional `href` + `linkComponent?: ElementType` (defaults to `<a>` when `href` provided; non-clickable `<div>` otherwise).
6. Heading level → `headingAs?: "h2" | "h3" | "h4"`.
7. Tone → `tone?: "primary" | "accent" | "muted"`.
8. Custom fallback icon → `fallbackIcon?: ComponentType<{ className?: string }>`.
9. Class overrides → `className?` (root), `headingClassName?`, `nameClassName?`, `bioClassName?`.

## Optimization gaps

1. **Memoization** — wrap default export in `React.memo`. Component is pure for given props.
2. **Stable identity** — no event handlers in v0.1, so no `useCallback` needed.
3. **Image loading** — add `loading="lazy"` to the `<img>` (only renders below-fold most of the time).
4. **No SSR concerns** — entirely server-renderable; no client-only APIs.

## Accessibility gaps

1. Image must have `alt` — derive from `imageAlt` prop, fallback to `name` (matches `content-card-news-01` pattern).
2. When card is clickable, the entire root needs to be a single anchor — accessible name composed automatically by reading the heading text. Use `aria-labelledby` pointing to the name element id (computed via `useId`).
3. When card is not clickable, no extra a11y treatment needed — it's just a card with a heading.
4. Icon-only avatar (fallback path) needs `aria-hidden="true"` on the icon (the name below carries the identity); icon is decorative.
5. Heading level configurability matters for landmark structure — sidebar cards typically should be `<h3>` under the article's `<h2>`, but consumers may need to flex.

## Proposed procomp scope

**Slug:** `author-card-01`
**Category:** `marketing` (matches `newsletter-card-01` — sidebar editorial blocks).
**Status:** alpha 0.1.0.

**Files (~7):**
- `author-card-01.tsx` — root component
- `parts/avatar.tsx` — image-or-icon-fallback avatar circle
- `parts/tone-resolver.ts` — pure mapping `tone` → CSS classes (mirrors newsletter-card)
- `types.ts` — public props + tone enum
- `dummy-data.ts` — 3 sample authors (with image / without image / muted-tone)
- `demo.tsx` — 5 sub-tabs (default / with image / clickable / muted tone / custom labels)
- `usage.tsx`, `meta.ts`, `index.ts` — standard

**Public API draft:**

```ts
export interface AuthorCard01Props {
  name: string;
  role: string;
  bio?: string;
  imageSrc?: string;
  imageAlt?: string;
  fallbackIcon?: ComponentType<{ className?: string }>;
  href?: string;
  linkComponent?: ElementType;
  tone?: "primary" | "accent" | "muted";        // default "primary"
  headingAs?: "h2" | "h3" | "h4";                // default "h3"
  labels?: { heading?: string };                 // default { heading: "About the author" }
  className?: string;
  headingClassName?: string;
  nameClassName?: string;
  bioClassName?: string;
}
```

**Bundle envelope:** ≤ 4KB component code (no shadcn primitives beyond what's already shared).

## Recommendation

**Ship as a standalone pro-component.** Clean visual + behavioral footprint, well-defined edges, sits in the same family rhythm as the 3 already-shipped news-domain marketing/forms blocks. Migration debt is low (one block of inline JSX → 7-file sealed folder). Production payoff is high — the "person identity card with bio" pattern is universal across blog/CMS/team/contributor contexts.

**One open call before the procomp gate:** `tone` defaults to `primary` (signal-lime tint). The kasder source uses `primary`. Confirm or override before I draft the description.
