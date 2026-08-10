# Phase 7 — v0.1.x patch session plan

> **Status:** Authored 2026-05-09 at session 13 sweep close. Awaiting execution.
> **Predecessor:** Sweep close — see [`docs/reviews/2026-05-09-sweep-rollup.md`](../docs/reviews/2026-05-09-sweep-rollup.md).
> **Estimated wall-clock:** ~5-6 hours (single long session OR split across two).

Phase 7 bundles the 14 🔸 Medium findings from sessions 8-12 + paired 🔹 Low findings into 10 logical groups. Each group: focused scope, listed file touches, smoke-or-tsc verification, version-bump candidates. After Phase 7: ~9 components bump to v0.1.1 / v0.1.2.

**Phase 7 is non-breaking v0.1.x patches only.** F-cross-12 (positional callbacks) is v0.2-bound and OUT of scope. F-cross-04 (offline build env) is a separate plan and OUT of scope.

---

## Goals

1. Close all 14 Medium findings from Tier 2 sweep.
2. Bundle paired Lows where they share a fix (Date.now batch, doc-only commits).
3. Mitigate F-cross-11 via documentation (Phase 7 group I).
4. Bump affected components' versions + refresh `docs/component-versions.md`.
5. Single Vercel redeploy at Phase 7 close.

## Non-goals

- v0.2 breaking changes (F-cross-12 positional callbacks).
- F-cross-04 environmental fix.
- Force-graph v3 recreation.
- New component work.
- Anything not surfaced in sessions 8-12 review files.

## Exit criteria

- [ ] All 10 Phase 7 groups committed.
- [ ] tsc 0 / lint 0 / validate-meta-deps 36/36 clean at every commit.
- [ ] At least 3 single-slug smokes passing for the affected components (event-card-01, media-carousel-01, detail-panel — the 3 with material code changes).
- [ ] `docs/component-versions.md` refreshed.
- [ ] Sweep-tracker F-cross-11 status: Closed (or partial-closed if doc-only path).
- [ ] Session 14 decision file at `.claude/decisions/<date>-session-14-phase-7.md`.
- [ ] Push to origin/master successful (Vercel redeploy triggered).

---

## Group A — Pluralization fix (event-card-01 + registration-card-01)

**Severity:** 🔸 Medium × 2 — both produce "1 days left" / "1 spots left" at boundary.
**Source:** s11 event-card F-01 + s12 registration-card F-01.

### Scope

Add `Intl.PluralRules`-based formatter callbacks to both components. Remove the static suffix labels. Default callbacks use English plural rules; consumers override via `formatDaysUntil` / `formatSpotsLeft`.

### Files

| File | Change |
|---|---|
| `src/registry/components/data/event-card-01/types.ts` | Add `formatDaysUntil?: (count: number) => string`; deprecate `daysUntilSuffix` (keep for back-compat one minor) |
| `src/registry/components/data/event-card-01/types.ts` | Same for `formatSpotsLeft` / `spotsLeftSuffix` |
| `src/registry/components/data/event-card-01/lib/format-default.ts` | Add default formatters using `Intl.PluralRules` |
| `src/registry/components/data/event-card-01/parts/grid.tsx` (+ feed/list/compact) | Use new formatter callbacks |
| `src/registry/components/data/registration-card-01/types.ts` | Same shape |
| `src/registry/components/data/registration-card-01/registration-card-01.tsx` | Use new formatter |
| `docs/procomps/event-card-01-procomp/event-card-01-procomp-guide.md` | Document new prop |
| `docs/procomps/registration-card-01-procomp/registration-card-01-procomp-guide.md` | Document new prop |

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- Single-slug smoke: `event-card-01` + `registration-card-01`
- Visual check: demo at `/components/event-card-01` for 1-day countdown + 1-spot countdown

### Version bump

- event-card-01: 0.1.0 → 0.1.1
- registration-card-01: 0.1.0 → 0.1.1

### Estimated effort

