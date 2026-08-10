# Handoff — procomp review sweep paused at session 4

> **Date paused:** 2026-05-08
> **Reason for handoff:** clean session boundary; user wants to continue in a fresh session
> **Last commit:** `ae5a711` — "review(article-body-01 + data-table): v0.2 + v0.1 sweep session 4"
> **Branch:** `master` (up to date with `origin/master` at handoff time; 3 unpushed sweep commits)
> **Working tree:** clean except `.claude/settings.local.json` (intentionally not tracked)

---

## TL;DR — Read this first

We're 4 sessions into a 13-session **procomp review sweep** of the ilinxa-ui-pro library. The sweep applies a 14-dimension review system to every component + a real CLI smoke-test via a scripted harness. **5 of 9 Tier 1 components reviewed; 0 of 27 Tier 2 done. Total: 5 of 36** (the library was 37 before force-graph was removed mid-sweep). All reviewed components passed with follow-ups; no Blockers. **Next session is #5: paired Tier 1 review of `workspace` v0.1 + `markdown-editor` v0.1.**

The review system itself is fully operational: templates instantiated per component, smoke harness running against the production Vercel registry, sweep tracker updated per session. The full master plan and recurring conventions live in:
- **Master plan:** `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md`
- **Sweep tracker (most-current state):** `docs/reviews/sweep-tracker.md`

---

## Read these files in this order before doing anything

| # | Path | Why |
|---|---|---|
| 1 | This file | You're here. Read top-to-bottom. |
| 2 | `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md` | The master plan. Sequencing, tier breakdown, smoke-harness design, per-component workflow with exact `cp` commands. **Already approved by user — don't re-litigate decisions.** |
| 3 | `docs/reviews/sweep-tracker.md` | Live state of the sweep — Tier 1/Tier 2 status, smoke runs, **8 open cross-cutting findings**, session log. The single source of truth for "where are we?" |
| 4 | `docs/reviews/README.md` | Review system overview — when to trigger, file shape, severity scale (🚫/⚠️/🔸/🔹), verdict labels |
| 5 | `docs/reviews/review-process.md` | The flow — 8-step review order, finding format (F-NN), verdicts, sign-off |
| 6 | `docs/reviews/review-guide.md` | The 14 review dimensions in detail — read per-dimension during a review, not all at once |
| 7 | `docs/reviews/templates/review-checklist.md` + `templates/review-report.md` | The deliverables you copy per review (date + version stamped in filename) |
| 8 | `docs/component-versions.md` | Versioned snapshot of all 36 remaining components (post-force-graph-removal) |
| 9 | `.claude/STATUS.md` *(use offset/limit/grep — file is ~88K tokens; F-cross-02 flags this)* | Recent decisions log has session-by-session entries; Components table has per-component context |
| 10 | `.claude/CLAUDE.md` + `.claude/AGENTS.md` | Project conventions, registry rules, design tokens, skill mandates |

**Auto-memory** at `C:\Users\AsiaData\.claude\projects\e--2026-ilinxaDOC-ilinxa-ui-pro\memory\MEMORY.md` is loaded automatically. Notable entries that affect this work:
- `feedback_brevity_preference.md` — keep responses short and clear
- `feedback_no_meta_questions_when_pattern_is_locked.md` — don't ask "Q-Ps" when patterns are obvious from prior reviews
- `feedback_re_validation_pass_catches_real_issues.md` — never rubber-stamp work; always re-validate
- `feedback_dynamicity_reusability_primacy.md` — open API surfaces; "add it later" is breaking
- `feedback_no_schedule_offers.md` — DO NOT offer `/schedule` regardless of trigger signals
- `feedback_dont_clear_turbopack_cache_live.md` — never clear turbopack cache while dev server is running
- `project_force_graph_frozen.md` — force-graph was REMOVED 2026-05-08 (renamed-archived to `docs/migrations/force-graph/`); don't propose v3 work unless user reopens
- `project_renderer_registry_pattern.md` — host-pattern (workspace + kanban + flow-canvas) — relevant for upcoming workspace review
- `project_richtext_substrate.md` — Plate substrate (just reviewed for article-body-01)
- `project_registry_live.md` — registry distribution conventions

