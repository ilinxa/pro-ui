---
date: 2026-05-10
session: file-tree-v0.1.0-pipeline
phase: post-pdf-viewer
type: ship
commits: pending-this-session
components: [file-tree]
findings: [file-tree/F-01-virtualizer-warning, file-tree/F-02-unused-context-prop, file-tree/F-03-noop-drop-fires-onmove, file-tree/F-04-smoke-pending]
status: shipped-pending-smoke
---

# file-tree — v0.1.0 first ship; first entry in the new `navigation` category

## What landed

`file-tree` v0.1.0 — a VS Code-shaped hierarchical tree built on Lucide icons and TanStack Virtual (already a project dep at `^3.13.24`). 26-file sealed folder under `src/registry/components/navigation/file-tree/`.

Public API:

- `<FileTree>` top-level + 5 standalone header parts (`<FileTreeHeader>`, `<FileTreeNewFileButton>`, `<FileTreeNewFolderButton>`, `<FileTreeRefreshButton>`, `<FileTreeCollapseAllButton>`) — each reads from internal Context
- `useFileTree()` consumer hook for advanced custom-chrome composition
- Public helpers: `mergeLoadedChildren()` (immutable splice for lazy-load merges), `iconForExtension()` (extension → Lucide icon)
- Slot APIs: `renderRow`, `renderHeader`, `renderContextMenu`, `renderEmpty`, `renderLoading`, `renderDeleteConfirm`
- 22 callback / context types exported, plus `DEFAULT_FILE_TREE_LABELS` for full label dictionaries

Object-shape callbacks throughout (F-cross-12-correct from day one). 22 i18n label keys. WCAG 2.1 AA target — `role="tree"` with roving-tabindex (root tabIndex flips to -1 once a row is focused), `role="treeitem"` per row with full `aria-level` / `aria-setsize` / `aria-posinset` / `aria-expanded` / `aria-selected`, single managed-focus, focus-visible rings, contrast ≥ AA in both themes.

## Sequencing — gates as designed

- **GATE 1 (description.md)** — authored at `docs/procomps/file-tree-procomp/file-tree-procomp-description.md`. Drafted with 21 open questions covering slug, category, data shape, lazy-load semantics, DnD library, virtualization library, icon source, selection mode, confirm-delete UX, multi-select drag, drop-position resolution, empty-state copy, header parts, icon-prop priority, indent guides, collapse-all behavior, open semantics, dummy-data shape, cut/copy/paste, default expanded state, drop legality. User confirmed with "confirmed" — all 21 starting-position recommendations accepted.
- **Pre-Q reframe** — initial plan-question presentation was opaque. User pushback ("i dont understant any of these be more simple and cleare and questions needs recomendations and comparisons as well") triggered a reframe of the 7 highest-leverage Q's into plain-English Problem / Options / Differences / Recommendation tables. All 7 confirmed in one round.
- **Architecture decision** — early in the conversation, decided between (A) separate `file-tree` + `folder-manager`, (B) merged `file-explorer` mega-component, (C) layered split where `file-tree` is the primitive and `folder-manager` composes it. Confirmed (C). Build order swapped: `file-tree` first (data-substrate primitive); `folder-manager` second (composes file-tree as optional sidebar slot).
- **GATE 2 (plan.md)** — authored at the sibling `file-tree-procomp-plan.md`. Substrate-decisions table traces every Q to a locked choice; Final API has full type definitions for the 60-prop surface; file-by-file plan covers 30 sealed-folder files; edge cases enumerate 18 explicit cases; implementation order is 38 sequenced steps each compiling before the next. Re-validation pass added 4 substantive refinements (`mergeLoadedChildren()` helper, split `<FileTreeNewButton>` into File + Folder variants, `selectionAnchorId` for shift+click range, `<Tooltip>` on header buttons + auto-scroll-during-drag edge case).
- **Alignment audit** — user requested a full alignment audit between description + plan. Found and fixed 3 real misalignments (substrate row referencing pre-split `<FileTreeNewButton>`, implementation step 24 referencing the same, missing `mergeLoadedChildren` + `iconForExtension` exports in `index.ts`) plus added per-file blurbs for the 6 trivial parts and corrected the description's "No files" → "No items" residual (Q12 had locked "No items").
- **Implementation** — followed the 38-step order. Each step compiled before the next. 5 self-caught fixes during the review pass (see findings + the review file).
- **GATE 3 (spot-check review)** — authored at `docs/procomps/file-tree-procomp/reviews/2026-05-10-v0.1.0-spotcheck.md`. Verdict: **Pass with follow-ups**. 4 findings (F-01 informational lint warning, F-02 dead `onContainerContextMenu` plumbing, F-03 no-op drops fire `onMove`, F-04 smoke pending). None blocking.

