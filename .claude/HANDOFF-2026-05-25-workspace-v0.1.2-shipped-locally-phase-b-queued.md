# HANDOFF — 2026-05-25 — workspace v0.1.2 SHIPPED locally; Phase B (v0.2.0) plan written + queued

> **Active handoff.** Read this first on resume. Supersedes [`HANDOFF-2026-05-09-session-pause.md`](HANDOFF-2026-05-09-session-pause.md) (frozen).
>
> **Resume entry points (pick one):**
> 1. `git push` to land the v0.1.2 ship on Vercel (deploy auto-runs `pnpm vercel-build`); then F-cross-11 path-b consumer-tsc smoke against the deployed artifact (closes spotcheck F-01).
> 2. Start Phase B (v0.2.0 — alpha → beta promotion). Full plan at [`C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`](file:///C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md). Phase A is fully shipped; Phase B is untouched code.
> 3. v0.1.3 micro-patch closing the v0.1.2 spotcheck F-03 (`useResizeKeyboard` export — un-export OR document for the rare consumer reaching for it).

---

## Where things stand

**Branch:** `master`. **Tip:** `9fe354b`. **Unpushed:** 2 commits ahead of `origin/master`.

```
9fe354b docs(workspace): backfill v0.1.2 decision-file commit SHA
5233498 feat(workspace): v0.1.2 — deep-review close-out (12 findings, all non-breaking)
2ff5d84 feat(rich-sidebar): v0.3.0 SHIPPED — A+ pass, 11 review findings closed (1 BREAKING type widening)
```

**Working tree:** clean except `.claude/scheduled_tasks.lock` (harness artifact — intentionally untracked, not part of any commit; ignore on resume).

**Component count unchanged:** 49 across 8 categories. `workspace` row in STATUS.md + component-versions.md both at `0.1.2 alpha`.

---

## What shipped in v0.1.2

12 validated findings closed. **Zero functional regression** for existing consumers. New props are purely additive with defaults preserving v0.1.1 behavior.

### Code (in `src/registry/components/layout/workspace/`)

| Finding | File(s) | Change |
|---|---|---|
| A-1 | [`workspace.tsx`](../src/registry/components/layout/workspace/workspace.tsx) | Dropped dead `const rootRect = canvas.getBoundingClientRect();` + `void rootRect;` in `handleDividerPointerDown` |
| A-2 | [`workspace.tsx`](../src/registry/components/layout/workspace/workspace.tsx) + [`lib/tree.ts`](../src/registry/components/layout/workspace/lib/tree.ts) | Lifted `computeLayoutBoundsForPath` from workspace.tsx into `lib/tree.ts`; now exported. `clampRatio` import in workspace.tsx removed (was only used by the moved function). |
| A-3 | [`hooks/use-keyboard-actions.ts`](../src/registry/components/layout/workspace/hooks/use-keyboard-actions.ts) + [`workspace.tsx`](../src/registry/components/layout/workspace/workspace.tsx) | New exported `useResizeKeyboard({ enabled, leaves, dividers, renderedTree, focusedAreaId, dispatch })` hook. Workspace's 55-line inline `Alt+Shift+Arrow` `useEffect` replaced by a 7-line call site. |
| A-4 | [`workspace.tsx:159`](../src/registry/components/layout/workspace/workspace.tsx) | `isStacked = breakpoint === "mobile"` (dropped `\|\| cap === 0` conflation). `cap=0` + multi-leaf at desktop now tile-renders with inert corners + resizable dividers. |
| A-5 | [`parts/split-divider.tsx`](../src/registry/components/layout/workspace/parts/split-divider.tsx) + [`workspace.tsx`](../src/registry/components/layout/workspace/workspace.tsx) | `<SplitDivider>` accepts new `onKeyResize?: (delta: number) => void`. `tabIndex={-1}` + `onKeyDown` for Arrow keys (orientation-aware). Pointer-down also focuses the divider so arrow chaining works. Workspace handler clamps `[0.05, 0.95]` and re-reads current ratio from `renderedTree` (avoids stale closures). |
| A-6 | [`types.ts`](../src/registry/components/layout/workspace/types.ts) + [`workspace.tsx`](../src/registry/components/layout/workspace/workspace.tsx) | New optional `onError?: (errors: string[]) => void` on `WorkspaceProps`. Stored in a `useRef` so prop-identity changes don't re-run the validate effect. Existing `console.error` preserved. |
| A-7 | [`types.ts`](../src/registry/components/layout/workspace/types.ts) + [`parts/card-stack.tsx`](../src/registry/components/layout/workspace/parts/card-stack.tsx) + [`workspace.tsx`](../src/registry/components/layout/workspace/workspace.tsx) | New optional `cardStackItemHeight?: number` (default 320). Module-level `STACK_CARD_HEIGHT` renamed `DEFAULT_STACK_CARD_HEIGHT` and used as the default; prop threaded through `<CardStack>` → `<StackedCard>` via new `itemHeight` prop. |
| A-8 | [`parts/component-picker.tsx`](../src/registry/components/layout/workspace/parts/component-picker.tsx) | Replaced bare `<div key={...}>` around each category's items with `<DropdownMenuGroup>`. |
| A-9 | [`hooks/use-corner-gesture.ts`](../src/registry/components/layout/workspace/hooks/use-corner-gesture.ts) | Removed module-level `let inertLogged = false;`. Replaced with `useRef<boolean>(false)` inside `useCornerGesture`. **Closes F-06 from the 2026-05-08 v0.1.0 sweep review** — the last open follow-up from that review. |

### Docs

| Finding | File(s) | Change |
|---|---|---|
| A-10 | [`workspace-procomp-guide.md`](../docs/procomps/workspace-procomp/workspace-procomp-guide.md) "Gotchas" + [`usage.tsx`](../src/registry/components/layout/workspace/usage.tsx) "Notes" | New "Gotcha" entry: `onLayoutChange` fires per rAF tick during edge-drag (~60Hz). Debounce recipe with `useMemo + debounce`. |
| A-13 | [`workspace-procomp-guide.md`](../docs/procomps/workspace-procomp/workspace-procomp-guide.md) | Migration notes section: explicit v0.1.1 → v0.1.2 changelog mirroring todo-tree pattern. Open follow-ups: strikethrough closure of every Phase A finding + forward-looking v0.2.0 items. |
| A-14 | [`workspace-procomp-guide.md`](../docs/procomps/workspace-procomp/workspace-procomp-guide.md) "Gotchas" | New "Gotcha" entry: first-render breakpoint flash. Doc-only because in-component fixes (lazy `useLayoutEffect` init / render-nothing-until-measured) carry SSR hydration mismatch risk. |
| (cross) | [`workspace-procomp-guide.md`](../docs/procomps/workspace-procomp/workspace-procomp-guide.md) | **Pattern 4 (controlled mode persistence) rewritten** with the canonical `useMemo + debounce` recipe — was the documented footgun. Persist+restore cookbook updated to point at Pattern 4 + show debounce. Two new cookbook recipes: "Surface validation errors" + "Customize the mobile card height". Tree-edit table now lists Arrow-key resize alongside edge-drag. "Useful options (v0.1.2)" callout right after mental model. Public API surface line enumerates all 9 type exports + notes v0.1.2's additive `WorkspaceProps` fields. |
| (cross) | [`workspace-procomp-description.md`](../docs/procomps/workspace-procomp/workspace-procomp-description.md) | Top-matter declares v0.1.2 production status + lists additive API surface + links to migration notes and decision file. |
| (cross) | [`workspace-procomp-plan.md`](../docs/procomps/workspace-procomp/workspace-procomp-plan.md) | New "Post-ship addenda" section covering v0.1.1 (F-01 fix + plan amendments for F-04/F-05) + v0.1.2 (full per-finding inventory) + v0.2.0 plan pointer. Loud, no silent deviations. |
| (cross) | [`demo.tsx`](../src/registry/components/layout/workspace/demo.tsx) | Wires `onError` → renders `<AlertTriangleIcon>` panel beneath canvas with the errors list. Passes `cardStackItemHeight={420}`. Inline copy mentions the new divider Arrow-key gesture. |
| (cross) | [`docs/component-versions.md`](../docs/component-versions.md) | Workspace row bumped 0.1.1 → 0.1.2. New v0.1.2 entry in the "Bumps" log with full change inventory + decision-file link. |

### New artifacts

- [`.claude/decisions/2026-05-24-workspace-v0.1.2-deep-review-closeout.md`](decisions/2026-05-24-workspace-v0.1.2-deep-review-closeout.md) — frontmatter `commits: [5233498]`, full per-finding outcome table + public-API impact + decision points + GATE 3 verdict link.
- [`docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md`](../docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md) — GATE 3 spot-check, rotating dim Public API, verdict **Pass with follow-ups**, 3 non-blocking findings.

---

## v0.1.2 spotcheck follow-ups (carry forward to resume)

| ID | Severity | Action | Target |
|---|---|---|---|
| F-01 | 🔹 Low | F-cross-11 path-b consumer-tsc smoke from `e:/tmp/ilinxa-smoke-consumer/` against the deployed Vercel artifact. Patch-bump exemption per established cadence. | After push |
| F-02 | 🔸 Medium (informational) | Phase B (v0.2.0) backlog: imperative `WorkspaceHandle` API + `stack` kind in `AreaTree` + `onResize`/`onLayoutChange` split + undo/redo + touch/pen gestures + multi-edge linked resize + alpha→beta promotion + full 16-dim checklist review. | v0.2.0 |
| F-03 | 🔹 Low | `useResizeKeyboard` is currently exported from `hooks/use-keyboard-actions.ts` but undocumented in the guide. Decide: un-export (keep module-private) OR document the contract. | v0.1.3 |

---

## Withdrawn / closed findings (context for fresh session)

- **H-2 (Alt+Enter shortcut)** — was a finding in the 2026-05-23 deep-review draft but already closed via plan amendment at `workspace-procomp-plan.md` line 236 during the v0.1.0 → v0.1.1 cycle. Do NOT re-open. Chevron menu provides keyboard parity; `Alt+Enter` is deferred to v0.2.
- **All other 2026-05-08 v0.1.0 sweep review follow-ups** (F-01 balanced-splits, F-02 chevron-menu, F-03 sweep-wide usage paths, F-04 separator dep, F-05 focus action doc, F-06 inertLogged → closed as A-9 here, F-07 meta.related) — all closed. No carry-forward from that review.

---

## Phase B (v0.2.0) at a glance

Full detail at [`C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`](file:///C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md).

| Item | What it does | Breaking? |
|---|---|---|
| B-1 | Imperative `WorkspaceHandle` ref API (~14 methods, mirrors `TodoTreeHandle` shape). `forwardRef<WorkspaceHandle, WorkspaceProps>`. Methods: `getLayout / setLayout / resetLayout / splitArea / mergeArea / resizeArea / swapComponent / focusArea / getFocusedAreaId / findArea / listAreas / setActivePreset / getActivePresetId / undo / redo / canUndo / canRedo`. | No (additive). |
| B-2 | `stack` kind in `AreaTree`. Closes the v0.1.1 F-01 trade-off (depth cap was not strictly honored because balanced-split chain has `log₂(N)` depth). `flattenSubtreesPastDepth` emits `stack` nodes instead of split chains. `computeLayout` renders stack regions via a parent-rect-constrained stack-renderer. | **Yes (TS-only).** `AreaTree` discriminator widens `leaf \| split` → `leaf \| split \| stack`. Exhaustive switches on `kind` get a tsc error until they add a `stack` arm. Migration recipe in v0.2.0 guide. |
| B-3 | New `onResize` per-frame callback. `onLayoutChange` fires only on resize END + non-resize action commits. Closes the H-1 footgun fully. | **Yes (subtle).** Consumers using `onLayoutChange` for in-flight feedback lose per-frame. Opt-back-in: `onResize={onLayoutChange}`. |
| B-4 | Built-in undo/redo. New `lib/history.ts`. `historyDepth?: number = 50` prop (`0` disables). Reducer actions `undo` / `redo`. Keyboard `Ctrl/Cmd+Z` (undo) + `Ctrl/Cmd+Shift+Z` (redo) wired in `use-keyboard-actions.ts`. | No (additive). |
| B-5 | Touch/pen gestures. Both gesture hooks already use Pointer Events. Add `touch-action: none` to corner handles. Long-press 300ms activation on touch pointer type (Dual DnD pattern from todo-tree). Default `mobile` cap default bumps `0 → 2`. | **Yes (mobile default).** Opt-out: `maxSplitDepth={{ mobile: 0 }}`. |
| B-6 | Multi-edge linked resize. Drag a divider, walk sibling splits, batch resize aligned dividers in one tree commit. New `linkedResize?: boolean = true` opt-out prop. | **Yes (default behavior change).** Opt-out: `linkedResize={false}`. |
| B-7 | Corner-drag carries initial ratio. `Action` `split` variant gains optional `ratio?` (default 0.5). Keyboard-split + chevron-menu paths unchanged. | No (additive). |
| B-8 | Promote `alpha → beta`. Triggers the full 16-dim `review-checklist.md` review (peer review preferred, or AI-assisted with findings tagged). | n/a. |
| B-9 | Migration guide — explicit 4-item breaking-changes list with opt-back-in recipes. | n/a. |

Effort estimate: ~3–4 days. Imperative API + `stack` kind = ~1 day; undo/redo = ~0.5 day; touch + multi-edge = ~1.5 days; full checklist review + decision file = ~0.5 day.

---

## On resume: first actions

1. `cd e:/2026/ilinxaDOC/ilinxa-ui-pro && git status && git log --oneline -3` — verify tree clean except `scheduled_tasks.lock`, tip at `9fe354b`.
2. Read this file end-to-end.
3. Pick a resume path:
   - **Push + smoke (close F-01):** `git push` → wait for Vercel deploy → run `pnpm dlx shadcn@4.6.0 add @ilinxa/workspace @ilinxa/workspace-fixtures` from `e:/tmp/ilinxa-smoke-consumer/` → `pnpm tsc --noEmit` in consumer → if clean, F-01 closed and you can squash the open follow-up in the spotcheck file.
   - **Phase B:** read the plan file at `C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`, then start B-1 (imperative API) since it's the foundation B-4 (undo/redo) builds on.
   - **v0.1.3 polish:** decide on `useResizeKeyboard` (un-export OR document). 30-minute patch.

---

## Critical files snapshot (for orientation)

- **Component source:** [`src/registry/components/layout/workspace/`](../src/registry/components/layout/workspace/) (19 files, 2648 LOC; lints + tsc clean)
- **Procomp docs:** [`docs/procomps/workspace-procomp/`](../docs/procomps/workspace-procomp/) (description / plan / guide / 2 reviews)
- **Decision file:** [`.claude/decisions/2026-05-24-workspace-v0.1.2-deep-review-closeout.md`](decisions/2026-05-24-workspace-v0.1.2-deep-review-closeout.md)
- **GATE 3 spotcheck:** [`docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md`](../docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md)
- **Phase B plan:** [`C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`](file:///C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md)
- **STATUS.md banner:** [`./STATUS.md`](STATUS.md) (top blockquote covers this session)

---

## State locked

- Two commits on `master` (`5233498` ship + `9fe354b` decision-file SHA backfill)
- STATUS.md banner added
- Decision file `commits: [5233498]` populated
- HANDOFF file authored (this file)
- Auto-memory updated (parent project memory + index)

The session is paused cleanly. Resume in a fresh chat — this HANDOFF is the entry point.
