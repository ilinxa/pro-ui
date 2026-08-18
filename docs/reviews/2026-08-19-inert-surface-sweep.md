# Readiness review — inert public-surface sweep (spotcheck, cross-component)

- **Date:** 2026-08-19
- **Tier:** pro-component ×10 (cross-cutting sweep + new build gate)
- **Trigger:** public-API-touching changes across 10 components ([`rules/readiness-review.md`](../../.claude/rules/readiness-review.md) trigger table)
- **Scope:** 16 inert public surfaces implemented or made self-disclosing; `validate:inert-surfaces` built and promoted to a build gate; guide-doc gate + 3 missing guides
- **Reviewer:** architect (main session), AI-assisted — single-model hat-switch per the readiness-loop playbook
- **Form:** one sweep-level review, following the [barrel-exports sweep](2026-08-17-barrel-exports-sweep.md) precedent for cross-cutting work, rather than 10 near-identical per-component files
- **Loop record:** [`docs/plans/inert-surface-class-plan.md`](../plans/inert-surface-class-plan.md) · **ADR:** [`2026-08-19-inert-surface-gate.md`](../../.claude/decisions/2026-08-19-inert-surface-gate.md)

---

## Origin

Authoring `code-block`'s long-missing guide surfaced two public APIs inert since v0.1.0. Rather
than fix the instance, the class was audited across all 64 components: **16 inert surfaces across
10 components** — props, handle methods and slot-context fields that compile, export, are callable,
and do nothing.

The defining case is `app-sidebar`, whose plan doc carries a **High** review finding carefully
correcting the *timing* of `onActiveItemChange` — a callback wired to nothing. **Review rigour does
not detect absence.**

## Verdict: **Pass with follow-ups**

All close conditions hold. Every finding is implemented or self-disclosing, the gate is falsified
both ways inside the real build chain, and consumer installs compile clean under consumer-strict
flags.

## Disposition of all 16

| Component | Surface | Disposition |
|---|---|---|
| code-block | `scrollToLine()` | **implemented** — CodeMirror dispatch in edit, row targeting in view/terminal, expands a collapsed block |
| code-block | `CodeBlockServerProps` | **disclosed** — `@deprecated`, phantom file reference removed |
| app-sidebar ×5 | `onItemHover` `onItemFocus` `onActiveItemChange` `onMount` `onUnmount` | **implemented** — hover/focus silent on disabled rows; `onActiveItemChange` fires from derived state, never the click handler |
| story-viewer ×2 | `reactors` `onLoadReactors` | **disclosed** — dev-warn + `@notImplemented` (no reactions surface exists to build on) |
| story-composer | `editorBackground` | **disclosed** — no surface of its own to paint; forwarding needs a MediaEditor prop |
| news-card | `openKebab()` | **implemented** — kebab controlled from the card root, reaching whichever variant renders |
| comment-thread ×3 | `renderComposer` helpers | **implemented** — real `setValue` / `submit` / `cancel` |
| pdf-viewer | `closeMenu()` + position | **implemented** — opens at the pointer on right-click, Escape closes |
| gantt-timeline | `measureRows()` | **implemented** — the virtualizer's own `measure()` was returned and never destructured |
| markdown-editor | `ToolbarItem.run` | **fixed at the type** — now optional, so a separator stops fabricating a no-op |
| media-editor | `handle.open()` | **disclosed** — a legitimate no-op, now an audible one |

Non-findings confirmed and left alone: `team-feedback-loop.onEvent` and `media-editor`'s capture
methods — both already disclosed, and the precedent the new rule is built on.

## Findings against my own work

