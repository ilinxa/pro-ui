# Plan — close the "declared but inert public surface" class

> Readiness-loop state machine. Resume by reading this file and continuing from the first
> unchecked gate. Config: [`.claude/readiness.config.md`](../../.claude/readiness.config.md).

**Goal (one sentence):** every public surface in the registry either *works*, or *says it doesn't* —
enforced by a build gate, so the class cannot silently return.

- **Started:** 2026-08-18
- **Loop:** feature-readiness-loop (tooling + cross-component sweep)
- **Origin:** authoring `code-block`'s missing guide found two inert APIs; an audit of all 64
  components found the class spans 6 components / 11 surfaces.

---

## The defect class

A public surface that **exists, compiles, exports, is callable, and does nothing.** No gate in the
battery can see it: `tsc`, `lint`, `validate:meta-deps`, `validate:barrel-exports`, the test tier
and even a 126-test adversarial review each check that a symbol **exists**, never that it **does
something**. A consumer is the first thing in the pipeline that actually calls it.

Prior instances (all found by humans/consumers, never by a gate):

| Date | Surface | Inert for |
|---|---|---|
| 2026-08-17 | `card-tree` `customPredefinedKeys` | since v0.3 (found by an integrator) |
| 2026-08-18 | `code-block` CodeMirror soft-failure fallback | since v0.1.0 (found re-validating a report) |
| 2026-08-18 | `code-block` `CodeBlockServerProps` + `scrollToLine()` | since v0.1.0 (found writing the guide) |

## The precedent that defines "acceptable"

`media-editor` already does this **right** and is the model for every fix here:

```ts
// media-editor.tsx:95
"media-editor: imperative capture (takePhoto / startRecording / ...) is deferred to v0.2 —
 drive capture via the in-UI controls for now.";
```

…paired with `meta.ts`: *"Imperative ref handle: … (imperative capture methods dev-warn — deferred
to v0.2)"*. The method exists, calling it **tells you** it is not implemented, and the docs say so.
`team-feedback-loop` does the same for `onEvent` ("accepted for symmetry, emits nothing (E6)").

**The rule this plan enforces:**

> A public surface must be **implemented**, or **self-disclosing**: it dev-warns when used *and*
> is declared non-functional in its JSDoc. Silent-and-advertised is the defect.

---

## In scope

- Detector `scripts/validate-inert-surfaces.mjs` + promotion to a `registry:build` gate.
- The 11 confirmed findings (table below), each implemented or made self-disclosing.
- The guide-doc leak: 3 components with no guide + a gate requiring one.
- Deferral-debt reconciliation: a `deferred to vN` marker where the shipped version has reached
  `vN` becomes a finding.

## Out of scope (parked)

- Building the actual `@ilinxa/code-block/server` RSC variant — that is a **feature** behind
  GATE 2, not a gap closure. FU-6 closes by making the existing type honest.
- The consumer-strict flag backlog (`exactOptionalPropertyTypes` 525 etc.) — separate arc.
- `media-editor` C17 `@internal` shim (tracked separately in STATUS).

---

## R1 — Invariants

| # | Invariant | How it is verified |
|---|---|---|
| I1 | No prop declared in a public `*Props` interface is unreferenced by its component's implementation, unless disclosed. | `validate:inert-surfaces` probe A + repo test |
| I2 | No method on a public handle/slot-context has an empty or comment-only body, unless disclosed. | probe B + repo test |
| I3 | No source comment or type references a file inside its own slug that does not exist. | probe C + repo test |
| I4 | "Disclosed" is not a bare ignore-comment: it requires a JSDoc `@notImplemented` tag **and** a runtime dev-warn. | gate rejects tag-without-warn |
| I5 | A `deferred to vN` marker in shipped code, where `meta.version >= vN`, is a finding. | probe D |
| I6 | Every shipped component has a guide doc. | `validate:doc-drift` extension |
| I7 | The gate fails the build on a real finding and passes when it is fixed. | falsified both ways inside `registry:build` |

## R1 — Blast radius

| Surface | Why it is touched |
|---|---|
| `scripts/validate-inert-surfaces.mjs` | new detector |
| `scripts/validate-doc-drift.mjs` | guide-doc presence check |
| `package.json` | `validate:inert-surfaces` script + `registry:build` wiring |
| `src/registry/components/code/code-block/**` | FU-6 + FU-7 |
| `src/registry/components/navigation/app-sidebar/**` | 5 inert callbacks |
| `src/registry/components/media/story-viewer/**` | `onLoadReactors` |
| `src/registry/components/data/news-card/**` | `openKebab` |
| `src/registry/components/data/comment-thread/**` | composer slot stubs |
| `src/registry/components/media/pdf-viewer/**` | `closeMenu` stub |
| `docs/procomps/{carousel-composer,pricing-table,signup-form}-procomp/` | missing guides |
| `tests/` | repo-tier guards for I1–I5 |
| `registry.json` + `public/r/*` | version bumps for every touched component |
| `.claude/STATUS.md`, `.claude/decisions/`, `.claude/readiness.config.md` | R6 docs sync |

