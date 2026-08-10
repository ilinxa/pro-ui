# ilinxa-ui-pro — Status

> **Current snapshot — the *now*, not a changelog.** Size budget: ≤14KB (enforced by `pnpm validate:doc-budget`). Per-decision context: [`.claude/decisions/`](decisions/). Pre-2026-05-09 history: [`STATUS-archive.md`](STATUS-archive.md) (frozen). Older handoffs: [`handoffs-archive/`](handoffs-archive/).
>
> **Last re-slim: 2026-08-10** (120KB → lean, plan P0.3 — third restoration of the lean-snapshot rule after 2026-05-09 and 2026-05-25). Banner-blockquotes are banned here; their content lives in decision files.

## Now (2026-08-10)

- **Active master plan:** [`docs/production-readiness-plan.md`](../docs/production-readiness-plan.md) — signed off 2026-08-10. Phases: P0 doc hygiene (in progress) → P1 fix review findings → P2 great rename (drop `-NN`, catalog copy rewrite) → P3 feature-slicing architecture → P4 polish/1.0. Locked: D1 drop `-NN` slugs · D2 order P1→P2→P3 · D3 STATUS one-line rows.
- **Deep review 2026-08-10:** [`docs/reviews/2026-08-10-deep-codebase-review.md`](../docs/reviews/2026-08-10-deep-codebase-review.md) — ~90 verified findings, ~20 High (broken flows in content-composer/media-editor/calendar/grid-news; task-family date corruption; undeclared `radix-ui`; markdown XSS; docs-site category filter + stale public docs). **None fixed yet** — P1 is the fix program.
- Library: **63 pro-components / 9 populated categories**, all shipped + smoke-verified; gamification pack 6/6 complete (tip `a662b54` at review time).
- Gates baseline: tsc 0 · meta-deps 63/63 · lint **81 errors (known baseline, P1E burns it down)** · build green.

## Library tiers

Charter: [`docs/library-tiers-charter.md`](../docs/library-tiers-charter.md) · Rule: [`.claude/rules/readiness-review.md`](rules/readiness-review.md) (core) + [`docs/reviews/readiness-review-spec.md`](../docs/reviews/readiness-review-spec.md) (full spec).

| Tier | Shipped | Distribution |
|---|---|---|
| pro-component | 63 | runtime (`registry:component`) |
| pro-section / pro-page / pro-panel | 0 — charter locked, tooling Phase B | runtime / scaffold-fork |

## Components

One line per component: version + status (source of truth: each `meta.ts`; regenerate via the P0.3 script pattern). Everything else → `meta.ts`, guide, decision files.

| Component | Category | Version | Status |
|---|---|---|---|
| `code-block` | code | 0.1.1 | alpha |
| `article-body-01` | data | 0.2.2 | alpha |
| `article-meta-01` | data | 0.1.0 | alpha |
| `blackboard-01` | data | 0.1.0 | alpha |
| `calendar-01` | data | 0.2.3 | alpha |
| `comment-thread-01` | data | 0.2.1 | alpha |
| `content-card-news-01` | data | 0.3.0 | alpha |
| `data-table` | data | 0.1.1 | alpha |
| `engagement-bar-01` | data | 0.3.2 | alpha |
| `event-card-01` | data | 0.1.1 | alpha |
| `expandable-text-01` | data | 0.1.0 | alpha |
| `flow-canvas-01` | data | 0.2.5 | alpha |
| `gantt-timeline-01` | data | 0.5.0 | alpha |
| `info-list-01` | data | 0.1.0 | alpha |
| `kanban-board-01` | data | 0.4.1 | alpha |
| `people-grid-01` | data | 0.1.0 | alpha |
| `post-card-01` | data | 0.3.2 | alpha |
| `progress-timeline-01` | data | 0.1.2 | alpha |
| `project-card-01` | data | 0.2.0 | alpha |
| `registration-card-01` | data | 0.1.1 | alpha |
| `rich-card` | data | 0.4.3 | beta |
| `rich-card-in-flow` | data | 0.2.0 | alpha |
| `schedule-list-01` | data | 0.1.0 | alpha |
| `stat-card` | data | 0.1.1 | alpha |
| `story-rail-01` | data | 0.2.1 | alpha |
| `thumb-list-01` | data | 0.1.0 | alpha |
| `todo-rich-card` | data | 0.4.0 | alpha |
| `todo-tree` | data | 0.3.0 | alpha |
| `detail-panel` | feedback | 0.1.1 | alpha |
| `category-cloud-01` | forms | 0.1.0 | alpha |
| `entity-picker` | forms | 0.1.1 | alpha |
| `filter-bar-01` | forms | 0.1.0 | alpha |
| `filter-stack` | forms | 0.1.0 | alpha |
| `json-form` | forms | 0.2.5 | alpha |
| `markdown-editor` | forms | 0.1.1 | alpha |
| `properties-form` | forms | 0.1.1 | alpha |
| `registration-form-01` | forms | 0.1.1 | alpha |
| `cooperative-challenge-01` | gamification | 0.1.2 | alpha |
| `task-choice-control-01` | gamification | 0.1.0 | alpha |
| `team-feedback-loop-01` | gamification | 0.1.1 | alpha |
| `team-progress-bar-01` | gamification | 0.1.1 | alpha |
| `team-quest-log-01` | gamification | 0.1.1 | alpha |
| `team-trophy-shelf-01` | gamification | 0.1.1 | alpha |
| `grid-layout-news-01` | layout | 0.2.0 | alpha |
| `workspace` | layout | 0.1.3 | alpha |
| `author-card-01` | marketing | 0.1.0 | alpha |
| `newsletter-card-01` | marketing | 0.1.0 | alpha |
| `page-hero-news-01` | marketing | 0.1.2 | alpha |
| `pricing-table-01` | marketing | 0.1.0 | alpha |
| `share-bar-01` | marketing | 0.1.0 | alpha |
| `content-composer-01` | media | 0.2.1 | alpha |
| `media-carousel-01` | media | 0.1.3 | alpha |
| `media-carousel-editor-01` | media | 0.1.2 | alpha |
| `media-editor-01` | media | 0.1.3 | alpha |
| `media-library-01` | media | 0.1.1 | alpha |
| `pdf-viewer` | media | 0.1.3 | alpha |
| `story-composer-01` | media | 0.2.1 | alpha |
| `story-viewer-01` | media | 0.4.4 | alpha |
| `video-player-01` | media | 0.1.2 | alpha |
| `account-switcher-01` | navigation | 0.1.0 | alpha |
| `file-manager` | navigation | 0.1.0 | alpha |
| `file-tree` | navigation | 0.1.0 | alpha |
| `rich-sidebar` | navigation | 0.3.0 | alpha |

