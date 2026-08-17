# Plan — Test infrastructure + card-tree v0.6.0 follow-up closure

> **Status:** ✅ **CLOSED** — shipped `e43f96a`, deployed, post-deploy verified. Retro in `.claude/improvement-log.md`.
> **Started:** 2026-08-17 · **Owner:** architect (main session)
> **Driver:** the `card-tree` v0.6.0 U-loop closed with 9 follow-ups; FU-1 (test runner) had its
> informed-defer trigger tripped by that bug. User directive: *"fix these in the most professional
> and reliable way … confirm the job is fully done with end to end tests."*

## Goal

One sentence: **give this repo a real test tier so behaviour claims are guarded continuously
rather than proven once**, and close the follow-ups that a test tier makes verifiable.

The `card-tree` bug shipped because no gate in this repo can see a wired-but-inert prop. It
typechecked, linted and passed every validator for three minor versions. v0.6.0 proved the fix with
a one-shot probe — correct, but **not a regression guard**, because nothing re-runs it. This arc
closes that gap.

## In scope

| # | Slice | Closes |
|---|---|---|
| S1 | **Vitest runner** — two projects (node for pure lib, jsdom for components), scripts, wired into the gate battery and `vercel-build` | FU-1 |
| S2 | **Unit/integration suite for card-tree custom keys** — port the 28-assertion probe verbatim + widen (reducer round-trip under duplicate/undo, `validate-edit` name blocking, `resolveCustomKeys` policy) | FU-1 |
| S3 | **Component tests** (Testing Library + jsdom) — render/edit contracts incl. **a throwing host `render`** and a throwing `icon`, which E2E cannot exercise cleanly | FU-3 |
| S4 | **Playwright E2E** — docs site on a production build: custom blocks render, add-menu offers registered keys, JSON-textarea fallback edit round-trips, no console errors | FU-3 |
| S5 | **`validate:barrel-exports`** — catalog-wide scan for public types unreachable from `index.ts`; see §R0.4 for the precise rule and the open question | *(new — the card-tree F5 defect class)* |
| S6 | **Guide import-path sweep** — `@/registry/components/...` → `@/components/<slug>` across procomp guides | FU-6 |
| S7 | **Config truth** — lint baseline 9→14 with provenance; add the `ERR_PNPM_EPERM` flake | FU-7, FU-9 |
| S8 | **card-tree artifact headroom** — 304.93/320 KB (4.7%); measure, then justify a budget raise or trim | FU-5 |

## Out of scope (explicitly, with reasons)

- **FU-4** non-destructive fallback for the custom-key shadowing case — a *behaviour* change to a
  signed-off spec; needs its own GATE 1/2, targeted v0.7.
- **FU-8** compound-structure refactor of `card-tree` (24 parts, 2 standalone exports) — a
  pre-existing violation and a large architectural change; needs its own loop.
- **FU-2** `card-tree-node` renders custom blocks as nothing — this is a **component change**, so
  by repo mandate it runs through `procomp-loop` (U-loop), **not** this loop. Sequenced immediately
  after, so the new test tier can prove it.

## R0.4 — OPEN SCOPE QUESTION (user decision)

> ### ⚠️ CORRECTED at R2 — the numbers below were from a throwaway naive scan and were WRONG
>
> The real figure, from the finished transitive validator, is **16 types across 5 components**
> (`post-card` 11 · `gantt-timeline` 2 · `event-calendar` 1 · `kanban-board` 1 · `media-editor` 1),
> not 54 across 17. Three separate errors in my throwaway scan, each worth recording:
>
> 1. **`blackboard` was never broken.** Its `index.ts:33` is `export type * from "./types"` — a
>    blanket re-export. My scan only recognised `export * from`, so it reported **13/14 (93%)**
>    for a component that is fully reachable. The headline number I quoted was the most wrong one.
> 2. **Most "missing" types are legitimately internal** (`task-card`'s `State`/`Action`, reducer
>    and context internals). The naive rule flags them; the transitive rule correctly does not.
>    This is why the naive rule would have produced a validator nobody trusts.
> 3. **`card-tree-node`'s `CardTreeJsonNode` is a false positive** the validator originally
>    emitted, caught during coordinator review: that type is *re-exported* from `card-tree`, not
>    declared locally, and `index.ts:18-31` **deliberately drops** it under the F-S1 lock because
>    shadcn's path rewriter mis-rewrites cross-procomp barrel re-exports. Flagging it would push
>    authors to reintroduce a known-broken pattern. Fixed: the validator now ignores types
>    re-exported from outside the component.
>
> The scope decision (validator now, sweep later) is unaffected — the sweep is simply **5
> components, not 16**.