~40 min (2 components, parallel structure, smoke verify).

---

## Group B — engagement-bar-01 utils/ → lib/ rename

**Severity:** 🔸 Medium — convention drift.
**Source:** s10 engagement-bar F-01.

### Scope

Mechanical folder rename. Update import path in source. Update registry.json paths.

### Files

| File | Change |
|---|---|
| `src/registry/components/data/engagement-bar-01/utils/format-count.ts` | → `lib/format-count.ts` |
| `src/registry/components/data/engagement-bar-01/engagement-bar-01.tsx:19` | Import path: `./utils/format-count` → `./lib/format-count` |
| `registry.json` | Update path + target for `format-count.ts` (search for `engagement-bar-01/utils/`) |

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- `pnpm validate:meta-deps` clean (no meta change but verify no regression)
- Single-slug smoke: `engagement-bar-01`

### Version bump

- engagement-bar-01: 0.1.1 → 0.1.2

### Estimated effort

~15 min.

---

## Group C — media-carousel-01 a11y (Embla keyboard plugin + inert)

**Severity:** 🔸 Medium × 2 — keyboard nav broken when track focused; inactive slides remain focusable.
**Source:** s10 media-carousel F-01 + F-02.

### Scope

1. Install `embla-carousel-keyboard` (~1KB) and add to emblaOptions.plugins.
2. Add HTML5 `inert` attribute to non-current slide wrappers.

### Files

| File | Change |
|---|---|
| `package.json` | `pnpm add embla-carousel-keyboard@^8.6.0` (match embla-carousel-react version) |
| `src/registry/components/media/media-carousel-01/parts/carousel-track.tsx` | Add `keyboard` plugin to emblaOptions; add `inert={!isActive ? "" : undefined}` to slide wrappers (gallery + linear variants) |
| `src/registry/components/media/media-carousel-01/meta.ts` | Add `embla-carousel-keyboard: "^8.6.0"` to `meta.npm` |
| `registry.json` | Add to `dependencies` array |

### Verification

- `pnpm tsc --noEmit` clean (React 19 supports `inert` natively)
- `pnpm lint` clean
- `pnpm validate:meta-deps` clean
- Single-slug smoke: `media-carousel-01`
- Manual a11y check: keyboard arrow nav works when track focused; Tab skips inactive-slide content

### Version bump

- media-carousel-01: 0.1.1 → 0.1.2

### Estimated effort

~30 min (dep install + 2 small code edits + verify).

---

## Group D — page-hero-news-01 white-on-lime mandate fix

**Severity:** 🔸 Medium — `text-white` on `from-primary` gradient violates CLAUDE.md design mandate ("lime is too bright for white text").
**Source:** s9 page-hero F-01.

### Scope

Replace `text-white` / `text-white/80` with `text-primary-foreground` / `text-primary-foreground/80` (the mandated near-black). Verify visual against the gradient.

### Files

| File | Change |
|---|---|
| `src/registry/components/marketing/page-hero-news-01/page-hero-news-01.tsx:91, 106` | `text-white` → `text-primary-foreground`; `text-white/80` → `text-primary-foreground/80` |
| `docs/procomps/page-hero-news-01-procomp/page-hero-news-01-procomp-guide.md` | Note the design-system-aligned change |

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- Single-slug smoke: `page-hero-news-01`
- Visual check: `/components/page-hero-news-01` — verify text legibility on lime gradient

### Version bump

- page-hero-news-01: 0.1.0 → 0.1.1

### Estimated effort

~10 min.

---

## Group E — progress-timeline-01 status colors

**Severity:** 🔸 Medium — 3-state status (before/active/after) has no visual color encoding.
**Source:** s11 progress-timeline F-01.

### Scope

Add status-conditional bar + marker colors. `before` → muted; `active` → primary (current); `after` → secondary (or muted-foreground). Color-AND-text differentiation per event-card-01 precedent.

### Files

