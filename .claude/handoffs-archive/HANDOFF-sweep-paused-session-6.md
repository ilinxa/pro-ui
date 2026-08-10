# Handoff — procomp review sweep paused at session 6 (Tier 1 closed)

> **Date paused:** 2026-05-08
> **Reason for handoff:** clean session boundary; user wants to continue in a fresh session
> **Last commit:** `a8d38fe` — "review(sweep): session 6 consistency fixes"
> **Branch:** `master` (5 unpushed sweep commits since the session-4 handoff)
> **Working tree:** clean except `.claude/settings.local.json` (intentionally not tracked)

---

## TL;DR — Read this first

We're now **6 sessions** into a 13-session **procomp review sweep** of the ilinxa-ui-pro library. **Tier 1 is COMPLETE** — all 9 components reviewed; verdicts unanimous Pass with follow-ups; **sweep mid-checkpoint UNLOCKED**.

**Total findings to date:** 51 component-level findings across 9 reviewed components + 9 cross-cutting findings (F-cross-01 through F-cross-09).

**Next session is #7 — the mid-sweep checkpoint.** Per the master plan, session 7 has **NO new reviews**; the focus is the batched cross-cutting cleanup that's been accumulating across sessions 1-6 + the per-component v0.1.1 patches.

The master plan and recurring conventions live in:
- **Master plan:** `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md`
- **Sweep tracker (most-current state):** `docs/reviews/sweep-tracker.md`
- **Prior handoff (session 4):** `.claude/HANDOFF-sweep-paused-session-4.md` — superseded by this doc for sweep state, but still useful as deeper history

---

## Read these files in this order before doing anything

| # | Path | Why |
|---|---|---|
| 1 | This file | You're here. Read top-to-bottom. |
| 2 | `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md` | The master plan. Sequencing, tier breakdown, smoke-harness design, per-component workflow. **Already approved by user — don't re-litigate decisions.** Note: master plan §7 (the mid-sweep checkpoint) is the authority for session 7's structure. |
| 3 | `docs/reviews/sweep-tracker.md` | Live state of the sweep — Tier 1/Tier 2 status, smoke runs, **9 open cross-cutting findings**, session log. The single source of truth for "where are we?" |
| 4 | `docs/reviews/README.md` | Review system overview — when to trigger, file shape, severity scale (🚫/⚠️/🔸/🔹), verdict labels |
| 5 | `docs/reviews/review-process.md` | The flow — 8-step review order, finding format (F-NN), verdicts, sign-off. Re-read **before** any future Tier 2 reviews. |
| 6 | `docs/reviews/review-guide.md` | The 14 review dimensions in detail — read per-dimension during a review, not all at once |
| 7 | `docs/reviews/templates/review-spotcheck.md` | Tier 2 spot-check template (for sessions 8-12) |
| 8 | `docs/component-versions.md` | Versioned snapshot of all 36 components (post-force-graph-removal) |
| 9 | `.claude/STATUS.md` *(use offset/limit/grep — file is ~88K tokens; F-cross-02 flags this)* | Recent decisions log has session-by-session entries (latest 10 kept, oldest auto-trimmed); Components table has per-component context |
| 10 | `.claude/CLAUDE.md` + `.claude/AGENTS.md` | Project conventions, registry rules, design tokens, skill mandates |
| 11 | The 9 Tier 1 review reports — `docs/procomps/<slug>-procomp/reviews/2026-05-08-v<version>-review.md` for: kanban-board-01, rich-card, flow-canvas-01, article-body-01, data-table, workspace, markdown-editor, properties-form, entity-picker | Authoritative findings; read the ones relevant to whatever cleanup task you start with |

**Auto-memory** at `C:\Users\AsiaData\.claude\projects\e--2026-ilinxaDOC-ilinxa-ui-pro\memory\MEMORY.md` is loaded automatically. Notable entries that affect this work:
- `feedback_brevity_preference.md` — keep responses short and clear
- `feedback_no_meta_questions_when_pattern_is_locked.md` — don't ask "Q-Ps" when patterns are obvious from prior reviews
- `feedback_re_validation_pass_catches_real_issues.md` — never rubber-stamp work; always re-validate at sign-off (consistently catches 1-3 substantive issues per session)
- `feedback_dynamicity_reusability_primacy.md` — open API surfaces; "add it later" is breaking
- `feedback_no_schedule_offers.md` — DO NOT offer `/schedule` regardless of trigger signals
- `feedback_dont_clear_turbopack_cache_live.md` — never clear turbopack cache while dev server is running
- `project_force_graph_frozen.md` — force-graph was REMOVED 2026-05-08 (renamed-archived to `docs/migrations/force-graph/`); don't propose v3 work unless user reopens
- `project_renderer_registry_pattern.md` — host-pattern (workspace + kanban + flow-canvas) — confirmed across 3 host components
- `project_richtext_substrate.md` — Plate substrate (article-body-01) + CodeMirror substrate (markdown-editor)
- `project_registry_live.md` — registry distribution conventions

