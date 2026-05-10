---
date: 2026-05-10
session: file-manager-v0.1.0-pipeline
phase: post-file-tree
type: ship
commits: pending-this-session
components: [file-manager, file-clipboard]
findings: [file-manager/F-01-virtualizer-warning, file-manager/F-02-imperative-handle-identity, file-manager/F-03-noop-paste-fires, file-manager/F-04-smoke-pending]
status: shipped-pending-smoke
---

# file-manager — v0.1.0; first cross-component shared primitive (`@ilinxa/file-clipboard`)

## What landed

`file-manager` v0.1.0 — Mac-Finder-style content pane that pairs with `file-tree`. 32-file sealed folder under `src/registry/components/navigation/file-manager/`. New shared primitive at `src/registry/components/navigation/_shared/file-clipboard.tsx` shipped as a separate `@ilinxa/file-clipboard` registry artifact; `@ilinxa/file-manager` declares it as a `registryDependency`. **First cross-component shared module in the library** — sets the pattern for `file-tree` v0.2.0's paste integration.

Public API (largest in the library to date):

- `<FileManager>` top-level + 11 standalone toolbar/status parts (`<FileManagerToolbar>`, `<FileManagerPathBar>`, `<FileManagerViewToggle>`, `<FileManagerIconSizeControl>`, `<FileManagerSortMenu>`, `<FileManagerSearchInput>`, `<FileManagerStatusBar>`, `<FileManagerBackForward>`, `<FileManagerUpButton>`, `<FileManagerNewButtons>`, `<FileManagerRefreshButton>`)
- `useFileManager()` consumer hook + `<FileClipboardProvider>` + `useFileClipboard()` exported from the new shared module
- 7 slot APIs (`renderToolbar`, `renderItem`, `renderContextMenu`, `renderEmpty`, `renderLoading`, `renderStatusBar`, `renderDeleteConfirm`)
- ~85 props grouped: data, current folder, lazy load, selection (incl. preserve-on-navigate), clipboard (3 modes), operations, view mode, icon size, sort, search/filter, history, rendering, slots, toolbar config, status bar, context menu config, confirmation, DnD, marquee, virtualization, polymorphic, ref, i18n labels
- `FileManagerActions` exposes 28 imperative actions
- 18 typed callback arg shapes (object-shape per F-cross-12)

Object-shape callbacks throughout. 50+ i18n labels. WCAG 2.1 AA target — `role="region"`, `role="toolbar"`, `role="grid"` (both grid and list modes use grid composite-widget pattern), `aria-multiselectable`, roving tabindex, live-region announcements via status bar.

## Sequencing — gates as designed

- **Pre-description discussion** — User flagged "folder-manager" as the wrong name (component handles files AND folders). Decision-question with 6 options + recommendation table; user picked `file-manager`. Industry-standard term for files+folders, pairs naturally with `file-tree`.
- **GATE 1 (description.md)** — 23 open questions covering slug, category, view modes, icon size, path bar, navigation history, selection clearing, marquee selection, shared clipboard primitive location, default view, sort, type-ahead, status bar, details slot, search, callback naming, drag-from-OS export, validation duplication, dummy data, demo dependencies, cross-component drops, item renderer, image thumbnails. User confirmed with "review and confirm it then move on" — all 23 starting-position recommendations accepted.
- **GATE 2 (plan.md)** — Substrate-decisions table traces every Q to a locked choice; Final API has full type definitions for the ~85-prop surface; file-by-file plan covers 32 sealed-folder files + 1 `_shared/` primitive; edge cases enumerate 24 explicit cases; implementation order is 48 sequenced steps. Re-validation pass added 5 substantive refinements (removed `cause` field from CurrentFolderChangeArgs, removed bogus duplicate interface, dropped TanStack Virtual from initial deps, pinned `onPathTyped` firing on commit-only, pinned pointer-down dispatch logic).
- **Plain-English Q-Plan rounds** — Q-Plan-1 (separate `@ilinxa/file-clipboard` registry artifact), Q-Plan-2 (lib duplication trade-off), Q-Plan-3 (defer virtualization). User answered `AAB` — accepted clipboard-as-separate-artifact + lib duplication, but **overrode my Q-Plan-3 recommendation and ship list-view virtualization at v0.1.0**. Plan adjusted to add TanStack Virtual back to deps + `use-list-virtual.ts` hook + virtualizer integration in list view.
- **Implementation** — followed the 48-step order. tsc clean throughout. 7 self-caught lint fixes during the build pass (see findings).
- **GATE 3 (spot-check review)** — authored at `docs/procomps/file-manager-procomp/reviews/2026-05-10-v0.1.0-spotcheck.md`. Verdict: **Pass with follow-ups**. 4 findings (F-01 informational virtualizer warning, F-02 imperative-handle identity, F-03 no-op paste fires `onPaste`, F-04 smoke pending). None blocking.

## Substrate decisions (locked, all in plan)

