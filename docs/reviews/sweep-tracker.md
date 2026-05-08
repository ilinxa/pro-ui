# Procomp review sweep — tracker

> **Single source of truth** for the multi-session review sweep across all 37 procomponents. Updated as part of every session's sign-off step.

- **Snapshot start:** 2026-05-08
- **Anchored to:** `docs/component-versions.md` (versions frozen at sweep start)
- **Plan:** `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md`
- **System docs:** `docs/reviews/` (README, process, guide, templates)

## Status legend

| Mark | Meaning |
|---|---|
| ⚪ | Pending |
| 🟡 | In progress |
| 🟢 | Reviewed — verdict recorded |
| 🔴 | Blocked — review verdict was Block / Needs revision |
| ⏭️ | Deferred — out of scope for this sweep |

## Verdict legend

`Pass` · `Pass with follow-ups` · `Needs revision` · `Block`

---

## Tier 1 — Full 14-dimension review (9 components, was 10)

> `force-graph` removed 2026-05-08 (archived to [`docs/migrations/force-graph/`](../migrations/force-graph/)) pending recreation under new design + plan. Session 3 becomes solo `flow-canvas-01` instead of paired.

| # | Slug | Version | Status | Verdict | Review file | Smoke | Reviewed | Notes |
|---|------|---------|--------|---------|-------------|-------|----------|-------|
| 1 | `kanban-board-01` | 0.2.0 | 🟢 | Pass with follow-ups | [reviews/2026-05-08-v0.2.0-review.md](../procomps/kanban-board-01-procomp/reviews/2026-05-08-v0.2.0-review.md) | ✓ pass (11.7s) | 2026-05-08 | **Session 1 pilot.** 6 findings (2 High, 4 Medium); v0.2.1 patch recommended. |
| 2 | `rich-card` | 0.4.0 | 🟢 | Pass with follow-ups | [reviews/2026-05-08-v0.4.0-review.md](../procomps/rich-card-procomp/reviews/2026-05-08-v0.4.0-review.md) | ✓ pass (12.3s) | 2026-05-08 | **Session 2.** 7 findings (2 High [F-01 virtualization not wired, F-02 dep version drift], 4 Medium, 1 Low); v0.4.1 patch recommended. Beta status appropriate. |
| 3 | `flow-canvas-01` | 0.1.0 | ⚪ | — | — | — | — | Carries the registry-omission Blocker (F-cross-03). Session 3 — now solo. |
| 4 | `article-body-01` | 0.2.0 | ⚪ | — | — | — | — | Major-feature bump v0.1 → v0.2. Session 4. |
| 5 | `data-table` | 0.1.0 | ⚪ | — | — | — | — | Canonical sealed-folder reference. Session 4. |
| 6 | `workspace` | 0.1.0 | ⚪ | — | — | — | — | Renderer-registry pattern reference. Session 5. |
| 7 | `markdown-editor` | 0.1.0 | ⚪ | — | — | — | — | Composite editor; missing `guide.md`. Session 5. |
| 8 | `properties-form` | 0.1.0 | ⚪ | — | — | — | — | Form-engine; missing `guide.md`. Session 6. |
| 9 | `entity-picker` | 0.1.0 | ⚪ | — | — | — | — | Async + selection; missing `guide.md`. Session 6. |
| ⏭️ | ~~`force-graph`~~ | ~~0.2.0~~ | ⏭️ Removed | — | — | — | 2026-05-08 | **Removed pending recreation.** Source + procomp docs archived to [`docs/migrations/force-graph/`](../migrations/force-graph/). v3 design + slug TBD. |

## Tier 2 — Spot-check + CLI smoke (27 components)

### data (16)

| # | Slug | Version | Status | Verdict | Review file | Smoke | Reviewed | Notes |
|---|------|---------|--------|---------|-------------|-------|----------|-------|
| 11 | `engagement-bar-01` | 0.1.1 | ⚪ | — | — | — | — | Session 10 |
| 12 | `media-carousel-01` | 0.1.1 | ⚪ | — | — | — | — | Session 10 |
| 13 | `post-card-01` | 0.1.1 | ⚪ | — | — | — | — | Session 10 |
| 14 | `article-meta-01` | 0.1.0 | ⚪ | — | — | — | — | Session 10 |
| 15 | `comment-thread-01` | 0.1.0 | ⚪ | — | — | — | — | Session 10 |
| 16 | `content-card-news-01` | 0.1.0 | ⚪ | — | — | — | — | Session 10 |
| 17 | `event-card-01` | 0.1.0 | ⚪ | — | — | — | — | Session 11 |
| 18 | `expandable-text-01` | 0.1.0 | ⚪ | — | — | — | — | Session 11 |
| 19 | `info-list-01` | 0.1.0 | ⚪ | — | — | — | — | Session 11 |
| 20 | `people-grid-01` | 0.1.0 | ⚪ | — | — | — | — | Session 11 |
| 21 | `progress-timeline-01` | 0.1.0 | ⚪ | — | — | — | — | Session 11 |
| 22 | `project-card-01` | 0.1.0 | ⚪ | — | — | — | — | Session 11 |
| 23 | `registration-card-01` | 0.1.0 | ⚪ | — | — | — | — | Session 12 |
| 24 | `schedule-list-01` | 0.1.0 | ⚪ | — | — | — | — | Session 12 |
| 25 | `story-rail-01` | 0.1.0 | ⚪ | — | — | — | — | Session 12 |
| 26 | `thumb-list-01` | 0.1.0 | ⚪ | — | — | — | — | Session 12 |