The throwaway scan reported: 17 components, 54 public types unreachable from their own `index.ts`.

| slug | missing/total | slug | missing/total |
|---|---|---|---|
| `blackboard` | **13/14 (93%)** | `newsletter-signup` | 2/8 |
| `post-card` | 11/23 (48%) | `code-block` | 1/25 |
| `task-card` | 8/36 (22%) | `detail-panel` | 1/13 |
| `pricing-table` | 3/15 | `category-cloud` | 1/4 |
| `card-tree-node` | 2/5 | `filter-bar` | 1/7 |
| `event-calendar` | 2/16 | `magazine-layout` | 1/6 |
| `gantt-timeline` | 2/18 | `media-editor` | 1/37 |
| `kanban-board` | 2/12 | `pdf-viewer` | 1/16 |
| `properties-form` | 2/11 | | |

**Important caveat:** a naive "everything in `types.ts` must be in `index.ts`" rule is wrong —
some are genuinely internal (`task-card`'s `State`/`Action` are reducer internals). So the
validator's rule is **transitive reachability**: *a type is a finding only if an **exported** type
(e.g. `<Name>Props`, the handle, an event payload) references it, yet a consumer cannot import
it.* That is exactly the card-tree defect — `CardTreeProps.customPredefinedKeys` referenced
`CustomPredefinedKey`, which was unreachable.

**The question:** does the 16-component barrel *sweep* ride in this arc, or become its own fix
program? Precedent exists for the bundled form (P1 patch-bumped 23 components under one decision
file). Additive type exports change no behaviour, but it is still 16 version bumps, 16 STATUS rows
and 16 rebuilt artifacts.

## R0.4 — DECIDED (user, 2026-08-17)

1. **Validator now, sweep later.** Build `validate:barrel-exports`, run it **report-only** (cannot
   block), fix `card-tree` only (already done in v0.6.0), and record the 16-component backlog with
   real numbers as its own fix program. Rationale: keeps this arc on the test tier; the sweep gets
   its own decision file + review, per the P1 precedent that patch-bumped 23 components at once.
2. **Tests gate the deploy.** The unit/component suite joins `vercel-build`, so a card-tree-class
   regression stops the site going live. E2E stays out of the deploy path (needs browsers + a
   running server) and runs locally/on demand. This is a **policy change to the deploy pipeline** →
   ADR required (R1).

## R1 — Invariants

Written testable; these are the R4 review targets and R5 verification targets.

| # | Invariant | Tier |
|---|---|---|
| T1 | `pnpm test` runs the full unit+component suite and exits non-zero if **any** test fails | S1 |
| T2 | A regression that re-breaks custom keys (revert `classifyKey`'s custom branch) **fails the suite** — the guard actually guards | S2 |
| T3 | The 28 probe assertions survive as real tests: round-trip fixed point, precedence, collision policy, validator throw/reject, no-custom-keys regression, Q-P4 | S2 |
| T4 | A **throwing host `render`** degrades to the JSON fallback and does not blank the tree; a throwing `icon` does not crash the add-menu | S3 |
| T5 | Custom blocks render, the add-menu offers registered keys, and the JSON-textarea fallback edit round-trips — observed in a real browser on a production build | S4 |
| T6 | `validate:barrel-exports` flags a type referenced by an exported type but not importable from `index.ts`; it does **not** flag genuinely-internal types (no false positive on `task-card`'s `State`/`Action`) | S5 |
| T7 | `vercel-build` fails when a test fails (deploy gate is real, not decorative) | S1 |
| T8 | **No existing gate regresses**: tsc 0, lint 0 errors, meta-deps 64/64, all validators, build — unchanged | all |

## R1 — Blast radius

| Surface | Why touched | Synced (R6) |
|---|---|---|
| `package.json` | test deps + `test` / `test:run` / `test:e2e` scripts; `vercel-build` gains the suite | ☐ |
| `vitest.config.ts` (new) | two projects: node (lib) + jsdom (components) | ☐ |
| `playwright.config.ts` (new) | E2E against a production build | ☐ |
| `tsconfig.json` | test globs / types if needed | ☐ |
| `src/registry/components/data/card-tree/**/__tests__` (new) | lib + component suites | ☐ |
| `e2e/` (new) | Playwright specs | ☐ |
| `scripts/validate-barrel-exports.mjs` (new) | the catalog-wide scan | ☐ |
| `eslint.config.mjs` | ignore/allow test globs if it complains | ☐ |
| `.claude/readiness.config.md` | gates table gains the test tier; lint baseline 9→14; new EPERM flake | ☐ |
| `.claude/decisions/<date>-test-tier.md` (ADR) | deploy-pipeline policy change | ☐ |
| `docs/procomps/*/**-guide.md` | S6 import-path sweep | ☐ |
| `.claude/STATUS.md` | test tier live; informed-defer removed; barrel backlog recorded | ☐ |
| `docs/component-guide.md` | testing section — how to add tests for a procomp | ☐ |
| `registry.json` / artifacts | **must NOT ship tests** — verify `__tests__` never enters a registry item | ☐ |

**Highest-risk row:** the last one. Registry items are hand-maintained; a test file leaking into a
shipped artifact would land in consumers' `components/` folders. Explicit R4/R5 check.

## Slice plan (R2)

Each slice = independently testable vertical cut; tests land with code.

1. S1 runner skeleton + one trivially-true test proving the harness runs in CI order.
2. S2 lib suite (no DOM) — the highest-value tests, port first.
3. S3 component suite (jsdom).
4. S5 validator + its own tests (a validator without tests is the same mistake again).
5. S4 E2E (last of the test slices — slowest, needs a built server).
6. S6/S7/S8 mechanical + config closure.

## R2 — slice status

| Slice | Owner | Status | Evidence |
|---|---|---|---|
| S1 runner | implementer | **done** | `vitest.config.ts` two projects (node/jsdom); `vercel-build` = `pnpm run test:run && pnpm run registry:build && pnpm run build:source-map && next build` — tests gate the deploy |
| S2 lib suite | implementer | **done** | **43 passed / 0 failed** across 6 files. **T2 acid test executed:** reverting `classifyKey`'s custom branch → **17 failed / 26 passed**; restored → 43 green; `git diff` on `classify-key.ts` clean. Registry-leak check: **0** test files in any registry item |
| S3 component suite | implementer | in flight | jsdom + Testing Library; throwing `render`/`icon`/`defaultValue`, JSON-fallback edit, inline-literal stability |
| S4 E2E | architect | specs written, run pending | `playwright.config.ts` (production build only, dev server banned) + `e2e/card-tree-custom-keys.spec.ts` |
| S5 barrel validator | implementer | in flight | — |
| S6 guide sweep | implementer | in flight | — |
| S7 config truth | architect | **done** | lint baseline 9→**14** with provenance; EPERM flake; pruned-peer-deps flake; artifact-budget misreading corrected |
| S8 artifact headroom | architect | **done — no action** | see §S8: the gate fails at `budget × 1.2` = 384 KB, not 320; real headroom ~26% |

**Coordinator spot-checks performed** (not taken on trust): `classify-key.ts` diff clean · `vercel-build` value read from `package.json` · registry-leak count run independently · `round-trip.test.ts` read in full to confirm the tests assert behaviour rather than execute lines.

## Phase checklist

- [x] **R0 Frame & scope** — plan doc; improvement log read (retro appended 2026-08-17); versions verified live
- [x] **R1 Design & contracts** — invariants + blast radius; ADR for the vercel-build policy change
- [x] **R2 Implement in slices**
- [x] **R3 Gate battery** — all 8 green; 2 validators fixed for the new non-shipped file class
- [x] **R4 Adversarial review** — 6 findings: 5 CONFIRMED+fixed, 1 accepted+documented
- [x] **R5 Runtime verification** — guard proven by reverting the fix (unit + e2e both go red); deploy gate executed both ways
- [x] **R6 Docs & knowledge sync** — base commit `e43f96a`
- [x] **R7 Close-out & retro** — pushed, deployed, post-deploy verified (0 test files in production artifacts), retro appended

## Verified dependency versions (read live via `pnpm view`, not assumed)

`vitest 4.1.10` · `@vitejs/plugin-react 6.0.5` · `jsdom 30.0.1` · `@testing-library/react 16.3.2` ·
`@testing-library/jest-dom 7.0.1` · `@testing-library/user-event 14.6.4` · `@playwright/test 1.62.1` ·
`vite-tsconfig-paths 6.1.1` · `@vitest/coverage-v8 4.1.10`

Repo baseline: React **19.2.4**, Next **16.2.4**, TypeScript ^5, pnpm 10.18.3.

## S8 — FU-5 artifact headroom: RESOLVED, no action

**My earlier framing was wrong and is corrected here.** `validate:artifact-size`
(`scripts/validate-artifact-size.mjs:36,107`) fails at `budgetKB × 1.2` — for `card-tree` that is
**384 KB**, not 320. At **304.93 KB** the real headroom to the failing gate is ~26%, not 4.7%. The
4.7% figure is headroom against the *declared target*, which is an intent marker, and the repo's
own rule is ">20% over budget without a matching budget bump = drift".

Resolution: **no budget change.** Raising a budget that has not been exceeded is padding. FU-5
downgrades from "act" to "watch", and the real thresholds are now written into
`readiness.config.md` §known-flakes so the next reader doesn't repeat the misreading.

## R5 — Runtime verification: the guard proof

A test suite is only worth its runtime if it **fails when the thing it guards breaks**. Both the
unit tier and the E2E tier were verified by deleting the fix and watching them go red.

### Unit/component tier
Reverting `classifyKey`'s custom branch → **17 failed / 26 passed**. Restored → **43 passed**.
`git diff` on `classify-key.ts` clean afterwards.

### E2E tier — three rounds, and the middle one found a bug in my own specs

| Round | Build | Result | What it revealed |
|---|---|---|---|
| 1 | fix present | 5 passed | baseline green |
| 2 | **fix reverted** | **2 failed / 3 passed** | ⚠️ **Three specs passed under a total regression.** They queried page-wide text, and the demo's own descriptive prose contains the same strings — so the assertions found prose, not blocks. The structural REGRESSION spec caught it; the text-based ones did not. |
| 2b | fix still reverted, **specs hardened** | 4 failed → then **5 failed** | scoped every assertion to `[data-rcid="ch4"]`, the card that owns the blocks |
| 3 | fix restored + rebuilt | **5 passed** | final state; source verified pristine by `git diff` |

**This is the second time in two days that a text-based assertion produced a false pass**, and the
first time it happened *inside a file whose own header comment warns against it*. The lesson is
now enforced structurally rather than by comment: every spec asserts within the owning card.

Had I skipped the revert experiment, I would have shipped an E2E suite that stayed green through
the exact regression it exists to catch — i.e. the same class of false assurance as the original
inert-prop bug.

### Final counts

| Tier | Command | Result |
|---|---|---|
| lib | `pnpm test:lib` | **43 passed / 0 failed** |
| component | `pnpm test:components` | **13 passed / 0 failed** |
| unit total | `pnpm test:run` (gates the deploy) | **56 passed / 0 failed**, 12 files, 4.08s |
| e2e | `pnpm test:e2e` (production build) | **5 passed / 0 failed**, 14.6s |
| **total** | | **61 automated checks** |

## R4 — Adversarial review (fresh-context reviewer, 6 findings)

**5 CONFIRMED + fixed · 1 accepted as a documented limitation.** The reviewer's per-file
decorative-vs-load-bearing judgement was the main deliverable and is recorded below.

| # | Finding | Verdict | Resolution |
|---|---|---|---|
| 1 | ⚠️ **`reuseExistingServer: true` could test a STALE build.** "Something is listening on 4311" is not evidence it serves the build you just made — and this repo's own known-flakes list records orphaned `next start` children holding ports on Windows. | **CONFIRMED** | Set to **`false`**. An occupied port now fails loudly instead of passing green against an old build. *This is the same false-assurance class as the original bug, relocated from the assertion layer to the infra layer — exactly the kind of thing a review is for.* |
| 6 | 🔸 **`test.skip` escape hatches silently drop coverage.** If a demo refactor removes the search input or the `aria-pressed` toggle, those specs stop testing anything and CI stays green. | **CONFIRMED** (mechanism present; both affordances verified currently live) | Converted both to hard `expect(...).toHaveCount(1)` assertions with explanatory messages. A missing affordance is now a loud failure. |
| 2 | 🔸 `readiness.config.md` said "gates 1–8" while the gates table had 7 rows — the test tier was never added to the table an R3 run mechanically walks. | **CONFIRMED** (my edit created it) | Added **gate 8 — tests**, noting it runs first in `vercel-build` and that E2E is deliberately not in the battery. |
| 3 | 🔸 `STATUS.md` still claimed "9 pre-existing warnings" while `readiness.config.md` was corrected to 14 **in the same changeset**. | **CONFIRMED** | STATUS gates line corrected; test tier recorded there too. |
| 4 | 🔹 `isForeignReExport` only recognised `"../"` re-exports, not the `@/registry/components/<cat>/<slug>` alias form used elsewhere in the repo. No live trigger, but a foreseeable false positive. | **CONFIRMED (latent)** | Alias form now handled. Re-ran: findings unchanged (16/5), all four spot-check slugs still correct. |
| 5 | 🔹 The `__tests__` exclusions are filename/dirname pattern matches, so a *shipped* file named `*.test.*` would silently vanish from both validators. | **CONFIRMED but ACCEPTED** | Not fixed. Content-aware detection costs far more than the risk: no such file exists, and the naming convention is universal. Recorded here and in both scripts' comments as a known authoring trap. |

**Reviewer's verdict on test quality — the question that mattered most:** every lib and component
test judged **load-bearing**, with one honest nuance. In
`component-inline-literal-stability.test.tsx`, `searchResultCalls === 1` **is** bug-sensitive
(reverting the memo to array-identity keying makes it 11), while `renderCalls === 11` is not —
and the test's own comment already says exactly that. Documented, not decorative.

Reviewer also independently reproduced: all 16 barrel findings, the registry-leak zero, test
isolation with no order-dependence, `56 passed`, 0 lint errors from test files, no Radix-specific
DOM assertions, no `.only`/`.skip` left behind.

**Post-fix re-verification:** barrel validator unchanged (16/5, four spot-checks correct);
E2E **5 passed / 0 failed** against a freshly built server with reuse disabled.

## Parked

*(adjacent problems found mid-run go here with one line of context — fixing them now is a user decision)*

- **Barrel-export sweep — 16 remaining components** (`card-tree` fixed): the validator ships
  report-only this arc by user decision; the sweep is its own fix program. Real numbers in §R0.4.
- **`procomp-loop` U2 wording is now partly obsolete** — it says "with no unit runner, the
  regression proof burden moves to U5". With a test tier live that burden moves back to U2.
  Owner: next `procomp-loop` skill touch.