---

## What was done across sessions 1–4

### Pre-session: planning + system design
- Created `docs/component-versions.md` — versioned snapshot
- Authored `docs/reviews/` review system: README, process, 14-dimension guide, checklist + report templates
- Audited the system + fixed 3 issues (path bug, item-count, README dir diagram)
- Created the master plan in `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md`
- User approved the plan (tiered depth + scripted harness + pilot-then-2-3 cadence)

### Session 1 (pilot) — `kanban-board-01` v0.2 + infra
- Authored `docs/reviews/sweep-tracker.md` (sweep-wide tracker)
- Authored `docs/reviews/templates/review-spotcheck.md` (Tier 2 compact format)
- **Initialized smoke harness** at `e:/tmp/ilinxa-smoke-consumer/` (Next 16 + Tailwind v4 + shadcn CLI v4 + `@ilinxa` registries map)
- Authored `scripts/smoke-all.mjs` driver
- Ran first 37-slug smoke against production Vercel registry
  - 31 pass / 1 expected-fail (`flow-canvas-01`) / 5 unexpected-fail
- **Reviewed kanban-board-01 v0.2** → Pass with follow-ups (6 findings)
- Commit: `7acfb9b`

### Session 2 — `rich-card` v0.4 + F-cross-05 root cause
- Investigated F-cross-05's 5 unexpected-fails. Root cause: 4 components have **bare-name sibling deps** in `registry.json` (`"expandable-text-01"` instead of `"@ilinxa/expandable-text-01"`); shadcn CLI tries to resolve as built-in primitive → 404
- The 5th was `force-graph` — same root cause as `flow-canvas-01` (not in registry)
- **Reviewed rich-card v0.4** → Pass with follow-ups (7 findings; headline F-01: virtualization claimed in API + meta features but **not wired** to render path)
- Added F-cross-06 (sweep-wide usage import-path drift) + F-cross-07 (cross-component dep version drift)
- Same commit as session 1: `7acfb9b`

### Session 3 — force-graph removal + `flow-canvas-01` v0.1 (solo)
- **Removed `force-graph`** pending recreation under new design + plan. v0.2 source + 4 procomp plan iterations renamed-archived to `docs/migrations/force-graph/` (git preserves history). Component count 37 → 36; Tier 1 10 → 9.
- Reviewed flow-canvas-01 v0.1 solo (force-graph paired-partner removed). Pass with follow-ups (7 findings):
  - F-01 (High): F-cross-03 carrier (not in `registry.json`)
  - F-02 (High): meta.ts deps under-declare (4 shadcn primitives + lucide-react missing)
  - F-03 (High): `process.env.NODE_ENV` violates description §6 #10 in 4 files
- **Corrected STATUS.md xyflow-attribution overstatement.** Earlier framing said `proOptions: { hideAttribution: true }` "technically requires xyflow Pro license" — that was wrong. xyflow is MIT; Pro is honor-system community etiquette only.
- Added F-cross-08 (`process.env.NODE_ENV` likely systemic across library)
- Commits: `7acfb9b` (force-graph removal) + `a5e386a` (review + correction)

