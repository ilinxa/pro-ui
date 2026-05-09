# ilinxa-ui-pro — Status

> **Current snapshot.** This file is the *now*, not a changelog.
>
> **History:**
> - Per-decision log going forward: [`.claude/decisions/`](decisions/) (one file per decision; YAML frontmatter + summary)
> - Pre-2026-05-09 bulk archive: [`.claude/STATUS-archive.md`](STATUS-archive.md) (frozen; do not extend)
>
> **Last updated:** 2026-05-09 (session 14 — **PHASE 7 COMPLETE + post-Phase-7 cleanup pass**: 14 Mediums + paired Lows across 10 groups + audit follow-up (progress-timeline marker + page-hero text-accent over lime) + reserved-meta-field cleanup + F-cross-04 closed via self-hosted fonts; **11 of 12 F-cross now closed**, only F-cross-12 remains)

---

## Components

36 components across 6 categories. Source of truth for per-component description / API / status: each component's `meta.ts` and procomp docs (`docs/procomps/<slug>-procomp/`). For the version snapshot: [`docs/component-versions.md`](../docs/component-versions.md). For per-component review state (Tier 1 reviewed / Tier 2 pending) + per-finding history: [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md).

| Slug | Category | Status | Version |
|------|----------|--------|---------|
| `data-table` | data | alpha | 0.1.1 |
| `rich-card` | data | **beta** | 0.4.1 |
| `kanban-board-01` | data | alpha | 0.2.1 |
| `flow-canvas-01` | data | alpha | 0.1.1 |
| `article-body-01` | data | alpha | 0.2.0 |
| `engagement-bar-01` | data | alpha | 0.1.2 |
| `post-card-01` | data | alpha | 0.1.1 |
| `comment-thread-01` | data | alpha | 0.1.0 |
| `article-meta-01` | data | alpha | 0.1.0 |
| `content-card-news-01` | data | alpha | 0.1.0 |
| `event-card-01` | data | alpha | 0.1.1 |
| `expandable-text-01` | data | alpha | 0.1.0 |
| `info-list-01` | data | alpha | 0.1.0 |
| `people-grid-01` | data | alpha | 0.1.0 |
| `progress-timeline-01` | data | alpha | 0.1.2 |
| `project-card-01` | data | alpha | 0.1.0 |
| `registration-card-01` | data | alpha | 0.1.1 |
| `schedule-list-01` | data | alpha | 0.1.0 |
| `story-rail-01` | data | alpha | 0.1.0 |
| `thumb-list-01` | data | alpha | 0.1.0 |
| `workspace` | layout | alpha | 0.1.1 |
| `grid-layout-news-01` | layout | alpha | 0.1.1 |
| `markdown-editor` | forms | alpha | 0.1.1 |
| `properties-form` | forms | alpha | 0.1.1 |
| `entity-picker` | forms | alpha | 0.1.1 |
| `category-cloud-01` | forms | alpha | 0.1.0 |
| `filter-bar-01` | forms | alpha | 0.1.0 |
| `filter-stack` | forms | alpha | 0.1.0 |
| `author-card-01` | marketing | alpha | 0.1.0 |
| `newsletter-card-01` | marketing | alpha | 0.1.0 |
| `page-hero-news-01` | marketing | alpha | 0.1.2 |
| `share-bar-01` | marketing | alpha | 0.1.0 |
| `media-carousel-01` | media | alpha | 0.1.2 |
| `story-viewer-01` | media | alpha | 0.1.1 |
| `video-player-01` | media | alpha | 0.1.1 |
| `detail-panel` | feedback | alpha | 0.1.1 |

> `force-graph` removed 2026-05-08 pending recreation; v0.2 source + procomp docs archived to [`docs/migrations/force-graph/`](../docs/migrations/force-graph/). v3 design + slug TBD.

---

## Roadmap

Next candidates, ordered by team utility:

1. `data/stat-card` — value + label + delta + sparkline. Universal in dashboards.
2. `feedback/empty-state` — icon + title + body + primary action.
3. `forms/multi-select` — combobox with tag chips (shadcn has Command, no real multi-select).
4. `layout/page-header` — title + breadcrumbs + actions slot.
5. `feedback/notification-feed` — grouped, time-bucketed, read/unread.
6. `navigation/command-palette` — cmd+k, grouped results.
7. `media/dropzone` — drag-drop + progress + previews.

**Active sweep work** — in-progress at `docs/reviews/sweep-tracker.md`. Tier 1 (9 components) reviewed at v0.1 across sessions 1-6; mid-sweep checkpoint Phases 1-6 closed in sessions 7-7d (this commit); Tier 2 (27 components) reviews scheduled across sessions 8-12; sweep close + rollup at session 13.

---

## Open decisions / TODOs

**Active — needs decision or work**

- **F-cross-12 (v0.2 candidate):** Positional-callback signatures across 5 components / 6 occurrences (kanban-board-01, grid-layout-news-01, content-card-news-01, project-card-01, story-rail-01). Breaking change; out of v0.1.x (non-breaking) scope. Library-wide v0.2 migration to object-shape callbacks with deprecation warnings emitted in v0.1.x as transition.
- **F-cross-11 follow-up (paths b/c, v0.2):** Phase 7 closed F-cross-11 via doc-path mitigation only. Path (b) — extend smoke harness with consumer-side `pnpm tsc --noEmit` after install — catches the brittleness at producer-commit time via real type-checking. Path (c) — realign cross-folder import paths to consumer-side style — is more invasive but most robust. Both deferred as v0.2 follow-ups; (b) recommended first.