## Substrate decisions (locked, all in plan)

| Locked | Implemented | Notes |
|---|---|---|
| Slug `file-tree` | ✓ | Flagship primitive — drops the `-01` suffix per `data-table` / `pdf-viewer` precedent. |
| Category `navigation` | ✓ | New category added to `categories.ts` + `ComponentCategorySlug`. First entry; `command-palette` will land here too. |
| `FsNode` shape | ✓ | id / name / type / parentId / children / ext / size / modifiedAt / icon / meta — no `disabled` / `readOnly` in v0.1.0. |
| `children: undefined` vs `[]` | ✓ | `undefined` → triggers `onLoadChildren`; `[]` → renders inline `(empty)` placeholder when expanded. |
| Default expanded (uncontrolled) | ✓ | Root-level folder ids only. |
| Cut / copy / paste | ✗ (deferred) | Lands with `folder-manager` in v0.2.0 against a shared clipboard primitive. |
| DnD: HTML5 native | ✓ | Zero peer dep. Auto-scroll near edges hand-rolled via `requestAnimationFrame`. |
| Drop legality | ✓ | Cycle + self-drop pre-validated; name-collision is consumer's call. |
| Drop-zone resolution | ✓ | Three-zones (before/inside/after) on folders; two-zones (above/below) on files. |
| Virtualization: TanStack Virtual | ✓ | Already a project dep — no new install needed (plan said "add"; was wrong). Auto-engages at ≥ 200 rows. |
| Default icons: Lucide map | ✓ | ~15 categories + `<File>` fallback. Consumer overridable via `iconForNode`. |
| Icon priority | ✓ | `node.icon` → `iconForNode(node)` → built-in. |
| Selection: single default + multi opt-in | ✓ | Cmd/Ctrl+click toggles, Shift+click range, Cmd/Ctrl+A select-all-visible. |
| Confirm-delete: AlertDialog | ✓ | shadcn `<AlertDialog>` (newly installed); `confirmDelete={false}` opt-out; `renderDeleteConfirm` slot. |
| Multi-select drag | ✓ | If dragged row is in selection, drags the whole selection; else replaces selection. |
| Header parts: standalone-exported atoms | ✓ | 5 parts exported. Each reads from `useFileTree()`. Wrapped in `<TooltipProvider>` at the orchestrator. |
| Indent guides | ✓ | On by default; `--border` @ 50%, 1px. Saturates at 200px. |
| Collapse-all | ✓ | Full collapse (every folder, every level). |
| Open semantics | ✓ | Enter on file fires `onOpen`; Enter on folder toggles. Click on label = select; click on chevron = toggle. |
| Dummy data | ✓ | Small Next.js shape (~25 nodes) + 250-node generator for virtualization demo. |

## Files

```
src/registry/components/navigation/file-tree/    (26 files in the sealed folder)
├── file-tree.tsx                  ← top-level (~340 LOC, "use client")
├── parts/   (13 files)
│   ├── file-tree-row.tsx, file-tree-row-list.tsx, file-tree-rename-input.tsx — core row pipeline
│   ├── file-tree-context-menu.tsx — shadcn ContextMenu wrapper with default-actions builder
│   ├── file-tree-header.tsx + 4 button parts (new-file, new-folder, refresh, collapse-all)
│   ├── file-tree-empty.tsx, file-tree-loading.tsx, file-tree-drag-overlay.tsx, file-tree-delete-confirm.tsx
├── hooks/   (7 files)
│   ├── use-file-tree-context.ts — Context + useFileTree() hook
│   ├── use-tree-state.ts — controlled+uncontrolled state, selection-anchor for range select
│   ├── use-tree-flatten.ts — visible-row flattening (memoized with sibling-position metadata)
│   ├── use-tree-keyboard.ts — full keyboard map
│   ├── use-tree-drag.ts — internal + external drag with auto-scroll + memoized cycle check
│   ├── use-tree-virtual.ts — TanStack Virtual integration (mode auto/always/never)
│   └── use-lazy-load.ts — onLoadChildren orchestration with per-folder error map
├── lib/   (3 files)
│   ├── icons.tsx — extension→Lucide map + iconForExtension public helper
│   ├── tree-utils.ts — index/find/descendants/parents/sort + mergeLoadedChildren public helper
│   └── validation.ts — isCycle / isSelfDrop / isLegalDrop + soft-validate-on-mount
├── types.ts                        ← public types + DEFAULT_FILE_TREE_LABELS
├── dummy-data.ts                   ← small Next.js shape + 250-node generator
├── demo.tsx                        ← 6 tabbed demos (read-only, full CRUD, lazy, multi, custom icons, virtualized)
├── usage.tsx                       ← 7 sections covering data shape, lazy, keyboard, DnD, custom chrome, gotchas
├── meta.ts                         ← v0.1.0, alpha, navigation
└── index.ts                        ← top-level + 5 parts + useFileTree + 2 helpers + 22 types
```