---

## Findings inventory (the work list)

Verdicts assigned at R1 from the audit; `file:line` evidence recorded per row.

| # | Component | Surface | Disposition |
|---|---|---|---|
| A1 | code-block | `scrollToLine()` no-op, advertised in `meta.ts` | **implement** |
| A2 | code-block | `CodeBlockServerProps` + phantom `code-block.server.tsx` comment | **disclose** (`@deprecated`, drop phantom ref) |
| A3 | app-sidebar | `onItemHover` | **implement** |
| A4 | app-sidebar | `onItemFocus` | **implement** |
| A5 | app-sidebar | `onActiveItemChange` | **implement** (plan already specifies effect-based timing) |
| A6 | app-sidebar | `onMount` | **implement** |
| A7 | app-sidebar | `onUnmount` | **implement** |
| A8 | story-viewer | `onLoadReactors` | **decide at R2** — implement if the overlay has a tap seam, else disclose |
| A9 | news-card | `openKebab()` no-op, advertised as part of an "11-method handle" | **decide at R2** |
| A10 | comment-thread | `renderComposer` controller stubs (`setValue`/`submit`/`cancel`) | **decide at R2** |
| A11 | pdf-viewer | `closeMenu()` + hardcoded `position {x:0,y:0}` | **decide at R2** |

**Found during R2, after hardening probe A** (comments were counting as references, which hid
them — see the retro): `story-viewer.reactors` (dead alongside `onLoadReactors`),
`story-composer.editorBackground` (declared, never applied), `gantt-timeline.measureRows()`
(public via `useGanttTimeline()`, empty body, while the virtualizer's real `measure()` went
unused), `markdown-editor` `ToolbarItem.run` (the *documented* separator idiom told consumers to
write `run: () => {}`), `media-editor.handle.open()` (a legitimate no-op, but a silent one).
**Final count: 16 surfaces across 10 components, not the 11 across 6 the R0 audit saw.**

Non-findings confirmed during the audit (documented so the gate does not regress on them):
`team-feedback-loop.onEvent` (disclosed in `meta.ts`), `gantt-timeline` `measure()` on the
non-virtualized branch (nothing to measure), `media-editor` capture methods (dev-warn + disclosed).

---

## Slices

- [x] **S1** — detector `validate:inert-surfaces.mjs`, probes A–D + disclosure rule
- [x] **S2** — code-block A1 + A2 (+6 tests; falsified → 5/6 red)
- [x] **S3** — app-sidebar A3–A7 (+8 tests; falsified → 5/8 red, the 3 survivors are negative controls)
- [x] **S4** — A8–A11 dispositions, **plus 5 more the hardened probe found** (+4 tests)
- [x] **S5** — guide-doc gate + 3 guides (pricing-table, carousel-composer, signup-form)
- [x] **S6** — promoted to `registry:build --strict`; falsified both ways, twice
- [x] **S7** — 14 repo-tier tests; 10 version bumps; registry rebuilt

## Phase checklist

- [x] **R0** framed — audit complete
- [x] **R1** invariants + blast radius written
- [x] **R2** slices implemented, each with tests
- [x] **R3** gate battery green with real numbers
- [x] **R4** adversarial review — 2 CONFIRMED findings on my own fixes, both fixed + tested
- [x] **R5** runtime verification — gate falsified both ways; components driven in a real browser
- [x] **R6** docs sync + base commit (`476030b`)
- [x] **R7** close-out, retro logged, parked promoted, deploy verified

## Gate numbers (R3 — filled in live)

| Gate | Command | Result |
|---|---|---|
| 1 typecheck | `pnpm tsc --noEmit` | **exit 0** |
| 2 lint | `pnpm lint` | **0 errors / 14 warnings** (baseline; two of mine found and fixed) |
| 3 meta-deps | `pnpm validate:meta-deps` | **64/64 clean, 0 findings** |
| 4 registry validators | (config gate 4) | 0 high (barrel 1 warn = known `@internal` C17) |
| 5 doc validators | `validate:doc-drift; validate:doc-budget` | **exit 0**, incl. new guide check |
| 6 registry build | `pnpm registry:build` | **exit 0**, 66 artifacts, 0 high |
| 7 app build | `pnpm build` | **exit 0**, all routes compiled |
| 8 tests | `NODE_ENV=production pnpm test:run` | **158 passed / 23 files** (was 126/19) |
| **new** | `pnpm validate:inert-surfaces` | **64/64 clean — 0 high, 0 warn** |

## R4 — findings on my own work (adversarial pass)

