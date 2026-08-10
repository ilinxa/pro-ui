---
date: 2026-08-11
session: production-readiness-p1-5
phase: P1.5 (plan: docs/production-readiness-plan.md — inserted between P1 and P2)
type: fix-program (F-cross-13 path-b producer sweep, 23 component bumps)
commits: ship commit + docs commit this date (see git log 2026-08-11)
components: calendar-01 0.2.5 · gantt-timeline-01 0.5.2 · todo-tree 0.3.2 · todo-rich-card 0.4.2 · kanban-board-01 0.4.3 · rich-card-in-flow 0.2.1 · flow-canvas-01 0.2.7 · code-block 0.1.3 · json-form 0.2.7 · entity-picker 0.1.2 · filter-bar-01 0.1.1 · filter-stack 0.1.2 · properties-form 0.1.3 · markdown-editor 0.1.3 · team-trophy-shelf-01 0.1.3 · pricing-table-01 0.1.1 · pdf-viewer 0.1.4 · media-library-01 0.1.2 · media-editor-01 0.1.5 · account-switcher-01 0.1.1 · file-manager 0.1.2 · file-tree 0.1.2 · rich-sidebar 0.3.2
findings: closes review §0 post-ship discovery #2 (F-cross-13 path-b cohort); zero asChild / delayDuration / ToggleGroup carriers left in shipped registry code
status: shipped; post-deploy full-63 Base-UI CLI smoke recorded below
---

# P1.5 — F-cross-13 path-b carrier sweep

Every shipped component now compiles on the CURRENT base-nova (Base UI) style surface. Ground truth re-verified before fixing: **no Base-UI primitive in the consumer harness accepts `asChild` at all** (including Button and ContextMenuTrigger — calendar's old "ContextMenuTrigger asChild is cross-backend-safe" comment was wrong); `TooltipProvider` takes `delay` not `delayDuration`; ToggleGroup is multi-value (`string[]`).

## Scope vs the review's estimate

Review §0 quantified ~45 asChild / 5 ToggleGroup / 4 delayDuration sites (~20 components) from a manual-copy smoke of 38. The full programmatic scan found the real cohort: **~55 sites across 23 components** — the review undercounted json-form, entity-picker, filter-bar-01, kanban-board-01, and media-editor-01's ToggleGroup (mode-toggle-pill), and the already-patched filter-stack/properties-form still carried `asChild` tooltip sites.

## Fix patterns applied

1. **Trigger IS the button** (majority): drop `asChild` + the `<Button>` wrapper; `<XxxTrigger className={cn(buttonVariants({variant,size}), …)}>` with all props/aria carried (comment-kebab / reaction-action precedent).
2. **ToggleGroup → plain-button segmented control** (file-manager ×2, media-editor pill; filter-stack/calendar precedent). Accepted delta: individual tab stops instead of roving tabindex.
3. **`delayDuration` dropped** (code-block, file-tree, file-manager, rich-sidebar). Consequence (verifier-flagged, accepted): tooltips in file-tree/file-manager now open at the library default **0 ms** (producer wrapper's default), consistent with every other component since the filter-stack/properties-form precedent.
4. **Pass-through `ContextMenuTrigger`**: drop `asChild`, `className="contents"` — layout preserved, right-click/long-press arrives by bubbling (calendar, gantt, media-library, flow-canvas, pdf-viewer, file-manager, file-tree).
5. **Local tooltip implementations** where a `<button>` trigger cannot wrap interactive children: calendar `EventHoverWrap` (cloneElement + portaled fixed-position card) and rich-sidebar `tooltip-wrapper` (fixed bubble; its public `delay` prop now actually works cross-backend via setTimeout — it was Radix-only before). rich-card-in-flow's input tooltips became native `title` (verifier confirmed parity-or-better: the old tooltip sat on a non-focusable div).
6. **entity-picker restructure** (judgment-heaviest): default trigger = full-field overlay `PopoverTrigger` `<button>` under a click-transparent chip layer; consumer `renderTrigger` path = wrapper span owning open-on-click + hidden anchor button for positioning, with a capture-phase pointerdown guard against the dismiss→reopen race. Guide updated (it documented the deleted `div[role=button]` architecture).

## Method + verifier catches (same pipeline as P1)

5 parallel implementation agents (disjoint folders) → central gates → 3 adversarial verifiers over the diffs → coordinator fixes. The verifiers caught, pre-ship:

- ⚠️ **Calendar touch long-press regression** (fix-introduced, the arc's N1-class catch): `CalendarTimeBlock`'s unconditional `stopPropagation` on pointerdown killed the bubbling the converted context-menu trigger depends on → long-press dead on iOS time-grid. Fixed: the column's draw handler ignores block-origin presses (`closest("[data-occ-id]")`) so the stops could be removed.
- 🔸 Local-tooltip parity gaps, fixed: hide-on-scroll + Escape dismiss + top-edge flip + touch-flash guard (calendar); disabled-toggle stale-position resurrection (render-phase adjustment — the effect version trips the React Compiler's set-state-in-effect rule) + resize dismiss (rich-sidebar).
- 🔸 entity-picker keyboard-close from custom triggers (detail===0 toggle) + aria self-wiring documented in guide; `useLayoutEffect` for the openRef guard.
- 🔸 Calendar's tooltip primitive became a functional no-op → provider + meta dep + registry.json entry removed.
- 🔹 nav-user keyboard fallback for anchor-less linkComponents; demo double-tooltip; `--radix-popover-trigger-width` → dual-var `(--radix-popover-trigger-width,var(--anchor-width))` in entity-picker/json-form (pre-existing carrier class, folded in since both were open).

## Registry.json deps pruned (coordinator)

file-manager −`toggle-group` · rich-card-in-flow −`tooltip` · rich-sidebar −`tooltip` · calendar-01 −`tooltip`.

## Accepted deltas (documented, no action)

Segmented controls: per-button tab stops. Tooltip-label triggers (pricing rows, permission-tooltip) announce as buttons. Trophy-shelf passive badges: hover-only CSS tip (date stays in `aria-label`). Calendar consumer `renderTooltip`: no enter/exit animation, base text size. entity-picker: chip-remove closes an open popover; focus ring restored via `has-focus-visible:border-ring`; custom triggers in an `inline-flex` wrapper (guide-noted); `disabled` now blocks custom triggers (bug fix).

## Follow-ups (owners)

- properties-form `field-row.tsx:196` focus ref points at a non-focusable span (pre-existing; the new button trigger is the natural target) → P3.4 fix-on-touch.
- `--radix-popover-trigger-width` audit across remaining components → P3.4 / on-touch.
- Residual F-cross-13 carrier class: 9 media/social items pin new-york regDep URLs → P2/P4 convention decision (unchanged).

## Post-deploy smoke

Recorded in the close-out commit after the full-63 CLI run on the repaired harness (`e:/tmp/ilinxa-smoke-consumer`, shadcn\@4.6.0 pinned, package.json re-aligned after every add per the corruption workaround).
