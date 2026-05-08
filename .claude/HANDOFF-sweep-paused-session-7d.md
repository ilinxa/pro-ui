# Handoff — procomp review sweep paused at session 7d (mid-checkpoint Phases 1-6 ALL CLOSED)

> **Date paused:** 2026-05-09
> **Reason for handoff:** mid-sweep checkpoint fully closed; Tier 2 reviews unblocked; clean session boundary before sessions 8-12 begin
> **Last commit:** `3fe1f00` — `review(sweep): Phase 6 self-review — 5 refinements applied` (pushed to `origin/master`)
> **Branch:** `master` — clean working tree except `.claude/settings.local.json` (intentionally untracked)

---

## TL;DR — Read this first

**Mid-sweep checkpoint Phases 1-6 ALL CLOSED across sessions 7 / 7b / 7c / 7d.** Tier 1 was already closed at 9/9 in session 6. The 6 Phases of the mid-sweep checkpoint (per master plan §7) closed sequentially:

- **Phase 1** (s7): smoke harness diagnostic — F-cross-09 closed via `shadcn@4.6.0` pin + harness hygiene fix; F-cross-10 spun out
- **Phase 2** (s7): 4 sweep-wide cross-cutting fixes — F-cross-03 + F-cross-05 + F-cross-06 + F-cross-08 all CLOSED in 4 fine-grained commits
- **Phase 3** (s7b): F-cross-07 + F-cross-10 CLOSED — `pnpm validate:meta-deps` lint shipped + 32 meta.ts files patched + smoke harness baseline locked + smoke-verified F-cross-03/05 post-Vercel-redeploy
- **Phase 4** (s7c): F-cross-01 Tier 1 dimension fully CLOSED — 4 missing-procomp-doc carriers authored (data-table full trio + 3 forms guides; ~2.6K lines new docs)
- **Phase 5** (s7b): 8 Tier 1 components patched to v0.1.1 / 0.2.1 / 0.4.1 — 3 substantive code fixes + ~14 plan-doc nits + version bumps
- **Phase 6** (s7d): F-cross-02 CLOSED via b3 hybrid — STATUS.md split into lean snapshot + STATUS-archive.md (frozen) + `.claude/decisions/` per-file convention

**Cross-cutting status: 8 of 10 closed.** Open:
- **F-cross-01** — 2 Tier 2 carriers (detail-panel session 12, filter-stack session 8) per master plan; their guides are authored alongside their Tier 2 reviews, NOT as standalone work
- **F-cross-04** — `pnpm build` fails on `next/font/google` Playfair Display fetch in offline/sandboxed envs; environmental, deferred to a separate plan

**Tier 2 reviews unblocked.** Sessions 8-12 can begin. Sweep close + rollup remain at session 13 per master plan.

The master plan and live state live in:
- **Master plan:** `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md`
- **Sweep tracker:** `docs/reviews/sweep-tracker.md` (single source of truth)
- **Phase 4 plan (executed in 7c):** `.claude/PHASE-4-PLAN.md` (frozen historical reference)
- **Prior handoff:** `.claude/HANDOFF-sweep-paused-session-7.md` — superseded by THIS doc; useful for deeper s7 history

---

## Read these files in this order before doing anything

