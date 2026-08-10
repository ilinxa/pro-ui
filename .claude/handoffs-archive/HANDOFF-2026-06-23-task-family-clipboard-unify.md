# HANDOFF — Task-family clipboard UNIFY + gantt v0.5.0 (2026-06-23, session-close LOCK)

**State:** built · gated · deep-reviewed · fixed · **committed (session-close lock) · NOT pushed.**
**Resume = push to `master` (auto-deploys via Vercel) → post-deploy live smoke.**

---

## What this session did

Closed the user-flagged gantt-vs-calendar gap AND the deeper consistency problem it surfaced: the task family had **two incompatible clipboard formats** so cross-surface paste silently no-op'd. Unified on ONE envelope hosted in `todo-rich-card`, and brought gantt to calendar parity.

| Component | Change | Bump |
|---|---|---|
| **todo-rich-card** | NEW `lib/clipboard.ts` (the canonical `ilinxa/task` envelope — dual-transport MIME+text/plain, omnivorous read + legacy back-compat); migrated own copy/paste onto it; json-io's 4 clipboard fns removed | **v0.4.0** |
| **calendar-01** | repointed 4 import sites + public barrel re-export to `../todo-rich-card/lib/clipboard`; local clipboard.ts deleted (non-breaking) | **v0.2.3** |
| **gantt-timeline-01** | double-click empty row → quick-composer (`parts/gantt-quick-composer.tsx`); copy/cut/paste (doc ClipboardEvent + menu); Priority submenu | **v0.5.0** |
| **todo-tree** | clipboard (Ctrl+C/X/V over selection + handle copyItems/cutItems/pasteItems) + `priorityOptions` | **v0.3.0** |

kanban stays OUT (data-agnostic). **Zero new deps** anywhere.

## Gates (all green, re-run after fixes)
`tsc 0` · `lint 0` (touched folders; repo-wide warnings pre-existing) · `meta-deps 57/57` · `build 66/66` · `registry:build ✓` · envelope round-trip **7/7** · back-compat fence **5/5**.

## Deep adversarial re-review — caught + FIXED before lock
1. 🚫 **todo-tree `registry.json` lacked `@ilinxa/todo-rich-card`** despite runtime clipboard imports → consumer `shadcn add` would break. Added; artifact `public/r/todo-tree.json` verified (declares it).
2. rich-card 3 copy sites serialized **stale `item.children`** → now `denormalize(node)`.
3. back-compat fence too loose → tightened to `id/name/status/active/setAt`.
4. todo-tree `pasteItems()` default mismatched the keyboard path → aligned to focused row + JSDoc.
5. doc nit: "26 methods" → 29.

**🔑 LESSON: `meta.ts internal:[…]` ≠ `registry.json registryDependencies`.** A cross-procomp RUNTIME import needs the `@ilinxa/<dep>` entry in the registry item — producer gates can't see its absence (content-composer-01 F-01 / F-cross-11 class).

## Files (key)
- `todo-rich-card/lib/clipboard.ts` (NEW), `lib/json-io.ts`, `todo-rich-card.tsx`, `hooks/use-keyboard.ts`, `parts/action-menu.tsx`, `index.ts`, `meta.ts`
- `calendar-01/`: `index.ts`, `hooks/use-calendar-edit.ts`, `parts/calendar-context-menu.tsx`, `parts/calendar-root.tsx`, `meta.ts` (deleted `lib/clipboard.ts`)
- `gantt-timeline-01/`: `hooks/use-gantt-edit.ts`, `parts/gantt-quick-composer.tsx` (NEW), `parts/gantt-timeline-body.tsx`, `parts/gantt-timeline-root.tsx`, `parts/gantt-context-menu.tsx`, `types.ts`, `index.ts`, `meta.ts`
- `todo-tree/`: `hooks/use-todo-tree-state.ts`, `todo-tree.tsx`, `todo-tree-with-editor.tsx`, `types.ts`, `meta.ts`
- `registry.json` (4 items touched), STATUS.md, decision file, 3 GATE-3 reviews, sweep-tracker F-cross-14

## RESUME checklist (new session)
1. `git log --oneline -3` — confirm the session-close lock commit is the tip.
2. **Push to `master`** (Vercel auto-runs `vercel-build` → regenerates artifacts → deploys). NOT done this session (push auto-deploys; was awaiting go-ahead).
3. **Post-deploy live smoke (4-ship pattern):** `pnpm dlx shadcn add @ilinxa/todo-tree` (+ gantt/calendar/todo-rich-card) into a tmp consumer → consumer `pnpm tsc --noEmit` clean (this is what would have caught the todo-tree registry-dep blocker pre-fix — re-confirm it's resolved). Cross-backend (Radix + Base UI) low-risk (no new primitive).
4. **Browser cross-surface round-trip** (dockerized virtual browser, see [[project_virtual_browser_available]] in memory): copy a card in rich-card → paste into gantt/calendar/tree, and back; verify ids reassigned + full detail survives.
5. Low follow-ups (any version): family-wide cut-permission hardening (gantt matches calendar today — both write-then-delete); Priority submenu color swatch; procomp guide/description/plan deltas for the 3 minors; calendar composer status-pick parity (gantt's gained one).

## Pointers
- Decision: [`2026-06-23-task-family-clipboard-unify-and-gantt-parity.md`](decisions/2026-06-23-task-family-clipboard-unify-and-gantt-parity.md)
- Reviews: `docs/procomps/{gantt-timeline-01,todo-rich-card,todo-tree}-procomp/reviews/2026-06-23-*` (each w/ re-review addendum)
- Sweep-tracker: F-cross-14 (closed)
- Memory: `project_task_family_clipboard_unify_gantt_v050.md`
