# HANDOFF — 2026-08-10/11 · Deep review → Master plan → P0 + P1 executed & shipped

> **Resume file for the production-readiness arc.** Everything from this session is committed + pushed (`master` == `origin` at `99ce6b1`, tree clean, Vercel deployed). Read this top-to-bottom, then start at **§NEXT ACTION**.
>
> **⚠️ STALENESS NOTE (added 2026-08-11):** §5's next action (P1.5) was **executed + smoke-verified 2026-08-11** — see [`decisions/2026-08-11-p1-5-carrier-sweep.md`](decisions/2026-08-11-p1-5-carrier-sweep.md); smoke = 63/63 installs · consumer tsc 0. STATUS.md is the live snapshot; the next action is now **P2 (great rename)** per §5's "Then P2" paragraph.

---

## 1. What happened this session (chronological)

1. **Deep end-to-end codebase review** (multi-agent: 6 scoped deep-read passes + spot verification) → **~90 verified findings** (~20 High: broken publish/export/day-view flows, date-only→UTC corruption, undeclared `radix-ui`, markdown XSS, dead category filter, docs claiming 8 components vs 63). Canonical file: [`docs/reviews/2026-08-10-deep-codebase-review.md`](../docs/reviews/2026-08-10-deep-codebase-review.md).
2. **External user review of the site validated** claim-by-claim (all 5 confirmed, one corrected) → review §10.
3. **User directives captured**: ① component naming unprofessional/inconsistent → rename; ② internal doc system too heavy/stale → slim + validate; ③ components too heavy → feature-slicing (à-la-carte install) investigation; ④ catalog descriptions too long/boring (validated: avg 463 chars, jargon leaks) → rewrite; ⑤ define loops/agents so quality is self-maintaining; ⑥ "nothing broken, no inconsistency" is the bar.
4. **Master plan authored + SIGNED OFF**: [`docs/production-readiness-plan.md`](../docs/production-readiness-plan.md). Locked decisions: **D1** drop `-NN` from all slugs (rename table still needs per-row approval) · **D2** phase order P1→P2→P3 · **D3** STATUS one-line rows. D4 (1.0 bar) + D5 (loops on-demand only, never scheduled) default-accepted.
5. **P0 executed + shipped** (commits `59e1f3b`+`4cb8614`): STATUS.md 120KB→~9KB; readiness rule 13.7KB→2.7KB core (+ spec at `docs/reviews/readiness-review-spec.md`); 46 handoffs archived to `handoffs-archive/`; llms.txt/README catalogs now **GENERATED** by `scripts/build-llms.mjs` (never hand-edit between markers); category-filter fix; SSR catalog fallback; `error.tsx`; `sitemap.ts`; **new gates** `validate:doc-drift` + `validate:doc-budget` wired into `registry:build`.
6. **P1 executed + shipped** (commits `9de7448..99ce6b1`): ALL review Blocker/High fixed. Method: **6 parallel implementation agents (disjoint folders) → central gate battery → 3 adversarial verify agents over the diffs → coordinator fixes for verifier findings → ship → live browser walkthrough → consumer smoke**. 25 components patch-bumped; lint 81→0 (3 documented suppressions); **new gates** reverse-npm (b2) in `validate-meta-deps` + new `validate-registry-json` — both in `registry:build`.
7. **Verification**: browser (virtual-browser MCP vs production): category filter live-fixed, calendar Day view, **markdown XSS payload typed into the real editor renders escaped** (title untouched), rich-sidebar/composer/grid-news render on new versions. Consumer smoke: see §4 discoveries.
8. **Post-ship smoke discoveries** (review §0 "post-ship" block): the CLI corruption bug + the F-cross-13 path-b cohort (→ §NEXT ACTION).

## 2. Current state (verify on resume)

- Tip `99ce6b1`, `master`==`origin`, tree clean, Vercel deploy green (Vercel posts commit statuses — `gh api repos/ilinxa/pro-ui/commits/<sha>/status`).
- Gates: `tsc` 0 · `lint` **0 errors** / 10 pre-existing warnings (2 unfixable TanStack `incompatible-library`, rest minor) · `validate:meta-deps` 63/63 (now bidirectional npm) · `validate:registry-json` 0 high / 4 documented warns · doc-drift ✓ · doc-budget ✓ · build 72 pages.
- Library: 63 components / 9 categories. Versions: see STATUS table (all bumped rows dated 2026-08-10 in their meta.ts).
- Full command list: `.claude/CLAUDE.md` §Commands (includes all 5 validators + `build:llms`).

