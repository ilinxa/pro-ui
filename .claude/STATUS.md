# ilinxa-ui-pro — Status

> **Current snapshot — the *now*, not a changelog.** Size budget: ≤14KB (enforced by `pnpm validate:doc-budget`). Per-decision context: [`.claude/decisions/`](decisions/). Pre-2026-05-09 history: [`STATUS-archive.md`](STATUS-archive.md) (frozen). Older handoffs: [`handoffs-archive/`](handoffs-archive/). **Active handoff: [`HANDOFF-2026-08-10-review-plan-p0-p1-complete.md`](HANDOFF-2026-08-10-review-plan-p0-p1-complete.md)** — the resume file for the production-readiness arc.
>
> **Last re-slim: 2026-08-10** (120KB → lean, plan P0.3 — third restoration of the lean-snapshot rule after 2026-05-09 and 2026-05-25). Banner-blockquotes are banned here; their content lives in decision files.

## Now (2026-08-11)

- **Active master plan:** [`docs/production-readiness-plan.md`](../docs/production-readiness-plan.md) — signed off 2026-08-10. **P0 ✅ · P1 ✅ · P1.5 ✅ · P2 ✅ (2026-08-11)** → next: **P3 feature-slicing** → P4 polish/1.0. Locked: D1 drop `-NN` slugs · D2 order P1→P2→P3 · D3 STATUS one-line rows · **naming canon + domain `ui.ilinxa.com`** ([canon](../docs/naming-canon.md)).
- **P2 great rename SHIPPED:** 52/63 slugs renamed full-surface (identifiers included), 52 deprecated aliases live (old install names redirect), 63 canon descriptions (≤160), brand unified *ilinxa pro-ui*, `validate:naming` + artifact-clean wired. Review: [`docs/reviews/2026-08-11-p2-rename-review.md`](../docs/reviews/2026-08-11-p2-rename-review.md). **User actions open: DNS `ui.ilinxa.com` (CNAME → cname.vercel-dns.com + Vercel domain attach) · then submit the directory PR per [`docs/directory-pr-pack.md`](../docs/directory-pr-pack.md).**
- **Deep review 2026-08-10:** [`docs/reviews/2026-08-10-deep-codebase-review.md`](../docs/reviews/2026-08-10-deep-codebase-review.md) — ~90 findings; **all Blocker/High FIXED by P1** (outcome ledger in review §0; open Mediums/Lows have owners there). 23 components patch-bumped ([decision](decisions/2026-08-10-p1-fix-program.md)).
- Library: **63 pro-components / 9 populated categories**.
- Gates: tsc 0 · **lint 0 errors** (9 pre-existing warnings) · meta-deps 63/63 (reverse-npm) · registry-json validator ✓ · doc validators ✓ · build green.

## Library tiers

Charter: [`docs/library-tiers-charter.md`](../docs/library-tiers-charter.md) · Rule: [`.claude/rules/readiness-review.md`](rules/readiness-review.md) (core) + [`docs/reviews/readiness-review-spec.md`](../docs/reviews/readiness-review-spec.md) (full spec)

| Tier | Shipped | Distribution |
|---|---|---|
| pro-component | 63 | runtime (`registry:component`) |
| pro-section / pro-page / pro-panel | 0 — charter locked, tooling Phase B | runtime / scaffold-fork |

## Components

One line per component: version + status (source of truth: each `meta.ts`; regenerate via the P0.3 script pattern). Everything else → `meta.ts`, guide, decision files.

