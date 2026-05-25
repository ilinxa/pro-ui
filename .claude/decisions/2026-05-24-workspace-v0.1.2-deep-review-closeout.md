---
date: 2026-05-24
type: patch
commits: [5233498]
components: [workspace]
findings: [A-1, A-2, A-3, A-4, A-5, A-6, A-7, A-8, A-9, A-10, A-13, A-14]
status: shipped
---

# workspace v0.1.2 — deep-review close-out (12 findings → patch)

## Summary

Patch bump on `workspace` v0.1.1 closing the 12 validated findings (1 High, 4 Medium, 5 Low + 2 doc-only) from the 2026-05-23 deep-review pass, plus the last remaining open follow-up from the 2026-05-08 v0.1.0 sweep review (F-06 inertLogged, here closed as A-9). Strictly non-breaking. Two purely additive `WorkspaceProps` (`onError`, `cardStackItemHeight`). One new internal keyboard surface (`<SplitDivider>` Arrow-key resize). One refactor extracting `Alt+Shift+Arrow` into a new `useResizeKeyboard` hook. Three doc additions (`onLayoutChange` 60Hz storm warning, first-render breakpoint flash gotcha, v0.1.1 → v0.1.2 changelog).

The work is Phase A of the comprehensive workspace improvement plan at [`C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`](file:///C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md). Phase B (v0.2.0) ships the imperative ref API, `stack` kind in `AreaTree`, touch/pen gestures, undo/redo, multi-edge linked resize, and the alpha→beta promotion with the full 16-dimension review.

## Per-finding outcomes

| ID | Source finding | Severity | Outcome in v0.1.2 |
|---|---|---|---|
| A-1 | M-2 (dead `rootRect`) | 🔸 Medium | Removed `const rootRect = canvas.getBoundingClientRect()` + `void rootRect;` at workspace.tsx:237/248. Verified unused; replaced the `!canvas` guard with `!canvasRef.current`. |
| A-2 | M-2 (duplicate tree walk) | 🔸 Medium | Lifted `computeLayoutBoundsForPath` from workspace.tsx into [`lib/tree.ts`](../../src/registry/components/layout/workspace/lib/tree.ts) and exported it. Workspace now imports + the file-local `clampRatio` import is gone (it was only used by the moved function). |
| A-3 | M-3 (keyboard logic split) | 🔸 Medium | New exported `useResizeKeyboard` hook in [`hooks/use-keyboard-actions.ts`](../../src/registry/components/layout/workspace/hooks/use-keyboard-actions.ts). The 55-line inline `useEffect` in workspace.tsx is replaced by a 7-line hook call. Same dependencies; same behavior. |
| A-4 | H-3 (`cap===0` conflation) | ⚠️ High | `isStacked` is now strictly `breakpoint === "mobile"`. `cap=0` at desktop/tablet now routes to tile rendering with corners inert (via existing `leaf.depth < cap` gate) and dividers resizable. Validated by call-flow trace pre-implementation. |
| A-5 | M-1 (divider keyboard) | 🔸 Medium | `<SplitDivider>` accepts new optional `onKeyResize?: (delta: number) => void`. Internally adds `tabIndex={-1}` + `onKeyDown` handler responding to ArrowLeft/Right (vertical) or ArrowUp/Down (horizontal). Pointer-down also focuses the divider so subsequent arrow presses keep working. workspace.tsx threads a handler that re-reads the current ratio from the renderedTree (avoiding stale closures) and clamps to `[0.05, 0.95]`. |
| A-6 | M-5 (validateTree swallowed) | 🔸 Medium | New optional `onError?: (errors: string[]) => void` prop. Stored in a `useRef` so prop-identity changes don't re-run the validate effect. Existing `console.error` preserved. |
| A-7 | L-1 (`STACK_CARD_HEIGHT` hardcoded) | 🔹 Low | New optional `cardStackItemHeight?: number` prop on `WorkspaceProps`. Threaded through `<CardStack>` → `<StackedCard>` via the new `itemHeight` prop. Module-level constant renamed `DEFAULT_STACK_CARD_HEIGHT` and used as the default. |
| A-8 | L-2 (`<DropdownMenuGroup>`) | 🔹 Low | Replaced bare `<div>` wrappers around each category's items in [`parts/component-picker.tsx`](../../src/registry/components/layout/workspace/parts/component-picker.tsx) with `<DropdownMenuGroup>`. The shadcn primitive already exports it; no new dep. |
| A-9 | L-4 (module-level `inertLogged`) | 🔹 Low (= F-06 from v0.1.0 review) | Module-level `let inertLogged = false;` removed; replaced with `useRef<boolean>(false)` inside `useCornerGesture`. Multi-instance correctness; HMR resilience. |
| A-10 | H-1 (onLayoutChange 60Hz storm) | ⚠️ High (doc) | New "Gotcha" section in the procomp guide documenting the per-rAF callback rate during edge-drag, plus a debounce recipe with `useMemo` + `debounce`. Mirrored note in `usage.tsx`. The structural fix (split `onResize` from debounced `onLayoutChange`) is v0.2.0 (B-3). |
| A-13 | (cross-cutting changelog) | — | Guide migration-notes section now has explicit v0.1.1 → v0.1.2 entry + strikethrough-tracked closures of every Phase A finding in "Open follow-ups" + forward-looking v0.2.0 items. Pattern mirrors todo-tree v0.1.2's guide. |
| A-14 | L-3 (first-render flash) | 🔹 Low (doc) | New "Gotcha" section explaining `useBreakpoint`'s desktop default + ResizeObserver settle pattern + wrapper-level workarounds. Doc-only by design: the obvious in-component fix (lazy init via `useLayoutEffect`) risks React 19 SSR hydration mismatch warnings, so we surface the issue rather than silence it. |

## Public-API impact

**New optional props on `WorkspaceProps`** — both default-off, both backwards-compatible:

- `onError?: (errors: string[]) => void`
- `cardStackItemHeight?: number` (default 320)

**New exported hook** (alongside `useKeyboardActions`):

- `useResizeKeyboard({ enabled, leaves, dividers, renderedTree, focusedAreaId, dispatch })` — primarily for refactor consolidation. Spotcheck F-03 tracks whether to un-export or document this for the next patch.

**Internal `<SplitDivider>` prop:**

- `onKeyResize?: (delta: number) => void` — not exported from `index.ts`. Component-internal.

**No breaking changes.** No existing prop renamed, removed, or semantically shifted.

## Decision points logged

1. **A-5 divider focus model:** chose `tabIndex={-1}` (programmatic-only) over `tabIndex={0}` (tab-stop pollution). Trade-off: divider isn't reachable via Tab cycling, but the `Area`'s focus ring already covers split-then-arrow navigation. Same precedent as the v0.1.0 review's option (a) for F-02 keyboard logic.
2. **A-6 onError ref guard:** stored in `useRef` so the validate `useEffect` doesn't re-run on prop-identity change. Matches the same pattern used for `onLayoutChange` at workspace.tsx:102-109 (Three-defenses controlled-mode discipline).
3. **A-14 doc-only over code fix:** rejected both obvious in-component fixes (`useLayoutEffect` lazy-init → SSR hydration mismatch risk; render-nothing-until-measured → delayed first paint + layout shift). Surface the gotcha; let consumers gate at the wrapper.
4. **A-10 doc warning instead of debounce:** rejected throttling inside the component because consumers using `onLayoutChange` for in-flight overlays would lose per-frame updates without an opt-in. v0.2.0's `onResize` / `onLayoutChange` split is the structural answer.
5. **H-2 (Alt+Enter) NOT in scope:** the v0.1.0 review's F-02 was closed via plan amendment at plan.md:236 (chevron-menu pattern locked, `Alt+Enter` deferred to v0.2). Not re-opened.

## GATE 3 verdict

[`docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md`](../../docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md) — **Pass with follow-ups**.

Three non-blocking follow-ups:
- **F-01** path-b consumer-tsc smoke deferred to post-push (patch-bump exemption per established cadence)
- **F-02** v0.2.0 backlog (B-1 through B-9 from the comprehensive plan)
- **F-03** `useResizeKeyboard` export documentation or un-export — next patch (v0.1.3)

## Verification

- `pnpm tsc --noEmit` — clean (exit 0)
- `pnpm eslint src/registry/components/layout/workspace/**/*` — clean (exit 0)
- `pnpm validate:meta-deps` — clean (49/49)
- `pnpm registry:build` — complete; workspace artifacts regenerated

F-cross-11 path-b consumer smoke deferred to post-push per patch-bump convention.

## Cross-references

- **Comprehensive plan (Phase A + Phase B):** [`C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`](file:///C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md)
- **v0.1.0 review (2026-05-08 sweep):** [`docs/procomps/workspace-procomp/reviews/2026-05-08-v0.1.0-review.md`](../../docs/procomps/workspace-procomp/reviews/2026-05-08-v0.1.0-review.md)
- **v0.1.2 spotcheck:** [`docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md`](../../docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md)
- **GATE 3 rule:** [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
- **Reference patterns reused:** `todo-tree`'s patch-bump decision file shape ([`2026-05-21-todo-tree-v0.1.2-add-button-deferred-commit-f-perm.md`](2026-05-21-todo-tree-v0.1.2-add-button-deferred-commit-f-perm.md)) and guide migration-notes format.