| # | Path | Why |
|---|---|---|
| 1 | This file | You're here. Read top-to-bottom. |
| 2 | [`.claude/STATUS.md`](STATUS.md) | Lean current snapshot (~8 KB; single Read works). Components table + Open decisions/TODOs + 5 most-recent decision pointers. |
| 3 | [`.claude/decisions/README.md`](decisions/README.md) | The per-decision file convention (frontmatter, naming, when-to-add). New since session 7d Phase 6. |
| 4 | [`.claude/decisions/`](decisions/) | 5 decision files covering sessions 7 / 7b-Phase-3 / 7b-Phase-5 / 7c-Phase-4 / 7d-Phase-6. Read selectively per current focus. |
| 5 | [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md) | **Single source of truth** for Tier 1/Tier 2 status, smoke runs, all 10 cross-cutting findings (8 closed, 2 open), session log. |
| 6 | [`docs/reviews/templates/review-spotcheck.md`](../docs/reviews/templates/review-spotcheck.md) | Tier 2 spot-check template (used in sessions 8-12). |
| 7 | [`docs/component-versions.md`](../docs/component-versions.md) | Versioned snapshot of all 36 components. Refreshed 2026-05-09 after Phase 5 v0.1.1 patches. |
| 8 | `C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md` | Master plan. Approved by user; §7 covers the now-closed mid-checkpoint. Sessions 8-12 are Tier 2 spot-checks. |
| 9 | [`docs/reviews/review-process.md`](../docs/reviews/review-process.md) + [`docs/reviews/review-guide.md`](../docs/reviews/review-guide.md) | The 8-step review order + 14 review dimensions (post-Phase-5 split into "simple primitive" vs "host pattern" anchors). Re-read before starting Tier 2 spot-checks. |
| 10 | [`.claude/STATUS-archive.md`](STATUS-archive.md) | **Frozen** pre-2026-05-09 history. Reference if you need session 1-6 context; otherwise skip. |
| 11 | [`.claude/CLAUDE.md`](CLAUDE.md) + [`.claude/AGENTS.md`](AGENTS.md) | Project conventions, registry rules, design tokens, skill mandates. "Progress tracking" section updated 2026-05-09 to reflect the new convention. |

**Auto-memory** at `C:\Users\AsiaData\.claude\projects\e--2026-ilinxaDOC-ilinxa-ui-pro\memory\MEMORY.md` is loaded automatically. New entries this session worth knowing:

- `project_decision_log_convention.md` — `.claude/decisions/<date>-<slug>.md` per-file convention; STATUS.md slim snapshot only
- `project_validate_meta_deps_lint.md` — `pnpm validate:meta-deps` catches F-cross-07 sub-shapes; chained into `pnpm vercel-build`
- `project_smoke_harness.md` — harness pre-flight + --overwrite + reset workflow; CLI pinned to shadcn@4.6.0
- `feedback_decision_question_format.md` — branching decisions structured as **Problem / Options / Differences / Recommendation**; no preamble

---

## What was done across sessions 7-7d

### Session 7 — Phases 1+2

**Phase 1 (smoke harness diagnostic):**
- F-cross-09 closed: shadcn CLI pinned to `pnpm dlx shadcn@4.6.0` in `scripts/smoke-all.mjs`
- 3 sub-modes diagnosed: (A) pure CLI regression in `latest`; (B) peer-dep loop on harness's corrupt `@tailwindcss/postcss: ^10.0.0`; (C) merged into F-cross-05 (CLI message-text changed but underlying bug persisted)
- F-cross-10 spun out: harness `package.json` hygiene drift (auto-revert anomaly investigated in 7b)

**Phase 2 (4 sweep-wide commits + 1 tracker):**
- `fb23a2b` F-cross-06 — 37 `usage.tsx` files normalized to `@/components/<slug>` (consumer-side paths)
- `b807e35` F-cross-08 — `process.env.NODE_ENV` dev-warn gates explicitly allowed in component-guide §7
- `0be5a57` F-cross-05 — 44 bare-name internal references namespaced as `@ilinxa/<slug>` (4→44 scope expansion via audit)
- `f319ae8` F-cross-03 — flow-canvas-01 shipped to registry.json
- `829863f` tracker bookkeeping; `c34d8f2` self-review consistency fix

**Decision file:** [`.claude/decisions/2026-05-08-session-7-phases-1-2.md`](decisions/2026-05-08-session-7-phases-1-2.md)

### Session 7b — Phase 3 (steps 1-5)

- F-cross-10 closed: harness baseline committed in 3 harness-only commits (`e2e7a7b` baseline / `d53315a` pre-flight + HARNESS.md / `879cf8a` --overwrite + clear KNOWN_MISSING). Auto-revert mystery solved (root cause: `pnpm add` invocations within shadcn-add).
- F-cross-03 + F-cross-05 smoke-verified post-Vercel-redeploy — all 5 single-slug smokes pass
- F-cross-07 closed: `pnpm validate:meta-deps` lint shipped (`c3f2ba6`); audit revealed 74 high findings across 32 of 36 components (much wider than the originally-tracked 5 Tier 1 carriers per audit-systematic-scope memory); 32 meta.ts files patched in `65ccf6f`; chain into `vercel-build` at `25466df` + `aa89388`
- Step 4 (scaffolder audit) was no-op — `_template/_template/meta.ts` already generates empty deps