| # | Finding | Verdict | Fix |
|---|---|---|---|
| F1 | `pdf-viewer` Escape handler on the scroll container — a menu takes focus when it opens, so it could never fire | **CONFIRMED** | Document-level listener; verified in-browser |
| F2 | `comment-thread` `submit` posted the previous value on a same-tick `setValue` | **CONFIRMED** | See F2b |
| F2b | The F2 fix used a **ref**, which the React Compiler rejects — `renderComposer` runs *during render*, so those helpers sit on a render-reachable path | **CONFIRMED** (by the lint) | Ref removed; `submit(value?)` widened — non-breaking, explicit |
| F3 | `ResolvedPartProps` gained **required** fields — it is barrel-exported and `types.ts` ships, so that is a compile-break, shipped in a **patch** | **CONFIRMED** (post-ship) | Both made optional, `news-card` 0.4.2 (`399cfdb`) |
| F4 | `scrollToLine` on a controlled-`expanded` block | **DROPPED** | Correct by contract — the host owns `expanded` |
| F5 | Expand-modal clone capturing the scroll query | **DROPPED** | `rootRef` is on the `<section>`; the modal renders as a sibling |

## Close conditions

| # | Condition | Status |
|---|---|---|
| 1 | Planning docs current | ✅ plan doc is the loop's state machine; 3 missing guides authored, so **every** component now has its trio |
| 2 | Gates + smoke | ✅ tsc 0 · lint 0 errors / 14 warnings (baseline) · meta-deps 64/64 · `registry:build` exit 0 (66 artifacts) · `pnpm build` exit 0 · tests **158 / 23 files** · `validate:inert-surfaces` **64/64 clean** · **consumer install 5/5, consumer tsc 0 errors** |
| 3 | Review file | ✅ this file |
| 4 | Verdict ≥ Pass-with-follow-ups, follow-ups owned | ✅ below |
| 5 | Constituents closed GATE 3 | n/a (pro-component tier) |
| 6 | STATUS row honest + decision file | ✅ 10 version rows updated; ADR + retro written |

## Proof that matters

- **The gate blocks a deploy.** Re-planted an inert `scrollToLine` → `registry:build` **exit 1**,
  halted *before* `shadcn build`; restored → **exit 0**. Repeated for a re-planted stale deferral.
- **Every fix falsified.** Breaking it turned the right tests red: scrollToLine 5/6, app-sidebar
  5/8 (the 3 survivors are negative controls), comment-thread 3/4.
- **Real browser, production build.** markdown-editor's toolbar renders 15 buttons after `run`
  became optional; code-block reached `data-highlight="ready"` with 383 addressable rows;
  news-card's controlled kebab opens a 12-item menu and closes on Escape; zero console errors.
- **Real consumer.** 5/5 install, 130 vendored files each carrying this arc's changes, consumer
  `tsc` **0 errors** with consumer-strict flags mirrored.

## Risk assessment

The probes are regex-based and deliberately conservative, so the residual risk is a **false
negative** — an inert surface shaped unlike the four probes (a prop read then ignored, a method
that only logs). The disclosure hatch is the pressure valve: if `@notImplemented` starts appearing
routinely, that is the signal to widen the probes, not that the rule is too strict.

## Follow-ups

| # | Item | Severity | Owner | Target |
|---|---|---|---|---|
| FU-1 | Implement what the disclosed surfaces promise: story-viewer reactions preview · story-composer editor background (needs a MediaEditor prop) · media-editor imperative capture · card-tree-node bulk edit · media-library copy/duplicate | 🔹 Low | per-component U-loop | unscheduled |
| FU-2 | The real `@ilinxa/code-block/server` RSC variant — a feature behind GATE 2, not a gap closure | 🔹 Low | `code-block` C-loop | unscheduled |
| FU-3 | Probe A cannot see a prop that is *read but ignored*. Widen if the hatch starts getting used routinely. | 🔹 Low | next sweep | on signal |

## Post-deploy

Verified live on `ui.ilinxa.com` with probes naming symbols only the new version has —
`data-cb-scroller`, `handleItemHover`, `submitSlot`, `kebabOpen?:`. The first attempt used
`onItemHover` and reported LIVE against a **stale** artifact, because that identifier ships in
`types.ts` and existed in the old version too: **a post-deploy probe must test something the
previous version did not have.**

Since the gate runs inside `vercel-build` → `registry:build`, a successful deploy is also proof it
passed in CI, not merely locally.