| File | Change |
|---|---|
| `src/registry/components/data/progress-timeline-01/progress-timeline-01.tsx:96-117` | Add status-conditional className map; apply to bar `[&>*]:bg-...` and marker `bg-...` |
| `docs/procomps/progress-timeline-01-procomp/progress-timeline-01-procomp-guide.md` | Document the status-color pattern + override props |

### Color picks (lock with design-system owner before shipping)

- `before`: bar `[&>*]:bg-muted-foreground/30`; marker `bg-muted-foreground`
- `active`: bar default (`bg-primary` via shadcn); marker `bg-primary` (current)
- `after`: bar `[&>*]:bg-secondary` (or `bg-muted-foreground/40`); marker `bg-secondary`

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- Single-slug smoke: `progress-timeline-01`
- Visual check: each state visually distinct on `/components/progress-timeline-01`

### Version bump

- progress-timeline-01: 0.1.0 → 0.1.1

### Estimated effort

~30 min (color decisions + apply + visual verify).

---

## Group F — detail-panel ariaLabel default

**Severity:** 🔸 Medium — `ariaLabel` optional but `<div role="region">` requires accessible name.
**Source:** s12 detail-panel F-02.

### Scope

Add `labels` prop with default `region: "Detail panel"`. Make `ariaLabel` derive from labels.region as fallback. Document the behavior.

### Files

| File | Change |
|---|---|
| `src/registry/components/feedback/detail-panel/types.ts` | Add `DetailPanelLabels = { region?: string }` interface; add `labels?: DetailPanelLabels` to props; add `DEFAULT_DETAIL_PANEL_LABELS = { region: "Detail panel" }` |
| `src/registry/components/feedback/detail-panel/detail-panel.tsx` | Resolve `ariaLabel ?? labels.region ?? DEFAULT_DETAIL_PANEL_LABELS.region` |
| `src/registry/components/feedback/detail-panel/index.ts` | Re-export `DetailPanelLabels` + `DEFAULT_DETAIL_PANEL_LABELS` |
| `docs/procomps/detail-panel-procomp/detail-panel-procomp-guide.md` | Update Reference section with new prop |

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- Single-slug smoke: `detail-panel`

### Version bump

- detail-panel: 0.1.0 → 0.1.1

### Estimated effort

~15 min.

---

## Group G — Date.now → performance.now batch (3 components)

**Severity:** 🔹 Low × 3 — paired finding across story-viewer-01, video-player-01 (useDoubleTap), filter-stack (verify).
**Source:** s9 story-viewer F-01 + s9 video-player F-01.

### Scope

Replace `Date.now()` with `performance.now()` for elapsed-time calculations. Monotonic + immune to NTP/DST jumps + slightly cheaper.

### Files

| File | Change |
|---|---|
| `src/registry/components/media/story-viewer-01/hooks/use-story-progress.ts:76, 87, 91` | `Date.now()` → `performance.now()` (3 sites) |
| `src/registry/components/media/video-player-01/hooks/use-double-tap.ts:25` | `Date.now()` → `performance.now()` |
| `src/registry/components/forms/filter-stack/...` | (Verify if filter-stack uses Date.now anywhere — recon at Phase 7 start) |

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- Single-slug smoke: `story-viewer-01` + `video-player-01`

### Version bump

- story-viewer-01: 0.1.0 → 0.1.1
- video-player-01: 0.1.0 → 0.1.1

### Estimated effort

~15 min.

---

## Group H — grid-layout-news-01 useMagazineFilter JSDoc/impl drift

**Severity:** 🔸 Medium — JSDoc claims auto-reset on dataset change; implementation does NOT.
**Source:** s8 grid-layout-news F-01.

### Scope

Either fix JSDoc OR implement the auto-reset. **Recommended: implement auto-reset** (matches the documented behavior; lower consumer-surprise risk).

### Files