## 3. The findings ledger — single source of truth for open work

[`docs/reviews/2026-08-10-deep-codebase-review.md`](../docs/reviews/2026-08-10-deep-codebase-review.md) **§0 "P1 outcome ledger"**: per-finding FIXED/OPEN status with owners. Key OPEN (also mirrored in STATUS §Open decisions):

| Item | Owner/target |
|---|---|
| **P1.5 F-cross-13 path-b sweep** (~45 `asChild` trigger sites across ~20 comps + 5 ToggleGroup sites in file-manager + 4 `delayDuration` stragglers vs CURRENT base-nova/Base-UI) | **NEXT, before P2** |
| shadcn CLI 4.6.0 package.json corruption (upstream bug) | watch upstream; harness workaround in place |
| Re-edited heroes never re-export (media N2) | content-composer v0.2.3 |
| Text-export webfonts fallback (media N3) | media-editor v0.2 or doc note |
| §6 unowned mediums (detail-panel focus-steal + namespace compound; gamification viewed-telemetry drift / mounted live regions / lazy-barrel bundle proof; task-choice cmdk collision; fixture URLs→P2.5) + §7 Lows + media N4-N6 + task N3-N6 | P3.4 fix-on-touch channel |
| 2.12 `now`-prop semantics divergence gantt vs calendar | P3.4 |
| 3.7 pinned new-york regDep URLs fight style-agnostic installs (proven harmful in this session's smoke — overwrote consumer's base-nova primitives) | P2/P4 convention decision |
| review 10.4 src-layout install path (llms.txt self-contradicts) | P4.2 smoke |

## 4. ⚠️ The two load-bearing discoveries (read before ANY smoke work)

1. **shadcn CLI 4.6.0 shuffles version specs across package names in the consumer's package.json on `add`** → every later in-CLI `pnpm add` fails with `ERR_PNPM_NO_MATCHING_VERSION` **before file writes** — runs LOOK successful (version-suggestion spam is the failure signature). The harness (`e:/tmp/ilinxa-smoke-consumer`) was silently installing NOTHING since ~July; those "clean" results are unverified. **Workaround**: after every CLI add, re-align consumer package.json to producer truth (node one-liner: copy producer's version for every overlapping name — see memory `project_shadcn_cli_pkgjson_corruption`), then `pnpm install --no-frozen-lockfile`.
2. **Smoke-method traps**: Vercel edge caches per encoding-variant (curl≠CLI; use content-strings as markers, never version numbers — meta.ts never ships); delete the consumer's `tsconfig.tsbuildinfo` before trusting tsc; manual-copy fallback (write artifact `files[].content` to `src/<target>`) skips the CLI's install-time rewrite of `@/registry/...` imports (false TS2307s) and installs no primitives — use it only for cross-backend type-checks with those classes excluded.

Harness upkeep done this session: SLUGS list in `scripts/smoke-all.mjs` regenerated to all 63; package.json re-aligned; `@ilinxa` URL restored (no `?v=` buster left behind).

## 5. NEXT ACTION — P1.5: the asChild/ToggleGroup carrier sweep

**Goal:** every shipped component compiles on the CURRENT base-nova (Base UI) style surface. One mechanical pattern, ~50 sites, ~20 components.

1. Repro the cohort list: repaired harness → real CLI install of all 63 (re-align package.json after EVERY add batch, per §4) → consumer `tsc`. Or start from this session's classified list (review §0 post-ship block).
2. Fix patterns (all precedented): `<XxxTrigger asChild><Button…>` → render trigger directly styled via `cn(buttonVariants({variant,size}))` (memory `project_shadcn_primitive_radix_baseui_divergence` — the universal escape hatch); ToggleGroup → plain-button segmented control (filter-stack `parts/mode-toggle.tsx` from this session is the template); `TooltipProvider delayDuration` → drop the prop (solo-button/permission-tooltip are templates).
3. Patch-bump each touched component (+STATUS rows), `registry:build`, ship, REAL CLI re-smoke to 0 errors, annotate ledger.
4. Suggest agent-parallel by folder exactly like P1 (constraints template in the P1 decision file §method).

