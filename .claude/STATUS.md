# ilinxa-ui-pro — Status

> **Current snapshot.** This file is the *now*, not a changelog.
>
> **History:**
> - Per-decision log going forward: [`.claude/decisions/`](decisions/) (one file per decision; YAML frontmatter + summary)
> - Pre-2026-05-09 bulk archive: [`.claude/STATUS-archive.md`](STATUS-archive.md) (frozen; do not extend)
>
> **Last updated:** 2026-05-09 (Phase 6 sign-off — F-cross-02 closed; STATUS.md split per option b3 hybrid)

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
| `engagement-bar-01` | data | alpha | 0.1.1 |
| `post-card-01` | data | alpha | 0.1.1 |
| `comment-thread-01` | data | alpha | 0.1.0 |
| `article-meta-01` | data | alpha | 0.1.0 |
| `content-card-news-01` | data | alpha | 0.1.0 |
| `event-card-01` | data | alpha | 0.1.0 |
| `expandable-text-01` | data | alpha | 0.1.0 |
| `info-list-01` | data | alpha | 0.1.0 |
| `people-grid-01` | data | alpha | 0.1.0 |
| `progress-timeline-01` | data | alpha | 0.1.0 |
| `project-card-01` | data | alpha | 0.1.0 |
| `registration-card-01` | data | alpha | 0.1.0 |
| `schedule-list-01` | data | alpha | 0.1.0 |
| `story-rail-01` | data | alpha | 0.1.0 |
| `thumb-list-01` | data | alpha | 0.1.0 |
| `workspace` | layout | alpha | 0.1.1 |
| `grid-layout-news-01` | layout | alpha | 0.1.0 |
| `markdown-editor` | forms | alpha | 0.1.1 |
| `properties-form` | forms | alpha | 0.1.1 |
| `entity-picker` | forms | alpha | 0.1.1 |
| `category-cloud-01` | forms | alpha | 0.1.0 |
| `filter-bar-01` | forms | alpha | 0.1.0 |
| `filter-stack` | forms | alpha | 0.1.0 |
| `author-card-01` | marketing | alpha | 0.1.0 |
| `newsletter-card-01` | marketing | alpha | 0.1.0 |
| `page-hero-news-01` | marketing | alpha | 0.1.0 |
| `share-bar-01` | marketing | alpha | 0.1.0 |
| `media-carousel-01` | media | alpha | 0.1.1 |
| `story-viewer-01` | media | alpha | 0.1.0 |
| `video-player-01` | media | alpha | 0.1.0 |
| `detail-panel` | feedback | alpha | 0.1.0 |

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

- **Reserved-but-unrendered meta fields:** `RegistryEntry.examples`, `ComponentMeta.thumbnail`, `ComponentMeta.subcategory` exist on the types but render nowhere yet. Decide whether to wire any (each adds detail-page surface) or remove them. (`ComponentMeta.related` IS now used — sweep-tracker links siblings via this field.)
- **Lime contrast pattern is dark-on-lime.** Both modes use near-black `--primary-foreground`. Don't switch to white — contrast fails. If a use case really wants white text on a green action, use a darker green (e.g. `oklch(0.45 0.18 142)` forest) and pair white text — but that becomes a separate token, not `--primary`.
- **MDX for usage docs:** currently `usage.tsx`. Consider migrating to `usage.mdx` once we cross ~5 components with prose-heavy guidance.
- **NPM publish artifacts:** no `tsup`/`rollup`, no `package.json` exports map. Distribution shipped via shadcn-registry instead (lower friction for the team-internal use case). NPM may still be worth doing for the heavyweights (rich-card 51 files, markdown-editor 28 files + 10 codemirror peer deps) — defer until an external consumer or a real updates-friction pain point shows up.
- **Test runner not wired.** `pnpm tsc --noEmit && pnpm lint` cover correctness; demo-driven manual verification is the project's interactivity story today. The pure modules in workspace + rich-card + properties-form `lib/` directories are written to be testable in isolation when Vitest lands. First test landing should be a round-trip property test for rich-card's parse→serialize→parse fixed-point.
- **F-cross-04 (open):** `pnpm build` fails on `next/font/google` Playfair Display fetch in offline/sandboxed envs. Workaround: `pnpm tsc --noEmit && pnpm lint && pnpm registry:build` cover correctness without the font fetch. Defer fix to a separate plan.
- **F-cross-01 (Tier 2 carriers — open):** `detail-panel` (session 12) and `filter-stack` (session 8) are missing `guide.md`. Per master plan, those guides are authored alongside their Tier 2 reviews — not as standalone Phase 4 work.

For the historical "Open decisions / TODOs" entries that are now closed (Phase 0 risk spike, chart palette, site nav, alpha/beta variants, footer version, public registry build, etc.), see the snapshot in `STATUS-archive.md`.

---

## Recent activity

The 5 most-recent decision files, most-recent first. Full list at [`.claude/decisions/`](decisions/).

- [2026-05-09 — session 7d Phase 6: F-cross-02 closed via b3 hybrid](decisions/2026-05-09-session-7d-phase-6.md) (STATUS.md split + decisions/ convention established)
- [2026-05-09 — session 7c Phase 4: 6 missing procomp docs authored](decisions/2026-05-09-session-7c-phase-4.md) (closes F-cross-01 Tier 1)
- [2026-05-09 — session 7b Phase 5: 8 Tier 1 v0.1.1 patches](decisions/2026-05-09-session-7b-phase-5.md) (workspace adaptive-flatten + rich-card v0.4.1 + kanban F-01 amber + plan-doc nits)
- [2026-05-09 — session 7b Phase 3: F-cross-07 + F-cross-10 closure](decisions/2026-05-09-session-7b-phase-3.md) (validate-meta-deps lint + smoke-verify F-cross-03/05 + harness baseline)
- [2026-05-08 — session 7 Phases 1+2: 5 cross-cutting findings closed](decisions/2026-05-08-session-7-phases-1-2.md) (F-cross-09 CLI regression + 4 sweep-wide fixes)

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