| Component | Category | Version | Status |
|---|---|---|---|
| `code-block` | code | 0.1.4 | alpha |
| `article-meta` | data | 0.2.0 | alpha |
| `blackboard` | data | 0.2.0 | alpha |
| `card-tree` | data | 0.5.0 | beta |
| `card-tree-node` | data | 0.3.0 | alpha |
| `comment-thread` | data | 0.3.0 | alpha |
| `data-table` | data | 0.1.2 | alpha |
| `engagement-bar` | data | 0.4.0 | alpha |
| `event-calendar` | data | 0.3.0 | alpha |
| `event-card` | data | 0.2.0 | alpha |
| `expandable-text` | data | 0.2.0 | alpha |
| `flow-canvas` | data | 0.3.0 | alpha |
| `gantt-timeline` | data | 0.6.0 | alpha |
| `info-list` | data | 0.2.0 | alpha |
| `kanban-board` | data | 0.5.0 | alpha |
| `news-card` | data | 0.4.0 | alpha |
| `people-grid` | data | 0.2.0 | alpha |
| `post-card` | data | 0.4.0 | alpha |
| `progress-timeline` | data | 0.2.0 | alpha |
| `project-card` | data | 0.3.0 | alpha |
| `registration-card` | data | 0.2.0 | alpha |
| `rich-text-editor` | data | 0.3.0 | alpha |
| `schedule-list` | data | 0.2.0 | alpha |
| `stat-card` | data | 0.1.2 | alpha |
| `story-rail` | data | 0.3.0 | alpha |
| `task-card` | data | 0.5.0 | alpha |
| `task-tree` | data | 0.4.0 | alpha |
| `thumbnail-list` | data | 0.2.0 | alpha |
| `detail-panel` | feedback | 0.1.2 | alpha |
| `category-cloud` | forms | 0.2.0 | alpha |
| `entity-picker` | forms | 0.1.3 | alpha |
| `filter-bar` | forms | 0.2.0 | alpha |
| `filter-panel` | forms | 0.2.0 | alpha |
| `json-form` | forms | 0.2.8 | alpha |
| `markdown-editor` | forms | 0.1.4 | alpha |
| `properties-form` | forms | 0.1.4 | alpha |
| `signup-form` | forms | 0.2.0 | alpha |
| `team-challenge` | gamification | 0.2.0 | alpha |
| `team-feedback-loop` | gamification | 0.2.0 | alpha |
| `team-progress-bar` | gamification | 0.2.0 | alpha |
| `team-quest-log` | gamification | 0.2.0 | alpha |
| `team-task-claim` | gamification | 0.2.0 | alpha |
| `team-trophy-shelf` | gamification | 0.2.0 | alpha |
| `magazine-layout` | layout | 0.3.0 | alpha |
| `split-workspace` | layout | 0.2.0 | alpha |
| `author-card` | marketing | 0.2.0 | alpha |
| `newsletter-signup` | marketing | 0.2.0 | alpha |
| `page-hero` | marketing | 0.2.0 | alpha |
| `pricing-table` | marketing | 0.2.0 | alpha |
| `share-bar` | marketing | 0.2.0 | alpha |
| `carousel-composer` | media | 0.2.0 | alpha |
| `content-composer` | media | 0.3.0 | alpha |
| `media-carousel` | media | 0.2.0 | alpha |
| `media-editor` | media | 0.2.0 | alpha |
| `media-library` | media | 0.2.0 | alpha |
| `pdf-viewer` | media | 0.1.5 | alpha |
| `story-composer` | media | 0.3.0 | alpha |
| `story-viewer` | media | 0.5.0 | alpha |
| `video-player` | media | 0.2.0 | alpha |
| `account-switcher` | navigation | 0.2.0 | alpha |
| `app-sidebar` | navigation | 0.4.0 | alpha |
| `file-manager` | navigation | 0.1.3 | alpha |
| `file-tree` | navigation | 0.1.3 | alpha |

## Queue & roadmap (re-dated 2026-08-10)

**The master plan supersedes ad-hoc queueing until P4 closes.** New-component work is paused during P1 (fix program) except by explicit user call.

- Original queue remainders: `rich-graph-2` · `chat-panel` · `notification-system`. Siblings queued (no GATE 1): `todo-card-tree-node` · `bottom-tab-bar-01` · `related-articles-ribbon-01`.
- Deferred extractions: `gamification-kit` (D-04; plan P3.5) · gamification Tier-host page.
- Roadmap candidates (post-P4): `feedback/empty-state` · `forms/multi-select` · `layout/page-header` · `feedback/notification-feed` · `navigation/command-palette` · `media/dropzone`.
- In-flight non-procomp: `cms-panel-01` GATE 1 awaiting sign-off + 10 open questions ([handoff](handoffs-archive/HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md)) — resumes after P1.

## Open decisions / TODOs