**Decision file:** [`.claude/decisions/2026-05-09-session-7b-phase-3.md`](decisions/2026-05-09-session-7b-phase-3.md)

### Session 7b — Phase 5 (per-component v0.1.1 patches)

- `153949c` plan-doc nits + meta.related + kanban dead code (17 files)
- `80f60b3` kanban F-01 — hardcoded amber → palette swatches via `findSwatch`/`swatchCssColor`
- `3240ba0` rich-card v0.4.1 — removed unwired `virtualize` prop + dead `useTreeVirtualizer` hook + `@tanstack/react-virtual` dep + 8-spot doc cleanup
- `2c04587` workspace F-01 — substantive bug fix; `flattenSubtreesPastDepth` now uses `collapseToBalancedSplits` to preserve all leaves (was silently dropping all but leftmost via `collapseToFirstLeaf`; Q12 contract restored)
- `396c986` 8 Tier 1 component versions bumped + docs/component-versions.md refresh
- `9dd33cc` tracker close

**New versions:** kanban-board-01 0.2.1 / rich-card 0.4.1 / flow-canvas-01 0.1.1 / data-table 0.1.1 / workspace 0.1.1 / markdown-editor 0.1.1 / properties-form 0.1.1 / entity-picker 0.1.1. (article-body-01 unchanged — all findings closed sweep-wide).

**Decision file:** [`.claude/decisions/2026-05-09-session-7b-phase-5.md`](decisions/2026-05-09-session-7b-phase-5.md)

### Session 7c — Phase 4 (4 missing procomp guides)

- `5389bee` data-table full trio (description 212L + plan 304L + guide 529L; closes F-01 of v0.1 review)
- `d169815` properties-form guide (~530L)
- `96588dd` entity-picker guide (~491L)
- `e6aa688` markdown-editor guide (~522L; the heaviest — bundle ceiling + GFM + wikilink + CM6 + 7 composition patterns)
- `9279370` tracker close
- `eb04f8e` Phase 4 plan (authored ahead of execution at `.claude/PHASE-4-PLAN.md`; validated with 7 refinements)

All guides follow the workspace template: When-to-use / NOT-to-use / 5-min walkthrough / mental model / 5-7 composition patterns / 7-9 gotchas / 5-6 cookbook recipes / v0.2 candidates / migration notes / Reference. F-cross-01 Tier 1 dimension fully closed.

**Decision file:** [`.claude/decisions/2026-05-09-session-7c-phase-4.md`](decisions/2026-05-09-session-7c-phase-4.md)

### Session 7d — Phase 6 (F-cross-02 closure + sweep mid-checkpoint sign-off)

- `93cead6` STATUS.md split via b3 hybrid: 88K → 8.1K bytes; STATUS-archive.md created; `.claude/decisions/` directory + README + 4 catch-up files
- `3fe1f00` self-review pass — 5 refinements (Procomp-docs column dropped; CLAUDE.md updated; Phase 6 decision file authored; README cutoff nuance; sweep-tracker tier-2 mis-categorization for media-carousel-01 fixed)

**Decision file:** [`.claude/decisions/2026-05-09-session-7d-phase-6.md`](decisions/2026-05-09-session-7d-phase-6.md)

---

## Where we are right now

### Tier 1 progress: 9 of 9 reviewed ✅, all v0.1.1 patches shipped

| # | Slug | Version | Verdict | All Findings Closed? |
|---|---|---|---|---|
| 1 | `kanban-board-01` | 0.2.1 | Pass with follow-ups | F-01/03/04/05 closed; F-06 deferred to v0.3 |
| 2 | `rich-card` | 0.4.1 | Pass with follow-ups | All closed (F-02/03/04 sweep-wide; F-01/05/06 in `3240ba0`) |
| 3 | `flow-canvas-01` | 0.1.1 | Pass with follow-ups | F-02/04/05/06 closed; F-03 sweep-wide; F-07 informational |
| 4 | `article-body-01` | 0.2.0 | Pass with follow-ups | All closed sweep-wide (F-01 by F-cross-07; F-02 by F-cross-06) |
| 5 | `data-table` | 0.1.1 | Pass with follow-ups | F-01 (3 docs) closed in 7c; F-02/03/04 closed |
| 6 | `workspace` | 0.1.1 | Pass with follow-ups | F-01 substantive fix in `2c04587`; F-02/04/05/07 closed; F-06 deferred to v0.2 |
| 7 | `markdown-editor` | 0.1.1 | Pass with follow-ups | F-01/03/04 sweep-wide; F-02 (guide) in 7c; F-05/06/07 in 7b Phase 5 |
| 8 | `properties-form` | 0.1.1 | Pass with follow-ups | F-01/03/04/06 sweep-wide; F-02 (guide) in 7c; F-05/07 in 7b Phase 5 |
| 9 | `entity-picker` | 0.1.1 | Pass with follow-ups | F-01/03/04 sweep-wide; F-02 (guide) in 7c; F-05/06 in 7b Phase 5 |

