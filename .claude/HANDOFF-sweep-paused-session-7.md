# Handoff — procomp review sweep paused at session 7 (Phases 1+2 closed)

> **Date paused:** 2026-05-08
> **Reason for handoff:** clean session boundary mid-Phase-2-checkpoint; user wants to continue in a fresh session as session 7b
> **Last commit:** `edecbc3` — "chore(reviews): handoff doc for sweep-session-7 pause" (this doc + tracker Phase-2 row)
> **Branch:** `master` (all session-7 commits PUSHED to `origin/master`; nothing in-flight locally)
> **Working tree:** clean except `.claude/settings.local.json` (intentionally untracked)

---

## TL;DR — Read this first

We're now **7 sessions** into a 13-session **procomp review sweep**. **Tier 1 is COMPLETE (9/9)** and **session 7 Phases 1+2 are CLOSED** — 4 of the 9 cross-cutting findings resolved this session, 5 commits pushed to `master`.

**Total findings to date:** 53 component-level findings + 10 cross-cutting findings (the original 9 plus F-cross-10 spun out this session). **5 closed in session 7:**
- ✅ F-cross-03 closed (flow-canvas-01 shipped)
- ✅ F-cross-05 closed (44 bare-name refs namespaced; scope expanded)
- ✅ F-cross-06 closed (37 usage.tsx files normalized)
- ✅ F-cross-08 closed (NODE_ENV rule relaxed)
- ✅ F-cross-09 closed (CLI regression diagnosed; harness pinned)

**Remaining open:** F-cross-01 (2 Tier-2 carriers), F-cross-02 (STATUS.md size), F-cross-04 (offline build env), F-cross-07 (3 sub-shapes; resolution = `validate:meta-deps` lint), F-cross-10 (harness hygiene drift).

**Next session is 7b** — continues session 7's master-plan §7 mid-checkpoint with Phases 3–6 (architectural fixes, documentation backlog, per-component v0.1.1 patches, sign-off).

The master plan and live state live in:
- **Master plan:** `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md`
- **Sweep tracker (most-current state):** `docs/reviews/sweep-tracker.md`
- **Prior handoff (session 6):** `.claude/HANDOFF-sweep-paused-session-6.md` — superseded by THIS doc for sweep state, but useful for deeper history

---

## Read these files in this order before doing anything

| # | Path | Why |
|---|---|---|
| 1 | This file | You're here. Read top-to-bottom. |
| 2 | `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md` | The master plan. Already approved by user. §7 covers the mid-sweep checkpoint structure. |
| 3 | `docs/reviews/sweep-tracker.md` | Live state — Tier 1/Tier 2 status, smoke runs, **5 still-open** cross-cutting findings (4 closed this session), session log. **Single source of truth.** |
| 4 | `docs/reviews/README.md` | Review system overview. |
| 5 | `docs/reviews/review-process.md` | The 8-step review order, finding format, verdicts, sign-off. Re-read before any future Tier 2 reviews. |
| 6 | `docs/reviews/review-guide.md` | The 14 review dimensions in detail — read per-dimension during a review. |
| 7 | `docs/reviews/templates/review-spotcheck.md` | Tier 2 spot-check template (for sessions 8–12). |
| 8 | `docs/component-versions.md` | Versioned snapshot of all 36 components (post-force-graph-removal). |
| 9 | `.claude/STATUS.md` *(use offset/limit/grep — file is ~88K tokens; F-cross-02 flags this)* | Pre-session-7 snapshot; session 7 update intentionally deferred per F-cross-02 to avoid bloating the file further. |
| 10 | `.claude/CLAUDE.md` + `.claude/AGENTS.md` | Project conventions, registry rules, design tokens, skill mandates. |
| 11 | The 9 Tier 1 review reports — `docs/procomps/<slug>-procomp/reviews/2026-05-08-v<version>-review.md` | Authoritative findings; consult per topic. |

