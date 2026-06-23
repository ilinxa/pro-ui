# HANDOFF — gantt-timeline-01 v0.4.0 + calendar-01 v0.2.1 fully CLOSED (session close, 2026-06-23)

> **Status:** ✅ **Both task surfaces closed, SHIPPED + PUSHED + DEPLOYED. `master` == `origin/master` (0/0), working tree clean.** Nothing is pending except two Low/future follow-ups. This session can be resumed cleanly from a blank slate — there is no in-flight work.

## TL;DR

Closed every owed verification on the two task-family components and shipped the one patch the smoke surfaced:
- **gantt-timeline-01 v0.4.0** (`84ef1ea`) — Draw-mode toggle + right-click portal fix. **F-01 live walkthrough CLOSED** (proven live in Production).
- **calendar-01 v0.2.1** (`39f4a61`) — cross-backend smoke fix. **F-01 + F-02 CLOSED** (4-ship loop ran for real: ship → smoke 3 errors → patch → re-smoke live = 0).

The enabling discovery: **the dockerized virtual browser works** (`virtualbrowser-stealth-browser-1`), so the long-deferred "no X server" F-01 walkthroughs could finally run. New memory `project_virtual_browser_available.md` records this (supersedes the old "headless, no browser" claim).

## Current repo state

- Tip: **`79ca440`** (docs: record post-deploy re-smoke clean). `origin/master` synced **0/0**, tree clean.
- Recent commits this session: `84ef1ea` (gantt v0.4.0) → [calendar agent rebased v0.1.0/v0.2.0 on top] → `39f4a61` (calendar v0.2.1 + closures) → `79ca440` (re-smoke record).
- Gates (certified at session close): **tsc 0 · lint 0 err (1 baseline TanStack Virtual warning) · meta-deps 57/57 · build 66/66 · registry:build 0 drift.**
- Versions: `gantt-timeline-01` **0.4.0**, `calendar-01` **0.2.1** (STATUS table + meta + registry all consistent).
- Both live in Vercel Production; installable via `pnpm dlx shadcn@latest add @ilinxa/{gantt-timeline-01,calendar-01}`.

## What shipped this session

### gantt-timeline-01 v0.4.0 (was uncommitted WIP at session start)
Two bug-driven fixes, shipped as a **minor** (new public API `GanttContextValue.drawMode`/`setDrawMode` + a default-behavior change → not a patch):
1. **Draw-vs-pan conflict** → explicit **Draw** toggle (editable toolbar). Off (default) empty-row drag pans; on → draws a sibling. Press pipeline rewritten immediate-classify → **deferred-classify**.
2. **Right-click items did nothing** → DOM-descendant guard (`!e.currentTarget.contains(e.target) → return`) on body `onPointerDown`/`onKeyDown` + gutter `onKeyDown` stops the portaled context-menu's events from being swallowed by the canvas.

No new files/deps/primitive. **F-01 CLOSED** via the virtual browser (Draw toggle `aria-pressed`+crosshair; right-click "Add task below" created a row). Decision: [`decisions/2026-06-22-gantt-timeline-01-v0.4.0-draw-mode-and-rightclick-fix.md`](decisions/2026-06-22-gantt-timeline-01-v0.4.0-draw-mode-and-rightclick-fix.md).

### calendar-01 v0.2.1 (patch — the 4-ship pattern)
The v0.2.0 cross-backend smoke (Base UI / `base-nova`) caught **3 real F-cross-13 errors**, all latent since v0.1.0:
- `ToggleGroup` is a **multi-value model on Base UI** (`value: string[]`, `onValueChange(string[], details)`) — a single-select string fails both ways. **NEW F-cross-13 carrier** (now in the divergence memory).
- `TooltipProvider delayDuration` is Radix-only (known carrier).

**Fixes:** view switcher `ToggleGroup` → plain-button segmented control (`<div role="group">` + `<button aria-pressed>`; the gantt zoom-switcher / blackboard "plain buttons shrink the F-cross-13 surface" rule — **dropped the `toggle-group` dep**) + drop `delayDuration`. **F-01 walkthrough clean; F-02 re-smoke against the LIVE v0.2.1 registry = 0 errors.** Decision: [`decisions/2026-06-23-calendar-01-v0.2.1-cross-backend-fix.md`](decisions/2026-06-23-calendar-01-v0.2.1-cross-backend-fix.md).

## Open follow-ups (NONE blocking — Low/future only)

| Item | Component(s) | Notes |
|---|---|---|
| **F-03 modal focus-trap** | gantt + calendar | `aria-modal` overlays don't trap Tab. Do BOTH together as a native `<dialog>` migration (gantt's `GanttEditPopover` + calendar's `OverlayShell`). |
| **F-04 live-preview perf + clipboard hoist** | calendar | Resize preview rebuilds the whole context per pointermove (isolate to a preview-only context). Separately: **hoist `calendar-01/lib/clipboard.ts` → `todo-rich-card`** and adopt the `ilinxa/task` envelope in gantt/kanban/tree so copy/paste works across every task surface ("between all task tools" epic). |
| **resize-the-group** | gantt | Drag a WBS summary bracket *edge* → proportional subtree rescale (teased since v0.3.0). |

## How to resume

There's no in-flight state — pick any of:
- **The clipboard-hoist epic** (F-04) is the highest-leverage next step: it unifies copy/paste across the whole task family (todo-rich-card / gantt / kanban / tree / calendar).
- **resize-the-group** for gantt (additive, well-scoped).
- **F-03** `<dialog>` migration for both overlays.
- Or an unrelated component from the queue (see [`.claude/STATUS.md`](STATUS.md) Active queue / Components table).

**If you need a live walkthrough:** the virtual browser works now — see [`project_virtual_browser_available.md`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_virtual_browser_available.md) (memory). `docker restart virtualbrowser-stealth-browser-1` if `create_session` reports "Missing X server."

## Pointers

- STATUS: [`.claude/STATUS.md`](STATUS.md) (top banners + Components table + Recent activity all reflect the closures).
- Decisions: gantt v0.4.0, calendar v0.2.1 (linked above) + calendar v0.2.0 (`2026-06-23-calendar-01-v0.2.0-editing-layer.md`).
- GATE 3 reviews: `docs/procomps/gantt-timeline-01-procomp/reviews/2026-06-22-v0.4.0-spotcheck.md` (F-01 closed) · `docs/procomps/calendar-01-procomp/reviews/2026-06-23-v0.2.0-spotcheck.md` (F-01/F-02 → v0.2.1).
- Smoke harness: `e:/tmp/ilinxa-smoke-consumer/` (base-nova/Base UI; never pushed; reset clean).