### Tier 2 progress: 0 of 27 reviewed (sessions 8-12 next)

Per master plan §"Session schedule":

- **Session 8:** category-cloud-01, filter-bar-01, filter-stack, grid-layout-news-01, author-card-01 (5 — forms + layout + 1 marketing). filter-stack guide authored as part of its review.
- **Session 9:** newsletter-card-01, page-hero-news-01, share-bar-01, story-viewer-01, video-player-01 (5 — marketing + media)
- **Session 10:** engagement-bar-01, media-carousel-01, post-card-01, article-meta-01, comment-thread-01, content-card-news-01 (6 — data part 1)
- **Session 11:** event-card-01, expandable-text-01, info-list-01, people-grid-01, progress-timeline-01, project-card-01 (6 — data part 2)
- **Session 12:** registration-card-01, schedule-list-01, story-rail-01, thumb-list-01, detail-panel (5 — data finish + feedback). detail-panel guide authored as part of its review.

### Smoke-test harness state

- **Path:** `e:/tmp/ilinxa-smoke-consumer/` (separate git, never pushed)
- **CLI pin:** `pnpm dlx shadcn@4.6.0` (per F-cross-09)
- **Pre-flight:** `pnpm install --frozen-lockfile` runs at start of `node scripts/smoke-all.mjs`; aborts fast on drift
- **Reset between runs:** `git checkout -- package.json pnpm-lock.yaml && pnpm install --frozen-lockfile`
- **Latest run:** session 7b verification smoke (5 single-slug, all pass) for F-cross-03/05 carriers post-Vercel-redeploy
- **Documentation:** `e:/tmp/ilinxa-smoke-consumer/HARNESS.md` covers 3 reset workflows + the CLI pin + KNOWN_MISSING

### Cross-cutting findings — 8 closed, 2 open

| ID | Severity | Status | Headline |
|---|---|---|---|
| F-cross-01 | ⚠️ High | **Open — 2 Tier 2 carriers only** | detail-panel (s12) + filter-stack (s8) missing guide.md; authored as part of their Tier 2 reviews per master plan |
| F-cross-02 | 🔸 Medium | ✅ CLOSED s7d | STATUS.md split via b3 hybrid; 88K → 8.1K; per-decision files convention live |
| F-cross-03 | 🚫 Blocker | ✅ CLOSED s7 | flow-canvas-01 shipped to registry; smoke-verified post-Vercel-redeploy |
| F-cross-04 | 🔸 Medium | **Open** | `next/font/google` offline build env; defer to separate plan |
| F-cross-05 | ⚠️ High | ✅ CLOSED s7 | 44 bare-name refs namespaced; smoke-verified post-Vercel-redeploy |
| F-cross-06 | 🔸 Medium | ✅ CLOSED s7 | 37 usage.tsx files normalized |
| F-cross-07 | ⚠️ High | ✅ CLOSED s7b | validate-meta-deps lint shipped + chained into vercel-build; 32 meta.ts files patched |
| F-cross-08 | ⚠️ High | ✅ CLOSED s7 | process.env.NODE_ENV dev-warn gates allowed |
| F-cross-09 | ⚠️ High | ✅ CLOSED s7 | shadcn CLI pinned to @4.6.0; 3 sub-modes resolved |
| F-cross-10 | ⚠️ High | ✅ CLOSED s7b | smoke harness baseline + pre-flight + --overwrite + auto-revert mystery resolved |

---

## Conventions / rules to respect (post-Phase-6)

