# Readiness review — barrel-exports backlog sweep (spotcheck, cross-component)

- **Date:** 2026-08-17
- **Tier:** pro-component × 4 (+ 1 refuted)
- **Trigger:** public-API-touching minor on each of `event-calendar`, `gantt-timeline`, `kanban-board`, `post-card` ([`.claude/rules/readiness-review.md`](../../.claude/rules/readiness-review.md) trigger table)
- **Scope:** drive `validate:barrel-exports` from **16 high across 5 components** to **0 high**
- **Reviewer:** architect (main session)
- **Why one review file:** the four changes are mechanically identical (type-only re-exports from a slug's own `types.ts`) and share one gate battery and one smoke. Per-component review files would be four copies of this table. Precedent: the P2/P3/P4 sweep reviews in this folder. Each component's `meta.ts` carries its own one-line record.

---

## Origin

`validate:barrel-exports` shipped **report-only** on 2026-08-17 with the test tier
([ADR](../../.claude/decisions/2026-08-17-test-tier.md), plan §R0.4): *"validator now,
catalog-wide sweep is its own fix program."* This is that fix program.

The defect class it detects: a type that is **transitively referenced by something `index.ts`
exports** but is not itself importable from `index.ts`. Nothing else in the gate battery can see
it — every such type is used internally, so the component compiles clean. It breaks only for an
external consumer writing `import type { X } from "@ilinxa/<slug>"`.

## Verdict: **Pass**

Closes GATE 3 for all four bumps. 0 high across all 64 components; `--strict` now exits 0, so the
validator is promotable to a gate — which is the outcome that makes the backlog *closed* rather
than merely smaller.

## Disposition of all 16

| Component | Type | Reachable from | Disposition |
|---|---|---|---|
| `event-calendar` → **0.5.0** | `CalendarBaseContextValue` | return type of the exported `useCalendar()` hook | **Exported.** A consumer could call the hook and not name what it returns |
| `gantt-timeline` → **0.7.0** | `GanttContextValue` | return type of the exported `useGanttTimeline()` | **Exported** |
| `gantt-timeline` | `GanttRenderItem` | element type of `GanttContextValue.renderItems` | **Exported.** Its `types.ts` comment says "internal; constructed in the Root" — that describes who *builds* it, not who may *name* it |
| `kanban-board` → **0.6.0** | `AnyKanbanCardRenderer` | declared element type of `KanbanBoardProps.renderers` **and** the first parameter of the exported `findRenderer` | **Exported.** Usable-without-naming (it is `KanbanCardRenderer<any>`, so typed renderers assign either way) but not nameable, which `KanbanBoardProps["renderers"]` requires |
| `post-card` → **0.5.0** | `LinkPreview`, `PostLocation`, `PostMention`, `PostMutationHandlers`, `PostPermissionAction`, `PostPermissions`, `PostPoll`, `PostPollOption`, `PostReplyTo`, `PostViewerMode`, `PostVisibility` (11) | fields of the already-exported `Post` / `PostCardProps` | **Exported.** The largest single gap: a consumer could hold a `Post` and be unable to name the type of a field they were constructing |
| `media-editor` | `StoryComposerLabels` | `MediaCaptureSurfaceProps.labels`, via the exported capture seam | **REFUTED — not exported.** See below |

**15 exported · 1 refuted · 0 deferred.**

## The refutation, and what it changed

`StoryComposerLabels` is tagged `@internal` in `media-editor/types.ts` and documented in place as
*"temporary shim; refactored to `MediaEditorLabels` in C17 […] NOT exported via barrel"*. It
leaked into the public surface at P3, when the capture injection seam gave
`MediaCaptureSurfaceProps` a `labels: Required<StoryComposerLabels>` field.

Re-exporting it would have been the **wrong fix**: it would freeze a transitional shim into the
published API and make its removal a breaking change. The right fix is to change the *public*
type to use `MediaEditorLabels` — the C17 refactor, which is breaking and belongs to
`media-editor`, not to a barrel sweep.

But leaving it as an un-actionable high finding means the backlog can never reach zero and the
validator can never be promoted from report-only. So the validator gained a **severity split**:

- **high** — an ordinary public type simply missing from `index.ts`. Fix by re-exporting.
- **warn** — the declaration carries `@internal`. Reported, never gated; `--strict` fails on high
  only.

`@internal` was chosen over a bare ignore-comment or a side-file allowlist deliberately: it is a
standard API-extractor tag with real meaning, it lives on the declaration, and it cannot silence
a finding without also documenting the type as non-public.

**Escape-hatch blast radius, measured:** exactly two `types.ts` files in the catalog carry
`@internal` (`media-editor` ×1, `blackboard` ×2). `blackboard` was never flagged, so the new tier
demoted exactly one finding — the intended one. No silent suppression.

## Close conditions

| # | Condition | Status |
|---|---|---|
| 1 | Planning trio current | ✅ n/a — no behaviour or contract change; each `meta.ts` gains a one-line feature record naming the types |
| 2 | Gates + smoke | ✅ full battery green (see below); all four installed via real CLI, consumer tsc **0 errors** |
| 3 | Review file | ✅ this file |
| 4 | Verdict ≥ Pass-with-follow-ups, follow-ups owned | ✅ one follow-up, owned |
| 5 | Constituents closed GATE 3 | n/a |
| 6 | STATUS rows honest + decision file | ✅ four rows bumped; [decision file](../../.claude/decisions/2026-08-17-fu-a-barrel-sweep-harness.md) |

## Gates

tsc 0 · lint 0 errors / 14 known warnings · meta-deps 64/64 · registry validators · doc
validators · `registry:build` (artifact-size 66 artifacts, 0 high) · `pnpm build` 77 pages ·
**102 tests / 15 files** under `NODE_ENV=production` · **16 e2e**.
`validate:barrel-exports`: **0 high · 1 warn**, `--strict` exit 0.

## Proof that matters

An install plus a `tsc` that never **names** the new types proves nothing — every one of them was
already reachable internally, which is precisely why no gate caught them. So the smoke included a
consumer-side probe importing all 15 by name from their package roots and aliasing each into a
type. It compiled: **0 errors**.

Falsified against production rather than by local mutation — fetching the **live** pre-change
artifacts confirmed the barrels genuinely lacked them:

```
LIVE post-card (pre-change):     PostMention ABSENT · PostPoll ABSENT · PostPermissions ABSENT
LIVE gantt-timeline (pre-change): GanttContextValue ABSENT · GanttRenderItem ABSENT
```

## Post-deploy

Verified on the deployed artifacts, not on the push (the v0.4.0 lesson). Commit `a1d1acc`,
deploy green, then off **production**:

| Check | Result |
|---|---|
| `/r/post-card.json`, `/r/gantt-timeline.json` barrels | `PostMention` · `PostPoll` · `GanttContextValue` · `GanttRenderItem` all now **present** (they were absent in the same fetch before the push) |
| Real CLI install of all four from `ui.ilinxa.com` | exit 0 |
| Consumer probe importing all 15 by name + `tsc --noEmit` | **0 errors** |

## Risk assessment

All four diffs are type-only re-exports from each slug's own `types.ts`. No runtime code, no
shipped-file changes, so `registry.json` rosters are untouched. The failure modes are (a) a name
collision in the barrel and (b) a name that does not exist — both are compile errors, and tsc is
green in the producer *and* in a consumer that imports every one by name.

## Follow-ups

| # | Item | Owner | Target |
|---|---|---|---|
| FU-1 | **`media-editor` C17**: change `MediaCaptureSurfaceProps.labels` to `Required<MediaEditorLabels>` and delete the `StoryComposerLabels` shim. Breaking for anyone who wrote a custom `CameraSurface`; needs its own U-loop. Until then `validate:barrel-exports` will report 1 warn — that warn *is* the ticket. | media-editor | next `media-editor` minor |

## Promotion to a gate — applied, same day, after user sign-off

`validate:barrel-exports --strict` now runs inside `registry:build` (and therefore
`vercel-build`), positioned after `validate-naming` and **before** `shadcn build`, so a broken
barrel cannot produce artifacts.

It was falsified both ways before being trusted, because a gate seen only passing is not a gate:

| Step | Result |
|---|---|
| Delete `AnyKanbanCardRenderer` from the kanban barrel | validator `--strict` → **exit 1**, 1 high · 1 warn |
| `pnpm registry:build` with the break in place | **exit 1**, halted before `shadcn build` — zero artifacts written |
| Restore the export (byte-identical to committed) | `registry:build` → **exit 0**, 0 high · 1 warn, 66 artifacts audited |

The `warn` row is the load-bearing detail: it was present throughout and never gated, which is
what makes the `@internal` escape hatch honest rather than a mute button.

**Safety note.** Unlike the test gate, this validator is pure filesystem reads and regex — no
`NODE_ENV`, no React, no network — so its CI behaviour is identical to local by construction. The
failure class from the `NODE_ENV=production` incident two days earlier cannot recur here.

**Confirmed in CI.** The argument above is structural; the evidence is the deploy. Vercel reports
`b1f298f` on `master` as **Ready**, serving `ui.ilinxa.com` — so `registry:build` ran the new
`--strict` gate inside `vercel-build` on Vercel and exited 0. That closes the one thing this
review could not check from outside: `b1f298f` changed no shipped artifact content, so the live
artifacts are byte-identical to the previous deploy and no amount of fetching could distinguish
the two builds. **A commit that changes no artifact is not post-deploy-verifiable by inspection —
the deploy log is the only evidence.**