**Informed defers — explicit trigger to revisit**

- **MDX for usage docs:** currently `usage.tsx`. **Trigger:** ~5 components reach prose-heavy guidance, OR a consumer needs MDX-specific features (codeblocks-with-render, embeds).
- **NPM publish artifacts:** no `tsup`/`rollup`, no `package.json` exports map. Distribution via shadcn-registry handles the team-internal use case. **Trigger:** external consumer onboards, OR shadcn-registry's update-friction (re-running `pnpm dlx shadcn add`) surfaces real pain. Heavyweights (rich-card 51 files, markdown-editor 28 files + 10 codemirror peer deps) are the most likely first trigger.
- **Test runner not wired.** `pnpm tsc --noEmit && pnpm lint` cover correctness today; demo-driven manual verification is the interactivity story. **Trigger:** first non-trivial bug in pure-function modules (workspace + rich-card + properties-form `lib/` directories). First test should be rich-card's `parse → serialize → parse` fixed-point round-trip property test.
- ~~**F-cross-04 (environmental)**~~ **✅ CLOSED 2026-05-09** — replaced `next/font/google` with `@fontsource-variable/*` self-hosted packages; `pnpm build` no longer requires network access. See [`.claude/decisions/2026-05-09-fcross04-self-host-fonts.md`](decisions/2026-05-09-fcross04-self-host-fonts.md).

For closed entries (Phase 0 risk spike, chart palette, site nav, alpha/beta variants, footer version, public registry build, reserved meta fields, lime contrast pattern, F-cross-01 / F-cross-11, etc.), see the per-decision files in `.claude/decisions/` plus `STATUS-archive.md` (pre-2026-05-09 entries).

---

## Recent activity

The 5 most-recent decision files, most-recent first. Full list at [`.claude/decisions/`](decisions/).

- [2026-05-09 — F-cross-04 CLOSED: self-host fonts via @fontsource-variable](decisions/2026-05-09-fcross04-self-host-fonts.md) (replaced `next/font/google` with `@fontsource-variable/{onest,jetbrains-mono,playfair-display}`; `pnpm build` now succeeds without network fetch; 11/12 F-cross closed; only F-cross-12 (positional callbacks → v0.2) remains)
- [2026-05-09 — session 14 follow-up: smaller-opens cleanup](decisions/2026-05-09-session-14-smaller-opens-cleanup.md) (removed 4 unused type members — `ComponentMeta.subcategory` / `thumbnail` / `RegistryEntry.examples` / `ComponentExample`; restructured STATUS Open decisions into Active vs Informed-defers with explicit triggers; tsc/lint/validate-meta-deps clean)
- [2026-05-09 — session 14 PHASE 7 COMPLETE: 14 Mediums + paired Lows shipped across 10 groups](decisions/2026-05-09-session-14-phase-7.md) (10 components bumped — engagement-bar-01 + media-carousel-01 to v0.1.2; 8 others to v0.1.1; F-cross-11 closed via doc-path; 10/12 F-cross now closed; F-cross-04 + F-cross-12 still open)
- [2026-05-09 — session 13 SWEEP CLOSE: rollup + Phase 7 plan + F-cross-11/12 escalations](decisions/2026-05-09-session-13-sweep-close.md) (sweep complete 36/36; rollup at `docs/reviews/2026-05-09-sweep-rollup.md`; Phase 7 plan at `.claude/PHASE-7-PLAN.md`; 14 Mediums bundled into 10 groups; 9/12 F-cross closed; F-cross-11 Phase 7 / F-cross-12 v0.2 / F-cross-04 deferred)
- [2026-05-09 — session 12 Tier 2 batch 5 (FINAL): 5 spot-checks + detail-panel guide](decisions/2026-05-09-session-12-tier2-batch-5.md) (detail-panel/story-rail-01/registration-card-01/schedule-list-01/thumb-list-01 — all Pass with follow-ups; 2 🔸 Medium; Tier 2 COMPLETE 27/27; F-cross-01 fully CLOSED)
- [2026-05-09 — session 11 Tier 2 batch 4: 6 spot-checks data part 2](decisions/2026-05-09-session-11-tier2-batch-4.md) (event-card-01/project-card-01/people-grid-01/info-list-01/progress-timeline-01/expandable-text-01 — all Pass with follow-ups; 3 🔸 Medium; expandable-text-01 F-01 confirms post-card-01 F-01 as library-wide pattern)

For every prior session / decision before 2026-05-08: see [`STATUS-archive.md`](STATUS-archive.md).

---

## How to update this file

`STATUS.md` is the slim snapshot. Don't extend it with verbose entries.

| When something happens | Where it goes |
|---|---|
| Component ships / version bumps / status changes | Update the Components table row above + author a `.claude/decisions/<date>-<slug>.md` |
| Sweep phase closes / cross-cutting finding closes | Author a decision file; update sweep-tracker; add a "Recent activity" pointer above |
| New TODO / Open decision lands | Add a bullet in "Open decisions / TODOs" |
| Something old gets closed | Either move the bullet to the archive OR strike it inline if recent + relevant |

The "Recent activity" pointer list above stays at ~5 entries (most recent first). Older entries are still in `.claude/decisions/` — not removed; just not surfaced in this index.
