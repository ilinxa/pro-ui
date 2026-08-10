# HANDOFF — `calendar-01` v0.2.0 SHIPPED (session close, 2026-06-23)

> **Status:** ✅ **SHIPPED + PUSHED to `master`** (tip `c8b686d`; origin synced 0/0). Working tree clean. Vercel auto-deploys → installable via `pnpm dlx shadcn@latest add @ilinxa/calendar-01`. **Supersedes** [`HANDOFF-2026-06-23-calendar-01-v0.2.0-stages-1-3-checkpoint.md`](HANDOFF-2026-06-23-calendar-01-v0.2.0-stages-1-3-checkpoint.md) (the pre-ship checkpoint).

## TL;DR

`calendar-01` v0.2.0 — the **editable** calendar — is shipped. Opt-in editing (`editable`, default off → read-only) over v0.1.0: pointer drag/resize/draw/create, **full keyboard editing**, a **modal detail-editor overlay + inline rename**, right-click **Copy/Cut/Rename**, **cross-surface copy/cut/paste** over a shared `ilinxa/task` clipboard envelope, and **F-04 height-responsive month overflow**. This push also published **v0.1.0** for the first time (it had never reached origin before the reconcile). What remains is **post-deploy verification** (F-01/F-02) + two Low follow-ups (F-03/F-04).

## What's in this ship (commit `c8b686d`)

- **Code:** Stage 4 (`parts/calendar-root.tsx` keyboard + document clipboard listeners + focus-restore; `lib/clipboard.ts`; `hooks/use-calendar-edit.ts` `pasteTasks`; `parts/calendar-edit-overlays.tsx` editor overlay + rename; `parts/calendar-month-view.tsx` F-04; `data-occ-id` on the event primitives) + the review-fix hardening pass.
- **Ship artifacts:** `meta.ts` → 0.2.0 (deps `context-menu`+`input`+`@dnd-kit/core`+`@dnd-kit/utilities`); `registry.json` + `public/r/calendar-01.json` (**32-file artifact**); guide v0.2; GATE 3 review; STATUS.md; decision file; plan §14c.
- **Gates:** tsc 0 · eslint 0 · meta-deps 57/57 · build 66/66 (no SSR err) · registry:build ✓.

## 🔑 The one design decision to carry forward

**Cross-surface task transfer is COPY/PASTE, not drag** (user-approved; plan §14c). The assembly renders one view at a time → cross-view drag is impossible on screen. Tasks travel as a shared `TodoItem` clipboard envelope (`lib/clipboard.ts`, `text/plain`, `kind:"ilinxa/task"`) through the OS clipboard; paste-target decides all-day vs timed. **Deferred/reserved:** external HTML5 drop tray (`onExternalDrop` declared + inert), agenda-row drag, conversion-drag.

## ▶️ RESUME (new session) — post-deploy, in priority order

1. **F-02 — cross-backend consumer-tsc smoke (the real owed verification).** v0.2 adds the `context-menu` + `input` primitives → re-arms F-cross-13 (Radix ↔ Base UI). Once Vercel has deployed, install `@ilinxa/calendar-01` into the base-nova / Base-UI consumer and run consumer `tsc --noEmit`. **A v0.2.1 patch is plausible** if either primitive trips Base UI (it has on past ships — the 4-ship pattern). See [[project_smoke_harness]] / `feedback_vercel_bot_mitigation_on_polling` (don't poll Vercel faster than 60s; manual-copy + local consumer-tsc is the fallback).
2. **F-01 — live in-browser walkthrough** (no X server in this env): drag/resize/keyboard/copy-paste, the modal editor + rename, F-04 responsive cap. File visual fixes as v0.2.1.
3. **F-03 — modal focus-trap** (`OverlayShell` in `parts/calendar-edit-overlays.tsx`): `aria-modal` overlays don't trap Tab (consistent with gantt's `GanttEditPopover`). A native `<dialog>` migration for **both** task-family overlays — do them together.
4. **F-04 — live-preview perf** (resize preview rebuilds the whole context per pointermove → isolate to a preview-only context) **+ the clipboard hoist epic**: move `lib/clipboard.ts` → `todo-rich-card` (the shared vocabulary) and adopt the envelope in gantt / kanban / tree so copy/paste works across every task surface for real.

## Pointers (authoritative records)

- Decision: [`.claude/decisions/2026-06-23-calendar-01-v0.2.0-editing-layer.md`](decisions/2026-06-23-calendar-01-v0.2.0-editing-layer.md)
- GATE 3: [`docs/procomps/calendar-01-procomp/reviews/2026-06-23-v0.2.0-spotcheck.md`](../docs/procomps/calendar-01-procomp/reviews/2026-06-23-v0.2.0-spotcheck.md)
- Plan §14c (the deviation) + guide v0.2: `docs/procomps/calendar-01-procomp/`
- STATUS.md top banner; auto-memory `project_calendar_01_v0_2_0_editing.md`.

## Housekeeping

- **Backups from the 2026-06-23 reconcile are still present and now safe to delete:** branch `backup/pre-reconcile-2026-06-23` + tag `checkpoint-cd75819` (both at the old pre-reconcile checkpoint `cd75819`; the work is shipped + pushed).
- The old checkpoint handoff cites pre-reconcile SHA `cd75819` (= shipped content, now at `c8b686d`).
