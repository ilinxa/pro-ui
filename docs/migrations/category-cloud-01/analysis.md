# category-cloud-01 — migration analysis

> Extraction pass for [`docs/migrations/category-cloud-01/`](./). Filled by the assistant after reading [`original/`](./original/) + [`source-notes.md`](./source-notes.md).
>
> **Family context:** middle of 3 sub-extractions from kasder's `NewsMagazineGrid.tsx` (siblings: `newsletter-card-01`, `filter-bar-01`). General-purpose, no `-news-` infix.

## Design DNA to PRESERVE

- **Editorial header rhythm** — `text-lg font-serif font-bold text-foreground mb-4 pb-2 border-b border-border` for the title.
- **Flex-wrap of pill badges** — `flex flex-wrap gap-2`. Natural responsive wrapping.
- **Active-vs-inactive variant swap** — Badge `variant="default"` (filled) when active, `variant="secondary"` (muted) otherwise.
- **Inline counts** — `{label} ({count})` rendered inside the chip.
- **`cursor-pointer`** + visual hover affordance.

## Structural debt to REWRITE

| # | Source | Resolution |
|---|---|---|
| 1 | Categories array imported from app data module | `items: CategoryCloudItem[] \| string[]` prop. String shorthand desugars to `{value, label}` form. |
| 2 | Counts derived inline by `allNews.filter(...)` | Optional `count` field on item; omitted from render when absent. |
| 3 | "All" sentinel exclusion handled by parent | Caller owns the input list; no internal logic. |
| 4 | Active state is `activeCategory === category` from parent | Controlled-or-uncontrolled `value: string \| null` + `onChange`. |
| 5 | Inline `onClick={() => setActiveCategory(...)}` | `onChange` callback prop; `toggleable` controls re-click-clears behavior. |
| 6 | Turkish "Kategoriler" header | `title?: string` prop. |
| 7 | Badge is `<div>` — Enter doesn't fire onClick | Wrap each in `<button type="button" aria-pressed={isActive}>` for native keyboard. |
| 8 | No group ARIA | `role="group" aria-label={ariaLabel ?? title}` on container. |
| 9 | No focus-visible style | Buttons get `focus-visible:ring-2`. |
| 10 | Heading level locked | `headingAs` prop. |
| 11 | Hardcoded count format | `formatCount` callback. |

## Dependency audit

- **Keep:** `@/components/ui/badge`, `@/lib/utils`.
- **Drop:** none.
- **Add:** none.

## Dynamism gaps

Every consumer-visible string, behavior, and class is overridable: `items`, `value`, `onChange`, `title`, `headingAs`, `formatCount`, `toggleable`, `ariaLabel`, `className`, `titleClassName`.

## Optimization gaps

- `React.memo` wrap.
- Stable `items` ref expectation documented in usage.tsx.

## Accessibility gaps

- Native `<button>` per chip with `aria-pressed`.
- `role="group"` on container.
- Focus-visible ring per chip.
- Configurable heading level.
- WCAG 2.1 AA.

## Proposed procomp scope

**Single component, 1 part file.**

```
src/registry/components/forms/category-cloud-01/
├── category-cloud-01.tsx     # root: state model + group container
├── parts/
│   └── category-chip.tsx     # one chip — button-as-badge with aria-pressed
├── types.ts
├── dummy-data.ts
├── demo.tsx
├── usage.tsx
├── meta.ts
└── index.ts
```

**File count:** 8. **Category:** `forms`.

### vs `entity-picker` audit

`entity-picker` = popover-driven select with search + multi-mode + chips. `category-cloud-01` = always-visible flex-wrap filter with counts. Different ergonomics:

- `entity-picker`: "pick from a long list with search."
- `category-cloud-01`: "see the full distribution, click to filter."

Real new component, no shared code.

### Demo plan

3 tabs:
1. **Basic** — string-array shorthand, no counts.
2. **With counts** — full items with counts; Turkish category labels.
3. **Controlled** — `value` + `onChange` driven externally with a sibling display.

## Recommendation

**PROCEED.** Smallest scope of the 3 sub-extractions.