---

## What was done across sessions 1–6

### Pre-session: planning + system design

Created `docs/component-versions.md` + the `docs/reviews/` review system (README, process, 14-dimension guide, checklist + report templates) + the master plan + an audit of the system itself (3 issues fixed). User approved the plan (tiered depth + scripted harness + pilot-then-2-3 cadence).

### Session 1 (pilot, 2026-05-08) — `kanban-board-01` v0.2 + infra

- Authored sweep-tracker, spot-check template, smoke harness at `e:/tmp/ilinxa-smoke-consumer/`, smoke driver script
- First 37-slug smoke against production Vercel registry: 31 pass / 1 expected-fail / 5 unexpected-fail
- Reviewed kanban-board-01 v0.2 → Pass with follow-ups (6 findings)
- Commit: `7acfb9b`

### Session 2 (2026-05-08) — `rich-card` v0.4

- Investigated session-1 unexpected-fails; identified F-cross-05 root cause (4 components have bare-name sibling deps in `registry.json`)
- Reviewed rich-card v0.4 → Pass with follow-ups (7 findings)
- Added F-cross-06 (sweep-wide usage import-path drift) + F-cross-07 (cross-component dep version drift)
- Same commit as session 1: `7acfb9b`

### Session 3 (2026-05-08) — force-graph removal + `flow-canvas-01` v0.1 (solo)

- **Removed `force-graph`** pending recreation; v0.2 source + procomp docs renamed-archived to `docs/migrations/force-graph/`. Component count 37 → 36; Tier 1 10 → 9
- Reviewed flow-canvas-01 v0.1 solo → Pass with follow-ups (7 findings)
- Corrected STATUS.md xyflow-attribution overstatement (xyflow is MIT; Pro is honor-system community etiquette only)
- Added F-cross-08 (`process.env.NODE_ENV` likely systemic)
- Commits: `7acfb9b` (force-graph removal) + `a5e386a`

### Session 4 (2026-05-08) — `article-body-01` v0.2 + `data-table` v0.1 (paired)

- Reviewed article-body-01 v0.2 → Pass with follow-ups (2 findings)
- Reviewed data-table v0.1 → Pass with follow-ups (4 findings)
- F-cross-06 promoted to "Confirmed systemic 4/4"; F-cross-07 affirmed 2/4
- Commit: `ae5a711`
- Pause + handoff doc: `d7b1409`

### Session 5 (2026-05-08) — `workspace` v0.1 + `markdown-editor` v0.1 (paired Tier 1)