## Verification status

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — clean (1 informational warning on `useVirtualizer` React-Compiler skip; F-01)
- `pnpm validate:meta-deps` — 39/39 clean
- `pnpm build` — succeeds (initial run failed at `/components/file-tree` SSR because `<Tooltip>` lacked a Provider; fixed by wrapping the orchestrator root in `<TooltipProvider>`)
- `pnpm registry:build` — `public/r/file-tree.json` + `public/r/file-tree-fixtures.json` regenerated; targets follow locked convention; no demo / usage / meta in the base item

Smoke harness deferred until post-push (Vercel needs to redeploy before `pnpm dlx shadcn@4.6.0 add @ilinxa/file-tree` resolves).

## Self-caught fixes during the review pass

These don't appear as findings because they were fixed in the same v0.1.0 — flagging here so future contributors see the rationale:

1. **Roving tabindex.** Root had `tabIndex={0}` and a focused row also had `tabIndex={0}` simultaneously. Fixed: root `tabIndex={focusedId === null ? 0 : -1}` (canonical ARIA tree pattern).
2. **`indexNodes(nodes)` recomputed every dragover (~60 Hz).** Fixed: memoized at hook entry; `onRowDragOver` / `onRowDrop` / `onContainerDrop` all read from the memo.
3. **`renderRow` slot's wrapper double-nested around `FileTreeRowView`.** Broke virtualized positioning because the inner `FileTreeRowView` had `style={outerStyle}` AND was inside a wrapper div that ALSO carried it. Fixed: in slot path, single wrapper carries `outerStyle`; default path passes `outerStyle` directly to the row view.
4. **Missing `<TooltipProvider>` caused SSR build to fail** at `/components/file-tree`. Fixed: wrapped tree root in `<TooltipProvider delayDuration={400}>`.
5. **`useTreeState` exposed `selectionAnchorId: ref.current` as a returned value.** Violated `react-hooks/refs` (read during render). Fixed: replaced with `getSelectionAnchorId()` getter; orchestrator calls inside `onRowClick` (event handler).

## Pending follow-ups (per GATE 3 review)

| Finding | Severity | Bump target |
|---|---|---|
| F-01 — `useVirtualizer` informational warning | 🔹 Low | n/a — document in guide |
| F-02 — `onContainerContextMenu` prop unused | 🔹 Low | v0.1.1 (cleanup) |
| F-03 — No-op drops can fire `onMove` | 🔸 Medium | v0.1.1 |
| F-04 — Smoke pending Vercel redeploy | 🔹 Low | this session, post-deploy |

## Workflow contribution

Third component to ship under the GATE-3 readiness-review rule (after `stat-card` v0.1.0 → v0.1.1 on 2026-05-09 and `pdf-viewer` v0.1.0 → v0.1.3 earlier today). The rule held: 5 self-caught fixes during review (none blocking) + 4 documented findings (none blocking). Active queue: 2 of 6 shipped — `pdf-viewer` ✅ + `file-tree` ✅. Remaining: `folder-manager`, `rich-graph-2`, `chat-panel`, `notification-system`.

Build-order swap (file-tree before folder-manager) was a deliberate architecture call — file-tree is the data-substrate primitive that folder-manager will compose. Locking the substrate first avoids extracting later (the F-cross-12 callback-shape lesson at a folder level). The active-queue order in STATUS.md was updated to reflect the swap.