### forms (3)

| # | Slug | Version | Status | Verdict | Review file | Smoke | Reviewed | Notes |
|---|------|---------|--------|---------|-------------|-------|----------|-------|
| 27 | `category-cloud-01` | 0.1.0 | ⚪ | — | — | — | — | Session 8 |
| 28 | `filter-bar-01` | 0.1.0 | ⚪ | — | — | — | — | Session 8 |
| 29 | `filter-stack` | 0.1.0 | ⚪ | — | — | — | — | Session 8 — missing `guide.md` |

### layout (1)

| # | Slug | Version | Status | Verdict | Review file | Smoke | Reviewed | Notes |
|---|------|---------|--------|---------|-------------|-------|----------|-------|
| 30 | `grid-layout-news-01` | 0.1.0 | ⚪ | — | — | — | — | Session 8 |

### marketing (4)

| # | Slug | Version | Status | Verdict | Review file | Smoke | Reviewed | Notes |
|---|------|---------|--------|---------|-------------|-------|----------|-------|
| 31 | `author-card-01` | 0.1.0 | ⚪ | — | — | — | — | Session 8 |
| 32 | `newsletter-card-01` | 0.1.0 | ⚪ | — | — | — | — | Session 9 |
| 33 | `page-hero-news-01` | 0.1.0 | ⚪ | — | — | — | — | Session 9 |
| 34 | `share-bar-01` | 0.1.0 | ⚪ | — | — | — | — | Session 9 |

### media (2)

| # | Slug | Version | Status | Verdict | Review file | Smoke | Reviewed | Notes |
|---|------|---------|--------|---------|-------------|-------|----------|-------|
| 35 | `story-viewer-01` | 0.1.0 | ⚪ | — | — | — | — | Session 9 |
| 36 | `video-player-01` | 0.1.0 | ⚪ | — | — | — | — | Session 9 |

### feedback (1)

| # | Slug | Version | Status | Verdict | Review file | Smoke | Reviewed | Notes |
|---|------|---------|--------|---------|-------------|-------|----------|-------|
| 37 | `detail-panel` | 0.1.0 | ⚪ | — | — | — | — | Session 12 — missing `guide.md` |

---

## Smoke runs

