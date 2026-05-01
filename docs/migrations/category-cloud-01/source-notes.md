# category-cloud-01 — migration source notes

> Intake doc for [`docs/migrations/category-cloud-01/`](./). The user provided a high-level description; the assistant drafted this doc from the source code + that description. **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off or edit before the analysis pass.**
>
> **Family context:** part of a sub-extraction from the kasder news system. Three small-but-reusable patterns extracted from `NewsMagazineGrid.tsx` (newsletter card, category cloud, filter bar) so `grid-layout-news-01` can become a slot-based layout that composes them. Each is **general-purpose** (no `-news-` infix) — the patterns are universal across news, blog, marketing, docs.
>
> **Open question worth flagging up front:** the existing pro-ui [`entity-picker`](../../../src/registry/components/forms/entity-picker/) already does "clickable badges with kind metadata + counts". Worth evaluating during analysis whether `category-cloud-01` is genuinely a new component or a thin layer over `entity-picker`.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\components\public\sections\news\NewsMagazineGrid.tsx` lines 254–275 (sidebar "Kategoriler" block).
- **Used in:** news landing page sidebar — flex-wrap of clickable category badges with item counts. Click → updates the parent's `activeCategory` state which drives the grid's filtering.
- **Related code:**
  - [`original/NewsMagazineGrid.tsx`](./original/NewsMagazineGrid.tsx) — the source (lines 254–275 are the relevant block; surrounding context shows how parent state flows in/out)
  - [`original/newsData.ts`](./original/newsData.ts) — fixture: the `categories` array (`["Tümü", "Kentsel Dönüşüm", "Sürdürülebilirlik", "Teknoloji", "Etkinlik", "Duyuru", "Araştırma"]`) drives the cloud (with `"Tümü"` filtered out)

## Role

Sidebar / inline filter affordance: a flex-wrap cloud of clickable category badges, each with its item count appended. Active category renders with a different Badge variant (`default` filled vs `secondary` muted). Click → parent's filter state changes, downstream content re-filters. Useful as a quick at-a-glance distribution view + one-click filter for the user.

Reusable beyond news: blog tag clouds, doc topic filters, dashboard segment toggles, e-commerce facet pills.

## What I like (preserve) [TO CONFIRM]

- **Header + cloud structure** — `<h3>Kategoriler</h3>` (serif bold, bottom-border separator) + flex-wrap of badges below. Clean editorial pattern.
- **Inline counts** — `{name} ({count})` rendered inside the badge label. At-a-glance distribution view.
- **Active-state via Badge variant swap** — `variant="default"` (filled) when active, `variant="secondary"` (muted) otherwise. No fight with the source variant for color (uses pro-ui's standard Badge variants).
- **`flex flex-wrap gap-2`** — natural responsive wrapping.
- **`cursor-pointer`** on inactive badges — signals interactivity.
- **"All" filter excluded from the cloud** — categories.filter(c => c !== "Tümü") in source. The cloud shows only real categories; the "All" affordance lives elsewhere (the filter-bar's first chip).

## What bothers me (rewrite) [TO CONFIRM]

- **Categories array hardcoded import** (`import { categories } from "@/data/newsData"`). Should be a prop: `categories: string[]` OR `categories: { id: string; label: string }[]`.
- **Counts derived inline by `allNews.filter(...)`** — coupled to NewsType + the parent's data. Should be a `counts?: Record<string, number>` prop OR a `getCount?: (category) => number` callback. Or omit counts entirely if not provided (graceful fallback).
- **"Tümü" sentinel-string filtering** — hardcoded "All" exclusion. Should be a `excludeCategories?: string[]` prop OR consumer just doesn't pass that string.
- **Active state hardcoded** — uses `activeCategory === category` from a parent state. Should be a controlled `value: string | null` + `onChange(category) => void`. Could also support uncontrolled with `defaultValue`.
- **`onClick={() => setActiveCategory(category)}`** — replaces the parent's setter. Should be a callback prop (`onCategoryClick(category)`) OR built-in via the controlled value.
- **Hardcoded "Kategoriler" Turkish header** → `title?: string` prop with English default ("Categories") OR full slot for `header?: ReactNode`.
- **No keyboard nav between badges.** Tab moves through each badge individually; no arrow-key roving. Could add a roving-tabindex group OR a true `role="listbox"` / `role="radiogroup"` ARIA pattern.
- **Badges are clickable but not semantic buttons.** `onClick` on a `<Badge>` (which renders `<div>` or `<span>`) — keyboard Enter doesn't fire onClick by default. Should be `<button type="button">` underneath OR use shadcn `Toggle` primitive.
- **No multi-select support** — source is single-active. Should be configurable via `selectionMode: 'single' | 'multi'` for future-proofing (multi useful for tag-style filtering).
- **Header styling locked** — `text-lg font-serif font-bold mb-4 pb-2 border-b border-border`. Could be configurable via `header` slot.
- **No empty state** — what renders when the categories array is empty? Currently nothing (just an empty cloud). Should optionally render a placeholder.

## Constraints / non-goals [TO CONFIRM]

- **Generic over category items** — not coupled to NewsType or the news domain. Works with tags, topics, departments, anything.
- **Stay framework-agnostic.** No `next/*`, no app contexts.
- **Optional counts** — some consumers won't have them; component should omit gracefully.
- **No multi-select in v0.1** — keep it single-select; multi-select is a v0.2 candidate (especially relevant if we end up re-using `entity-picker` instead).
- **No virtualization** — category clouds rarely exceed 50 items; no perf concern.
- **Independent of `newsletter-card-01` and `filter-bar-01`** — no cross-imports.

## Open follow-ups (analysis-pass topics)

- **Evaluate vs `entity-picker`.** If `entity-picker` already does ~80% of this, `category-cloud-01` may be a thin preset / alias. Worth a 10-min audit during the analysis pass before scaffolding new files.
- **shadcn `Toggle` vs custom button-as-badge.** shadcn ships a `Toggle` primitive that handles the active-state semantics + keyboard correctly. Could the cloud just be a `ToggleGroup`? Worth comparing in analysis.

## Screenshots / links

User shared 1 screenshot in this turn (the categories card with `(2)` counts on each chip). Drop it into [`./original/screenshots/`](./original/screenshots/) when convenient — visual record of the chip density + active-state contrast.

**Useful for the analysis pass:**
- Screenshot of the cloud at varying widths (does it wrap nicely on narrow sidebars?).
- Active-state screenshot (one chip selected vs. all neutral).
- Long-category-name behavior (does a 4-word category wrap inside the chip or bleed out?).

<!-- Paste additional images, design files, screen recordings, or notes below. -->