These are non-obvious things that have already burnt time. **Don't re-litigate.**

1. **STATUS.md is now lean (~8 KB).** Read it normally — single Read works. Don't append "Recent decisions" entries to it; author per-decision files at `.claude/decisions/<date>-<slug>.md` instead, and surface in STATUS.md's "Recent activity" pointer list (keep top-5).
2. **STATUS-archive.md is FROZEN.** Don't extend it. Pre-2026-05-09 history only.
3. **Per-decision files:** YAML frontmatter (`date / session / phase / type / commits / components / findings / status`) + Summary / Context / Outcome / Cross-references sections. Convention at `.claude/decisions/README.md`.
4. **Templates copied per use, not edited in place.** `cp` from `docs/reviews/templates/` to the procomp folder; never edit templates while filling them.
5. **Per-component review files use timestamped + version-tagged names:** `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-{checklist,review,spotcheck}.md`.
6. **Severity emojis are FIXED:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low.
7. **Verdicts are FIXED:** Pass / Pass with follow-ups / Needs revision / Block.
8. **Findings use `F-NN` format** — contiguous numbering across severities, ordered severity-desc → location-asc. Cross-cutting findings use `F-cross-NN`.
9. **Cross-cutting ratio convention:** X carriers / N reviewed Tier 1.
10. **Don't propose force-graph v3** unless the user explicitly opens the topic. Archived material at `docs/migrations/force-graph/`.
11. **Don't offer `/schedule`** — user does not use scheduled background agents.
12. **Don't clear turbopack cache while `next dev` is running.** Right sequence: stop → clear → start.
13. **Smoke harness lives OUTSIDE the producer repo** at `e:/tmp/ilinxa-smoke-consumer/`. Don't push it. Always run `pnpm install --frozen-lockfile` pre-flight.
14. **Self-review at session sign-off catches real issues.** This handoff itself is the result of a self-review pass that found 5 issues post-Phase-6.
15. **Decision-question format** is mandatory for branching decisions: **Problem / Options / Differences / Recommendation**. No preamble. (Per `feedback_decision_question_format.md`.)
16. **Brevity preference.** Match question length. Drop preambles. Skip structure when not needed.
17. **Audit systematic scope before sweep-wide commits.** Programmatically scan for the same shape across the entire surface BEFORE committing; expand-in-same-commit when additional sites are mechanically identical (precedent: F-cross-05 4 → 44, F-cross-07 5 → 32).
18. **Skill mandates from CLAUDE.md** still apply — `frontend-design`, `configuring-project-memory`, `xyflow-react-pro`, `shadcn-registry-pro`, `skill-creator-pro` skills when working in those domains.

---

## Files NOT to touch (or touch only with caution)

- **`.claude/HANDOFF.md`** — OLD handoff from May 2 (218 lines, pre-sweep). Frozen historical record.
- **`.claude/HANDOFF-sweep-paused-session-4.md`** — superseded.
- **`.claude/HANDOFF-sweep-paused-session-6.md`** — superseded by session-7 handoff.
- **`.claude/HANDOFF-sweep-paused-session-7.md`** — superseded by THIS doc. Useful as deeper s7 history.
- **`.claude/STARTER-PROMPT-session-7b.md`** — frozen historical kick-off doc.
- **`.claude/PHASE-4-PLAN.md`** — frozen plan, executed in session 7c. Don't extend.
- **`.claude/STATUS-archive.md`** — frozen pre-2026-05-09 history. Don't extend.
- **`docs/migrations/force-graph/`** — frozen archive of removed force-graph v0.2.
- **`.claude/skills/sigma-react-pro/`** — retained as v3 reference for force-graph recreation.
- **Existing review files** — once committed per-session, don't go back and edit. New version → new dated file.
- **Historical session-log rows in `sweep-tracker.md`** — frozen records of what was true at session close. Don't retroactively edit.
- **The sweep commits (sessions 7-7d)** — pushed to `origin/master`. Don't `--amend`.

---

## What session 8 starts with

Tier 2 spot-checks. Per master plan §"Session schedule" + tracker:

**Session 8 components (5):**
1. `category-cloud-01` (forms)
2. `filter-bar-01` (forms)
3. `filter-stack` (forms — **author guide.md as part of the review** per F-cross-01 Tier 2 carrier convention)
4. `grid-layout-news-01` (layout)
5. `author-card-01` (marketing)

