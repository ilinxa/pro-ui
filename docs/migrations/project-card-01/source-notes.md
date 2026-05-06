# Project Card 01 — migration source notes

> Intake doc for [`docs/migrations/project-card-01/`](./). The assistant pre-filled what is derivable from the source code; please review, correct, and fill the **"What I like"** / **"What bothers me"** / **"Constraints"** / **"Component decomposition"** sections from your perspective. The companion `analysis.md` is filled by the assistant after this doc is signed off.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** kasder — `kas-social-front-v0` (Next.js 15 / React 19, shadcn/ui, Tailwind v4, framer-motion)
- **Path in source:**
  - [`original/ProjectCard.tsx`](./original/ProjectCard.tsx) (92 LOC) — public projects-page card; vertical image-on-top, status pill, hover-reveal CTA
  - [`original/ProjectsGrid.tsx`](./original/ProjectsGrid.tsx) (123 LOC) — public-page orchestrator: pill-button category filter + manual `IntersectionObserver` infinite scroll + 1/2/3-col grid
  - [`original/ProjectsHero.tsx`](./original/ProjectsHero.tsx) (17 LOC) — thin wrapper over `PageHero`; Building2 badge + title + highlight + description
  - [`original/BusinessProjectsSection.tsx`](./original/BusinessProjectsSection.tsx) (328 LOC) — embedded business-profile widget; bento-mosaic grid + sequential prev/next detail dialog with goals + gallery + external-link
- **Related code (also in `original/` for collaborator graph):**
  - [`original/projectsType.ts`](./original/projectsType.ts) — `Project` (8 fields) + `ProjectCardProps`
  - [`original/projectsData.ts`](./original/projectsData.ts) — `allProjects` 12-item fixture + `categories` 7-pill list
  - [`original/useInfiniteScroll.ts`](./original/useInfiniteScroll.ts) — clean `IntersectionObserver` hook used by `BusinessProjectsSection`
  - [`original/PageHero.tsx`](./original/PageHero.tsx) — generic hero `ProjectsHero` wraps; identical surface to our shipped `page-hero-news-01`
- **Used in:**
  - **Public projects page** — `<ProjectsHero>` over `<ProjectsGrid>` rendering `<ProjectCard>` items; standalone listing for site visitors
  - **Business profile page** — `<BusinessProjectsSection projects=... isPreview>` embedded as one of several profile widgets; bento mosaic with click-to-expand detail dialog
- **Two `Project` shapes — minor union variance:**
  - Public type: `status: "completed" | "ongoing" | "planned"` + 8 required fields
  - BusinessProjectsSection inline type: `status: "completed" | "ongoing" | "upcoming"` + same 8 required + 6 optional (`fullDescription`, `location?`, `year?`, `team?`, `goals?[]`, `gallery?[]`, `link?`)
  - **`planned` vs `upcoming` is the same semantic state** — drift between two devs writing the same component twice. Migration will pick one (proposed: `planned`, matches the larger source).

## Role

Renders a single project (urban-renewal / earthquake-housing / sustainable-development / etc.) with everything a casual reader needs to recognize what was built, where, and whether it's done. The card's "alive" axis is its **status state** (`completed` / `ongoing` / `planned`) and its **category** (`Kentsel Dönüşüm` / `Afet Yönetimi` / `Sürdürülebilir Gelişim` / etc.) — both shown as on-image badges so the card communicates at a glance.

Two layouts exist at the source — same data, different presentation contexts:

- **Grid card** (`ProjectCard.tsx`) — vertical image-on-top + content-below; rendered at 1/2/3 columns on the public projects landing page. Optimistic / promotional tone (gradient overlay, hover-reveal CTA, subtle lift on hover).
- **Feature card** (`BusinessProjectsSection.tsx` grid item) — full-bleed image-as-background with content overlaid white-on-dark; rendered inside a bento mosaic on a business-profile widget. Denser, no hover-reveal, opens a detail dialog instead of navigating.