### Session 4 — `article-body-01` v0.2 + `data-table` v0.1 (paired)
- Reviewed article-body-01 v0.2 → Pass with follow-ups (2 findings: F-01 lucide-react `^0.x` wrong major + non-standard semver — affirms F-cross-07 2/4; F-02 import-path drift)
- Reviewed data-table v0.1 → Pass with follow-ups (4 findings: **F-01 NO procomp docs at all** for the canonical reference; F-02 import-path drift makes F-cross-06 4/4 systemic; F-03 review-guide §3 misrepresents data-table's actual flat shape; F-04 empty `related`)
- F-cross-06 promoted to "Confirmed systemic" (4/4 Tier 1)
- F-cross-07 promoted to "Affirmed 2/4" (rich-card + article-body-01)
- Commit: `ae5a711`

---

## Where we are right now

### Tier 1 progress: 5 of 9 reviewed

| # | Slug | Version | Verdict | Findings | Commit |
|---|---|---|---|---|---|
| 1 | `kanban-board-01` | 0.2.0 | Pass with follow-ups | 6 (2 H, 4 M) | `7acfb9b` |
| 2 | `rich-card` | 0.4.0 (beta) | Pass with follow-ups | 7 (2 H, 4 M, 1 L) | `7acfb9b` |
| 3 | `flow-canvas-01` | 0.1.0 | Pass with follow-ups | 7 (3 H, 3 M, 1 L) | `a5e386a` |
| 4 | `article-body-01` | 0.2.0 | Pass with follow-ups | 2 (1 H, 1 M) | `ae5a711` |
| 5 | `data-table` | 0.1.0 | Pass with follow-ups | 4 (1 H, 2 M, 1 L) | `ae5a711` |
| 6 | `workspace` | 0.1.0 | **next** | — | — |
| 7 | `markdown-editor` | 0.1.0 | next (paired) | — | — |
| 8 | `properties-form` | 0.1.0 | session 6 | — | — |
| 9 | `entity-picker` | 0.1.0 | session 6 | — | — |

### Tier 2 progress: 0 of 27 reviewed

Spot-check sessions are 8–12 per plan. **Don't start Tier 2 yet** — finish Tier 1 first, then mid-sweep checkpoint at session 7.

### Reviewed components — artifact paths

```
docs/procomps/<slug>-procomp/reviews/2026-05-08-v<version>-{checklist,review}.md
```

For each of: `kanban-board-01-procomp` (v0.2.0), `rich-card-procomp` (v0.4.0), `flow-canvas-01-procomp` (v0.1.0), `article-body-01-procomp` (v0.2.0), `data-table-procomp` (v0.1.0).

### Smoke-test harness state

- **Path:** `e:/tmp/ilinxa-smoke-consumer/` (outside the producer repo)
- **Stack:** Next 16 + Tailwind v4 + React 19 + shadcn CLI v4
- **Driver:** `e:/tmp/ilinxa-smoke-consumer/scripts/smoke-all.mjs`
- **Registries map:** `@ilinxa` → `https://ilinxa-proui.vercel.app/r/{name}.json`
- **Latest 37-slug run:** session 1 — **31 pass / 1 expected-fail (`flow-canvas-01`) / 5 unexpected-fail** (`comment-thread-01`, `force-graph`, `post-card-01`, `media-carousel-01`, `story-viewer-01`). Root causes identified in session 2 (4 are F-cross-05; force-graph since removed → drops to 4 unexpected-fail in any fresh run).
- ⚠️ **The result file at `e:/tmp/ilinxa-smoke-consumer/results/2026-05-08-smoke.md` was OVERWRITTEN in session 3** by a single-slug test for flow-canvas-01. The full 37-slug output is preserved in the per-review reports' "Smoke row" sections (cite specific install times: kanban 11.7s, rich-card 12.3s, article-body-01 13.9s, data-table 16.5s, flow-canvas-01 3.0s expected-fail) but no consolidated file. **Recommendation for new session:** re-run `node scripts/smoke-all.mjs` early to get fresh canonical results for the post-force-graph-removal state (expected: 31 pass / 1 expected-fail / 4 unexpected-fail).
- **`KNOWN_MISSING` set:** `["flow-canvas-01"]` (force-graph was removed from SLUGS array entirely in session 3, not added to KNOWN_MISSING)
- **Single-slug filter:** `node scripts/smoke-all.mjs --slug <name>`

### Cross-cutting findings — 8 open

| ID | Severity | Status | Headline |
|---|---|---|---|
| F-cross-01 | ⚠️ High | Open | **5 components** missing `guide.md`: `detail-panel`, `entity-picker`, `filter-stack`, `markdown-editor`, `properties-form` (originally 6 — `force-graph` was the 6th but was removed this session). data-table is a 6th outlier with all three docs missing (description+plan+guide), surfaced as data-table F-01 in the session 4 review. |
| F-cross-02 | 🔸 Medium | Open | `.claude/STATUS.md` ~88K tokens; needs `STATUS-archive.md` split |
| F-cross-03 | 🚫 Blocker | Open (narrowed) | `flow-canvas-01` absent from `registry.json` (was `flow-canvas-01` + `force-graph`; `force-graph` removed) |
| F-cross-04 | 🔸 Medium | Open | `pnpm build` fails on Google Fonts (Playfair Display) network access in offline/sandboxed envs; `tsc + lint + registry:build` cover correctness |
| F-cross-05 | ⚠️ High | Open with concrete fix | 4 components have **bare-name sibling deps** in `registry.json`: `comment-thread-01`, `post-card-01`, `media-carousel-01`, `story-viewer-01`. Fix: namespace as `@ilinxa/<slug>`. Mechanical, batchable. |
| F-cross-06 | 🔸 Medium | **Confirmed systemic (4/4 Tier 1)** | All reviewed components have producer-side `@/registry/components/data/<slug>` import paths in `usage.tsx`. Sweep-wide single-commit fix at session 7 mid-checkpoint. |
| F-cross-07 | ⚠️ High | **Affirmed 2/4** | Rich-card declares `@dnd-kit/sortable: ^11.x` (wrong major; non-standard `^N.x`); article-body-01 declares `lucide-react: ^0.x` (wrong major). Recommend `pnpm validate:meta-deps` CI lint check. |
| F-cross-08 | ⚠️ High | Open | `process.env.NODE_ENV` likely systemic across library (4 occurrences in flow-canvas-01 violate description §6 #10). Recommend relaxing the criterion to allow standard NODE_ENV dev-warn gates. |

### Component-level findings inventory (26 total across 5 reviews)

These all live in the per-component review docs; see `sweep-tracker.md` for the table summary.

---

## Key decisions made (with rationale)

1. **Tiered review depth.** Full 14-dimension reviews for ~10 mature/critical (Tier 1) + spot-check + smoke for ~27 v0.1.0 alphas (Tier 2). Tier 2 uses `templates/review-spotcheck.md` (compact format with 4 fixed dimensions + 1 rotating + max 5 findings).

2. **Scripted smoke harness against production.** Tested against the live Vercel registry, not local dev server. Reasoning: only production exposes CDN/rewrite/missing-artifact issues; local would mask them. F-cross-03 only surfaces against deployed.

3. **Pilot-then-2-3-per-session cadence.** Session 1 was the pilot (validates templates end-to-end). Subsequent: 2-3 reviews per session.

4. **`flow-canvas-01` reviewed locally with F-cross-03 as Blocker, NOT shipped first.** Process discipline — the review captures the v0.1.0 state honestly; shipping before the review would hide the defect the review system was designed to catch. Concrete fix in F-cross-03's note.

5. **Six missing guides treated as per-review findings, not authored upfront.** Author cost is ~1-2 hours per guide; six = a full session of pure docs work. Each becomes a Dimension 1 finding; rollup batches them into a documentation backlog.

6. **STATUS.md size flagged but not yet split.** F-cross-02 captures the issue; deferred to a dedicated follow-up plan. Workaround: use offset/limit/grep to read STATUS.md (Read fails on the whole file).

7. **`force-graph` removed pending recreation.** v0.2 was problematic; user committed to recreating under new design. Source + procomp docs renamed-archived to `docs/migrations/force-graph/` (git preserves history). `sigma-react-pro` skill retained as v3 reference. Library count 37 → 36; Tier 1 10 → 9.

8. **xyflow attribution etiquette correction.** `@xyflow/react` is MIT; `proOptions: { hideAttribution: true }` is fully permitted by the license. xyflow Pro is honor-system community etiquette ("please support if you hide the badge"), not a legal requirement. Earlier STATUS.md framing was wrong; corrected this session with historical claim preserved in quotes for searchability.

9. **F-cross-06 sweep-wide fix deferred to session 7 mid-checkpoint.** Single-commit grep-replace across all 36 components' `usage.tsx` files is more efficient than per-component fixes. Session 7 in the plan is "no new reviews; cross-cutting triage" — natural fit.

10. **Per-session commits.** 3 commits to date: `7acfb9b` (review system + sessions 1+2 + force-graph removal), `a5e386a` (session 3 + xyflow correction), `ae5a711` (session 4). Future sessions should follow the same per-session-commit pattern.

---

## What's next — session 5 plan

**Per master plan §3:** **paired Tier 1 — `workspace` v0.1 + `markdown-editor` v0.1** (composite + editor).

### Pre-flight reading for session 5

- `docs/procomps/workspace-procomp/` — workspace planning docs (description + plan + guide expected)
- `docs/procomps/markdown-editor-procomp/` — markdown-editor planning docs (description + plan; **`guide.md` missing per F-cross-01**)
- Per-component STATUS.md rows (use grep — STATUS.md is huge)

### Workspace context

- **Renderer-registry pattern reference** — along with kanban + flow-canvas-01. The `project_renderer_registry_pattern.md` memory specifically calls out workspace as the proven shape.
- **Layout category** — first non-`data` Tier 1 review.
- **Composite component** — likely complex; budget closer to 90 min.

### Markdown-editor context (from STATUS.md context)

- **CodeMirror 6 substrate** (10 npm packages: `@codemirror/{state,view,commands,language,lang-markdown,autocomplete,search}` + `@lezer/{markdown,highlight}` + `marked`)
- **Per-instance `new Marked()`** for preview parsing (Q-P1: avoids global mutation)
- **Three view modes:** edit / split / preview with controlled-or-uncontrolled dispatch + container-query stacking <480px
- **Default 8-item toolbar** (bold/italic/code/link/lists/blockquote/heading-cycle) extensible via `defaultMarkdownToolbar` spread
- **`[[wikilink]]` autocomplete + decoration** via CM6 `StateField` + `StateEffect`; runtime updates re-decorate without remount (validate-pass refinement)
- **Echo-guarded value-prop sync** via `SyncAnnotation` + `lastSyncedValueRef` (Q-P9 — same pattern article-body-01 uses)
- **`Cmd/Ctrl+S → onSave(currentDoc)` payload from live CM6 doc**, NOT React `value` prop (avoids React-batching staleness)
- **28 files** (matches plan §8.1 exactly per STATUS) — among the largest components
- **Missing `guide.md`** — F-cross-01 carrier; will surface as a per-review Dimension 1 finding
- **5 documented plan deviations** in STATUS row (useState for view, view-passed-to-handle, mount-time prop snapshot, separator id-prefix, size-limit deferred) — read STATUS row carefully

### What you'll likely find

Based on patterns across 4 prior reviews, expect:
- **F-cross-06 (import-path drift)** in usage.tsx for both. (Don't fix per-component; track for sweep-wide session 7.)
- **F-cross-07 (dep version drift)** in either component's `meta.ts.dependencies.npm`. Verify against producer's `package.json`.
- **F-cross-08 (`process.env.NODE_ENV`)** in either if their dev-warn pattern uses NODE_ENV gates.
- **F-cross-01 carrier** for markdown-editor (missing `guide.md`).

The headline (probably) finding for **markdown-editor** is whether its 28 files (matching plan §8.1 exactly) actually deliver everything claimed. The plan deviations in STATUS are documented; verify they're still accurate.

The headline for **workspace** is the renderer-registry pattern's mature implementation — does it match kanban + flow-canvas-01's shape?

### Per-component workflow (from `review-process.md` §1)

Step A — Prep (5 min):
```bash
cd e:/2026/ilinxaDOC/ilinxa-ui-pro
SLUG=workspace; VERSION=0.1.0; DATE=$(date -u +%Y-%m-%d)
mkdir -p docs/procomps/${SLUG}-procomp/reviews
cp docs/reviews/templates/review-checklist.md docs/procomps/${SLUG}-procomp/reviews/${DATE}-v${VERSION}-checklist.md
cp docs/reviews/templates/review-report.md    docs/procomps/${SLUG}-procomp/reviews/${DATE}-v${VERSION}-review.md
# Repeat for markdown-editor
```

Step B — 8-step review order (`review-process.md` §2):
1. description sanity check
2. read root `<slug>.tsx` + `types.ts` (half the time — this is highest-leverage)
3. read `demo.tsx`
4. skim `parts/` + `hooks/`
5. cross-ref `meta.ts` + `registry.json` + `STATUS.md`
6. run verifications (`pnpm tsc --noEmit && pnpm lint && pnpm registry:build`)
7. browser validate (deferred per project gap)
8. re-read `guide.md` last (or `description.md` again if guide missing)

Step C — Verifications (already known clean post-session-3):
- `pnpm tsc --noEmit` — clean
- `pnpm lint` — clean except 1 pre-existing rich-card warning (rich-card F-06 use-virtualizer.ts dead-code)
- `pnpm build` — fails on F-cross-04 (Google Fonts env)
- `pnpm registry:build` — clean
- Smoke install — both passed in session 1's run (workspace 9.8s, markdown-editor 10.8s)

Step D — Tick checklist + write report (use F-NN format from `review-process.md` §6).

Step E — Sign-off:
- Update `docs/reviews/sweep-tracker.md` Tier 1 rows for both
- Add Recent-decisions entry to `.claude/STATUS.md` (use targeted Edit; don't read whole file)
- Commit per-session

### Estimated time

- Workspace alone: ~60-75 min (renderer-registry composite, several file reads needed)
- Markdown-editor alone: ~75-90 min (28 files; CodeMirror substrate to verify; documented plan deviations to validate)
- Tracker + STATUS + commit: ~15 min

**Total: 150-180 min for the paired session** — slightly over the 120 plan budget. May want to budget 2 sessions if context window pressures push.

---

## Conventions / rules to respect

These are non-obvious things that have already burnt time during the sweep:

1. **STATUS.md is huge (~88K tokens).** Don't try to `Read` it whole — fails. Use `Read` with offset/limit OR `Grep` for the specific pattern. F-cross-02 tracks splitting it.

2. **Templates are copied per use, not edited in place.** `cp` from `docs/reviews/templates/` to the procomp folder; **never edit templates while filling them**.

3. **Per-component review files use timestamped + version-tagged names:**
   ```
   docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-{checklist,review}.md
   ```
   Same component re-reviewed at a later version produces a new pair (no overwriting).

4. **Severity emojis are FIXED:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low. Don't substitute. Used in checklist + report + tracker for cross-doc grep.

5. **Verdicts are FIXED:** `Pass` / `Pass with follow-ups` / `Needs revision` / `Block`. Don't invent new ones.

6. **Findings use `F-NN` format** — contiguous numbering across severities, ordered severity-desc → location-asc. Cross-cutting findings use `F-cross-NN` and live in the tracker, not in any single review.

7. **Don't propose force-graph v3 work** unless the user explicitly opens the topic. v3 design + slug TBD; archived material at `docs/migrations/force-graph/` is the bridge.

8. **Don't offer `/schedule`** — user does not use scheduled background agents in this project (per `feedback_no_schedule_offers.md`).

9. **Don't clear turbopack cache while `next dev` is running.** Right sequence: stop → clear → start (per `feedback_dont_clear_turbopack_cache_live.md`).

10. **Smoke harness lives OUTSIDE the producer repo** at `e:/tmp/ilinxa-smoke-consumer/`. Don't try to run smoke from the producer.

11. **Skill mandates from CLAUDE.md** still apply — use `frontend-design`, `configuring-project-memory`, `xyflow-react-pro`, `shadcn-registry-pro` skills when working on those domains. (For pure review work, the relevant skills are descriptive references, not action mandates — read them when reviewing the matching component.)

12. **Brevity preference (memory).** Match question length. Drop preambles. Skip structure when not needed.

13. **Re-validation pass (memory).** Never rubber-stamp work. Always re-validate. Has consistently caught real issues per the memory log.

---

## Files NOT to touch (or touch only with caution)

- **`.claude/HANDOFF.md`** — the OLD handoff from May 2 (218 lines, pre-sweep). Don't overwrite or modify; it documents earlier project state. This new file (`HANDOFF-sweep-paused-session-4.md`) supersedes it for the sweep continuation but doesn't replace it.

- **`docs/migrations/force-graph/`** — frozen archive of removed force-graph v0.2. Don't edit unless v3 work begins. Read-only reference for the eventual recreation.

- **`.claude/skills/sigma-react-pro/`** — retained as v3 reference for force-graph recreation. Don't repurpose.

- **`registry.json`** — DON'T add `flow-canvas-01` until F-cross-03's fix is explicitly authorized. Don't fix the 4 F-cross-05 components' bare-name sibling deps mid-review either; both are tracked as cross-cutting findings for a coordinated fix.

- **Existing review files** — once committed per-session, don't go back and edit. New version → new dated file. Re-reviews on a later version go in a new file in the same `reviews/` subfolder.

---

## Glossary — terms to know

- **Procomp** — pro-component. Each is a sealed folder under `src/registry/components/<category>/<slug>/`.
- **Sweep** — the multi-session review effort, anchored to `docs/component-versions.md`.
- **Tier 1** — full 14-dimension review (9 components, of which 5 done).
- **Tier 2** — compact spot-check + smoke (27 components, 0 done).
- **F-NN** — finding number within a single review (e.g. `F-01` to `F-07`).
- **F-cross-NN** — cross-cutting finding spanning multiple components (8 open).
- **Smoke harness** — the consumer-install test app at `e:/tmp/ilinxa-smoke-consumer/`.
- **Renderer-registry pattern** — consumer-supplied dispatch by `__type` field. Used by workspace, kanban-board-01, flow-canvas-01.
- **`@ilinxa/<slug>`** — namespaced consumer-install path. Producer-side path is `@/registry/components/<category>/<slug>`. **F-cross-06 is about `usage.tsx` files using producer-side instead of consumer-side.**
- **Locked target convention** — every file in `registry.json` is `type: "registry:component"`, `target: "components/<slug>/<sub-path>"`. No exceptions.
- **Sealed folder** — each procomp's source folder is treated as self-contained; only imports from `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps allowed.

---

## If anything looks wrong

- **The sweep-tracker.md is the live state.** If this handoff and the tracker disagree, **trust the tracker**.
- **Recent commits are the source of truth for what shipped.** Use `git log --oneline -10` to verify.
- **Per-component review reports are the source of truth for findings.** This handoff summarizes; the reports are authoritative.
- **STATUS.md Recent-decisions log has session-by-session entries** — the most recent ~5 should match this handoff.

---

## When you're ready

1. Read `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md` (the master plan).
2. Read `docs/reviews/sweep-tracker.md` (live state).
3. Spot-check `git log --oneline -5` (most recent 3 are sweep commits).
4. Confirm you have the picture before continuing.
5. Begin session 5: paired Tier 1 review of `workspace` v0.1 + `markdown-editor` v0.1.

The user will likely say something like "go ahead" or "start session 5" — at that point, follow the per-component workflow in `review-process.md` §1, starting with template instantiation for both components, then planning-doc reads, then code reads, then reports.

**Don't repeat work.** If you find yourself re-reading a doc the previous session already covered, check the existing review reports first — they cite specific lines and findings.

— Claude (sweep session 4 handoff, 2026-05-08)