- **🟢 Directory listing — pack READY, two user actions left** ([pack](../docs/directory-pr-pack.md)): (1) DNS `ui.ilinxa.com` → CNAME `cname.vercel-dns.com` + Vercel domain attach; (2) submit the one-entry PR to shadcn-ui/ui. Clean-project audit GREEN 2026-08-11 (list/view/search/add/fixtures/alias/tsc, newest CLI, src-layout Radix consumer). MIT decided 2026-08-11 ([decision](decisions/2026-08-11-open-source-mit-directory-plan.md)).
- **P1.5 executed + smoke-verified 2026-08-11** ([decision](decisions/2026-08-11-p1-5-carrier-sweep.md)): zero `asChild`/`delayDuration`/ToggleGroup carriers in shipped code (23 + 4 residual-round bumps). Full-63 real-CLI Base-UI smoke: **63/63 installs · consumer tsc 0 errors** — first fully-green smoke since the CLI-corruption era began (~July).
- **⚠️ shadcn CLI 4.6.0 corrupts consumer package.json on add** (version shuffle across names) — broke the smoke harness silently since ~July; harness re-aligned 2026-08-10. Verify newer CLI versions; smoke results between July and 2026-08-10 are unverified. Details: review §0.
- **P1 follow-up cohort** (from the fix program's adversarial passes; owners in review §0 ledger): re-export-on-re-edit (composer v0.2.3) · text-export webfonts (media-editor v0.2) · §6/§7 remainders → P3.4 fix-on-touch.
- **F-cross-13** Radix→Base-UI divergence — path (b) producer sweep DONE (P1.5, 2026-08-11); path (a) defensive authoring is the standing rule for new code. Known residual carrier classes: pinned new-york regDep URLs (→P2/P4) · `--radix-popover-trigger-width` var (entity-picker/json-form now dual-var; audit others on touch). Tracker: [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md).
- **F-S1** cross-procomp `/types` rewriter substitution — relative-imports lock in place; watch for a second trip.
- **Per-component follow-up cohorts** (Low, from GATE 3 reviews): media-editor/story-composer v0.3 cohort · card-tree-node v0.3 · flow-canvas v0.2.x · pdf-viewer worker default v0.2 · blackboard F-03/F-04. Owners + targets in each review file; superseded where the 2026-08-10 review re-found them.
- **Informed defers:** MDX usage docs (trigger: ~5 prose-heavy components) · NPM publish artifacts (trigger: external consumer onboards) · test runner (trigger: first pure-lib bug; first test = card-tree parse→serialize fixed-point).

## Recent activity

Five most-recent, one line each. Full log: [`.claude/decisions/`](decisions/).

- **2026-08-11 — P2 great rename SHIPPED: 52 slugs + identifier families, aliases, canon copy, ui.ilinxa.com** ([decision](decisions/2026-08-11-p2-great-rename.md) · [review](../docs/reviews/2026-08-11-p2-rename-review.md)) — 2 codemods (16.4k replacements), 3 adversarial verify passes all closed pre-push, clean-project directory audit green.
- **2026-08-11 — Open-source MIT + registry-directory plan** ([decision](decisions/2026-08-11-open-source-mit-directory-plan.md)) — LICENSE shipped; external guide audited (central "blocker" was false); directory PR sequenced after P2.
- **2026-08-11 — P1.5 F-cross-13 path-b carrier sweep: 23 patch bumps, zero asChild/delayDuration/ToggleGroup in shipped code** ([decision](decisions/2026-08-11-p1-5-carrier-sweep.md)) — 5 parallel fix agents + 3 adversarial verifiers (caught 1 real regression pre-ship: calendar touch long-press); calendar/app-sidebar tooltips now local; registry deps pruned.
- **2026-08-10 — P1 fix program shipped: all review Highs closed, 23 patch bumps, lint 81→0** ([decision](decisions/2026-08-10-p1-fix-program.md)) — 6 parallel fix batches + 3 adversarial verify passes (caught + closed one regression pre-ship); reverse-npm + registry-json validators live.
- **2026-08-10 — Deep review + production-readiness plan signed off** ([review](../docs/reviews/2026-08-10-deep-codebase-review.md) · [plan](../docs/production-readiness-plan.md)) — ~90 findings; D1–D3 locked; P0 hygiene executed same day.

## How to update this file

Slim snapshot only — **never** verbose entries, **never** banner blockquotes (banners are changelog; changelog = decision files). Components table rows are one line: version + status. Recent activity = 5 one-liners max. When something ships: update the table row, author `.claude/decisions/<date>-<slug>.md`, add a one-line Recent-activity pointer, trim to 5. Stay under the 14KB budget — `pnpm validate:doc-budget` fails the build otherwise.