| Locked | Implemented | Notes |
|---|---|---|
| Slug `file-manager` | ✓ | Renamed from initial `folder-manager` per user pre-description discussion. |
| Category `navigation` | ✓ | Sibling of `file-tree`; second entry in `navigation`. |
| `FsNode` shape | ✓ | Re-declared in `types.ts` (compatible-by-convention with file-tree's). |
| View modes | ✓ | grid + list. Columns deferred to v0.2.0. |
| Icon size | ✓ | Three steps (sm/md/lg) → 80/120/180px grid tracks; 32/48/72px icons. |
| Path bar | ✓ | Clickable breadcrumbs + click-empty-area to enter typed-input mode. Esc reverts. |
| Navigation history | ✓ | Built-in default (50-entry cap); controllable via `historyBackIds`/`historyForwardIds`; `enableHistory={false}` opt-out. |
| Selection on navigate | ✓ | Cleared by default. `preserveSelectionOnNavigate={true}` opt-in. **Implemented in orchestrator's wrapped navigate actions** (not via effect) to avoid `react-hooks/set-state-in-effect`. |
| Marquee selection | ✓ | Native pointer events + AABB intersection. Shift+drag = additive. Disabled by `enableMarqueeSelection={false}`. |
| Shared clipboard | ✓ | New `@ilinxa/file-clipboard` registry artifact at `_shared/file-clipboard.tsx`. Three modes: solo / provider / controlled. Auto-detected via `__hasProvider` sentinel. |
| Default view mode | ✓ | grid. |
| Sort | ✓ | Built-in (folders-first, alpha, asc/desc) + interactive sort menu + `sortItems` override. List-view headers also sortable. |
| Type-ahead | ✓ | 800ms reset window. Hooked into `use-keyboard.ts`. |
| Status bar | ✓ | `[count items · selected · total size]`; replaceable via `renderStatusBar`; hideable via `showStatusBar={false}`. |
| Search | ✓ | Built-in `<Input>` + controlled props + `filterItems` predicate. |
| Drag-from-OS export | ✗ (deferred to v0.2.0) | |
| Validation duplication | ✓ | Copy of file-tree's `validation.ts` + `tree-utils.ts` + `icons.tsx` shipped inside file-manager. |
| Dummy data | ✓ | Next.js shape (mirrors file-tree's) + flat-grid (30 mixed items) + 250-node generator for virtualization demo. |
| Cross-component drops | ✓ | Same `application/x-ilinxa-file-tree` MIME marker as file-tree. |
| `renderItem` slot | ✓ | Power-user composition; `defaultItem` passed through. |
| Image thumbnails | ✗ (deferred to v0.2.0) | Consumer composes via `renderItem`. |
| List-view virtualization | ✓ (Q-Plan-3 = B override) | TanStack Virtual at >=200 items. Grid view does NOT virtualize at v0.1.0. |

## Files

```
src/registry/components/navigation/_shared/
└── file-clipboard.tsx                        — FileClipboardProvider + useFileClipboard hook (NEW shared module)

src/registry/components/navigation/file-manager/   (32 files)
├── file-manager.tsx                          ← top-level orchestrator (~520 LOC, "use client")
├── parts/   (22 files)
│   ├── file-manager-toolbar.tsx              — composes 9 atoms
│   ├── file-manager-{back-forward,up-button,path-bar,view-toggle,icon-size-control,sort-menu,search-input,new-buttons,refresh-button}.tsx — toolbar atoms
│   ├── file-manager-content-pane.tsx         — view-picker, marquee+drag wiring, ResizeObserver-driven column count
│   ├── file-manager-{grid-view,list-view,item,rename-input,marquee}.tsx — render core
│   ├── file-manager-{context-menu,delete-confirm,empty,loading,drag-overlay,status-bar}.tsx — chrome
├── hooks/   (12 files)
│   ├── use-file-manager-context.ts           — Context + useFileManager hook
│   ├── use-current-folder.ts                 — controlled/uncontrolled current-folder + path computation
│   ├── use-navigation-history.ts             — back/forward stacks (50-entry cap; useState-based per react-hooks/refs)
│   ├── use-selection.ts                      — controlled/uncontrolled selection + anchor for shift-click
│   ├── use-clipboard.ts                      — auto-detects FileClipboardProvider; falls back to internal
│   ├── use-sort-search.ts                    — sort + search + view-mode + icon-size controlled/uncontrolled
│   ├── use-visible-items.ts                  — flatten current folder + sort + filter + hidden + clipboard-cut
│   ├── use-lazy-load.ts                      — onLoadChildren orchestration; per-folder loading + error map keyed by id
│   ├── use-marquee.ts                        — drag-rectangle pointer events + AABB intersection
│   ├── use-drag.ts                           — internal + external DnD with cycle pre-validation + auto-scroll
│   ├── use-keyboard.ts                       — full keyboard map with 2-D arrow nav in grid mode + type-ahead
│   └── use-list-virtual.ts                   — TanStack Virtual integration for list view at >=200 items
├── lib/   (6 files)
│   ├── icons.tsx                             — extension→Lucide map (copied from file-tree)
│   ├── tree-utils.ts                         — index/find/parents/sort/getChildrenOf + mergeLoadedChildren public helper
│   ├── validation.ts                         — isCycle / isSelfDrop / isLegalDrop (copied from file-tree)
│   ├── path.ts                               — buildPath / parsePath (NEW; manager-specific)
│   ├── intersect.ts                          — AABB rectangle intersection + getItemRects (NEW; marquee)
│   └── format.ts                             — formatBytes / formatDate / formatKind / formatItemCount (NEW)
├── types.ts                                  ← public types + DEFAULT_FILE_MANAGER_LABELS
├── dummy-data.ts                             ← Next.js shape + flat-grid + 250-node generator
├── demo.tsx                                  ← 5 tabbed demos (standalone / flat / CRUD+clipboard / lazy / virtualized)
├── usage.tsx                                 ← 8 sections (data shape, clipboard, lazy, keyboard, DnD, custom chrome, gotchas)
├── meta.ts                                   ← v0.1.0, alpha, navigation
└── index.ts                                  ← top-level + 11 standalone parts + useFileManager + 2 helpers + clipboard re-exports + 40+ types
```

## Verification status

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — clean (2 informational warnings on `useVirtualizer` React-Compiler skip; F-01)
- `pnpm validate:meta-deps` — **40/40 clean**
- `pnpm build` — succeeds (48 prerendered pages, up from 47)
- `pnpm registry:build` — `public/r/file-manager.json` (31 files), `public/r/file-manager-fixtures.json` (1 file), `public/r/file-clipboard.json` (1 file) all regenerated

Smoke harness deferred until post-push.

## Self-caught fixes during the review pass

These don't appear as findings because they were fixed in v0.1.0:

1. **`react-hooks/refs` in `use-navigation-history.ts`** — refs accessed during render to expose backIds/forwardIds. Refactored from `useRef` to `useState`; back/forward operations now use functional setState.
2. **`react-hooks/set-state-in-effect` in `use-selection.ts`** — clear-on-navigate logic was running in an effect. Moved to the navigate actions in the orchestrator (`navigateTo`/`navigateUp`/`navigateBack`/`navigateForward`/`triggerOpen`); selection clears synchronously when the manager-driven navigation happens. Documented behavior: consumer-driven `currentFolderId` mutations (e.g., parent component changes the prop) do NOT clear selection.
3. **`react-hooks/immutability` in `use-visible-items.ts`** — `let totalSize` reassigned inside a `map` callback. Switched to `reduce`.
4. **`react-hooks/refs` forward-reference in `use-marquee.ts`** — handlePointerUp referenced handlePointerMove in its dep list. Refactored: defined both handlers inside the pointer-down callback so they don't precede declaration; cleanup uses module-scope refs that are written when the listeners are added.
5. **`react-hooks/set-state-in-effect` (kickoff) in `use-lazy-load.ts`** — synchronous `setLoadingIds` inside `triggerLoad` violated the rule when called from the effect body. Wrapped the kickoff in `queueMicrotask`. Refactored: per-folder loading + error state keyed by id (Map<string, ...>) so navigation between folders surfaces the right state without an explicit clear effect.
6. **Unused imports** — `useRef` in `file-manager-content-pane.tsx`, `getVisibleIds` in `use-marquee.ts`, `_additive` callback param in marquee call site.
7. **Tailwind canonical class** — `min-w-[280px]` → `min-w-70` (IDE diagnostic).

## Pending follow-ups (per GATE 3 review)

| Finding | Severity | Bump target |
|---|---|---|
| F-01 — `useVirtualizer` informational warning | 🔹 Low | n/a — document in guide |
| F-02 — Imperative-handle identity (`useImperativeHandle` deps) | 🔸 Medium | v0.1.1 (matches pdf-viewer F-02 pattern) |
| F-03 — No-op cut+paste fires `onPaste` | 🔸 Medium | v0.1.1 (matches file-tree F-03 pattern) |
| F-04 — Smoke pending Vercel redeploy | 🔹 Low | this session, post-deploy |

## Workflow contribution

Fourth component to ship under the GATE-3 readiness-review rule (after `stat-card` v0.1.0 → v0.1.1 on 2026-05-09, `pdf-viewer` v0.1.0 → v0.1.3 earlier today, `file-tree` v0.1.0 earlier today). The rule held: 7 self-caught fixes during review (none blocking) + 4 documented findings (none blocking).

**First cross-component shared module in the library** — `_shared/file-clipboard.tsx` ships as `@ilinxa/file-clipboard` registry artifact; `@ilinxa/file-manager` declares it as a `registryDependency`. This is the pattern that will support `file-tree` v0.2.0's paste (it will declare the same `registryDependency` and consume the same Provider).

User-driven Q-Plan-3 override (defer-virtualization → ship-virtualization) shaped the v0.1.0 scope to include list-view virtualization. Grid-view virtualization remains deferred (column-aware grid virtualization is structurally different and not covered by TanStack Virtual's row-virtualizer).

Active queue: 3 of 6 shipped — `pdf-viewer` ✅ + `file-tree` ✅ + `file-manager` ✅. Remaining: `rich-graph-2`, `chat-panel`, `notification-system`.