**Workflow per Tier 2 spot-check** (25-35 min hard time-box per `docs/reviews/review-process.md`):
1. `cp docs/reviews/templates/review-spotcheck.md docs/procomps/<slug>-procomp/reviews/2026-05-XX-v<version>-spotcheck.md`
2. Read description + plan + guide (each component already has all 3 — verify with `ls docs/procomps/<slug>-procomp/`)
3. Read `<slug>.tsx` + spot-check `parts/` if any
4. Run `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps`
5. Single-slug smoke: `cd e:/tmp/ilinxa-smoke-consumer && node scripts/smoke-all.mjs --slug <name>` (don't forget the harness reset between runs)
6. Author at most 5 findings per spot-check; pick 1 rotating dimension to dive on
7. Verdict + sign-off

**At session 8 sign-off:**
- One decision file at `.claude/decisions/2026-05-XX-session-8-tier2-batch-1.md`
- Update STATUS.md "Recent activity" pointer list (keep top-5)
- Update sweep-tracker (Tier 2 rows; smoke run row; F-cross-01 status when filter-stack guide lands)

**Don't expect** to find new cross-cutting findings — the lint + smoke harness + per-decision convention are guards. If something does surface, follow the F-cross-NN escalation pattern.

---

## Recent commits — sessions 7-7d

```
3fe1f00 review(sweep): Phase 6 self-review — 5 refinements applied
93cead6 review(sweep): close F-cross-02 — Phase 6 sign-off via b3 hybrid
9279370 review(sweep): close Phase 4 in tracker — F-cross-01 Tier 1 fully resolved
e6aa688 docs(markdown-editor): Phase 4 — author consumer guide
96588dd docs(entity-picker): Phase 4 — author consumer guide
d169815 docs(properties-form): Phase 4 — author consumer guide
5389bee docs(data-table): Phase 4 — author full procomp doc trio (closes F-01)
eb04f8e chore(reviews): Phase 4 plan for session 7c
9dd33cc review(sweep): close Phase 5 in tracker — 8 Tier 1 v0.1.1 patches shipped
396c986 review(sweep): bump 8 Tier 1 component versions for Phase 5 v0.1.1 patches
2c04587 review(workspace): F-01 v0.1.1 — adaptive flatten preserves all leaves
3240ba0 review(rich-card): v0.4.1 — remove unwired virtualize prop + dead hook + dep
80f60b3 review(kanban-board-01): F-01 v0.2.1 — palette-driven note color
153949c review(sweep): Phase 5 v0.1.1 patches — plan-doc nits, meta.related, kanban dead code
aa89388 chore(scripts): vercel-build composes registry:build (deploy-time lint guard)
25466df review(sweep): close F-cross-07; chain validate:meta-deps into registry:build
65ccf6f review(sweep): F-cross-07 fix meta-deps drift across 32 components
2f907bd review(sweep): update F-cross-07 status with lint audit results
c3f2ba6 feat(scripts): validate-meta-deps lint for F-cross-07 audit
c46352b review(sweep): close F-cross-10; smoke-verify F-cross-03 + F-cross-05; session-7b row
```

All pushed to `origin/master` 2026-05-09. Vercel auto-redeployed; production registry artifacts are current.

---

## If anything looks wrong

- **The sweep-tracker.md is the live state.** If this handoff and the tracker disagree, **trust the tracker**.
- **Recent commits are the source of truth for what shipped.** Use `git log --oneline -20` to verify.
- **Per-decision files in `.claude/decisions/` are authoritative for sessions 7+.** Read them for context.
- **STATUS.md is the snapshot.** It should always reconcile with the tracker; if it doesn't, fix STATUS.md.

---

## When you're ready

1. Read this file top-to-bottom (you may already be here).
2. Skim the 5 most-recent decision files (`.claude/decisions/`) — top-down for the latest first.
3. Glance at `docs/reviews/sweep-tracker.md` for live state.
4. Review the master plan's §"Session schedule" rows for sessions 8-12.
5. Begin session 8: spot-check the 5 components above, hard 25-35 min time-box per component.

— Claude (sweep session 7d handoff, 2026-05-09)