| Date | Source | Pass | Expected-fail | Unexpected-fail | Report |
|------|--------|------|---------------|-----------------|--------|
| 2026-05-08 | prod (Vercel) | 31 | 1 (`flow-canvas-01`) | 4 (`comment-thread-01`, `post-card-01`, `media-carousel-01`, `story-viewer-01` — all F-cross-05; the 5th original `force-graph` since removed) | [results/2026-05-08-smoke.md](file:///e:/tmp/ilinxa-smoke-consumer/results/2026-05-08-smoke.md) |

---

## Cross-cutting findings

Findings that span multiple components or are bigger than any single review. Surface as discovered; resolve at rollup or via dedicated follow-up plan.

| ID | Severity | Description | Discovered | Status |
|----|----------|-------------|------------|--------|
| F-cross-01 | ⚠️ High | Six procomp folders missing `guide.md`: `detail-panel`, `entity-picker`, `filter-stack`, `force-graph`, `markdown-editor`, `properties-form`. Each component review will produce a Dimension 1 finding; the rollup batches these into a documentation backlog. | 2026-05-08 (pre-flight) | Open |
| F-cross-02 | 🔸 Medium | `.claude/STATUS.md` is ~88K tokens — exceeds single-Read limit (25K), forces offset/limit/grep workflow. Has stopped being a current snapshot and started being an append-only log. Recommendation: split per `STATUS-archive.md` for >30-day decisions. | 2026-05-08 (pre-flight) | Open |
| F-cross-03 | 🚫 Blocker | **`flow-canvas-01` absent from `registry.json` + `public/r/`** despite being in `src/` and `manifest.ts`. `pnpm dlx shadcn add @ilinxa/flow-canvas-01` returns 404. Either ship to registry or formalize a `frozen-not-distributed` component-status convention. Central finding of `flow-canvas-01` Tier 1 review (session 3 — now solo since force-graph removed). **Originally scoped to 2 components** (force-graph also); narrowed to 1 after force-graph was removed pending recreation on 2026-05-08. | 2026-05-08 (pre-flight) | Open — narrowed in session 2 |
| F-cross-04 | 🔸 Medium | Producer `pnpm build` fails on `next/font/google` Playfair Display fetch (`src/app/layout.tsx`). Environmental — requires network access to Google Fonts. Affects every component review's Dimension-12 verification in offline/sandboxed environments. Workaround: `pnpm tsc --noEmit && pnpm lint && pnpm registry:build` cover correctness without the font fetch. | 2026-05-08 (session 1) | Open |
| F-cross-06 | 🔸 Medium | **Sweep-wide `usage.tsx` import-path drift.** Both kanban-board-01 and rich-card use the producer-side `@/registry/components/data/<slug>` import path in their `usage.tsx` basic-example code blocks instead of the consumer-side `@/components/<slug>` (or `@ilinxa/<slug>`) path. Surfaced in 2/2 reviews so far → strongly likely systemic across the remaining 35 components. Sweep-wide fix is more efficient than per-component. Recommendation: at session 7 mid-sweep checkpoint, run a single pass over all 37 components' `usage.tsx` files standardizing imports to consumer-side. | 2026-05-08 (session 2) | Open |
| F-cross-07 | ⚠️ High | **Cross-component dep version drift.** rich-card's `meta.ts.dependencies.npm` declares `@dnd-kit/sortable: ^11.x` (non-standard `^N.x` notation, wrong major version — v11 doesn't exist; producer's `package.json` has `^10.0.0`). kanban-board-01 declares `^10.0.0` correctly. A consumer installing both gets conflicting peer requirements. Library should enforce a project-level convention that inter-component dep pins match the producer's `package.json`. Consider a lint check / CI job. Same pattern likely exists for other shared deps (lucide-react, @tanstack/react-virtual). | 2026-05-08 (session 2) | Open |
| F-cross-05 | ⚠️ High | **Root cause identified in session 2:** four components (`comment-thread-01`, `post-card-01`, `media-carousel-01`, `story-viewer-01`) declare internal sibling component dependencies in `registry.json` as **bare slug names** (e.g. `"expandable-text-01"`, `"video-player-01"`) instead of namespaced `@ilinxa/<slug>` references. shadcn CLI v latest interprets bare names as built-in shadcn primitives and tries to fetch them from `https://ui.shadcn.com/r/styles/base-nova/<slug>.json`, which 404s. Reproduction: `pnpm dlx shadcn@latest add @ilinxa/comment-thread-01` → "The item at https://ui.shadcn.com/r/styles/base-nova/expandable-text-01.json was not found." Originally observed as 5 unexpected-fails in session 1's smoke — the 5th was `force-graph` (different root cause: not in registry; component since removed 2026-05-08). **Fix:** in `registry.json`, change every bare internal-sibling reference in `registryDependencies` to `@ilinxa/<slug>`. Mechanical edit, can be batched. Affected items confirmed: `comment-thread-01` (refs expandable-text-01, engagement-bar-01), `post-card-01` (refs expandable-text-01, video-player-01, media-carousel-01, engagement-bar-01, comment-thread-01), `media-carousel-01` (refs video-player-01), `story-viewer-01` (refs video-player-01). After fix, re-run `pnpm registry:build && pnpm vercel-build`, redeploy, re-smoke. | 2026-05-08 (session 1 smoke) | **Open with concrete fix** |

---

## Session log

One row per session. Updated at sign-off of each session.

| Session | Date | Components reviewed | Tracker delta | Smoke run | Notes |
|---------|------|---------------------|---------------|-----------|-------|
| 1 (pilot) | 2026-05-08 | `kanban-board-01` v0.2 → Pass with follow-ups (6 findings) | infra: sweep-tracker, spot-check template, harness scaffolded at `e:/tmp/ilinxa-smoke-consumer/`, full 37-slug smoke run executed | ✓ first run on file (31/37 pass + 1 expected-fail + 5 unexpected-fail) | Pilot validated templates; surfaced F-cross-04 (build env) and F-cross-05 (5-slug install fails). Templates work end-to-end. |
| 2 | 2026-05-08 | `rich-card` v0.4 → Pass with follow-ups (7 findings) | F-cross-05 root cause identified (4-of-5 = bare-name sibling deps; force-graph = same as flow-canvas-01 / not in registry → expanded F-cross-03); F-cross-06 (sweep-wide usage import-paths) + F-cross-07 (cross-component dep version drift) added | re-used session 1 smoke (rich-card row: pass 12.3s) | Pre-beta-gate review surfaced virtualization-not-wired finding (F-01); two cross-cutting issues escalated for sweep-wide fix. |

---

## Done-criteria checkpoints

- [ ] **Session 1 close:** kanban review pair exists; harness scaffolded; tracker has all 37 rows + first session entry; smoke harness runs successfully with documented output.
- [ ] **Session 7 (mid-sweep):** all 9 Tier 1 review files exist; tracker shows 9 🟢 / 27 ⚪; second smoke run captured.
- [ ] **Session 13 (sweep close):** all 36 🟢; rollup at `docs/reviews/<DATE>-sweep-rollup.md`; STATUS.md updated; cross-cutting findings closed.
