# ilinxa-ui-pro — Status

> **Current snapshot.** This file is the *now*, not a changelog.
>
> **History:**
> - Per-decision log going forward: [`.claude/decisions/`](decisions/) (one file per decision; YAML frontmatter + summary)
> - Pre-2026-05-09 bulk archive: [`.claude/STATUS-archive.md`](STATUS-archive.md) (frozen; do not extend)
>
> **Last updated:** 2026-05-10 (**pdf-viewer v0.1.3 + video-player-01 v0.1.2** patch-bumped — runtime regression fixes, no API change. **pdf-viewer v0.1.3:** rendered `<Page>` outside `<Document>` with only the `pdf` prop, which works for the page itself but trips an invariant inside react-pdf's `AnnotationLayer` (it reads `pdf` exclusively from `useDocumentContext()` in v10). Wrapped the page list in `<Document className="contents">` so DocumentContext propagates, removed the now-redundant hidden loader. **video-player-01 v0.1.2:** Pexels' video CDN now blocks anonymous hotlinks (returns 403). Swapped all 6 sample URLs in `dummy-data.ts` for stable hotlink-friendly equivalents (test-videos.co.uk for BBB / Sintel / Jellyfish, MDN cc0-videos for flower / friday, placeholders.dev for the poster). All 6 verified HTTP 206 with range support. **38 components total.** Patch bumps don't trigger GATE 3. F-01 (worker CDN default, v0.2.0) + F-02 (actions identity) + F-03 (print busy UX) remain open on pdf-viewer.)

---

## Components

38 components across 6 categories. Source of truth for per-component description / API / status: each component's `meta.ts` and procomp docs (`docs/procomps/<slug>-procomp/`). For the version snapshot: [`docs/component-versions.md`](../docs/component-versions.md). For per-component review state (Tier 1 reviewed / Tier 2 pending) + per-finding history: [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md).

| Slug | Category | Status | Version |
|------|----------|--------|---------|
| `data-table` | data | alpha | 0.1.1 |
| `rich-card` | data | **beta** | 0.4.1 |
| `kanban-board-01` | data | alpha | 0.3.0 |
| `flow-canvas-01` | data | alpha | 0.1.1 |
| `article-body-01` | data | alpha | 0.2.0 |
| `engagement-bar-01` | data | alpha | 0.1.2 |
| `post-card-01` | data | alpha | 0.1.1 |
| `comment-thread-01` | data | alpha | 0.1.0 |
| `article-meta-01` | data | alpha | 0.1.0 |
| `content-card-news-01` | data | alpha | 0.2.0 |
| `event-card-01` | data | alpha | 0.1.1 |
| `expandable-text-01` | data | alpha | 0.1.0 |
| `info-list-01` | data | alpha | 0.1.0 |
| `people-grid-01` | data | alpha | 0.1.0 |
| `progress-timeline-01` | data | alpha | 0.1.2 |
| `project-card-01` | data | alpha | 0.2.0 |
| `registration-card-01` | data | alpha | 0.1.1 |
| `schedule-list-01` | data | alpha | 0.1.0 |
| `story-rail-01` | data | alpha | 0.2.0 |
| `thumb-list-01` | data | alpha | 0.1.0 |
| `stat-card` | data | alpha | 0.1.1 |
| `workspace` | layout | alpha | 0.1.1 |
| `grid-layout-news-01` | layout | alpha | 0.2.0 |
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
| `video-player-01` | media | alpha | 0.1.2 |
| `pdf-viewer` | media | alpha | 0.1.3 |
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

- **pdf-viewer worker default (F-01, v0.2.0):** Plan locked bundled-`?url` worker import for offline-friendliness. Turbopack rejected `new URL("bare-specifier", import.meta.url)` at build, so v0.1.0 ships with unpkg-CDN default + `workerSrc` prop override + `postinstall` recipe in guide. Bump-target v0.2.0: replace CDN default with bundled-or-postinstall path. Decision file at [`.claude/decisions/2026-05-10-pdf-viewer-v01-pipeline.md`](decisions/2026-05-10-pdf-viewer-v01-pipeline.md).
- **F-cross-12 (v0.2 candidate):** Positional-callback signatures across 5 components / 6 occurrences (kanban-board-01, grid-layout-news-01, content-card-news-01, project-card-01, story-rail-01). Breaking change; out of v0.1.x (non-breaking) scope. Library-wide v0.2 migration to object-shape callbacks with deprecation warnings emitted in v0.1.x as transition.
- ~~**F-cross-11 follow-up paths (b)/(c)**~~ **✅ Path (b) CLOSED 2026-05-09** — smoke harness extended with consumer-side `pnpm tsc --noEmit` post-install; first run surfaced + fixed a real bug (37 `index.ts` files re-exporting docs-site-only `meta`). Path (c) — tsconfig path realignment — remains deferred; with (b) actively guarding, (c)'s additional safety value is marginal. See [`.claude/decisions/2026-05-09-fcross11-path-b-smoke-tsc.md`](decisions/2026-05-09-fcross11-path-b-smoke-tsc.md).

**Informed defers — explicit trigger to revisit**

- **MDX for usage docs:** currently `usage.tsx`. **Trigger:** ~5 components reach prose-heavy guidance, OR a consumer needs MDX-specific features (codeblocks-with-render, embeds).
- **NPM publish artifacts:** no `tsup`/`rollup`, no `package.json` exports map. Distribution via shadcn-registry handles the team-internal use case. **Trigger:** external consumer onboards, OR shadcn-registry's update-friction (re-running `pnpm dlx shadcn add`) surfaces real pain. Heavyweights (rich-card 51 files, markdown-editor 28 files + 10 codemirror peer deps) are the most likely first trigger.
- **Test runner not wired.** `pnpm tsc --noEmit && pnpm lint` cover correctness today; demo-driven manual verification is the interactivity story. **Trigger:** first non-trivial bug in pure-function modules (workspace + rich-card + properties-form `lib/` directories). First test should be rich-card's `parse → serialize → parse` fixed-point round-trip property test.
- ~~**F-cross-04 (environmental)**~~ **✅ CLOSED 2026-05-09** — replaced `next/font/google` with `@fontsource-variable/*` self-hosted packages; `pnpm build` no longer requires network access. See [`.claude/decisions/2026-05-09-fcross04-self-host-fonts.md`](decisions/2026-05-09-fcross04-self-host-fonts.md).
- ~~**F-cross-12 (v0.2 callback migration)**~~ **✅ FULLY CLOSED 2026-05-09** — v0.2 cutover landed: all 6 positional callbacks removed, `<oldName>Args` renamed to canonical `<oldName>` (now object-shape). Components bumped: `grid-layout-news-01` 0.2.0, `content-card-news-01` 0.2.0, `project-card-01` 0.2.0, `story-rail-01` 0.2.0, `kanban-board-01` 0.3.0. v0.1.x transition (Args sibling props with deprecation warnings) was the bridge; now removed. See [`.claude/decisions/2026-05-09-fcross12-callback-migration-transition.md`](decisions/2026-05-09-fcross12-callback-migration-transition.md) + [`.claude/decisions/2026-05-09-fcross12-v02-cutover.md`](decisions/2026-05-09-fcross12-v02-cutover.md).

For closed entries (Phase 0 risk spike, chart palette, site nav, alpha/beta variants, footer version, public registry build, reserved meta fields, lime contrast pattern, F-cross-01 / F-cross-11, etc.), see the per-decision files in `.claude/decisions/` plus `STATUS-archive.md` (pre-2026-05-09 entries).

---

## Recent activity

The 5 most-recent decision files, most-recent first. Full list at [`.claude/decisions/`](decisions/).

- [2026-05-10 — pdf-viewer v0.1.3 + video-player-01 v0.1.2 runtime fixes](decisions/2026-05-10-pdf-viewer-v013-video-player-v012-runtime-fixes.md) (two patch-bumps, no API change; pdf-viewer: `<Page>` rendered outside `<Document>` tripped AnnotationLayer's pdf-from-context invariant — fixed by wrapping page list in `<Document className="contents">`; video-player-01: Pexels CDN now 403s anonymous hotlinks — swapped all 6 fixture URLs to test-videos.co.uk + MDN cc0-videos + placeholders.dev, all curl-verified)
- [2026-05-10 — pdf-viewer v0.1.0 first ship (second component under the readiness-review rule)](decisions/2026-05-10-pdf-viewer-v01-pipeline.md) (GATE 1 + GATE 2 + GATE 3 all passed; 28-file sealed folder; react-pdf@^10.4.1 substrate; toolbar + zoom + drag-drop + selection + right-click + password + print + virtualization; verdict `Pass with follow-ups` (4 findings); F-01 worker-default-on-CDN drift documented for v0.2.0)
- [2026-05-09 — stat-card v0.1.0 → v0.1.1 pipeline (first component under the readiness-review rule)](decisions/2026-05-09-stat-card-v01-pipeline.md) (GATE 1 + GATE 2 + GATE 3 all passed; smoke verified post-Vercel-deploy; v0.1.1 same-day patch closed 3 of 4 follow-ups; F-04 (`--success` token) deferred to v0.2; sibling `<StatCardSparkline>` standalone export; object-shape callbacks; Intl percent delta formatter)
- [2026-05-09 — Component-readiness-review rule established (GATE 3)](decisions/2026-05-09-component-readiness-review-rule.md) (every new component must pass a structured spot-check review before push; `.claude/rules/component-readiness-review.md` codifies it; CLAUDE.md + component-guide §13 + procomps/README + spotcheck/checklist templates all updated; existing components grandfathered)
- [2026-05-09 — F-cross-11 path (b) CLOSED: smoke harness gains consumer-side tsc](decisions/2026-05-09-fcross11-path-b-smoke-tsc.md) (smoke-all.mjs runs `pnpm tsc --noEmit` after install loop; first run caught 37 broken `index.ts` re-exports of docs-site-only `meta` — fixed in producer commit `c4662bb`; path (c) deferred since (b) is actively guarding)
- [2026-05-09 — F-cross-12 v0.2 cutover (post v0.1.x transition)](decisions/2026-05-09-fcross12-v02-cutover.md) (positional callbacks across 5 components removed; canonical names now object-shape; grid-layout-news / content-card-news / project-card / story-rail to 0.2.0; kanban-board to 0.3.0; **all 12 F-cross findings now closed**)

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