| # | Finding | Failure scenario | Verdict | Fix + test |
|---|---|---|---|---|
| F1 | `pdf-viewer` Escape handler lived on the scroll container | A context menu takes focus when it opens, so `onKeyDown` on the scroller could never fire — the documented "Escape closes" was false in exactly the situation it existed for | **CONFIRMED** | Document-level listener while open; verified in-browser |
| F2b | The first F2 fix used a **ref**, which the React Compiler lint rejected: these helpers are passed to `renderComposer` **during render**, so a ref read sits on a render-reachable path | A consumer's render function could invoke `submit()` in the render phase and read a ref there | **CONFIRMED** (by the lint, after my fix) | Ref removed; `submit` widened to `submit(value?)` — non-breaking, explicit for the same-tick case |
| F2 | `comment-thread` `submit` closed over React state | A custom composer calling `setValue(next)` then `submit()` in one tick posts the PREVIOUS value — silently posting stale text, worse than the empty stub it replaced | **CONFIRMED** | Value mirrored in a ref; `composer-slot.test.tsx` (falsified 2/4 red) |
| F3 | `scrollToLine` on a controlled-`expanded` block | Host owns `expanded`; the expand request emits `onExpandedChange` and the host may ignore it | **DROPPED** | Correct by contract — controlled means the host decides |
| F4 | Expand-modal clone could capture the scroll query | `rootRef` is on the `<section>`; the modal renders as a sibling, so the query cannot reach it | **DROPPED** | Verified by reading the render tree |

## R5 — runtime evidence

- **Gate blocks a deploy:** re-planted an inert `scrollToLine` → `registry:build` **exit 1**, halted *before* `shadcn build`; restored → **exit 0**. Re-planted a stale deferral → **exit 1**; restored → **exit 0**.
- **Real browser** (production build on :4571, Playwright): markdown-editor toolbar renders 15 buttons after `run` became optional · code-block 9 scroll seams / 383 addressable rows / highlighter reached `ready` · app-sidebar 29 nav rows, hover throws nothing · pricing-table, signup-form, carousel-composer render clean · **zero console errors on every page**.
- **news-card controlled kebab:** the first check passed *vacuously* (0 triggers, because the kebab lives in a non-default tab). Corrected: switch to "Editor mode" → 3 triggers → click opens a menu with 12 items → Escape closes it → 0 console errors. `open`/`onOpenChange` round-trips.

## Pre-mortem

If this breaks, it breaks because the detector's regex-based probes produce a false positive that
someone silences with a disclosure tag on a surface that *should* have been implemented — turning
the escape hatch into a laundering mechanism. Mitigation: disclosure requires a runtime dev-warn,
not just a comment, so silencing the gate has a user-visible cost.

## R7 — deploy verification

A ship closes on the **deployed artifact**, not on `git push`. Polled `ui.ilinxa.com/r/*.json`
after `476030b`:

```
code-block      data-cb-scroller  LIVE
app-sidebar     handleItemHover   LIVE
comment-thread  submitSlot        LIVE
```

Each probe names a symbol that exists **only** in the new version. The first attempt used
`onItemHover` for app-sidebar and reported LIVE against a *stale* artifact — that identifier is
declared in `types.ts`, which the old version shipped too. Same trap as the 2026-08-18 post-deploy
poll, caught here by re-reading the rule: **a post-deploy probe must test something the previous
version did not have.**

The gate runs inside `vercel-build` → `registry:build`, so a successful deploy is also proof it
passed in CI, not just locally.

## Parked (promoted to config)

- The real `@ilinxa/code-block/server` RSC variant — a feature behind GATE 2.
- Implementing what the disclosed surfaces promise: story-viewer reactions preview,
  story-composer editor background, media-editor imperative capture, card-tree-node bulk edit,
  media-library copy/duplicate. Each now dev-warns and is tagged `@notImplemented`.

## R5 addendum — consumer install verification (2026-08-19, post-ship)

The one instrument skipped at first pass, and the one that matters most for public **type** changes.
Ran the smoke harness against the deployed registry for the five components whose types changed:

| Slug | Install | Consumer `tsc` |
|---|---|---|
| news-card | pass | **0 errors** |
| comment-thread | pass | **0 errors** |
| markdown-editor | pass | **0 errors** |
| app-sidebar | pass | **0 errors** |
| code-block | pass (unbounded) | **0 errors** |

130 vendored files; each verified to carry this arc's changes (`data-cb-scroller`, `kebabOpen?:`,
`submitSlot`, `handleItemHover`, `run?:`). Consumer tsc runs with the consumer-strict flags
mirrored, so this is the bar that would have caught the `ResolvedPartProps` break.

**Two harness defects surfaced, both fixed, neither a product defect:**

1. A hardcoded **120s** per-slug install timeout killed `code-block` mid-write. It landed with zero
   files, and consumer tsc then failed inside `json-form` and `media-library` — its dependents —
   **implicating two components that were never touched.** Raised to 300s,
   `SMOKE_INSTALL_TIMEOUT_MS`-overridable.
2. Each run ends with `pnpm install --no-frozen-lockfile`, re-drifting the lockfile so the *next*
   run's pre-flight fails. A batch loop therefore fails every slug after the first — and reports
   exit 0 anyway, because a `for` loop's status is its last command's.

**(2) nearly became a false green of exactly the kind this arc is about:** the batch reported
"exit code 0" while installing nothing at all. It was caught only by checking the installed file
count instead of trusting the exit status — and then my first file-count check read the wrong path
(`components/` rather than `src/components/`) and reported zero for a tree that was fully
populated. Two measurement errors in a row on the same claim.