**Auto-memory** at `C:\Users\AsiaData\.claude\projects\e--2026-ilinxaDOC-ilinxa-ui-pro\memory\MEMORY.md` is loaded automatically. Notable entries:
- `feedback_brevity_preference.md` — keep responses short and clear
- `feedback_no_meta_questions_when_pattern_is_locked.md` — don't ask Q-Ps when patterns are obvious
- `feedback_re_validation_pass_catches_real_issues.md` — never rubber-stamp; always re-validate
- `feedback_dynamicity_reusability_primacy.md` — open API surfaces; "add it later" is breaking
- `feedback_no_schedule_offers.md` — DO NOT offer `/schedule`
- `feedback_dont_clear_turbopack_cache_live.md` — never clear turbopack cache while dev server is running
- `feedback_audit_systematic_scope_before_committing.md` — **NEW (session 7)**: when an F-cross finding says "fix N carriers," programmatically scan for the same shape across the entire surface BEFORE committing; expand-in-same-commit when additional sites are mechanically identical (s7 F-cross-05 went 4 carriers → 44 sites this way)
- `project_force_graph_frozen.md` — force-graph removed 2026-05-08; don't propose v3 work
- `project_renderer_registry_pattern.md` — host-pattern confirmed across 3 host components
- `project_richtext_substrate.md` — Plate + CodeMirror substrates
- `project_registry_live.md` — registry distribution conventions (component count drifts; read `registry.json` for current shape — updated session 7)

---

## What was done across sessions 1–7

### Sessions 1–6 — Tier 1 reviews (recap)

All 9 Tier 1 components reviewed (each "Pass with follow-ups"). 53 component-level findings + 9 cross-cutting findings (F-cross-01..09) surfaced. See HANDOFF-sweep-paused-session-6.md for detailed per-session summaries.

### Session 7 — mid-sweep checkpoint (Phases 1+2 of 6)

**Phase 1 — Smoke harness diagnostic (closed):**

- Pinned smoke harness to `pnpm dlx shadcn@4.6.0` in `scripts/smoke-all.mjs:87` (was `shadcn@latest`).
- Re-ran smoke; got 22/1/13 vs session 5's 19/1/16 — but failure pattern decomposed cleanly:
  - **F-cross-09 sub-mode (A)** → confirmed pure CLI regression in `latest`. Pinning resolved all 9 "try-previous-version" carriers.
  - **F-cross-09 sub-mode (B)** → confirmed 100% peer-dep loop on harness's corrupt `@tailwindcss/postcss: ^10.0.0`. Fixing the range resolved all 3 silent-120s-timeouts (article-body-01 8.0s pass, article-meta-01 5.9s pass, content-card-news-01 6.5s pass). No separate root cause.
  - **F-cross-09 sub-mode (C)** → underlying bug = F-cross-05; new CLI's message text changed from "404 base-nova/<sibling>.json" to "Check if the item name is correct". Merged back into F-cross-05.
- **F-cross-10 NEW** — spun out as a separate finding. Harness `package.json` carries unsatisfiable wrong-major dep ranges (`@tailwindcss/postcss: ^10.0.0`, `react-day-picker: ^10.0.0`, `@types/node: ^9.14.0`) that don't appear in any procomp meta. pnpm pre-validates ALL existing deps before any add, so unsatisfiable existing ranges block unrelated installs and masquerade as procomp/CLI bugs. **Recommended remediation before Tier 2:** `pnpm install --frozen-lockfile` prelude in smoke-all.mjs + harness-hygiene checklist.
- **Anomaly observed during Phase 1:** my `package.json` Edits to `react-day-picker` and `@types/node` reverted between Edit-tool calls (origin not yet identified — possibly file-watcher / hook / linter / restore-from-template). The `@tailwindcss/postcss: ^4` fix did persist. Worth investigating before Tier 2.

**Phase 2 — Sweep-wide single-commit fixes (closed):**

Four fine-grained commits + one tracker commit, all pushed:

| Commit | Finding | Scope |
|---|---|---|
| `fb23a2b` | **F-cross-06** | 37 `usage.tsx` files (36 procomps + `_template`) — replaced `@/registry/components/<category>/<slug>` with `@/components/<slug>`. tsc + lint clean. |
| `b807e35` | **F-cross-08** | `docs/component-guide.md` 3 spots (§7 banned-imports code example, §7 dodge table row, §11.5 Portability violations table row) — `process.env.NODE_ENV` dev-warn gates explicitly allowed; entity-picker plan §12.5 #5 cited as the precedent. |
| `0be5a57` | **F-cross-05** | `registry.json` 44 bare-name internal refs namespaced as `@ilinxa/<slug>`. **Scope expanded:** original 4 carriers had 9 cross-component sibling refs; 35 latent fixtures-base intra-component refs surfaced and were fixed in the same commit (smoke installs base only, so these were never being tested). All 36 fixtures items now correctly namespace their base. |
| `f319ae8` | **F-cross-03** | `registry.json` + `public/r/flow-canvas-01*.json` — flow-canvas-01 shipped to registry as base (26 files) + fixtures (1 file). Pattern matches kanban-board-01 exactly. registryDependencies declared as actual usage (button, context-menu, dialog, textarea) — diverges from `meta.ts` which says `shadcn:[]` (that's F-02 of v0.1 review and a separate Phase 5 v0.1.1 patch). |
| `829863f` | tracker | Sweep-tracker updates: F-cross-09 closure, F-cross-10 new entry, session-7 Phase 1 row. |

**Smoke verification of F-cross-03 + F-cross-05 carriers** is deferred to first action of session 7b — needs Vercel redeploy of `master`, which the `vercel-build` hook handles automatically within minutes of push.

**Total session-7-Phase-2 footprint:** 88 files modified across 5 commits (37 usage.tsx + 1 component-guide + 1 registry.json + 1 sweep-tracker + 47 build artifacts in `public/r/`).

---

## Where we are right now

### Tier 1 progress: 9 of 9 reviewed ✅ (unchanged from session 6)

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

### Tier 2 progress: 0 of 27 reviewed

Spot-checks scheduled for sessions 8–12. **Don't start Tier 2 in session 7b** — finish the cross-cutting cleanup first.

### Smoke-test harness state

- **Path:** `e:/tmp/ilinxa-smoke-consumer/` (outside producer repo)
- **CLI pin:** `pnpm dlx shadcn@4.6.0` (committed)
- **Latest run (session 7 Phase 1):** **22 pass / 1 expected-fail (`flow-canvas-01`) / 13 unexpected-fail**. Breakdown:
  - 9 fails blocked by harness `@types/node: ^9.14.0` (F-cross-10): workspace, markdown-editor, properties-form, detail-panel, filter-stack, author-card-01, page-hero-news-01, share-bar-01, video-player-01
  - 4 fails = F-cross-05 carriers (will resolve once Vercel redeploys with the 0be5a57 fix): comment-thread-01, post-card-01, media-carousel-01, story-viewer-01
- **Files preserved:**
  - `results/2026-05-08-smoke-session5-baseline.md` — session 5's 19/1/16 result (immutable baseline for diagnostic)
  - `results/2026-05-08-smoke.md` — session 7 Phase 1 result (22/1/13)
- **`KNOWN_MISSING` set:** `["flow-canvas-01"]` — **needs to be cleared in session 7b** once Vercel redeploys (flow-canvas-01 is now in registry.json per `f319ae8`).

### Cross-cutting findings — 5 still open (was 9; closed 4 + spun out 1 new this session)

| ID | Severity | Status | Headline |
|---|---|---|---|
| F-cross-01 | ⚠️ High | **Open — 2 Tier 2 carriers remain** | `detail-panel` (Tier 2 session 12) + `filter-stack` (Tier 2 session 8) still missing `guide.md`. data-table missing all 3 docs. **Remaining session-7 work:** author 4 missing guides (markdown-editor, properties-form, entity-picker, data-table) in Phase 4 (likely session 7b). |
| F-cross-02 | 🔸 Medium | **Open** | `.claude/STATUS.md` ~88K tokens; needs `STATUS-archive.md` split. Workaround: offset/limit/grep to read STATUS.md. Session 7's deliberate decision to skip STATUS.md update reinforces the need to fix this. |
| F-cross-03 | ✅ **CLOSED s7** | — | flow-canvas-01 shipped. Smoke-verify via single-slug after Vercel redeploys (first action of session 7b). |
| F-cross-04 | 🔸 Medium | Open | `pnpm build` fails on Google Fonts (Playfair Display) network access in offline/sandboxed envs. `tsc + lint + registry:build` cover correctness. Defer fix to a separate plan. |
| F-cross-05 | ✅ **CLOSED s7** | — | 44 bare-name refs namespaced. Smoke-verify the 4 carriers post-Vercel-redeploy. |
| F-cross-06 | ✅ **CLOSED s7** | — | 37 `usage.tsx` files normalized. Verified by tsc + lint; no smoke verification needed (usage.tsx never ships). |
| F-cross-07 | ⚠️ High | **Open — 3 sub-shapes affirmed** | (a) Wrong-major / non-standard-semver: 2/9 (rich-card `@dnd-kit/sortable: ^11.x`; article-body-01 `lucide-react: ^0.x`). (b) Phantom `radix-ui: ^1.4.3`: 3/3 forms components (markdown-editor + properties-form + entity-picker). (c) Over-declared shadcn primitives: 2/9 (properties-form `tabs`+`badge`; entity-picker `button`+`tabs`). **Session 7b Phase 3 resolution:** author `pnpm validate:meta-deps` lint covering all 3 sub-shapes; audit `pnpm new:component` template for auto-included `radix-ui`; per-component meta drops on the 5 affected Tier 1 components. |
| F-cross-08 | ✅ **CLOSED s7** | — | description §6 #10 relaxed; entity-picker plan §12.5 #5 cited as precedent. No carrier components patched (rule was the bug). |
| F-cross-09 | ✅ **CLOSED s7** | — | shadcn CLI regression resolved by `@4.6.0` pin. Sub-modes A/B/C all explained. New F-cross-10 spun out from investigation. |
| F-cross-10 | ⚠️ High | **NEW (s7) — Open; recommended before Tier 2** | Smoke harness `package.json` hygiene drift — wrong-major ranges block unrelated installs. Recommend `pnpm install --frozen-lockfile` prelude + harness-hygiene checklist. Investigate the auto-revert behavior observed during Phase 1. **Affects:** all session-8+ Tier-2 smoke verification. **Doesn't affect:** procomp library or registry artifacts. |

---

## Per-component v0.1.1 patch backlog (carried forward from session 6)

Many sweep-wide entries are now closed (✅). Per-component items remain:

| Slug | Tier 1 finding | Action | Sweep-wide? |
|---|---|---|---|
| **kanban-board-01** | F-01 hardcoded amber tokens in kanban-note | Replace with semantic tokens | No (per-component v0.2.1) |
| | F-03 dead-code in use-keyboard-actions | Remove | No |
| | F-05 demo indigo swatch | Replace | No |
| | F-06 onDragOver visual feedback | UX polish | No |
| **rich-card** | F-01 virtualization-prop-not-wired | Wire to render path | No |
| | F-02 `@dnd-kit/sortable: ^11.x` wrong major | Fix to `^10.0.0` | Partly (F-cross-07 sub-a) |
| | F-03 unused `separator` dep | Drop from meta | No |
| | F-05 demo says "v0.3 demo" | Update | No |
| | F-06 use-virtualizer.ts dead code | Remove (or wire per F-01) | No |
| | F-07 demo amber colors | Replace | No |
| **flow-canvas-01** | F-02 meta deps under-declared (4 shadcn + lucide) | Fix `meta.ts` declarations | No (registry.json already correct per `f319ae8`) |
| | F-04 stale `related: ["force-graph"]` | Update | No |
| | F-05 plan-vs-actual file count drift + `controls.tsx` not authored | Author or amend plan | No |
| | F-06 STATUS file-count claim wrong | Fix STATUS | No |
| | F-07 xyflow Pro etiquette note | Doc clarification | No |
| **article-body-01** | F-01 `lucide-react: ^0.x` wrong major | Fix to `^1.11.0` | Partly (F-cross-07 sub-a) |
| **data-table** | F-01 NO procomp docs (description + plan + guide all missing) | Author 3 docs | F-cross-01 outlier |
| | F-03 review-guide §3 misrepresents data-table's flat shape | Update review-guide | No |
| | F-04 empty `related: []` | Populate | No |
| **workspace** | F-01 adaptive flatten loses leaves past cap | Fix `flattenSubtreesPastDepth` | No |
| | F-02 plan-locked Alt+Enter not wired | Wire OR amend plan | No |
| | F-04 plan §9 over-states `separator` dep | Strike from plan | No |
| | F-05 7th `focus` reducer action not in plan §2 | Update plan §2 | No |
| | F-06 module-level `inertLogged` | Move to per-instance ref (v0.2) | No |
| | F-07 empty `meta.related` | Populate | No |
| **markdown-editor** | F-02 `guide.md` missing | Author guide | F-cross-01 |
| | F-03 phantom `radix-ui` npm dep | Drop from meta | Partly (F-cross-07 sub-b) |
| | F-05 plan §3.3 vs source `getView()` type drift | Update plan | No |
| | F-06 toolbar empty-`label` separator sentinel | Doc OR add discriminated `type: "separator"` | No |
| | F-07 missing `"workspace"` from `meta.related` | Add | No |
| **properties-form** | F-02 `guide.md` missing | Author guide | F-cross-01 |
| | F-03 phantom `radix-ui` + demo-only `tabs`/`badge` in meta.shadcn | Drop from meta | Partly (F-cross-07 sub-b + sub-c) |
| | F-05 plan §8.1 footer "File count: 22" but list/source = 25 | Fix plan | No |
| | F-06 meta vs registry shadcn-deps drift | Same as F-03 | Partly (F-cross-07) |
| | F-07 `meta.related` could include forms siblings | Expand | No |
| **entity-picker** | F-02 `guide.md` missing | Author guide | F-cross-01 |
| | F-03 phantom `radix-ui` + demo-only `button`/`tabs` in meta.shadcn | Drop from meta | Partly (F-cross-07 sub-b + sub-c) |
| | F-05 plan §6.3 documents `useRef` callback ref but impl uses `useState`-as-callback-ref | Update plan §6.3 | No |
| | F-06 `meta.related` could include detail-panel + markdown-editor | Expand | No |

(F-01 of each component pointing to `process.env.NODE_ENV` is now resolved by F-cross-08's rule relaxation — no per-component patch needed.)
(F-04 of each component pointing to F-cross-06 is now resolved sweep-wide.)

---

## Session 7b plan — continue mid-sweep checkpoint (Phases 3–6)

Per master plan §7. The remaining four phases.

### Phase 3: Architectural fixes

1. **F-cross-10 harness pre-flight.** Before any other smoke-dependent work: investigate the auto-revert behavior observed during Phase 1. Consider re-scaffolding harness fresh from `pnpm create next-app` + `pnpm dlx shadcn@4.6.0 init` if drift becomes intractable. Then add `pnpm install --frozen-lockfile` prelude to `scripts/smoke-all.mjs` so future runs abort fast on hygiene drift.
2. **Smoke-verify session 7 Phase 2 fixes** (post-Vercel-redeploy):
   - Single-slug smoke for the 4 F-cross-05 carriers: `comment-thread-01`, `post-card-01`, `media-carousel-01`, `story-viewer-01`. Should now PASS (no more 404 base-nova).
   - Single-slug smoke for `flow-canvas-01`. Should now PASS (no longer expected-fail). **Update `KNOWN_MISSING` in `scripts/smoke-all.mjs` to remove flow-canvas-01.**
3. **F-cross-07 author `pnpm validate:meta-deps` lint.** New script (likely `scripts/validate-meta-deps.mjs`) that for each component:
   - Greps shipped imports (skip `demo.tsx`, `usage.tsx`, `meta.ts`)
   - Cross-checks against `meta.ts.dependencies.shadcn` (catches over-declared shadcn primitives — sub-shape c)
   - Cross-checks against `meta.ts.dependencies.npm` (catches phantom npm deps — sub-shape b — and version drift vs producer's `package.json` — sub-shape a)
   - Add `radix-ui` to a forbidden-deps list
   - Add to package.json scripts; ideally invoke from `pnpm registry:build`
4. **Audit `pnpm new:component` template** for the auto-included `radix-ui` dep. Either remove it from the template OR add `radix-ui` to a forbidden-deps list in `validate:meta-deps`.
5. **Apply `validate:meta-deps` to the 5 affected Tier 1 components** (rich-card, article-body-01, markdown-editor, properties-form, entity-picker) — drop phantom + demo-only entries from each `meta.ts`.

### Phase 4: Documentation backlog

6. **F-cross-01 author 4 missing guides** (markdown-editor, properties-form, entity-picker — Tier 1 carriers; data-table needs all 3 docs). Detail-panel + filter-stack stay deferred to their Tier 2 reviews. Use the workspace guide as the structural template. Estimated 2 hours per guide; 4 guides = ~8 hours of focused work. **Strong candidate to split into session 7c** if context-window pressures push.

### Phase 5: Per-component v0.1.1 patches

7. **Apply non-sweep-wide v0.1.1 patches** for each Tier 1 component per the backlog above. Many are trivial; **workspace's F-01 (adaptive flatten loses leaves)** is the most substantive. flow-canvas-01's F-02 (meta deps under-declared) is doc-only since registry.json is already correct per `f319ae8`.

### Phase 6: Sign-off

8. Update `docs/reviews/sweep-tracker.md` cross-cutting findings table — close newly-resolved entries, narrow remaining ones.
9. **Decide on STATUS.md.** F-cross-02 flags it as ~88K tokens (oversized). Two options at session-7-final-close:
   - (a) Add a single Recent-decisions line for sessions 7+7b/c (per plan), trim to ~10 entries via the awk truncation pattern from session 5/6 commits.
   - (b) Defer the line, fix F-cross-02 properly (split to STATUS-archive.md), then add the line to the new clean STATUS.md.
   - **Recommendation:** option (b) — F-cross-02's been deferred long enough; session 7's deliberate skip of STATUS.md updates makes (b) the natural exit.
10. Final commit + push.

### Estimated remaining time

- Phase 3 (architectural + smoke verify + lint script): ~120–180 min
- Phase 4 (4 guides): ~8 hours focused — **split to 7c is strongly advised**
- Phase 5 (per-component patches): ~120–180 min
- Phase 6 (sign-off): ~30 min if F-cross-02 stays open; ~90 min if (b) is chosen

**Realistic split:** 7b = Phases 3 + 5, 7c = Phase 4, then 7d = Phase 6 with F-cross-02 fix.

---

## Conventions / rules to respect

These are non-obvious things that have already burnt time during the sweep. **Don't re-litigate.**

1. **STATUS.md is huge (~88K tokens).** Don't try to `Read` it whole — fails. Use `Read` with offset/limit OR `Grep`. F-cross-02 tracks splitting it. Trim to ~10 entries at session sign-off (oldest auto-deleted via `awk 'NR<=99'` pattern — see session 5/6 commits).
2. **Templates are copied per use, not edited in place.** `cp` from `docs/reviews/templates/` to the procomp folder; **never edit templates while filling them**.
3. **Per-component review files use timestamped + version-tagged names:** `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-{checklist,review}.md`.
4. **Severity emojis are FIXED:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low. Don't substitute.
5. **Verdicts are FIXED:** `Pass` / `Pass with follow-ups` / `Needs revision` / `Block`.
6. **Findings use `F-NN` format** — contiguous numbering across severities, ordered severity-desc → location-asc. Cross-cutting findings use `F-cross-NN` and live in the tracker, not in any single review.
7. **Cross-cutting ratio convention** (refined sessions 5+6): X carriers / N reviewed Tier 1. **Use both at-writing-time + sweep-wide framing.**
8. **Don't propose force-graph v3 work** unless the user explicitly opens the topic. Archived material at `docs/migrations/force-graph/`.
9. **Don't offer `/schedule`** — user does not use scheduled background agents in this project.
10. **Don't clear turbopack cache while `next dev` is running.** Right sequence: stop → clear → start.
11. **Smoke harness lives OUTSIDE the producer repo** at `e:/tmp/ilinxa-smoke-consumer/`. Don't try to run smoke from the producer.
12. **Self-review at session sign-off catches real issues.** Sessions 5+6 each had 3-5 cross-doc inconsistencies caught post-commit. Session 7 didn't have a final consistency-review pass — first thing in 7b should be a sanity-check on the 5 commits + tracker entries before continuing.
13. **Skill mandates from CLAUDE.md** still apply — `frontend-design`, `configuring-project-memory`, `xyflow-react-pro`, `shadcn-registry-pro`, `skill-creator-pro` skills when working on those domains.
14. **Brevity preference.** Match question length. Drop preambles. Skip structure when not needed.
15. **Re-validation pass.** Never rubber-stamp work. Always re-validate.
16. **NEW from session 7:** Investigate auto-revert of harness `package.json` edits (Phase 1 anomaly) before relying on harness state in 7b. Don't blindly re-edit the same fields without first understanding what reverts them.
17. **NEW from session 7:** When a sweep-wide cross-cutting fix has a clear systematic shape (e.g., F-cross-05's 4 carriers), audit whether the same shape exists elsewhere before committing. Session 7's expansion of F-cross-05 from 9 sites → 44 (35 latent fixtures bugs surfaced) is the canonical example. Mechanical fixes that ship to consumers should be audit-bounded.

---

## Files NOT to touch (or touch only with caution)

- **`.claude/HANDOFF.md`** — OLD handoff from May 2 (218 lines, pre-sweep). Frozen historical record.
- **`.claude/HANDOFF-sweep-paused-session-4.md`** — superseded by session-6 handoff. Frozen.
- **`.claude/HANDOFF-sweep-paused-session-6.md`** — superseded by THIS doc for sweep state. Useful as deeper history. Don't overwrite.
- **`docs/migrations/force-graph/`** — frozen archive of removed force-graph v0.2.
- **`.claude/skills/sigma-react-pro/`** — retained as v3 reference for force-graph recreation.
- **Existing review files** — once committed per-session, don't go back and edit. New version → new dated file.
- **Historical session-log rows in `sweep-tracker.md`** (rows 1-7-Phase-1, 7-Phase-2) — frozen records of what was true at session close. Don't retroactively edit.
- **The 5 session-7 commits** (`fb23a2b`, `b807e35`, `0be5a57`, `f319ae8`, `829863f`) — pushed to `origin/master`. Don't `--amend` (creates lost-work risk).

---

## Glossary — terms to know

(Unchanged from session-6 handoff; see there for full glossary. Net-new terms in session 7:)

- **Sub-mode (A) / (B) / (C)** — F-cross-09's three distinct fail-shapes in the session-5 fresh smoke. All resolved by the 4.6.0 pin + harness hygiene fix.
- **Harness hygiene drift** — F-cross-10 shorthand for `package.json` accumulating wrong-major dep ranges that block unrelated installs.
- **Latent fixtures bugs** — F-cross-05 sub-finding: 35 fixtures-base intra-component bare-name refs that were never tested by smoke (smoke installs base only) but would 404 if anyone ran `pnpm dlx shadcn add @ilinxa/<slug>-fixtures`. Resolved sweep-wide in `0be5a57`.

---

## Recent commits (session 7 — pushed)

```
829863f review(sweep): close F-cross-09; spin out F-cross-10; session-7 row
f319ae8 review(sweep): F-cross-03 ship flow-canvas-01 to registry
0be5a57 review(sweep): F-cross-05 namespace bare-name internal refs in registry
b807e35 review(sweep): F-cross-08 relax `process.env.NODE_ENV` portability rule
fb23a2b review(sweep): F-cross-06 fix usage.tsx import paths sweep-wide
ca62f08 chore(reviews): handoff doc for sweep-session-6 pause  [← prior handoff]
a8d38fe review(sweep): session 6 consistency fixes
667173d review(properties-form + entity-picker): v0.1 + v0.1 sweep session 6
b5ad5d6 review(sweep): session 5 consistency fixes
f4fbf3f review(workspace + markdown-editor): v0.1 + v0.1 sweep session 5
```

All 15 sweep commits since `7263286` pushed to `origin/master` 2026-05-08.

---

## If anything looks wrong

- **The sweep-tracker.md is the live state.** If this handoff and the tracker disagree, **trust the tracker**.
- **Recent commits are the source of truth for what shipped.** Use `git log --oneline -10` to verify.
- **Per-component review reports are the source of truth for findings.** This handoff summarizes; the reports are authoritative.
- **STATUS.md is intentionally NOT updated for session 7.** F-cross-02 deferral; session-7 record lives in the tracker + this handoff. Will be reconciled at sweep close (session 13) or whenever F-cross-02 is fixed.

---

## When you're ready

1. Read `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md` (master plan; especially §7).
2. Read `docs/reviews/sweep-tracker.md` (live state — confirm it agrees with this handoff's "5 closed / 5 open" cross-cutting count).
3. Spot-check `git log --oneline -7` (top 5 are session-7 commits).
4. Confirm Vercel has redeployed (the production registry should now serve the namespaced `@ilinxa/<slug>` deps and the new `flow-canvas-01.json` artifact).
5. Begin session 7b — start with **Phase 3 step 1 (F-cross-10 harness pre-flight)** since downstream verification depends on a clean harness.

The user will likely say "go ahead" or "start session 7b" — at that point, follow the Phase 3 → 6 order above. **Don't skip Phase 3 step 1** (harness pre-flight) — every smoke-verify needs the harness clean first.

**Don't repeat work.** If you find yourself re-reading a doc the previous session already covered, check the existing review reports first — they cite specific lines and findings.

— Claude (sweep session 7 handoff, 2026-05-08)
