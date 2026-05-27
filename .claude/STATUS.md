# ilinxa-ui-pro — Status

> **Current snapshot — the *now*, not a changelog.** For per-decision context, browse [`.claude/decisions/`](decisions/) (one file per decision, YAML-frontmatter queryable). For full historical record pre-2026-05-09, see [`.claude/STATUS-archive.md`](STATUS-archive.md) (frozen).
>
> **Active handoff:** [`.claude/HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md) — fresh-session resume point. Past handoffs: [`HANDOFF-2026-05-25-workspace-v0.1.2-shipped-locally-phase-b-queued.md`](HANDOFF-2026-05-25-workspace-v0.1.2-shipped-locally-phase-b-queued.md) (frozen; workspace ship landed; superseded by tier system + cms-panel-01 work), [`HANDOFF-2026-05-09-session-pause.md`](HANDOFF-2026-05-09-session-pause.md) (frozen).
>
> **Last big snapshot trim:** 2026-05-25 (this trim, restoring the lean-snapshot convention; ~41K tokens → ~8K). Prior trim: 2026-05-09 (F-cross-02 split — Recent decisions log moved to per-decision files; pre-2026-05-09 bulk archive frozen).

---

## Library tiers

Four-tier model formalized 2026-05-25. Charter: [`docs/library-tiers-charter.md`](../docs/library-tiers-charter.md). Rule: [`.claude/rules/readiness-review.md`](rules/readiness-review.md).

| Tier | Shipped | Distribution | Folder |
|---|---|---|---|
| **pro-component** | 49 | runtime (`registry:component`) | `src/registry/components/` |
| **pro-section** | 0 (charter locked, tooling Phase B) | runtime default | `src/registry/sections/` *(Phase B)* |
| **pro-page** | 0 (charter locked, tooling Phase B) | scaffold-fork (`registry:block`) | `src/registry/pages/` *(Phase B)* |
| **pro-panel** | 0 (charter locked, tooling Phase B) | scaffold-fork meta-block | `src/registry/panels/` *(Phase B)* |

Phase A landed 2026-05-25 (charter + rule restructure + tier dir READMEs + STATUS block). Phase B (scaffolders + registry infra + per-tier categories + meta-deps lint extension) ships alongside the first pilot in each tier. Phase C is pilots in order: section → page → panel (no panel-first; composition risk compounds).

---

## Components

49 components across 8 categories. Source of truth for per-component description / API / status: each component's `meta.ts` and procomp docs (`docs/procomps/<slug>-procomp/`). For the version snapshot: [`docs/component-versions.md`](../docs/component-versions.md). For per-component review state + per-finding history: [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md).

| Slug | Category | Status | Version |
|------|----------|--------|---------|
| `data-table` | data | alpha | 0.1.1 |
| `rich-card` | data | **beta** | 0.4.2 |
| `kanban-board-01` | data | alpha | 0.3.0 |
| `flow-canvas-01` | data | alpha | 0.2.5 |
| `article-body-01` | data | alpha | 0.2.2 |
| `engagement-bar-01` | data | alpha | 0.2.0 |
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
| `rich-card-in-flow` | data | alpha | 0.2.0 |
| `todo-rich-card` | data | alpha | 0.1.1 |
| `todo-tree` | data | alpha | 0.1.3 |
| `workspace` | layout | alpha | 0.1.3 |
| `grid-layout-news-01` | layout | alpha | 0.2.0 |
| `markdown-editor` | forms | alpha | 0.1.1 |
| `properties-form` | forms | alpha | 0.1.1 |
| `json-form` | forms | alpha | 0.2.5 |
| `registration-form-01` | forms | alpha | 0.1.1 |
| `pricing-table-01` | marketing | alpha | 0.1.0 |
| `entity-picker` | forms | alpha | 0.1.1 |
| `category-cloud-01` | forms | alpha | 0.1.0 |
| `filter-bar-01` | forms | alpha | 0.1.0 |
| `filter-stack` | forms | alpha | 0.1.0 |
| `author-card-01` | marketing | alpha | 0.1.0 |
| `newsletter-card-01` | marketing | alpha | 0.1.0 |
| `page-hero-news-01` | marketing | alpha | 0.1.2 |
| `share-bar-01` | marketing | alpha | 0.1.0 |
| `media-carousel-01` | media | alpha | 0.1.2 |
| `story-viewer-01` | media | alpha | 0.1.2 |
| `video-player-01` | media | alpha | 0.1.2 |
| `pdf-viewer` | media | alpha | 0.1.3 |
| `file-tree` | navigation | alpha | 0.1.0 |
| `file-manager` | navigation | alpha | 0.1.0 |
| `rich-sidebar` | navigation | alpha | 0.3.0 |
| `account-switcher-01` | navigation | alpha | 0.1.0 |
| `code-block` | code | alpha | 0.1.1 |
| `detail-panel` | feedback | alpha | 0.1.1 |

> `force-graph` removed 2026-05-08 pending recreation; v0.2 source + procomp docs archived to [`docs/migrations/force-graph/`](../docs/migrations/force-graph/). v3 design + slug TBD.

---

## Active queue (session-open list, 2026-05-13)

User's procomp queue — 7 of 10 shipped, 3 remaining. Each goes through GATE 1 (description) → GATE 2 (plan) → implementation → GATE 3 (spot-check review).

1. ~~`pdf-viewer`~~ ✅ shipped 2026-05-10
2. ~~`file-tree`~~ ✅ shipped 2026-05-10
3. ~~`file-manager`~~ ✅ shipped 2026-05-10
4. ~~`code-block`~~ ✅ shipped 2026-05-11
5. ~~`json-form`~~ ✅ shipped 2026-05-13 (now v0.2.5)
6. ~~`todo-rich-card`~~ ✅ shipped 2026-05-20 (now v0.1.1)
7. ~~`todo-tree`~~ ✅ shipped 2026-05-21 (now v0.1.3)
8. `rich-graph-2`
9. `chat-panel`
10. `notification-system`

Sibling procomps queued (no GATE 1 yet): `todo-rich-card-in-flow` (flow-canvas-01 adapter), `bottom-tab-bar-01` (shares NavBadge + NavItem schema with rich-sidebar via F-S1 relative imports).

**Side workstreams — recently closed:** `rich-sidebar` v0.1 → v0.3 (3 ships across 2026-05-22 / 23), `account-switcher-01` v0.1.0 (49th component, 2026-05-23), `registration-form-01` + `pricing-table-01` (CMS conversion batch, 2026-05-22), `workspace` v0.1.2 → v0.1.3 + v0.2.0 GATE 1 (2026-05-24 / 25). See Recent activity below or `.claude/decisions/`.

---

## Roadmap (longer-term team-utility candidates)

Next candidates, ordered by team utility (separate from the active queue above):

1. ~~`data/stat-card`~~ ✅ shipped 2026-05-09
2. `feedback/empty-state` — icon + title + body + primary action.
3. `forms/multi-select` — combobox with tag chips (shadcn has Command, no real multi-select).
4. `layout/page-header` — title + breadcrumbs + actions slot.
5. `feedback/notification-feed` — grouped, time-bucketed, read/unread (overlaps with active-queue `notification-system` — reconcile when that one starts).
6. `navigation/command-palette` — cmd+k, grouped results.
7. `media/dropzone` — drag-drop + progress + previews.

**Active sweep work** — in-progress at [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md). Tier 1 (9 components) reviewed at v0.1 across sessions 1-6; Phases 1-6 closed in sessions 7-7d; Tier 2 (27 components) reviews scheduled across sessions 8-12.

---

## Open decisions / TODOs

**Active — needs decision or work**

- **F-cross-13** — shadcn primitive Radix→Base UI divergence (Medium). Path (a) shipped per-procomp (defensive callback contravariance + drop divergent prop names; established 2026-05-17 in rcif v0.2.0). Path (b) — producer-primitive refresh — standalone hygiene task, affects every procomp using shadcn primitives with non-trivial props. Tracker: [`docs/reviews/sweep-tracker.md` F-cross-13](../docs/reviews/sweep-tracker.md). Defensive-callback pattern is the **new default for all future procomp authors**.
- **F-S1 cross-procomp `/types` substitution** (Watch). shadcn 4.6.0 path rewriter substitutes the current slug for the target slug when a same-category sibling imports `<other-slug>/types`. Worked around via RELATIVE imports for all cross-procomp paths in shipped source. Promotion criterion: a second same-category cross-procomp ship that trips the bug despite the relative-paths lock.
- **rich-card-in-flow v0.1 + v0.2 spot-check follow-ups** → v0.3.0 plan (4 Low candidates: `isCardLike` tightening + Plate per-mount cost + per-field ports + custom port-type registration). Decisions: [v0.1.0](decisions/2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md), [v0.2.0](decisions/2026-05-17-rich-card-in-flow-v0.2.0-port-editor.md).
- **flow-canvas-01 v0.2.0 spot-check follow-ups** → v0.2.1 candidates (F-01 Med post-Tier-1+2 DevTools-trace measurement; F-02 Low path-b smoke; F-03 Low usage.tsx stale "Deferred to v0.2" heading). Decision: [2026-05-16-flow-canvas-v0.2.0-perf-bundle](decisions/2026-05-16-flow-canvas-v0.2.0-perf-bundle.md).
- **pdf-viewer worker default** (F-01) → v0.2.0. Replace unpkg-CDN default with bundled-or-postinstall path; Turbopack rejected bare-specifier `new URL()` so v0.1.0 ships CDN default + `workerSrc` override. Decision: [2026-05-10-pdf-viewer-v01-pipeline](decisions/2026-05-10-pdf-viewer-v01-pipeline.md).

**Informed defers — explicit trigger to revisit**

- **MDX for usage docs** — currently `usage.tsx`. Trigger: ~5 components reach prose-heavy guidance, OR a consumer needs MDX-specific features (embeds, codeblocks-with-render).
- **NPM publish artifacts** — no `tsup`/`rollup`, no exports map. shadcn-registry handles team-internal use. Trigger: external consumer onboards, OR registry update-friction surfaces real pain.
- **Test runner not wired** — `tsc --noEmit` + `lint` + demo-driven manual verification cover today. Trigger: first non-trivial bug in pure-function `lib/` modules (workspace + rich-card + properties-form). First test should be rich-card's `parse → serialize → parse` fixed-point property test.

Closed entries (F-cross-01/04/11-pathB/12, Phase 0 risk spike, chart palette, site nav, alpha/beta variants, footer version, public registry build, reserved meta fields, lime contrast pattern, rcif p-llm-system-in warning, etc.) live in [`.claude/decisions/`](decisions/) + [`STATUS-archive.md`](STATUS-archive.md) (pre-2026-05-09).

---

## Recent activity

The 5 most-recent decision files, most-recent first. Full per-decision log at [`.claude/decisions/`](decisions/).

- **⏸ 2026-05-27 — post-card-01 v0.2.0 IN FLIGHT — C7 shipped, C8–C12 pending** (uncommitted decision; tip `fb05bee`; 8 commits stacked = engagement-bar-01 v0.2.0 + post-card-01 v0.2.0 C0–C7). Implementation paused mid-chain; resume from C8 (repost-of-card). Active handoff: [`HANDOFF-2026-05-27-post-card-01-v0.2.0-c7-shipped-c8-pending.md`](HANDOFF-2026-05-27-post-card-01-v0.2.0-c7-shipped-c8-pending.md). Post-card-01 row stays at v0.1.1 until C12 (version bump lands at the final commit). Remaining: C8 repost mini-card / C9 poll widget / C10 responsive sweep / C11 kebab role-aware wiring / C12 demo refresh + smoke harness consumer-tsc + version bump + GATE 3 spotcheck. ~8h focused work estimated.
- **2026-05-27 — engagement-bar-01 v0.2.0 SHIPPED** ([decision](decisions/2026-05-27-engagement-bar-01-v0.2.0-likers-strip-share-menu-extraction.md)) — additive sub-export extraction: `LikersStrip` + `ShareMenu` moved from `post-card-01/parts/` → `engagement-bar-01/parts/`; new `EngagementLikerProfile` type (relaxed-fields shape, parallel to strict `EngagementLikeUser` for delta payloads). Spotcheck verdict **Pass**, zero findings. C0 prerequisite for post-card-01 v0.2.0; main chain C1 → C12 unblocked.
- **⏸ 2026-05-25 — cms-panel-01 GATE 1 description IN FLIGHT** (uncommitted; awaiting user sign-off + answers to 10 open questions). Authored at [`docs/panels/cms-panel-01/cms-panel-01-description.md`](../docs/panels/cms-panel-01/cms-panel-01-description.md) — first `pro-panel` pilot. 11 routes staged v0.1/v0.2/v0.3; hybrid CRUD strategy (shared sections + `entity-crud-page-01` parameterized by `entityType` serves 4 routes); WP-5-role permissions; ~13–14 constituent artifacts to ship bottom-up before panel closes. Active handoff: [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md). No decision file yet (lands when GATE 1 signs off).
- [2026-05-25 — Library tier system charter LOCKED (Phase A)](decisions/2026-05-25-library-tier-system-charter.md) — pro-section + pro-page + pro-panel tiers formalized above procomp; rule renamed `component-readiness-review.md` → `readiness-review.md` with stub redirect; foundational docs only (no code, no scaffolders). 49 procomps unchanged + grandfathered. Phase B/C deferred to first pilot in each tier. Tip `a771758`.
- **2026-05-25 — STATUS.md slim-down** (`72fdec2`) — 41K tokens → 14KB (~6× shrink). Restores F-cross-02 lean-snapshot convention (2026-05-09 precedent).

Older entries (~25 trimmed from this index 2026-05-25 per the lean-snapshot convention) are accessible at [`.claude/decisions/`](decisions/) — every shipped component, gate closure, or substantive decision since 2026-05-09 has its own dated file. Slug-grep is the search interface.

---

## How to update this file

`STATUS.md` is the slim snapshot. **Don't extend it with verbose entries.** Per-decision detail lives in `.claude/decisions/<date>-<slug>.md` (queryable by YAML frontmatter); STATUS.md is the index + the snapshot. The 2026-05-09 + 2026-05-25 trims were both restorations of this rule, not exceptions.

| When something happens | Where it goes |
|---|---|
| Component ships / version bumps / status changes | Update the Components table row + author a `.claude/decisions/<date>-<slug>.md` file |
| Sweep phase closes / cross-cutting finding closes | Author a decision file; update [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md); add a one-line "Recent activity" pointer above (keep ~5 most-recent only) |
| New TODO / Open decision lands | Add a one-line bullet in "Open decisions / TODOs" with a decision/tracker link — do NOT inline the decision content |
| Something old gets closed | Either strike inline if recent + relevant, OR drop the line entirely (the decision file is the source of truth) |
| Intro banner urge | **Resist.** No more banner-blockquote stack at the top. Banners ARE the changelog; they belong in decision files + Recent activity, not the snapshot |

The "Recent activity" pointer list stays at ~5 entries (most recent first). Older entries are still in `.claude/decisions/` — not removed, just not surfaced in this index. If you need to extend Recent activity past 7 entries, trim back to 5 instead.