- Reviewed workspace v0.1.0 → Pass with follow-ups (7 findings: 2H/3M/2L). Headline F-01: adaptive flatten silently discards leaves past cap (Q12 contract violation)
- Reviewed markdown-editor v0.1.0 → Pass with follow-ups (7 findings: 3H/3M/1L). Headline F-03: phantom `radix-ui: ^1.4.3` npm dep over-declared
- **NEW F-cross-09 — shadcn CLI smoke regression** detected via fresh smoke run (19/1/16 vs session 1's 31/1/5)
- F-cross-06 confirmed 6/6 systemic; F-cross-08 affirmed 2/7; F-cross-07 widened (phantom-dep shape added)
- Commits: `f4fbf3f` (initial reviews) + `b5ad5d6` (consistency fixes after self-review)

### Session 6 (2026-05-08) — `properties-form` v0.1 + `entity-picker` v0.1 (paired Tier 1; closes Tier 1 at 9/9)

- Reviewed properties-form v0.1.0 → Pass with follow-ups (7 findings: 3H/3M/1L). Highest plan-vs-code fidelity Tier 1 reviewed. Densest F-cross-08 carrier (8 occurrences)
- Reviewed entity-picker v0.1.0 → Pass with follow-ups (6 findings: 3H/2M/1L). Most carefully-validated Tier 1 plan in the sweep. **Plan §12.5 #5 explicitly locks `process.env.NODE_ENV` as deliberate gate — canonical evidence for relaxing description §6 #10 sweep-wide**
- F-cross-06 closes Tier 1 at 8/8 fully systemic; F-cross-08 affirmed 4/9 Tier 1; F-cross-07 widened to 3 sub-shapes
- F-cross-01 Tier 1 dimension closed at 3/3 (markdown-editor s5; properties-form + entity-picker s6); 2 Tier 2 carriers remain (filter-stack, detail-panel)
- F-cross-09 selectivity datapoint: entity-picker passes (8581ms) while properties-form fails (4514ms; sub-mode A)
- **Sweep mid-checkpoint UNLOCKED**
- Commits: `667173d` (initial reviews) + `a8d38fe` (consistency fixes after self-review)

---

## Where we are right now

### Tier 1 progress: 9 of 9 reviewed ✅

| # | Slug | Version | Verdict | Findings | Commit |
|---|---|---|---|---|---|
| 1 | `kanban-board-01` | 0.2.0 | Pass with follow-ups | 6 (2 H, 4 M) | `7acfb9b` |
| 2 | `rich-card` | 0.4.0 (beta) | Pass with follow-ups | 7 (2 H, 4 M, 1 L) | `7acfb9b` |
| 3 | `flow-canvas-01` | 0.1.0 | Pass with follow-ups | 7 (3 H, 3 M, 1 L) | `a5e386a` |
| 4 | `article-body-01` | 0.2.0 | Pass with follow-ups | 2 (1 H, 1 M) | `ae5a711` |
| 5 | `data-table` | 0.1.0 | Pass with follow-ups | 4 (1 H, 2 M, 1 L) | `ae5a711` |
| 6 | `workspace` | 0.1.0 | Pass with follow-ups | 7 (2 H, 3 M, 2 L) | `f4fbf3f` |
| 7 | `markdown-editor` | 0.1.0 | Pass with follow-ups | 7 (3 H, 3 M, 1 L) | `f4fbf3f` |
| 8 | `properties-form` | 0.1.0 | Pass with follow-ups | 7 (3 H, 3 M, 1 L) | `667173d` |
| 9 | `entity-picker` | 0.1.0 | Pass with follow-ups | 6 (3 H, 2 M, 1 L) | `667173d` |

**Total: 53 component-level findings across 9 reviews. Verdicts unanimous Pass with follow-ups; no Blockers.**

### Tier 2 progress: 0 of 27 reviewed

Spot-checks scheduled for sessions 8-12 per master plan. **Don't start Tier 2 in session 7** — session 7 is the cross-cutting cleanup checkpoint.

### Reviewed components — artifact paths

```
docs/procomps/<slug>-procomp/reviews/2026-05-08-v<version>-{checklist,review}.md
```

For each of: `kanban-board-01-procomp` (v0.2.0), `rich-card-procomp` (v0.4.0), `flow-canvas-01-procomp` (v0.1.0), `article-body-01-procomp` (v0.2.0), `data-table-procomp` (v0.1.0), `workspace-procomp` (v0.1.0), `markdown-editor-procomp` (v0.1.0), `properties-form-procomp` (v0.1.0), `entity-picker-procomp` (v0.1.0).

### Smoke-test harness state

- **Path:** `e:/tmp/ilinxa-smoke-consumer/` (outside the producer repo)
- **Stack:** Next 16 + Tailwind v4 + React 19 + shadcn CLI v4 (currently `@latest` resolving a regressed version per F-cross-09 — **session 7 must pin this**)
- **Driver:** `e:/tmp/ilinxa-smoke-consumer/scripts/smoke-all.mjs`
- **Registries map:** `@ilinxa` → `https://ilinxa-proui.vercel.app/r/{name}.json`
- **Latest 36-slug run (session 5 fresh smoke):** **19 pass / 1 expected-fail (`flow-canvas-01`) / 16 unexpected-fail** with 3 sub-modes per F-cross-09. Result file: `e:/tmp/ilinxa-smoke-consumer/results/2026-05-08-smoke.md`. **Did not re-run in session 6** — entity-picker passed (8581ms; F-cross-09-immune subset); properties-form failed (4514ms; sub-mode A).
- **`KNOWN_MISSING` set:** `["flow-canvas-01"]` (force-graph removed from SLUGS array in session 3)
- **Single-slug filter:** `node scripts/smoke-all.mjs --slug <name>`

### Cross-cutting findings — 9 open

| ID | Severity | Status | Headline |
|---|---|---|---|
| F-cross-01 | ⚠️ High | **Tier 1 dimension closed (3/3); 2 Tier 2 remain** | Original 6 missing-guide carriers — force-graph removed; markdown-editor (s5) + properties-form + entity-picker (s6) confirmed; `detail-panel` + `filter-stack` remain as Tier 2 carriers (sessions 8 + 12). Plus data-table outlier (all-three-docs missing). |
| F-cross-02 | 🔸 Medium | Open | `.claude/STATUS.md` ~88K tokens; needs `STATUS-archive.md` split. Workaround: use offset/limit/grep to read STATUS.md. |
| F-cross-03 | 🚫 Blocker | Open (narrowed) | `flow-canvas-01` absent from `registry.json`. Ship it via the kanban pattern in session 7. |
| F-cross-04 | 🔸 Medium | Open | `pnpm build` fails on Google Fonts (Playfair Display) network access in offline/sandboxed envs. `tsc + lint + registry:build` cover correctness. Defer fix to a separate plan. |
| F-cross-05 | ⚠️ High | **Open with concrete fix; surface unified into F-cross-09 sub-mode (A)** | 4 components with bare-name sibling deps in `registry.json`: `comment-thread-01`, `post-card-01`, `media-carousel-01`, `story-viewer-01`. Fix: namespace as `@ilinxa/<slug>`. **Re-verify under pinned CLI in session 7** (current CLI obscures the original 404 with the F-cross-09 "try previous version" message). |
| F-cross-06 | 🔸 Medium | **Confirmed fully systemic 8/8 Tier 1** | All 8 reviewed Tier 1 components have producer-side `@/registry/components/<category>/<slug>` import paths in `usage.tsx`. **Sweep-wide single-commit grep-replace at session 7.** Fix path: `@/registry/components/<category>/<slug>` → `@/components/<slug>`. |
| F-cross-07 | ⚠️ High | **3 sub-shapes affirmed** | (a) Wrong-major / non-standard-semver: 2/9 (rich-card `@dnd-kit/sortable: ^11.x`; article-body-01 `lucide-react: ^0.x`). (b) Phantom npm dep `radix-ui: ^1.4.3`: 3/9, **fully systemic across forms components 3/3** (markdown-editor + properties-form + entity-picker). (c) Over-declared shadcn primitives (demo-only entries): 2/9 (properties-form `tabs`+`badge`; entity-picker `button`+`tabs`). **Recommended fix: `pnpm validate:meta-deps` lint at session 7** that catches all 3 sub-shapes. Audit `pnpm new:component` template for the auto-include of `radix-ui`. |
| F-cross-08 | ⚠️ High | **Open — 4/9 Tier 1 confirmed; entity-picker plan §12.5 #5 is the precedent** | `process.env.NODE_ENV` use confirmed: flow-canvas-01 (4) + markdown-editor (1) + properties-form (8) + entity-picker (3) = 16 occurrences across 4 components. Other 5 reviewed Tier 1 clean. **Critical:** entity-picker plan §12.5 #5 EXPLICITLY locks `process.env.NODE_ENV` as deliberate dev-warn-gate ("Bundlers strip the dead code"). Description §6 #10 / plan §8 portability rule "no `process.env`" is the bug, not the components. **Recommended resolution at session 7: relax description §6 #10 to allow `NODE_ENV` dev-warn gates explicitly, citing entity-picker plan §12.5 #5 as the precedent.** |
| F-cross-09 | ⚠️ High | **Open — needs CLI version diff + harness pin + sub-mode (B) characterization** | shadcn CLI smoke regression: 19/1/16 vs session 1's 31/1/5. Three sub-modes: (A) 9 NEW "try-previous-version" fails (workspace + markdown-editor + properties-form + detail-panel + filter-stack + author-card-01 + page-hero-news-01 + share-bar-01 + video-player-01); (B) 3 NEW silent 120s timeouts (article-body-01, article-meta-01, content-card-news-01) — different sub-mode possibly different cause; (C) 4 F-cross-05 carriers' surface unified into (A). **Recommended session 7 actions: (1) pin smoke harness to `pnpm dlx shadcn@4.6.0`; (2) investigate CLI version diff between 4.6.0 and current latest; (3) separately characterize sub-mode (B); (4) decide whether to advise consumers to pin too.** |

---

## Per-component v0.1.1 patch backlog (from sessions 1-6 reviews)

These are the per-component follow-ups across all 9 Tier 1 reviews. Many will be addressed sweep-wide in session 7 (linked); the rest are component-specific.

| Slug | Tier 1 finding | Action | Sweep-wide? |
|---|---|---|---|
| **kanban-board-01** | F-01 hardcoded amber tokens in kanban-note | Replace with semantic tokens | No (per-component v0.2.1) |
| | F-02 STATUS.md staleness | Fixed in s2 | Done |
| | F-03 dead-code in use-keyboard-actions | Remove | No |
| | F-04 usage import-path drift | F-cross-06 | Yes |
| | F-05 demo indigo swatch | Replace | No |
| | F-06 onDragOver visual feedback | UX polish | No |
| **rich-card** | F-01 virtualization-prop-not-wired | Wire to render path | No |
| | F-02 `@dnd-kit/sortable: ^11.x` wrong major | Fix to `^10.0.0` | Partly (F-cross-07 sub-a) |
| | F-03 unused `separator` dep | Drop from meta | No |
| | F-04 usage import-path drift | F-cross-06 | Yes |
| | F-05 demo says "v0.3 demo" | Update | No |
| | F-06 use-virtualizer.ts dead code | Remove (or wire per F-01) | No |
| | F-07 demo amber colors | Replace | No |
| **flow-canvas-01** | F-01 not in `registry.json` | Add via kanban pattern | Yes (F-cross-03) |
| | F-02 meta deps under-declared (4 shadcn + lucide) | Fix declarations | No |
| | F-03 `process.env.NODE_ENV` (4 occurrences) | F-cross-08 | Yes |
| | F-04 stale `related: ["force-graph"]` | Update | No |
| | F-05 plan-vs-actual file count drift + `controls.tsx` not authored | Author or amend plan | No |
| | F-06 STATUS file-count claim wrong | Fix STATUS | No |
| | F-07 xyflow Pro etiquette note | Doc clarification | No |
| **article-body-01** | F-01 `lucide-react: ^0.x` wrong major | Fix to `^1.11.0` | Partly (F-cross-07 sub-a) |
| | F-02 usage import-path drift | F-cross-06 | Yes |
| **data-table** | F-01 NO procomp docs (description + plan + guide all missing) | Author 3 docs | F-cross-01 outlier |
| | F-02 usage import-path drift | F-cross-06 | Yes |
| | F-03 review-guide §3 misrepresents data-table's flat shape | Update review-guide | No |
| | F-04 empty `related: []` | Populate | No |
| **workspace** | F-01 adaptive flatten loses leaves past cap | Fix `flattenSubtreesPastDepth` | No |
| | F-02 plan-locked Alt+Enter not wired | Wire OR amend plan | No |
| | F-03 usage import-path drift | F-cross-06 | Yes |
| | F-04 plan §9 over-states `separator` dep | Strike from plan | No |
| | F-05 7th `focus` reducer action not in plan §2 | Update plan §2 | No |
| | F-06 module-level `inertLogged` | Move to per-instance ref (v0.2) | No |
| | F-07 empty `meta.related` | Populate | No |
| **markdown-editor** | F-01 `process.env.NODE_ENV` in use-imperative-handle.ts:12 | F-cross-08 | Yes |
| | F-02 `guide.md` missing | Author guide | F-cross-01 |
| | F-03 phantom `radix-ui` npm dep | Drop from meta | Yes (F-cross-07 sub-b) |
| | F-04 usage import-path drift | F-cross-06 | Yes |
| | F-05 plan §3.3 vs source `getView()` type drift | Update plan | No |
| | F-06 toolbar empty-`label` separator sentinel | Doc OR add discriminated `type: "separator"` | No |
| | F-07 missing `"workspace"` from `meta.related` | Add | No |
| **properties-form** | F-01 `process.env.NODE_ENV` (8 occurrences across 4 files) | F-cross-08 | Yes |
| | F-02 `guide.md` missing | Author guide | F-cross-01 |
| | F-03 phantom `radix-ui` + demo-only `tabs`/`badge` in meta.shadcn | Drop from meta | Yes (F-cross-07 sub-b + sub-c) |
| | F-04 usage import-path drift | F-cross-06 | Yes |
| | F-05 plan §8.1 footer "File count: 22" but list/source = 25 | Fix plan | No |
| | F-06 meta vs registry shadcn-deps drift | Same as F-03 | Yes |
| | F-07 `meta.related` could include forms siblings | Expand | No |
| **entity-picker** | F-01 `process.env.NODE_ENV` (3 occurrences; intentional per plan §12.5 #5) | F-cross-08 (relax rule) | Yes |
| | F-02 `guide.md` missing | Author guide | F-cross-01 |
| | F-03 phantom `radix-ui` + demo-only `button`/`tabs` in meta.shadcn | Drop from meta | Yes (F-cross-07 sub-b + sub-c) |
| | F-04 usage import-path drift | F-cross-06 | Yes |
| | F-05 plan §6.3 documents `useRef` callback ref but impl uses `useState`-as-callback-ref | Update plan §6.3 | No |
| | F-06 `meta.related` could include detail-panel + markdown-editor | Expand | No |

---

## Session 7 plan — mid-sweep checkpoint (NO new reviews)

Per master plan §7. The session's job is to **resolve the batched cross-cutting cleanup** that's accumulated. Suggested execution order:

### Phase 1: Smoke harness restoration (must precede everything else)

**Why first:** F-cross-09's CLI regression is currently obscuring F-cross-05's diagnostic clarity AND blocks any verification of F-cross-03 / F-cross-06 fixes via smoke. Pin first, then resume.

1. **Pin smoke harness to `pnpm dlx shadcn@4.6.0`.** Edit `e:/tmp/ilinxa-smoke-consumer/scripts/smoke-all.mjs` to use `pnpm dlx shadcn@4.6.0 add @ilinxa/<slug>` instead of `shadcn@latest`.
2. **Re-run smoke against pinned CLI.** Capture fresh result file. Expected: F-cross-09 sub-mode (A)'s 9 fails resolve; sub-mode (C)'s 4 F-cross-05 carriers should re-emit the original "404 base-nova" error (validating F-cross-05's persistence).
3. **Investigate sub-mode (B).** The 3 silent 120s timeouts (`article-body-01`, `article-meta-01`, `content-card-news-01`) may be a different root cause. Run them individually with `--slug` flag against pinned CLI; capture verbose output.
4. **Document CLI version diff** between 4.6.0 and the regressed latest (whatever version `shadcn@latest` resolved when session 5's fresh smoke ran — check git history or shadcn's npm registry). Add to F-cross-09 tracker entry.

### Phase 2: Sweep-wide single-commit fixes (high leverage)

5. **F-cross-06 sweep-wide grep-replace.** Replace producer-side `@/registry/components/<category>/<slug>` with consumer-side `@/components/<slug>` across all 36 components' `usage.tsx` files. **One commit.** Verify with: re-run smoke harness; spot-check 2-3 random components' usage.tsx files.
6. **F-cross-08 resolution: relax description §6 #10.** Edit `docs/component-guide.md` and any `.claude/rules/` docs that codify "no `process.env`". Add explicit exception for `process.env.NODE_ENV` dev-warn gates. **Cite entity-picker plan §12.5 #5 as the precedent** in the rationale. Don't patch the 4 carrier components — the rule is the bug.
7. **F-cross-03 ship `flow-canvas-01` to `registry.json`.** Add base item (sealed-folder source files, all `type: "registry:component"` with `target: "components/flow-canvas-01/<sub>"`) + `flow-canvas-01-fixtures` companion item (`dummy-data.ts`). Pattern in [docs/component-guide.md §11.5](../docs/component-guide.md#115-shipping-via-the-registry). Run `pnpm registry:build` to verify; smoke-test from the pinned harness.
8. **F-cross-05 fix the 4 bare-name sibling deps.** In `registry.json`, change `comment-thread-01` / `post-card-01` / `media-carousel-01` / `story-viewer-01`'s `registryDependencies` entries from bare `"<slug>"` to `"@ilinxa/<slug>"`. After F-cross-09 is pinned, the original 404 errors should re-surface; this fix resolves them. Re-run smoke to verify.

### Phase 3: Architectural fixes

9. **F-cross-07 author `pnpm validate:meta-deps` lint.** New script (likely `scripts/validate-meta-deps.mjs`) that for each component:
   - Greps shipped imports (skip `demo.tsx`, `usage.tsx`, `meta.ts`)
   - Cross-checks against `meta.ts.dependencies.shadcn` (catches over-declared shadcn primitives)
   - Cross-checks against `meta.ts.dependencies.npm` (catches phantom npm deps + version drift vs producer's `package.json`)
   - Flags 3 sub-shapes: (a) wrong-version, (b) phantom-npm, (c) over-declared-shadcn
   - Add to package.json scripts; ideally invoke from `pnpm registry:build`
10. **Audit `pnpm new:component` template** for the auto-included `radix-ui` dep. Either remove it from the template OR add `radix-ui` to a forbidden-deps list in `validate:meta-deps`.
11. **Apply `validate:meta-deps` to the 5 affected Tier 1 components** (rich-card, article-body-01, markdown-editor, properties-form, entity-picker) — drop phantom + demo-only entries from each `meta.ts`.

### Phase 4: Documentation backlog

12. **F-cross-01 author 5 missing guides** (markdown-editor, properties-form, entity-picker — Tier 1 carriers; data-table needs all 3 docs). Detail-panel + filter-stack stay deferred to their Tier 2 reviews. Use the workspace guide as the structural template (description + plan present; guide is the consumer-facing surface). Estimated 2 hours per guide; 4 guides = ~8 hours of focused work. **Don't author detail-panel or filter-stack guides in session 7** — those land in Tier 2.

### Phase 5: Per-component v0.1.1 patches (per backlog above)

13. **Apply non-sweep-wide v0.1.1 patches** for each Tier 1 component. See backlog table above for the per-component list. Many are trivial doc fixes; workspace's F-01 (adaptive flatten) is the most substantive.

### Phase 6: Sign-off + STATUS update

14. Update `docs/reviews/sweep-tracker.md` cross-cutting findings table — close resolved entries, narrow scope on remaining ones.
15. Add a STATUS.md Recent-decisions entry for session 7 (will trim the oldest entry to keep ~10).
16. Commit per-task within session 7 (fine-grained commits help bisection if anything regresses).

### Estimated time

Session 7 is intentionally large — it's the cleanup of 6 sessions of accumulated tech debt. Realistic budget:
- Phase 1 (smoke restoration + investigation): ~60-90 min
- Phase 2 (sweep-wide single-commit fixes): ~90-120 min (F-cross-06 grep-replace is fast; F-cross-03 + F-cross-05 + F-cross-08 each smaller)
- Phase 3 (architectural fixes): ~120-180 min (`validate:meta-deps` is a new script with non-trivial grep/parse logic)
- Phase 4 (documentation backlog): ~8 hours focused if all 4 guides authored — **may want to split across sessions 7a + 7b**
- Phase 5 (per-component patches): ~120-180 min depending on which patches land
- Phase 6 (sign-off): ~15 min

**Total: 12+ hours if all ship in one session.** Realistic: split phases into 2-3 sessions if context-window pressures push. The user can decide whether to compress or split as session 7 progresses.

---

## Conventions / rules to respect

These are non-obvious things that have already burnt time during the sweep:

1. **STATUS.md is huge (~88K tokens).** Don't try to `Read` it whole — fails. Use `Read` with offset/limit OR `Grep` for the specific pattern. F-cross-02 tracks splitting it. **Trim to ~10 entries** at session sign-off (oldest auto-deleted via `awk 'NR<=99'` truncation pattern — see session 5/6 commits for precedent).

2. **Templates are copied per use, not edited in place.** `cp` from `docs/reviews/templates/` to the procomp folder; **never edit templates while filling them**.

3. **Per-component review files use timestamped + version-tagged names:**
   ```
   docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-{checklist,review}.md
   ```

4. **Severity emojis are FIXED:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low. Don't substitute. Used in checklist + report + tracker for cross-doc grep.

5. **Verdicts are FIXED:** `Pass` / `Pass with follow-ups` / `Needs revision` / `Block`.

6. **Findings use `F-NN` format** — contiguous numbering across severities, ordered severity-desc → location-asc. Cross-cutting findings use `F-cross-NN` and live in the tracker, not in any single review.

7. **Cross-cutting ratio convention** (refined across sessions 5+6): X carriers / N reviewed Tier 1. **Use both at-writing-time + sweep-wide framing** when the count changes mid-session. Example from workspace review §7: "1/6 Tier 1 reviewed at this writing (flow-canvas-01 only); markdown-editor's session-5 review then bumps it to 2/7 sweep-wide." Same pattern in properties-form review for F-cross-08 (3/8 → 4/9). Don't use ambiguous "X of N" without time-snapshot qualifier.

8. **Don't propose force-graph v3 work** unless the user explicitly opens the topic. v3 design + slug TBD; archived material at `docs/migrations/force-graph/`.

9. **Don't offer `/schedule`** — user does not use scheduled background agents in this project (per `feedback_no_schedule_offers.md`).

10. **Don't clear turbopack cache while `next dev` is running.** Right sequence: stop → clear → start (per `feedback_dont_clear_turbopack_cache_live.md`).

11. **Smoke harness lives OUTSIDE the producer repo** at `e:/tmp/ilinxa-smoke-consumer/`. Don't try to run smoke from the producer.

12. **Self-review at session sign-off catches real issues.** Both session 5 and session 6 had post-commit consistency-fix passes. Per `feedback_re_validation_pass_catches_real_issues.md`: never rubber-stamp — surface 1-3 substantive issues per session and fix them in a follow-up commit BEFORE pausing. Sessions 5+6 each had 3-5 cross-doc inconsistencies caught this way.

13. **Skill mandates from CLAUDE.md** still apply — use `frontend-design`, `configuring-project-memory`, `xyflow-react-pro`, `shadcn-registry-pro` skills when working on those domains.

14. **Brevity preference (memory).** Match question length. Drop preambles. Skip structure when not needed.

15. **Re-validation pass (memory).** Never rubber-stamp work. Always re-validate.

---

## Files NOT to touch (or touch only with caution)

- **`.claude/HANDOFF.md`** — the OLD handoff from May 2 (218 lines, pre-sweep). Frozen historical record.
- **`.claude/HANDOFF-sweep-paused-session-4.md`** — the session-4 handoff. Now superseded by THIS file for sweep state, but useful as deeper history. Don't overwrite.
- **`docs/migrations/force-graph/`** — frozen archive of removed force-graph v0.2.
- **`.claude/skills/sigma-react-pro/`** — retained as v3 reference for force-graph recreation.
- **Existing review files** — once committed per-session, don't go back and edit. New version → new dated file. Re-reviews on a later version go in a new file in the same `reviews/` subfolder.
- **Historical session-log rows in `sweep-tracker.md`** (rows 1-6) — frozen records of what was true at each session close. Don't retroactively edit.

---

## Glossary — terms to know

- **Procomp** — pro-component. Each is a sealed folder under `src/registry/components/<category>/<slug>/`.
- **Sweep** — the multi-session review effort, anchored to `docs/component-versions.md`.
- **Tier 1** — full 14-dimension review (9 components, all 9 done as of session 6).
- **Tier 2** — compact spot-check + smoke (27 components, 0 done; sessions 8-12).
- **F-NN** — finding number within a single review (e.g. `F-01` to `F-07`).
- **F-cross-NN** — cross-cutting finding spanning multiple components (9 open).
- **Smoke harness** — the consumer-install test app at `e:/tmp/ilinxa-smoke-consumer/`.
- **Renderer-registry pattern** — consumer-supplied dispatch by `__type` field. Used by workspace, kanban-board-01, flow-canvas-01.
- **`@ilinxa/<slug>`** — namespaced consumer-install path. Producer-side path is `@/registry/components/<category>/<slug>`. **F-cross-06 is about `usage.tsx` files using producer-side instead of consumer-side.**
- **Locked target convention** — every file in `registry.json` is `type: "registry:component"`, `target: "components/<slug>/<sub-path>"`. No exceptions.
- **Sealed folder** — each procomp's source folder is treated as self-contained; only imports from `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps allowed.
- **At-writing-time** — the snapshot of a cross-cutting metric AT the moment a review is being written (vs sweep-wide post-close). See convention #7.

---

## Recent commits (since session-4 handoff)

```
a8d38fe review(sweep): session 6 consistency fixes
667173d review(properties-form + entity-picker): v0.1 + v0.1 sweep session 6
b5ad5d6 review(sweep): session 5 consistency fixes
f4fbf3f review(workspace + markdown-editor): v0.1 + v0.1 sweep session 5
d7b1409 chore(reviews): handoff doc for sweep-session-4 pause  [← prior handoff]
ae5a711 review(article-body-01 + data-table): v0.2 + v0.1 sweep session 4
a5e386a review(flow-canvas-01): v0.1.0 sweep session 3 + xyflow attribution fix
7acfb9b feat(reviews): ship procomp review system + remove force-graph
7263286 feat: ship batched components — kanban-board-01 v0.2 + social-posts-system arc + cards + sandbox + flow-canvas-01
```

---

## If anything looks wrong

- **The sweep-tracker.md is the live state.** If this handoff and the tracker disagree, **trust the tracker**.
- **Recent commits are the source of truth for what shipped.** Use `git log --oneline -10` to verify.
- **Per-component review reports are the source of truth for findings.** This handoff summarizes; the reports are authoritative.
- **STATUS.md Recent-decisions log has session-by-session entries** — the most recent ~5 should match this handoff.

---

## When you're ready

1. Read `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md` (the master plan; especially §7).
2. Read `docs/reviews/sweep-tracker.md` (live state).
3. Spot-check `git log --oneline -10` (most recent 5 are sweep commits).
4. Confirm you have the picture before continuing.
5. Begin session 7 (no new reviews) — start with **Phase 1: smoke harness restoration**, since it gates verification of every other fix.

The user will likely say "go ahead" or "start session 7" — at that point, follow the Phase 1 → 6 order above. **Phase 4 (4-guide authoring) may want to split into a session 7b** if context-window pressures push; that's the user's call to make as session 7 progresses.

**Don't repeat work.** If you find yourself re-reading a doc the previous session already covered, check the existing review reports first — they cite specific lines and findings.

— Claude (sweep session 6 handoff, 2026-05-08)