| File | Change |
|---|---|
| `src/registry/components/layout/grid-layout-news-01/hooks/use-magazine-filter.ts` | Add `useEffect` keyed on `[items, filterPredicate, sortComparator]` that calls `setPage(1)` |
| `docs/procomps/grid-layout-news-01-procomp/grid-layout-news-01-procomp-guide.md` | Reaffirm the documented behavior + add note about ref-stability |

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- Single-slug smoke: `grid-layout-news-01`
- Visual check: dataset change resets to page 1

### Version bump

- grid-layout-news-01: 0.1.0 → 0.1.1

### Estimated effort

~15 min.

---

## Group I — F-cross-11 cross-folder import constraint documentation

**Severity:** ⚠️ High (cross-cutting) — but doc-only mitigation is the Phase 7 path.
**Source:** F-cross-11 (s10 post-card F-01 + s11 expandable-text F-01).

### Scope

Add a section to `docs/component-guide.md` documenting the cross-folder import constraint:
- Cross-folder consumers MUST import from `<slug>.tsx` (the file, not the folder/barrel)
- Consequently, all symbols intended for cross-folder consumption must be re-exported from `<slug>.tsx`
- Symbols in `lib/`, `hooks/`, `parts/` sub-folders are internal-only when accessed cross-folder
- shadcn rewrite logic + smoke harness limitations explained

Also add a note to the relevant procomp guides:
- post-card-01 guide
- comment-thread-01 guide
- engagement-bar-01 guide
- expandable-text-01 guide
- video-player-01 guide
- story-viewer-01 guide

### Files

| File | Change |
|---|---|
| `docs/component-guide.md` | New §11.X "Cross-folder import constraint" |
| 6 procomp guide.md files | Cross-reference to new component-guide section |

### Verification

- `pnpm lint` clean (markdown-only)

### Version bump

- None (docs-only)

### Estimated effort

~30 min (one substantive doc + 6 small cross-references).

### Tracker update

- F-cross-11 status: Open → Closed (doc path) at Phase 7 close. Optionally pursue path (b) — consumer-tsc smoke harness extension — as a follow-up out of Phase 7 scope.

---

## Group J — Doc-only Lows bundle (one big commit)

**Severity:** 🔹 Low × ~10 — paired demo + docs gaps from sessions 8-12.
**Source:** Multiple Lows aggregated.

### Scope

Single commit with all docs/demo polish:

| Source | Component | Item |
|---|---|---|
| s8 article-meta F-01 | article-meta-01 | Add `align="end"` demo sub-tab |
| s8 filter-stack F-02 | filter-stack | Add `onFilteredChange`-consuming sub-demo |
| s8 grid-layout-news F-02/F-03 | grid-layout-news-01 | Document positional renderItem versioning trap + slot widening note in guide |
| s9 newsletter-card F-01 | newsletter-card-01 | Format-hint placeholder (`"you@example.com"`) |
| s9 share-bar F-01 | share-bar-01 | Wire `onCopySuccess` into analytics demo tab |
| s9 share-bar F-02 | share-bar-01 | Document `successResetMs` dual-purpose |
| s10 content-card-news F-02 | content-card-news-01 | Re-export `toDate` from index.ts |
| s11 thumb-list F-01 | thumb-list-01 | Add explanatory `<p>` text after each demo tab |
| s11 thumb-list F-02 | thumb-list-01 | Add `headerIcon={null}` + custom linkComponent demo |
| s12 schedule-list F-01 | schedule-list-01 | Document time-column-width constraint OR change `w-20` → `w-auto min-w-20` |

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- No smoke run needed (docs/demo-only changes)

### Version bump

- None for most (docs only). Possibly micro-bumps for components with demo changes.

### Estimated effort

~30-45 min (10 small edits across multiple files).

---

## Component-versions.md refresh

**At Phase 7 close**, refresh [`docs/component-versions.md`](../docs/component-versions.md) with the new versions. Affected components:

| Component | Old | New |
|---|---|---|
| event-card-01 | 0.1.0 | 0.1.1 |
| registration-card-01 | 0.1.0 | 0.1.1 |
| engagement-bar-01 | 0.1.1 | 0.1.2 |
| media-carousel-01 | 0.1.1 | 0.1.2 |
| page-hero-news-01 | 0.1.0 | 0.1.1 |
| progress-timeline-01 | 0.1.0 | 0.1.1 |
| detail-panel | 0.1.0 | 0.1.1 |
| story-viewer-01 | 0.1.0 | 0.1.1 |
| video-player-01 | 0.1.0 | 0.1.1 |
| grid-layout-news-01 | 0.1.0 | 0.1.1 |

Plus update each affected component's `meta.ts` `version` + `updatedAt`. Single bookkeeping commit at Phase 7 end.

---

## Phase 7 commit plan

10 logical groups + version bump + close commit = ~12 commits. Group sizes vary; all should be small, focused, and individually reviewable.

| # | Commit message | Group | Effort |
|---|---|---|---|
| 1 | `fix(event-card-01,registration-card-01): F-01 pluralization via Intl.PluralRules` | A | ~40 min |
| 2 | `chore(engagement-bar-01): rename utils/ → lib/ folder per sealed-folder convention` | B | ~15 min |
| 3 | `fix(media-carousel-01): F-01+F-02 enable Embla keyboard plugin + inert on inactive slides` | C | ~30 min |
| 4 | `fix(page-hero-news-01): F-01 text-white → text-primary-foreground per design mandate` | D | ~10 min |
| 5 | `fix(progress-timeline-01): F-01 add status-conditional bar/marker colors` | E | ~30 min |
| 6 | `fix(detail-panel): F-02 add labels.region default for role=region accessible name` | F | ~15 min |
| 7 | `fix: Date.now → performance.now batch (story-viewer-01 + video-player-01 + ...)` | G | ~15 min |
| 8 | `fix(grid-layout-news-01): F-01 implement useMagazineFilter auto-reset on dataset change` | H | ~15 min |
| 9 | `docs: F-cross-11 — document cross-folder import constraint in component-guide` | I | ~30 min |
| 10 | `docs: Phase 7 doc-only Lows bundle (10 small fixes across sessions 8-12 reviews)` | J | ~30 min |
| 11 | `chore(versions): bump 10 components to v0.1.x; refresh component-versions.md` | — | ~15 min |
| 12 | `review(sweep): close Phase 7 — 14 Mediums shipped + F-cross-11 doc-mitigated` | sign-off | ~20 min |

### Push at Phase 7 close

Single push at end → Vercel auto-runs `pnpm vercel-build` → registry artifacts regenerate → `pnpm validate:meta-deps` runs as deploy-time guard.

---

## Risks

1. **Color picks for progress-timeline (Group E) require design-system owner sign-off.** If unavailable, pre-pick `bg-muted-foreground/30` (before) + `bg-primary` (active) + `bg-secondary` (after) and mark for review.

2. **Embla keyboard plugin may interact with Embla's other plugins.** None used currently in media-carousel; verify on smoke.

3. **`Intl.PluralRules` browser support** — IE11 doesn't support, but the project targets modern browsers (React 19 + Tailwind v4). Acceptable.

4. **Group I doc-only F-cross-11 mitigation** — does not "fix" the brittleness, only documents the constraint. The brittleness remains until consumer-tsc smoke harness extension lands. Document this transition in the Phase 7 close commit.

5. **Total wall-clock estimate (~5-6h)** assumes single uninterrupted session. Realistic with breaks: ~7-8h elapsed. Split across 2 sessions if needed.

---

## After Phase 7

- Review sweep + Phase 7 are done. Project enters clean v0.1.x state.
- F-cross-04, F-cross-12, force-graph v3 still open as separate plans.
- New component work from STATUS.md Roadmap unlocks.
- Suggested next: stat-card / empty-state / multi-select / page-header / etc. (per [STATUS.md](.claude/STATUS.md) Roadmap section).

---

*Phase 7 plan authored at session 13 sweep close. Awaiting execution.*