Same `Project`, two visual contexts — strong evidence variants are real (mirrors event-card-01's `grid` / `feed` story exactly).

## What I like (preserve)

> **Filled-in starting point — please add / strike-through / refine.** Sections marked **[ASSISTANT-DERIVED]** are the assistant's read of what looks intentional in the source; you have final say.

**[ASSISTANT-DERIVED] 3-state status set with named labels** — `completed` ("Tamamlandı") / `ongoing` ("Devam Ediyor") / `planned` ("Planlanan") in `ProjectCard.tsx` lines 10–14. Tighter than event-card-01's 6-state machine because projects don't have a time-window kernel — status is editorially set, not derived. **Preserve as a closed union.**

**[ASSISTANT-DERIVED] Status-driven color tokens** (lines 16–20) — green for completed, accent for ongoing, blue for planned. The blue-for-planned is interesting: the source uses inline hex (`bg-blue-500/20 text-blue-400`) rather than a token; suggests "planned" is conceptually distinct from "warning/upcoming" (event-card-01's amber). Worth deciding whether to add an `--info` token (blue) to globals.css or map `planned` to `--muted` (consistent with our token-conservatism).

**[ASSISTANT-DERIVED] Category badge top-right with `Building2` icon prefix + `backdrop-blur-sm`** (`ProjectCard.tsx` lines 49–54) — universal Building2 icon (vs. event-card-01's per-type-color map). Suggests project-card-01 may NOT need a per-category color map at v0.1 — the icon does the differentiation. Confirm with user.

**[ASSISTANT-DERIVED] Hover-reveal "Detayları Gör" overlay with arrow** — `opacity-0 group-hover:opacity-100` accent-tinted pill centered on the image (lines 57–62). The card has TWO action affordances: the whole link wrapper navigates, AND the centered overlay communicates "this is interactive." Distinctive — not in event-card-01. **Preserve for `grid` variant.**

**[ASSISTANT-DERIVED] Image gradient overlay** — `bg-linear-to-t from-primary/80 via-primary/20 to-transparent opacity-60 group-hover:opacity-80` (line 39). Primary-tinted (lime in pro-ui) gradient with hover-intensify. Differs from event-card-01's neutral darkening — gives projects a more promotional, less utilitarian tone. **Preserve.**

**[ASSISTANT-DERIVED] Title hover color shift** — `group-hover:text-accent transition-colors` on the `<h3>` (line 67). Subtle; reinforces the link-affordance.

**[ASSISTANT-DERIVED] Lift-on-hover** — `hover:-translate-y-2` + shadow upgrade (`shadow-soft` → `shadow-medium`) on the card chrome (line 31). 500ms duration. **Preserve.**

**[ASSISTANT-DERIVED] Bento mosaic 5-pattern rhythm** (`BusinessProjectsSection.tsx` lines 41–59) — the `getLgPattern(indexInBatch, batchSize)` function distributes items in batches of 5 across `lg:col-span-{1,2,3}` × `lg:row-span-{1,2}`. **Brilliant** because it gracefully degrades for any item count (1, 2, 3, 4, 5, 6+) — the last batch isn't necessarily 5, and the layout adjusts. **This is the kernel** worth lifting to a generic `bento-grid-01` later. NOT part of this card migration; flagged as a follow-up.

**[ASSISTANT-DERIVED] Sequential prev/next detail dialog** (`BusinessProjectsSection.tsx` lines 79–93, 184–222) — chevron buttons + project-counter pill + `disabled` at boundaries. Same state-machine shape as `story-viewer-01`'s segment navigation but for desktop modal context. **Worth lifting to its own future pro-comp** (`project-detail-dialog-01` or generic `sequential-detail-dialog-01`). NOT part of this card migration.

**[ASSISTANT-DERIVED] Detail-dialog meta chips** — Location / Year / Team rows, icon-prefixed (`MapPin` / `Calendar` / `Users`), only render when field exists (lines 228–247). Already-shipped `info-list-01` pro-comp covers this exact pattern.

**[ASSISTANT-DERIVED] Goals list with bullet-dot prefix** (lines 258–273) — small `w-1.5 h-1.5 rounded-full bg-primary` dot + flex-start aligned text. Clean. Reusable inside the future detail dialog.

**[ASSISTANT-DERIVED] Gallery grid 3/4-col with hover-zoom** (lines 276–287) — already-shipped `media-carousel-01` covers this; future detail dialog composes it.

> Add anything else — visual rhythms, animation timings, color choices, micro-interactions you specifically want to keep.

-

## What bothers me (rewrite)

> **Filled-in starting point — assistant's read of structural debt.** Tell me what else bugs you.

**[ASSISTANT-DERIVED] `next/link` hardcoded** — registry mandate forbids `next/*`. Will swap to polymorphic `linkComponent` slot (default `"a"`).

**[ASSISTANT-DERIVED] Hardcoded `/projects/${project.id}` route** (`ProjectCard.tsx` line 30) — needs `href` prop or `getHref(project)` callback.

**[ASSISTANT-DERIVED] Hardcoded Turkish strings** — `Tamamlandı` / `Devam Ediyor` / `Planlanan` / `Detayları Gör` / `Yakında` / `Tüm projeler gösteriliyor` / `Yükleniyor...` / `Tüm Projeleri Gör` / `Projeyi Ziyaret Et` / `Proje Hakkında` / `Hedefler` / `Galeri` / `Projelerimiz`. All flow through a `labels` object with English defaults.

**[ASSISTANT-DERIVED] `framer-motion` usage in `ProjectCard.tsx`** — `motion.div` with `whileInView` + viewport once + `delay: (index % 6) * 0.1`. Per pro-ui mandate ("one orchestrated reveal per major page"), card-level reveal staggering is a **layout concern**, not a card concern. Drop the wrapping `motion.div` entirely; the consumer's grid layout (`grid-layout-news-01`) drives stagger. Saves the framer-motion peer-dep import for `project-card-01`.

**[ASSISTANT-DERIVED] `index` prop drives `animationDelay`** but is the ONLY thing index does — drop it; card is index-agnostic.

**[ASSISTANT-DERIVED] Status union drift** — public type uses `planned`, BusinessProjectsSection inline type uses `upcoming`. Migration picks `planned` (matches the larger fixture and matches the editorial sense — "planned but not yet started" reads more concrete than "coming soon"). Document the rename in `analysis.md`.

**[ASSISTANT-DERIVED] Status colors use raw `bg-green-500/20 bg-blue-500/20`** — not pro-ui tokens. Migration maps to `--primary` / `--accent` / (TBD `--info` or `--muted`) per the design-system mandate (no raw hex). See "Open decisions" below.

**[ASSISTANT-DERIVED] Category color-map is absent in source** — categories rely on the universal Building2 icon. **Question for user:** add a `categoryStyles?: Record<string, { className: string; icon?: ComponentType }>` prop matching content-card-news-01's `categoryStyles` (so consumers CAN tint Kentsel-Dönüşüm vs. Afet-Yönetimi differently if they want), or stay icon-only? Proposed: ship the prop but default empty (icon-only behavior).

**[ASSISTANT-DERIVED] No `actions` slot for nested interactives** — same as event-card-01. Whole card is a link; nested `<button>` would be invalid HTML. Solution: same overlay-link pattern (link `absolute inset-0 z-0`, actions slot `relative z-10`, accessible name via `aria-labelledby={titleId}` + `useId`).

**[ASSISTANT-DERIVED] No `loading="lazy"` on `<img>`** — straightforward fix.

**[ASSISTANT-DERIVED] No `aria-labelledby` on the link wrapper** — link's accessible name is the entire flattened card text. Fix via `useId` + `<h3 id={titleId}>` + `<a aria-labelledby={titleId}>`.

**[ASSISTANT-DERIVED] No reduced-motion gating** — `transition-transform duration-700 group-hover:scale-110` runs for everyone. Gate via `motion-safe:` per pro-ui convention.

**[ASSISTANT-DERIVED] `BusinessProjectsSection` mixes orchestration + visual** — bento layout, infinite-scroll loader, dialog state, dialog chrome, AND the per-item card visual all in one 328-LOC file. Decompose:
  - Card visual → goes into `project-card-01` `feature` variant
  - Bento layout (`getLgPattern` / `getMdPattern`) → future generic `bento-grid-01` pro-comp (NOT this migration)
  - Detail dialog → future `project-detail-dialog-01` pro-comp (NOT this migration)
  - Infinite-scroll → already covered by `grid-layout-news-01` (NOT this migration)

**[ASSISTANT-DERIVED] Detail-dialog `<img>` for header** — no `next/image` (good!) but no `loading="lazy"` either. Out of scope (dialog is a separate future pro-comp).

**[ASSISTANT-DERIVED] No featured / pinned flag on `Project`** — would map naturally to a `featured?: boolean` prop on the card (mirrors event-card-01's locked-in decision: top accent border + star prefix). Worth confirming whether kasder has plans for "highlighted projects."

> Add anything else — re-render perf, prop ergonomics, accessibility gaps you've noticed.

-

## Constraints / non-goals

> **Filled-in starting point — please confirm or restrict further.**

**[ASSISTANT-DERIVED] Single-component scope: ONLY `project-card-01` ships in this migration.** Bento layout, detail dialog, infinite-scroll hook, public-page orchestrator are EXPLICITLY out of scope (handled by reuse or by future migrations — see "Component decomposition" below).

**[ASSISTANT-DERIVED] No detail / route ship.** The card is a leaf. Consumer wires the destination (own page, modal, drawer, etc.).

**[ASSISTANT-DERIVED] Stay framework-agnostic — no `next/*`, no `next/image`, no `next/link`, no `framer-motion`.** Polymorphic `linkComponent` slot. Card-level reveal is a layout concern.

**[ASSISTANT-DERIVED] No live-status logic.** Status is editorially set on the `Project` object — it does NOT auto-derive from a date or completion-percentage. Differs from event-card-01 (which has a 6-state time-window kernel). Project status changes when an editor changes it. Card stays pure-prop.

**[ASSISTANT-DERIVED] No registration / inquiry / contact flow inside the card.** Card surfaces info; consumer wires the action via the future `actions` slot or whole-card link target.

**[ASSISTANT-DERIVED] Sample status colors stay token-driven.** No raw hex, no inline OKLCH unless a new design-system token is being added (decision in "Open decisions").

## Component decomposition (THE KEY MAP)

> This section is the "precise division" you asked for. Each row of the source decomposes into one of: **NEW (this migration)** / **REUSE (already shipped)** / **DEFERRED (future migration)** / **DROPPED (handled by app code, not registry)**.

### What ships in THIS migration (`project-card-01` sealed-folder pro-comp)

| Source artifact | Becomes | Notes |
|---|---|---|
| `ProjectCard.tsx` (entire visual) | `project-card-01` `grid` variant — `parts/grid.tsx` | Vertical image-on-top, status pill, category pill, hover-reveal CTA, lift-on-hover, gradient overlay |
| `BusinessProjectsSection.tsx` per-item card visual (lines 130–166 only) | `project-card-01` `feature` variant — `parts/feature.tsx` | Full-bleed image background, status badge top-right, category top-left, white-on-dark text, no hover-reveal CTA |
| `Project` type (both source variants merged) | `types.ts` — `ProjectCardItem` | Required: `id`, `title`, `category`, `image`, `description`, `status`. Optional: `location?`, `year?`, `href?`, `imageAlt?`, `featured?`. Status union: `"completed" \| "ongoing" \| "planned"` (drops `upcoming`) |
| `statusLabels` + `statusColors` (`ProjectCard.tsx` lines 10–20) | `lib/project-status.ts` — `PROJECT_STATUS_CONFIG` (public export) | Mirrors event-card-01's `EVENT_STATUS_CONFIG` export pattern |
| Hardcoded category list (`projectsData.ts`) | NOT shipped — moves to `dummy-data.ts` only | Categories are consumer-supplied at the filter-bar level |

**Estimated file count:** 12 (1 root dispatcher + 2 parts + 1 lib + types + dummy + demo + usage + meta + index + index re-exports). Mirrors event-card-01.

### What REUSES already-shipped pro-comps (no new code, just compose at consumer level)

These are **already in pro-ui** — the consumer assembles the public projects page by importing them. The migration explicitly does not duplicate these.

| Source artifact | Already-shipped pro-comp | Coverage |
|---|---|---|
| `ProjectsHero.tsx` (17 LOC wrapper) + `commons/PageHero.tsx` | [`page-hero-news-01`](../../../src/registry/components/marketing/page-hero-news-01/) | Same surface: badge + title + titleHighlight + description. **100% subsumed.** |
| `ProjectsGrid.tsx` category-pill row (lines 77–95) | [`filter-bar-01`](../../../src/registry/components/forms/filter-bar-01/) | Pill-button category filter with selected state. **Verify exact API match** during analysis. |
| `ProjectsGrid.tsx` 1/2/3-col grid + infinite-scroll (lines 97–117) | [`grid-layout-news-01`](../../../src/registry/components/layout/grid-layout-news-01/) | Responsive grid + infinite-scroll loader. **Verify infinite-scroll surface** during analysis (may need a `loadMore` prop). |
| `useInfiniteScroll.ts` (52 LOC hook) | Subsumed by `grid-layout-news-01`'s internal impl OR shippable as a thin `lib/use-infinite-scroll` helper if `grid-layout-news-01` doesn't re-export it | Audit during analysis pass. |
| Detail-dialog meta chips (Location / Year / Team) | [`info-list-01`](../../../src/registry/components/data/info-list-01/) | Icon-prefixed key:value rows. Composed inside the future `project-detail-dialog-01`. |
| Detail-dialog full-description block | [`expandable-text-01`](../../../src/registry/components/data/expandable-text-01/) | Truncate-and-expand for long descriptions. |
| Detail-dialog gallery | [`media-carousel-01`](../../../src/registry/components/media/media-carousel-01/) | Image grid with hover/zoom. |
| Detail-dialog external-link CTA | [`engagement-bar-01`](../../../src/registry/components/data/engagement-bar-01/) | "Visit project" / "Share" / "Bookmark" actions. |
| Detail-dialog prev/next chevron state machine | [`story-viewer-01`](../../../src/registry/components/media/story-viewer-01/) | Sequential-viewer state precedent (modal context, prev/next/close, index counter). |

### What's DEFERRED to future migrations (out of scope for this intake)

These are real components worth shipping eventually, just not in this intake. Each one needs its own `pnpm new:migration` cycle.

| Future pro-comp | Source artifact | Why deferred |
|---|---|---|
| `bento-grid-01` (layout) — generic | `BusinessProjectsSection.tsx` `getLgPattern` + `getMdPattern` (lines 41–64) | The 5-pattern rhythm is **not project-specific** — it'd arrange events / news / portfolio items just as well. Deserves its own greenfield procomp gate, not a project migration. The `getPatternClass` algorithm IS the kernel — must be lifted intact. |
| `project-detail-dialog-01` (data) — or generic `sequential-detail-dialog-01` | `BusinessProjectsSection.tsx` `Dialog` block (lines 170–306) | Composes 4 already-shipped pro-comps (`info-list-01` + `expandable-text-01` + `media-carousel-01` + `engagement-bar-01`) + a sequential prev/next state machine (precedent: `story-viewer-01`). Deserves its own intake when prioritized. |

### What's DROPPED (handled by app code at the consumer level, not by the registry)

| Source artifact | Why dropped |
|---|---|
| `ProjectsGrid.tsx` orchestrator (full file) | App composes `page-hero-news-01` + `filter-bar-01` + `grid-layout-news-01` + `project-card-01`. Registry doesn't ship "page templates." |
| `ProjectsHero.tsx` (full file) | Subsumed entirely by `page-hero-news-01` (same surface). |
| `BusinessProjectsSection.tsx` orchestrator (full file) | App composes `bento-grid-01` (future) + `project-card-01` `feature` variant + `project-detail-dialog-01` (future). |
| `projectsData.ts` (12-item fixture + 7-pill category list) | Sample data — consumer's data layer. (We mirror just enough variety in `dummy-data.ts`.) |
| `framer-motion` `motion.div` wrappers | Per registry rule — card-level animation is a layout concern. |

## Open decisions (need user sign-off before analysis pass)

1. **Status color for `planned`** — three options:
   - **(a)** Map `planned` → `bg-muted` (consistent with our token-conservatism; "planned" reads as "not yet attention-grabbing"). Cheapest. **Recommended.**
   - **(b)** Map `planned` → existing `bg-warning` (the amber token added in event-card-01 migration). Reads more "upcoming-soon" which doesn't quite match `planned`'s editorial sense.
   - **(c)** Add a new `--info` token (blue, `oklch(0.78 0.10 240)` or similar) to `globals.css` for `planned`. Most honest to the source's blue-for-planned signal but expands the token system for one-component use.

2. **Status union: `planned` (proposed) vs. `upcoming`** — the source has both. Proposed: `planned`. Migration treats `upcoming` as a typo and renames everywhere.

3. **`categoryStyles?: Record<string, { className?: string; icon?: ComponentType }>` prop** — ship-empty-default OR drop entirely (icon-only via universal `Building2`)? Proposed: ship the prop, default empty (icon-only behavior preserved); consumers CAN tint per-category if they want, mirrors content-card-news-01 + event-card-01 conventions.

4. **`featured?: boolean` flag on `Project`** — add to `ProjectCardItem` type? Mirrors event-card-01's locked-in decision (top accent border + star prefix on title). Source has no concept of featured projects, but it's a cheap forward-compat surface. Proposed: yes, ship it.

5. **`actions?: ReactNode` slot** — overlay-link pattern, mirrors event-card-01. Proposed: yes, ship it.

6. **Variants in v0.1 — confirm both `grid` + `feature`?** Proposed: yes (mirrors event-card-01's `grid` + `feed` decision). The `feature` variant is what makes this card useful inside future `bento-grid-01`.

7. **Hover-reveal "Detayları Gör" CTA — keep on `grid`, drop on `feature`?** Source confirms this: public ProjectCard has it, BusinessProjectsSection bento item does not. Proposed: yes, hover-CTA on `grid` only. Use `labels.viewDetails` for the string.

8. **Image gradient color — `from-primary/80` (lime) vs. neutral?** The source uses primary-tinted; gives projects a more promotional tone. Pro-ui's primary is signal-lime which is bright. Proposed: neutral darkening (`from-black/70`) on `feature` variant; primary-tinted on `grid` variant to preserve the source's promotional DNA.

## Locked-in decisions (signed off 2026-05-03)

1. **Status color map (REVISED 2026-05-03 after first-render review):**
   | Status | Token (locked) | Note |
   |---|---|---|
   | `completed` | `bg-primary text-primary-foreground` | Signal-lime — celebratory, "done" |
   | `ongoing` | `bg-chart-3 text-white` | **Teal** — sits between completed (lime) and planned (grey); reads as "active." Originally proposed `bg-accent`, but pro-ui's `--accent: oklch(0.96 0.002 250)` is a near-white **surface token**, not a brand color — `bg-accent` would render as a near-invisible pill on `bg-card` |
   | `planned` | `bg-muted text-muted-foreground border border-border` | Neutral — "scheduled, not yet attention-grabbing." Border added for definition against `bg-card` |

   Token-conservative — no new `--info` token added (not enough one-off use to justify a new design-system token). All three states use existing tokens.
2. **Status union is `"completed" | "ongoing" | "planned"`.** `upcoming` from `BusinessProjectsSection`'s inline type is treated as drift; renamed to `planned` everywhere. Migration documents the rename in `analysis.md`.
3. **`categoryStyles?: Record<string, { className?: string; icon?: ComponentType }>` ships, default empty.** Behaviour identical to source when consumer doesn't pass it (universal `Building2` icon + neutral chip). Consumers CAN tint per-category if they want — mirrors content-card-news-01 + event-card-01 conventions.
4. **`featured?: boolean` ships on `ProjectCardItem`.** Visual treatment same as event-card-01: top accent border (`border-t-4 border-primary` on `grid` chrome / `ring-2 ring-primary ring-inset` on `feature` overlay) + `<Star className="w-4 h-4 fill-primary text-primary">` prefix on the `<h3>` with `aria-label={labels.featuredAriaLabel}`. Source has no concept of featured projects today — cheap forward-compat surface.
5. **`actions?: ReactNode` slot ships.** Overlay-link pattern: link `absolute inset-0 z-0`, actions slot `relative z-10`, `aria-labelledby={titleId}` via `useId`. Mirrors event-card-01 + content-card-news-01.
6. **Variants in v0.1: BOTH `grid` and `feature`.** Same data shape (`ProjectCardItem`), variant prop dispatches to `parts/grid.tsx` / `parts/feature.tsx`. Mirrors event-card-01's `grid` / `feed` story.
   - `grid` — vertical image-on-top, content-below, hover-reveal "View details" CTA, hover-lift; renders in 1/2/3-column responsive grid (use [`grid-layout-news-01`](../../../src/registry/components/layout/grid-layout-news-01/))
   - `feature` — full-bleed image background, content overlaid white-on-dark, no hover-CTA; renders inside `bento-grid-01` (deferred) or any image-tile container
7. **Hover-reveal "View details" CTA on `grid` variant only.** `feature` variant drops it (matches `BusinessProjectsSection` source — no hover overlay there). String flows through `labels.viewDetails` (default `"View details"`).
8. **Image gradient (REVISED 2026-05-03 after first-render review):** Both variants use neutral darkening — NOT primary-tinted.
   - `grid`: `from-black/60 via-black/15 to-transparent` (subtle bottom-darkening for badge legibility; image content shows through clearly)
   - `feature`: `from-black/90 via-black/40 to-transparent` (heavier darkening because content overlay reads white-on-image)

   Source's `from-primary/80 via-primary/20` was preserved verbatim in the first ship but **overpowered photographic content** — pro-ui's `--primary` is bright signal-lime which competes with image hues across the spectrum. Neutral darkening preserves the "promotional vs embedded" tonal difference (heavier on feature) without imposing a brand-color tint over arbitrary photography. Mirrors `event-card-01`'s grid pattern.

-

## Screenshots / links

<!-- Paste images, design files, screen recordings if you have them. The assistant will work from the code if you don't. -->