## Queue & roadmap (re-dated 2026-08-10)

**The master plan supersedes ad-hoc queueing until P4 closes.** New-component work is paused during P1 (fix program) except by explicit user call.

- Original queue remainders: `rich-graph-2` · `chat-panel` · `notification-system`. Siblings queued (no GATE 1): `todo-rich-card-in-flow` · `bottom-tab-bar-01` · `related-articles-ribbon-01`.
- Deferred extractions: `gamification-kit` (D-04; plan P3.5) · gamification Tier-host page.
- Roadmap candidates (post-P4): `feedback/empty-state` · `forms/multi-select` · `layout/page-header` · `feedback/notification-feed` · `navigation/command-palette` · `media/dropzone`.
- In-flight non-procomp: `cms-panel-01` GATE 1 awaiting sign-off + 10 open questions ([handoff](handoffs-archive/HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md)) — resumes after P1.

## Open decisions / TODOs

- **🔴 P1 fix program** — the ~90-finding review (see Now). Batches 1A–1E in the plan; every 🚫/⚠️ gets fixed or deferred-with-owner.
- **F-cross-13** Radix→Base-UI divergence — path (a) defensive-per-procomp is the standing default; path (b) producer-primitive refresh remains open hygiene. Tracker: [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md).
- **F-S1** cross-procomp `/types` rewriter substitution — relative-imports lock in place; watch for a second trip.
- **Per-component follow-up cohorts** (Low, from GATE 3 reviews): media-editor/story-composer v0.3 cohort · rich-card-in-flow v0.3 · flow-canvas v0.2.x · pdf-viewer worker default v0.2 · blackboard F-03/F-04. Owners + targets in each review file; superseded where the 2026-08-10 review re-found them.
- **Informed defers:** MDX usage docs (trigger: ~5 prose-heavy components) · NPM publish artifacts (trigger: external consumer onboards) · test runner (trigger: first pure-lib bug; first test = rich-card parse→serialize fixed-point).

## Recent activity

Five most-recent, one line each. Full log: [`.claude/decisions/`](decisions/).

- **2026-08-10 — Deep review + production-readiness plan signed off** ([review](../docs/reviews/2026-08-10-deep-codebase-review.md) · [plan](../docs/production-readiness-plan.md)) — ~90 findings; D1–D3 locked; P0 hygiene executed same day.
- **2026-07-01 — gamification visual hover pass** ([decision](decisions/2026-07-01-gamification-visual-hover-pass.md)) — 4 patch bumps + docs-site Button hover fix.
- **2026-07-01 — team-quest-log-01 v0.1.0** ([decision](decisions/2026-07-01-team-quest-log-01-v0.1.0-first-ship.md)) — 6th/final gamification component; pack 6/6 complete + smoke-verified.
- **2026-07-01 — task-choice-control-01 v0.1.0** ([decision](decisions/2026-07-01-task-choice-control-01-v0.1.0-first-ship.md)) — E4 autonomy control; single-unit exception; pre-push Base-UI smoke clean.
- **2026-07-01 — cooperative-challenge-01 v0.1.0→v0.1.1** ([decision](decisions/2026-07-01-cooperative-challenge-01-v0.1.0-first-ship.md)) — E3; smoke caught Radix-only `getValueLabel` → v0.1.1.

## How to update this file

Slim snapshot only — **never** verbose entries, **never** banner blockquotes (banners are changelog; changelog = decision files). Components table rows are one line: version + status. Recent activity = 5 one-liners max. When something ships: update the table row, author `.claude/decisions/<date>-<slug>.md`, add a one-line Recent-activity pointer, trim to 5. Stay under the 14KB budget — `pnpm validate:doc-budget` fails the build otherwise.