**Then P2 — the great rename** (plan §Phase 2): draft the 63-row old→new slug table (D1: drop `-NN`; fix `rich-card`/`todo-rich-card`/`rich-card-in-flow` stem collisions; unify gamification `team-` prefix) → **user approves per-row** → scripted sweep (folders/manifest/registry.json×2/imports/docs-folders) + **P2.5 catalog-copy rewrite in the same sweep** (canon: ≤160 chars, capability-first, zero jargon; swap pravatar/example.com fixture URLs while each component is open) + deprecated-alias grace items + `validate:naming`. Then P3 (feature-slicing investigation + calendar/media-editor pilots — plan §Phase 3), P4 (1.0 bar), P5 loops live throughout.

## 6. The working method (repeat it — it caught real bugs every time)

- **Plan-first with sign-off** (project GATE culture) → parallel scoped implementation agents (disjoint folders; meta version bumps by the agent; registry.json/STATUS/decisions reserved to the coordinator) → **adversarial verify agents on `git diff` per family, instructed to REFUTE** (caught N1, a real fix-introduced regression: gate's `editorState` truthiness arm would have published a DISCARDED hero) → coordinator fixes → gate battery → per-family commits → push → **live browser walkthrough via stealth-browser MCP against production** (drive prod URLs; container can't reach host dev servers) → **real CLI consumer smoke on the Base-UI harness** → ledger annotation → STATUS/decision/memory sync.
- Cross-agent seams need an explicit verification trace (calendar⇄todo-rich-card date-only contract was the riskiest seam; verified byte-identical round-trip).
- Reviews that widen a fix beyond the prescribed change need their own adversarial trace (N1's lesson).

## 7. Doc map (everything this arc touches)

| Doc | Role |
|---|---|
| [`docs/production-readiness-plan.md`](../docs/production-readiness-plan.md) | Master plan; phase statuses inline (P0 ✅, P1 ✅ banners); locked D1-D5 in §8 |
| [`docs/reviews/2026-08-10-deep-codebase-review.md`](../docs/reviews/2026-08-10-deep-codebase-review.md) | All findings + §0 outcome ledger + §10 external-review validation |
| [`.claude/decisions/2026-08-10-p0-doc-hygiene-and-validators.md`](decisions/2026-08-10-p0-doc-hygiene-and-validators.md) | P0 record |
| [`.claude/decisions/2026-08-10-p1-fix-program.md`](decisions/2026-08-10-p1-fix-program.md) | P1 record: commits, bumps, method lessons |
| [`.claude/STATUS.md`](STATUS.md) | Snapshot: versions, open items (P1.5 top), 5-line activity |
| `scripts/`: `build-llms.mjs`, `validate-doc-drift.mjs`, `validate-doc-budget.mjs`, `validate-registry-json.mjs`, extended `validate-meta-deps.mjs` | The P5 validator layer (all wired into `registry:build`) |
| `docs/reviews/readiness-review-spec.md` | Full GATE 3 spec (rule file is the 2.7KB core) |
| `e:/tmp/ilinxa-smoke-consumer` + its `HARNESS.md` | Base-UI smoke harness (repaired; see §4) |

## 8. Standing constraints (don't regress these)

- Size budgets are ENFORCED (`validate:doc-budget`): CLAUDE.md ≤12KB · STATUS ≤14KB · readiness rule ≤4KB · ≤2 active HANDOFFs in `.claude/` root (archive to `handoffs-archive/`).
- llms.txt/README catalog sections are generated — edit `registry.json` descriptions + run `pnpm build:llms`, never hand-edit between the markers.
- Every shipped-code npm import must be declared in meta.npm AND the registry item (b2 check + registry-json validator fail otherwise).
- STATUS stays one-line rows / 5 activity entries / no banner blockquotes.
- User preferences: no scheduled agents ever; loops on-demand; brevity in chat; decision-question format (Problem/Options/Differences/Recommendation) for choices.

**Session closed 2026-08-11 ~00:45. Next session: verify §2 state, then execute §5 (P1.5), then P2 table for approval.**
