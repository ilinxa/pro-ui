# file-manager — procomp plan

> Stage 2: how. The implementation contract.
>
> **Predecessor:** [`file-manager-procomp-description.md`](./file-manager-procomp-description.md), confirmed by user with "review and confirm it then move on" — all 23 open-question recommendations accepted.
>
> **Sibling reference:** [`file-tree`](../file-tree-procomp/) (shipped 2026-05-10). `file-manager` reuses the `FsNode` shape (compatible-by-convention) and ships its own copy of `validation.ts` / `tree-utils.ts` / `icons.tsx` to keep both components independently installable. The new shared `_shared/file-clipboard.ts` primitive lands alongside file-manager and will be consumed by file-tree starting v0.2.0.

## Substrate decisions (locked)

| Decision | Choice | Source |
|---|---|---|
| Slug | `file-manager` | Confirmed pre-description |
| Category | `navigation` | Description Q2 |
| Data ownership | controlled (consumer owns `nodes`); component fires callbacks | Description |
| `currentFolderId` | controlled prop + `onCurrentFolderChange` callback | Description Q16 |
| `FsNode` shape | reused from file-tree (same fields) | Description |
| View modes | `'grid'` (default) + `'list'` at v0.1.0; `'columns'` deferred to v0.2.0 | Description Q3, Q10 |
| Icon size | three discrete steps (`'sm' | 'md' | 'lg'`) — grid mode only | Description Q4 |
| Path bar | clickable breadcrumbs + click-empty-area-to-edit dual mode | Description Q5 |
| Navigation history | built-in default; `enableHistory={false}` opt-out; controlled via `historyBackIds` / `historyForwardIds` | Description Q6 |
| Selection on navigate | clear by default; `preserveSelectionOnNavigate={true}` opt-in | Description Q7 |
| Marquee selection | in scope; native pointer events + intersect-rectangle algorithm | Description Q8 |
| Shared clipboard | `_shared/file-clipboard.ts` primitive + `<FileClipboardProvider>` from day one | Description Q9 |
| Sort | built-in (folders-first, alpha by name) + interactive sort menu + consumer override | Description Q11 |
| Type-ahead select | in scope; 800ms reset window | Description Q12 |
| Status bar | built-in default; `renderStatusBar` slot; `showStatusBar={false}` opt-out | Description Q13 |
| `details` slot width | consumer-controlled via slot's own `className`; default min-width 280px | Description Q14 |
| Search input | built-in + `searchQuery` controlled props + `filterItems` predicate override | Description Q15 |
| Drag-from-OS export | OUT of scope at v0.1.0 | Description Q17 |
| Validation lib | ship a copy of file-tree's `validation.ts` inside file-manager's sealed folder | Description Q18 |
| Dummy data | reuse Next.js project shape from file-tree + flat-grid fixture (~30 image-named items) | Description Q19 |
| Cross-component drops | shared `application/x-ilinxa-file-tree` MIME marker | Description Q21 |
| `renderItem` slot | ship from day one | Description Q22 |
| Image thumbnails | OUT of scope at v0.1.0; consumer composes via `renderItem` | Description Q23 |
| `onMove` shape | `{ ids, targetId, position: 'inside' }` — same shape as file-tree's, position is always `'inside'` for file-manager (no reorder semantic) | Description Drag-and-drop |
| Drop legality | drops on files = rejected; drops on whitespace internal = no-op; drops on whitespace external = upload to current folder | Description Drag-and-drop |
| Multi-select drag | drags whole selection if dragged item is in selection; else replaces selection (same as file-tree) | Description Multi-select |

## Final API

### Public types — `types.ts`

```ts
import type { CSSProperties, ReactNode, Ref } from "react";

// Re-exported FsNode for convenience (compatible-by-convention with file-tree)
export type FsNodeType = "file" | "folder";

export interface FsNode {
  id: string;
  name: string;
  type: FsNodeType;
  parentId?: string | null;
  children?: FsNode[];
  ext?: string;
  size?: number;
  modifiedAt?: string;
  icon?: ReactNode;
  meta?: Record<string, unknown>;
}

// ─── Manager-specific enums ────────────────────────────────────────────────

export type FileManagerViewMode = "grid" | "list";
export type FileManagerIconSize = "sm" | "md" | "lg";
export type FileManagerSortKey = "name" | "modified" | "size" | "type";
export type FileManagerSortOrder = "asc" | "desc";
export type FileManagerDropPosition = "inside";

export interface FileManagerSortState {
  key: FileManagerSortKey;
  order: FileManagerSortOrder;
}

// ─── Clipboard (shared with future file-tree paste) ────────────────────────

export type FileClipboardKind = "cut" | "copy";

export interface FileClipboard {
  kind: FileClipboardKind | null;
  ids: string[];
}

// ─── Visible-item descriptor (what each rendered cell knows) ───────────────

export interface FileManagerItem {
  node: FsNode;
  selected: boolean;
  focused: boolean;
  /** True when this item is in the current clipboard with `kind: 'cut'` (visual = 50% opacity). */
  cut: boolean;
  /** Position within the visible-items array. */
  index: number;
  /** Total visible items in the current folder (for aria-setsize). */
  totalVisible: number;
}

// ─── Read-only state surfaced to slots + imperative ref ────────────────────

export interface FileManagerState {
  currentFolderId: string | null;
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
  renamingId: string | null;
  viewMode: FileManagerViewMode;
  iconSize: FileManagerIconSize;
  sort: FileManagerSortState;
  searchQuery: string;
  /** Path from root to current folder (root → ... → current). Empty when at root. */
  path: FsNode[];
  /** Whether the manager is currently waiting for `onLoadChildren` to resolve. */
  loadingChildren: boolean;
  loadError: string | null;
  clipboard: FileClipboard;
  historyBackIds: string[];
  historyForwardIds: string[];
}

// ─── Imperative actions ────────────────────────────────────────────────────

export interface FileManagerActions {
  navigateTo: (folderId: string | null) => void;
  navigateUp: () => void;
  navigateBack: () => void;
  navigateForward: () => void;
  refresh: (nodeId?: string | null) => void;

  setViewMode: (mode: FileManagerViewMode) => void;
  setIconSize: (size: FileManagerIconSize) => void;
  setSort: (sort: FileManagerSortState) => void;
  setSearchQuery: (query: string) => void;

  select: (idOrIds: string | string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  focusNode: (id: string) => void;

  startRename: (id: string) => void;
  cancelRename: () => void;

  triggerCreate: (type: FsNodeType) => void;
  triggerDelete: (ids: string[]) => void;
  triggerOpen: (id: string) => void;

  cut: (ids: string[]) => void;
  copy: (ids: string[]) => void;
  paste: () => void;
  clearClipboard: () => void;
}

export interface FileManagerHandle {
  state: FileManagerState;
  actions: FileManagerActions;
}

// ─── Callback arg shapes (object-shape per F-cross-12) ─────────────────────

export interface FileManagerOpenArgs               { node: FsNode }
export interface FileManagerCurrentFolderChangeArgs { folderId: string | null }
export interface FileManagerCreateArgs             { parentId: string | null; type: FsNodeType }
export interface FileManagerRenameArgs             { id: string; node: FsNode; nextName: string }
export interface FileManagerDeleteArgs             { ids: string[] }
export interface FileManagerMoveArgs               { ids: string[]; targetId: string | null; position: FileManagerDropPosition }
export interface FileManagerPasteArgs              { ids: string[]; kind: FileClipboardKind; targetFolderId: string | null }
export interface FileManagerClipboardChangeArgs    { clipboard: FileClipboard }
export interface FileManagerRefreshArgs            { nodeId: string | null }
export interface FileManagerExternalDropArgs       { files: File[]; targetFolderId: string | null }
export interface FileManagerLoadChildrenArgs       { nodeId: string; node: FsNode }
export interface FileManagerSelectionChangeArgs    { ids: Set<string> }
export interface FileManagerSortChangeArgs         { sort: FileManagerSortState }
export interface FileManagerViewModeChangeArgs     { mode: FileManagerViewMode }
export interface FileManagerIconSizeChangeArgs     { size: FileManagerIconSize }
export interface FileManagerSearchChangeArgs       { query: string }
export interface FileManagerPathTypedArgs          { path: string }
export interface FileManagerValidateRenameArgs     { node: FsNode; nextName: string }
export interface FileManagerIconForNodeArgs        { node: FsNode }

// ─── Default labels (full set; consumers override partially via `labels` prop) ─

export interface FileManagerLabels {
  title: string;
  back: string;
  forward: string;
  up: string;
  refresh: string;
  newFile: string;
  newFolder: string;
  searchPlaceholder: string;
  viewGrid: string;
  viewList: string;
  iconSizeSmall: string;
  iconSizeMedium: string;
  iconSizeLarge: string;
  sortByName: string;
  sortByModified: string;
  sortBySize: string;
  sortByType: string;
  sortAsc: string;
  sortDesc: string;
  contextOpen: string;
  contextNewFile: string;
  contextNewFolder: string;
  contextCut: string;
  contextCopy: string;
  contextPaste: string;
  contextRename: string;
  contextDelete: string;
  contextRefresh: string;
  deleteConfirmTitle: string;
  deleteConfirmDescription: string;
  deleteConfirmAction: string;
  deleteConfirmCancel: string;
  emptyTitle: string;
  loading: string;
  loadError: string;
  retry: string;
  externalDropOverlay: string;
  itemCount: string;            // "{n} items"
  itemCountSelected: string;    // "{n} selected"
  totalSize: string;            // "{size} total"
  pathRoot: string;             // breadcrumb root segment label (default "Files")
}

// ─── Slot contexts ──────────────────────────────────────────────────────────

export interface FileManagerToolbarContext {
  state: FileManagerState;
  actions: FileManagerActions;
  showNewFile: boolean;
  showNewFolder: boolean;
  showRefresh: boolean;
  showSearch: boolean;
  showViewToggle: boolean;
  showIconSize: boolean;
  showSort: boolean;
  showBackForward: boolean;
  showUpButton: boolean;
  showPathBar: boolean;
  title?: string;
  labels: FileManagerLabels;
}

export interface FileManagerStatusBarContext {
  state: FileManagerState;
  actions: FileManagerActions;
  totalCount: number;
  selectedCount: number;
  totalSize: number;
  labels: FileManagerLabels;
}

export interface FileManagerContextMenuItem {
  id:
    | "open"
    | "new-file"
    | "new-folder"
    | "cut"
    | "copy"
    | "paste"
    | "rename"
    | "delete"
    | "refresh";
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}

export interface FileManagerContextMenuContext {
  state: FileManagerState;
  actions: FileManagerActions;
  /** Right-clicked item — `null` when right-clicking empty whitespace. */
  node: FsNode | null;
  defaultActions: FileManagerContextMenuItem[];
  position: { x: number; y: number };
  labels: FileManagerLabels;
}

export interface FileManagerEmptyContext {
  actions: FileManagerActions;
  showNewFile: boolean;
  showNewFolder: boolean;
  labels: FileManagerLabels;
}

export interface FileManagerItemRenderArgs {
  item: FileManagerItem;
  defaultItem: ReactNode;
  viewMode: FileManagerViewMode;
}

export interface FileManagerDeleteConfirmContext {
  ids: string[];
  nodes: FsNode[];
  onConfirm: () => void;
  onCancel: () => void;
  labels: FileManagerLabels;
}

// ─── Top-level props ────────────────────────────────────────────────────────

export interface FileManagerProps {
  // ── Data ──
  nodes: FsNode[];

  // ── Current folder ──
  currentFolderId?: string | null;
  defaultCurrentFolderId?: string | null;
  onCurrentFolderChange?: (args: FileManagerCurrentFolderChangeArgs) => void;

  // ── Lazy load ──
  onLoadChildren?: (args: FileManagerLoadChildrenArgs) => Promise<FsNode[]>;

  // ── Selection ──
  selectedIds?: Set<string>;
  defaultSelectedIds?: Set<string>;
  onSelectedChange?: (args: FileManagerSelectionChangeArgs) => void;
  preserveSelectionOnNavigate?: boolean;        // default false

  // ── Clipboard ──
  clipboard?: FileClipboard;
  defaultClipboard?: FileClipboard;
  onClipboardChange?: (args: FileManagerClipboardChangeArgs) => void;

  // ── Operations ──
  onOpen?: (args: FileManagerOpenArgs) => void;
  onCreate?: (args: FileManagerCreateArgs) => void;
  onRename?: (args: FileManagerRenameArgs) => void;
  onDelete?: (args: FileManagerDeleteArgs) => void;
  onMove?: (args: FileManagerMoveArgs) => void;
  onPaste?: (args: FileManagerPasteArgs) => void;
  onRefresh?: (args: FileManagerRefreshArgs) => void;
  onExternalDrop?: (args: FileManagerExternalDropArgs) => void;
  validateRename?: (args: FileManagerValidateRenameArgs) => string | null;

  // ── View mode ──
  viewMode?: FileManagerViewMode;
  defaultViewMode?: FileManagerViewMode;        // default 'grid'
  onViewModeChange?: (args: FileManagerViewModeChangeArgs) => void;

  // ── Icon size ──
  iconSize?: FileManagerIconSize;
  defaultIconSize?: FileManagerIconSize;        // default 'md'
  onIconSizeChange?: (args: FileManagerIconSizeChangeArgs) => void;

  // ── Sort ──
  sort?: FileManagerSortState;
  defaultSort?: FileManagerSortState;           // default { key: 'name', order: 'asc' }
  onSortChange?: (args: FileManagerSortChangeArgs) => void;
  sortItems?: (a: FsNode, b: FsNode, sort: FileManagerSortState) => number;

  // ── Search / filter ──
  searchQuery?: string;
  defaultSearchQuery?: string;
  onSearchQueryChange?: (args: FileManagerSearchChangeArgs) => void;
  filterItems?: (node: FsNode, query: string) => boolean;
  showHidden?: boolean;
  isHidden?: (node: FsNode) => boolean;

  // ── Navigation history ──
  enableHistory?: boolean;                       // default true
  historyBackIds?: string[];                     // controlled
  historyForwardIds?: string[];                  // controlled
  onPathTyped?: (args: FileManagerPathTypedArgs) => void;

  // ── Rendering ──
  iconForNode?: (args: FileManagerIconForNodeArgs) => ReactNode;
  renderItem?: (args: FileManagerItemRenderArgs) => ReactNode;
  renderToolbar?: (ctx: FileManagerToolbarContext) => ReactNode;
  renderContextMenu?: (ctx: FileManagerContextMenuContext) => ReactNode;
  renderEmpty?: (ctx: FileManagerEmptyContext) => ReactNode;
  renderLoading?: () => ReactNode;
  renderStatusBar?: (ctx: FileManagerStatusBarContext) => ReactNode;
  renderDeleteConfirm?: (ctx: FileManagerDeleteConfirmContext) => ReactNode;

  // ── Slots ──
  sidebar?: ReactNode;
  details?: ReactNode;

  // ── Toolbar config ──
  toolbar?: boolean;                             // default true
  title?: string;
  showNewFile?: boolean;                         // default true
  showNewFolder?: boolean;                       // default true
  showRefresh?: boolean;                         // default true
  showSearch?: boolean;                          // default true
  showViewToggle?: boolean;                      // default true
  showIconSize?: boolean;                        // default true (grid mode)
  showSort?: boolean;                            // default true
  showBackForward?: boolean;                     // default true
  showUpButton?: boolean;                        // default true
  showPathBar?: boolean;                         // default true

  // ── Status bar config ──
  showStatusBar?: boolean;                       // default true

  // ── Context-menu config ──
  contextMenu?: boolean;                         // default true
  contextMenuActions?: {
    open?: boolean;
    newFile?: boolean;
    newFolder?: boolean;
    cut?: boolean;
    copy?: boolean;
    paste?: boolean;
    rename?: boolean;
    delete?: boolean;
    refresh?: boolean;
  };

  // ── Confirmation ──
  confirmDelete?: boolean;                        // default true

  // ── DnD ──
  enableInternalDrag?: boolean;                   // default true
  enableExternalDrop?: boolean;                   // default true
  enableMarqueeSelection?: boolean;               // default true

  // ── Polymorphic ──
  className?: string;
  style?: CSSProperties;

  // ── Imperative handle ──
  ref?: Ref<FileManagerHandle>;

  // ── i18n labels ──
  labels?: Partial<FileManagerLabels>;
}

/** Default labels — exported so consumers can build complete label objects. */
export const DEFAULT_FILE_MANAGER_LABELS: FileManagerLabels;
```

### Exported names — `index.ts`

```ts
export { FileManager } from "./file-manager";
export { FileManagerToolbar } from "./parts/file-manager-toolbar";
export { FileManagerPathBar } from "./parts/file-manager-path-bar";
export { FileManagerViewToggle } from "./parts/file-manager-view-toggle";
export { FileManagerIconSizeControl } from "./parts/file-manager-icon-size-control";
export { FileManagerSortMenu } from "./parts/file-manager-sort-menu";
export { FileManagerSearchInput } from "./parts/file-manager-search-input";
export { FileManagerStatusBar } from "./parts/file-manager-status-bar";
export { useFileManager } from "./hooks/use-file-manager-context";
export { mergeLoadedChildren } from "./lib/tree-utils";
export { iconForExtension } from "./lib/icons";
export { DEFAULT_FILE_MANAGER_LABELS } from "./types";
export type {
  FsNode,
  FsNodeType,
  FileManagerProps,
  FileManagerHandle,
  FileManagerState,
  FileManagerActions,
  FileManagerItem,
  FileManagerViewMode,
  FileManagerIconSize,
  FileManagerSortKey,
  FileManagerSortOrder,
  FileManagerSortState,
  FileManagerDropPosition,
  FileClipboard,
  FileClipboardKind,
  FileManagerOpenArgs,
  FileManagerCurrentFolderChangeArgs,
  FileManagerCreateArgs,
  FileManagerRenameArgs,
  FileManagerDeleteArgs,
  FileManagerMoveArgs,
  FileManagerPasteArgs,
  FileManagerClipboardChangeArgs,
  FileManagerRefreshArgs,
  FileManagerExternalDropArgs,
  FileManagerLoadChildrenArgs,
  FileManagerSelectionChangeArgs,
  FileManagerSortChangeArgs,
  FileManagerViewModeChangeArgs,
  FileManagerIconSizeChangeArgs,
  FileManagerSearchChangeArgs,
  FileManagerPathTypedArgs,
  FileManagerValidateRenameArgs,
  FileManagerIconForNodeArgs,
  FileManagerContextMenuItem,
  FileManagerToolbarContext,
  FileManagerStatusBarContext,
  FileManagerContextMenuContext,
  FileManagerEmptyContext,
  FileManagerItemRenderArgs,
  FileManagerDeleteConfirmContext,
  FileManagerLabels,
} from "./types";

// Shared clipboard primitive (sibling module; consumed by file-manager
// internally and by file-tree starting v0.2.0).
export {
  FileClipboardProvider,
  useFileClipboard,
} from "../_shared/file-clipboard";
```

The `useFileManager()` hook is the public consumer entry for advanced custom-chrome composition. Returns `{ state, actions, ...config }` from the internal Context. Throws if called outside a `<FileManager>`.

## File-by-file plan

```
src/registry/components/navigation/_shared/
└── file-clipboard.ts                        — FileClipboardProvider + useFileClipboard hook (NEW shared module)

src/registry/components/navigation/file-manager/   (≈32 files in the sealed folder)
├── file-manager.tsx                         — top-level orchestrator ("use client", ~340 LOC)
├── parts/
│   ├── file-manager-toolbar.tsx             — default toolbar; reads from useFileManager()
│   ├── file-manager-path-bar.tsx            — breadcrumbs + click-to-edit input mode
│   ├── file-manager-back-forward.tsx        — back/forward buttons (history-aware)
│   ├── file-manager-up-button.tsx           — parent-folder button
│   ├── file-manager-view-toggle.tsx         — grid/list toggle group
│   ├── file-manager-icon-size-control.tsx   — sm/md/lg control (grid mode only)
│   ├── file-manager-sort-menu.tsx           — sort dropdown
│   ├── file-manager-search-input.tsx        — search field
│   ├── file-manager-new-buttons.tsx         — new-file + new-folder buttons (used by toolbar)
│   ├── file-manager-refresh-button.tsx      — refresh button
│   ├── file-manager-content-pane.tsx        — wrapper that picks grid OR list view + handles marquee
│   ├── file-manager-grid-view.tsx           — CSS-grid layout of items
│   ├── file-manager-list-view.tsx           — header-row + item-rows list layout
│   ├── file-manager-item.tsx                — single item (works in both views; reads viewMode prop)
│   ├── file-manager-rename-input.tsx        — inline rename
│   ├── file-manager-context-menu.tsx        — shadcn ContextMenu wrapper
│   ├── file-manager-status-bar.tsx          — bottom bar with counts + size
│   ├── file-manager-empty.tsx               — empty-state
│   ├── file-manager-loading.tsx             — loading-state skeleton
│   ├── file-manager-drag-overlay.tsx        — external-drop overlay
│   ├── file-manager-delete-confirm.tsx      — default AlertDialog wrapper
│   └── file-manager-marquee.tsx             — marquee rectangle visual
├── hooks/
│   ├── use-file-manager-context.ts          — Context provider + useFileManager() consumer
│   ├── use-current-folder.ts                — current-folder controlled/uncontrolled state + path computation
│   ├── use-navigation-history.ts            — back/forward stack (capped at 50; bypassable)
│   ├── use-selection.ts                     — controlled/uncontrolled selection + anchor for shift-click
│   ├── use-clipboard.ts                     — auto-detects FileClipboardProvider; falls back to internal
│   ├── use-visible-items.ts                 — flatten current folder's children + sort + filter + hidden
│   ├── use-keyboard.ts                      — full keyboard map (arrow nav 2D in grid, Cmd+X/C/V, etc.)
│   ├── use-marquee.ts                       — drag-rectangle pointer events + intersect algorithm
│   ├── use-drag.ts                          — internal + external DnD with cycle pre-validation
│   ├── use-type-ahead.ts                    — type-ahead-to-focus (debounced 800ms reset)
│   ├── use-lazy-load.ts                     — onLoadChildren orchestration on navigate
│   └── use-sort-search.ts                   — sort + search controlled/uncontrolled state
├── lib/
│   ├── icons.tsx                            — extension→Lucide map (copy from file-tree, kept in sync manually)
│   ├── tree-utils.ts                        — indexNodes / findNode / getParentChain / mergeLoadedChildren / countAllNodes
│   ├── validation.ts                        — isCycle / isSelfDrop / isLegalDrop (copy from file-tree)
│   ├── path.ts                              — buildPath(currentFolderId, index) → FsNode[]; parsePath(string, index)
│   ├── intersect.ts                         — rectangleIntersectsRect helper for marquee
│   └── format.ts                            — formatBytes(n), formatDate(iso) for status bar + list view
├── types.ts                                 — public types (above) + DEFAULT_FILE_MANAGER_LABELS
├── dummy-data.ts                            — Next.js shape (reuse from file-tree) + 30-image flat fixture
├── demo.tsx                                 — 6-mode tabbed demo
├── usage.tsx                                — concise inline notes
├── meta.ts                                  — registry meta
└── index.ts                                 — barrel exports + re-export of shared clipboard
```

### Per-file LOC budgets + responsibilities

#### Top-level

- **`file-manager.tsx`** (~340 LOC, "use client") — Orchestrator. Reads props, calls all hooks, builds `FileManagerContextValue`, wraps in Provider, renders `[sidebar?][toolbar?][content-pane][status-bar?][details?]` flexbox layout. Handles delete-confirmation AlertDialog state; wraps tree in `<TooltipProvider>` (per file-tree precedent). Wires keyboard handler on root with `tabIndex={focusedId === null ? 0 : -1}` (roving-tabindex pattern).

#### Parts (22 files)

- **`file-manager-toolbar.tsx`** (~120 LOC) — Default toolbar layout. Uses `useFileManager()`. Composes the standalone parts (back/forward, up, path-bar, view-toggle, icon-size, sort, search, new-file, new-folder, refresh) per their `show*` flags. Each gated atom can be replaced via the wholesale `renderToolbar` slot.
- **`file-manager-path-bar.tsx`** (~90 LOC) — Breadcrumbs from `state.path`. Each segment is a button → `actions.navigateTo(segment.id)`. Click empty area → toggles to `<input>` mode. **`onPathTyped` fires on Enter or blur (commit), NOT per-keystroke** — keystroke-fire would be too noisy and most consumers can't resolve partial paths anyway. Esc reverts to breadcrumbs without firing.
- **`file-manager-back-forward.tsx`** (~50 LOC) — Two icon buttons. Disabled when respective stack is empty.
- **`file-manager-up-button.tsx`** (~30 LOC) — One button. Disabled at root.
- **`file-manager-view-toggle.tsx`** (~40 LOC) — Two-button toggle group (grid / list). Reads + writes `state.viewMode`.
- **`file-manager-icon-size-control.tsx`** (~50 LOC) — Three-button toggle group (sm / md / lg). Hidden when `viewMode === 'list'`.
- **`file-manager-sort-menu.tsx`** (~70 LOC) — DropdownMenu with sort-key items + asc/desc toggle. Reads + writes `state.sort`.
- **`file-manager-search-input.tsx`** (~50 LOC) — `<Input>` with search icon. Debounce-on-blur is consumer's job; we fire `onSearchQueryChange` on every keystroke.
- **`file-manager-new-buttons.tsx`** (~40 LOC) — Two icon buttons. Each gated by `showNewFile` / `showNewFolder` AND callback wiring.
- **`file-manager-refresh-button.tsx`** (~30 LOC) — One button.
- **`file-manager-content-pane.tsx`** (~120 LOC) — The scroll container. Picks grid OR list view based on `state.viewMode`. Hosts the marquee logic + drag overlay. `data-file-manager-scroller` for auto-scroll-during-drag. **Pointer-down dispatch:** the pane owns the top-level `onPointerDown` handler; it inspects `event.target.closest("[data-item-id]")` — if it hits an item, the event is left to bubble to the item's drag handlers (item is `draggable`); if it hits whitespace, the marquee hook takes over. This guarantees pointer-down-on-item is never misinterpreted as marquee-start.
- **`file-manager-grid-view.tsx`** (~80 LOC) — CSS grid with `grid-template-columns: repeat(auto-fill, <itemSize>)`. Item size mapped from `state.iconSize` to `80px / 120px / 180px`. Each cell = `<FileManagerItem viewMode="grid" />`.
- **`file-manager-list-view.tsx`** (~120 LOC) — Header row with sortable columns (Name / Modified / Size / Type) — clicking header toggles sort. Body is a vertical list of `<FileManagerItem viewMode="list" />` rows.
- **`file-manager-item.tsx`** (~180 LOC) — Single item. Reads `viewMode` and `iconSize` props to switch internal layout. Layout-grid case: `[icon (80% opacity)][name truncated]`; layout-list case: `[icon][name][size][modified][kind]`. Click / double-click / context-menu / drag handlers shared. Inline rename input renders inside name when `state.renamingId === item.node.id`.
- **`file-manager-rename-input.tsx`** (~70 LOC) — Same shape as file-tree's rename input. Auto-selects basename for files; whole name for folders.
- **`file-manager-context-menu.tsx`** (~150 LOC) — shadcn ContextMenu wrapper. Captures right-click target via event.target's closest `[data-item-id]`. Composes default actions array per node type + paste-availability + selection state. Dispatches via `actions.cut`, `actions.copy`, `actions.paste`, etc.
- **`file-manager-status-bar.tsx`** (~60 LOC) — `[count items · selected count · total size]`. Uses `lib/format.ts` for size formatting. Reads from `useFileManager()`.
- **`file-manager-empty.tsx`** (~50 LOC) — Centered placeholder. Includes optional new-file / new-folder buttons.
- **`file-manager-loading.tsx`** (~30 LOC) — Skeleton items in current view shape (grid skeletons in grid mode; row skeletons in list).
- **`file-manager-drag-overlay.tsx`** (~50 LOC) — Same shape as file-tree's drag overlay (external-drop).
- **`file-manager-delete-confirm.tsx`** (~40 LOC) — Same shape as file-tree's delete-confirm.
- **`file-manager-marquee.tsx`** (~40 LOC) — Pure visual: an absolutely-positioned div sized from drag start/current point. Reads `state` from `use-marquee.ts`; nothing else.

#### Hooks (12 files)

- **`use-file-manager-context.ts`** (~70 LOC) — `FileManagerContext` + `useFileManager()` hook. Throws if called outside a provider.
- **`use-current-folder.ts`** (~110 LOC) — Manages `currentFolderId` controlled/uncontrolled. Resolves the path (`buildPath(currentFolderId, index)` → `FsNode[]`). Triggers `selectionAfterNavigate` clearing logic + history-stack updates.
- **`use-navigation-history.ts`** (~80 LOC) — Maintains `historyBackIds[]` + `historyForwardIds[]` (capped at 50). Public methods: `pushVisit(id)`, `goBack()`, `goForward()`. When a Back/Forward navigation runs, the stack movement is bypassed (we don't push the destination as a fresh visit).
- **`use-selection.ts`** (~120 LOC) — Same pattern as file-tree's `use-tree-state.ts` selection part. Includes `selectionAnchorId` (ref-based; exposed via getter). Cleared on currentFolderId change unless `preserveSelectionOnNavigate`.
- **`use-clipboard.ts`** (~90 LOC) — Detects whether `<FileClipboardProvider>` is up the tree. If yes, reads/writes through it. If no AND `clipboard` prop given, controlled. Otherwise, internal state. Returns `{ clipboard, cut, copy, clearClipboard }`.
- **`use-visible-items.ts`** (~110 LOC) — Computes the visible-items array from `nodes`, `currentFolderId`, `sort`, `searchQuery`, `showHidden`, `isHidden`, and the clipboard's `cut` state (so each item knows if it's currently in `cut` state for visual). Memoized.
- **`use-keyboard.ts`** (~190 LOC) — Full keyboard map. Two-D arrow nav in grid mode (computes columns based on container width + iconSize); 1-D arrow nav in list mode. Handles Cmd+X/C/V/A/Z (Z is no-op for us — consumer's), Backspace (navigate up if no selection), Enter (open file or folder), F2 (rename), Delete (delete), Esc (clear / cancel rename), Cmd+[/]/up (back/forward/up), Home/End, type-ahead.
- **`use-marquee.ts`** (~120 LOC) — Pointer-down on whitespace starts marquee. Pointer-move updates rectangle bounds + intersects against item DOM rects (cached via `data-item-id`). Pointer-up commits selection. Auto-extends scroll like the drag hook.
- **`use-drag.ts`** (~150 LOC) — Modeled on file-tree's `use-tree-drag.ts`. Same `application/x-ilinxa-file-tree` MIME marker (cross-component DnD). Cycle pre-validation via `lib/validation.ts`. Drops on files = rejected; drops on folders = `inside`; drops on whitespace internal = no-op; drops on whitespace external = upload to current folder. Auto-scroll near edges.
- **`use-type-ahead.ts`** (~50 LOC) — Tracks a prefix string + reset timer. Each keystroke (when not modifier) appends to prefix; `setTimeout(800ms)` clears. After append, find first item whose `name` starts with prefix (case-insensitive) and `actions.focusNode`.
- **`use-lazy-load.ts`** (~80 LOC) — Same shape as file-tree's. Fires `onLoadChildren` when current folder has `children === undefined`. Tracks per-folder loading + error state.
- **`use-sort-search.ts`** (~80 LOC) — Sort + search controlled/uncontrolled state. View-mode + icon-size folded in too (they have the same controlled-uncontrolled pattern).

#### Lib (6 files)

- **`icons.tsx`** (~80 LOC) — Copy of file-tree's `lib/icons.tsx`. Same `EXT_TO_ICON` map + `iconForExtension` + `defaultFileIcon` + `defaultFolderIcon`.
- **`tree-utils.ts`** (~150 LOC) — Copy of file-tree's `lib/tree-utils.ts`. Same `indexNodes` / `findNode` / `getParentChain` / `getDescendantIds` / `defaultSort` / `mergeLoadedChildren` / `countAllNodes` / `getNodeExtension`. Plus a manager-specific helper: `getChildrenOf(folderId, index)` returning the visible children array (used by `use-visible-items`).
- **`validation.ts`** (~50 LOC) — Copy of file-tree's `lib/validation.ts`.
- **`path.ts`** (~60 LOC) — `buildPath(currentFolderId, index)` walks the parent chain to produce `FsNode[]` from root. `parsePath(string, nodes)` (best-effort string-to-id resolution; consumer typically provides their own resolver via `onPathTyped`).
- **`intersect.ts`** (~30 LOC) — `rectangleIntersectsRect(a, b)` predicate; `getItemRects(scroller)` returns `Map<string, DOMRect>` for all items currently rendered.
- **`format.ts`** (~60 LOC) — `formatBytes(n: number): string` (e.g., "4.2 MB"); `formatDate(iso: string): string` (e.g., "May 9, 2026" via `Intl.DateTimeFormat`). `formatItemCount(n)` and `formatSelectedCount(n)` for status bar.

#### Shared (1 new file)

- **`_shared/file-clipboard.ts`** (~80 LOC) — `FileClipboard` type, `FileClipboardContext`, `<FileClipboardProvider>`, `useFileClipboard()` hook. Provider holds `useState<FileClipboard>({ kind: null, ids: [] })` + setter. Hook returns `{ clipboard, setClipboard, cut, copy, clearClipboard }`. Falls back to a "no provider" sentinel that returning consumers detect via `useFileClipboard().__hasProvider`.

#### Top-level remaining

- **`dummy-data.ts`** (~200 LOC) — Re-imports the small Next.js project shape (locally; we don't import from file-tree per our independence decision). Adds a flat-grid fixture: ~30 image-named items in a single folder for grid demo (no nesting; just `{id, name, type:'file', ext:'png/jpg/svg'}`). Plus a 250-node generator for the virtualization-stress demo.
- **`demo.tsx`** (~280 LOC) — 6 tabbed demos:
  1. **Standalone grid** — basic file-manager with the small Next.js shape, grid view.
  2. **Dual-pane Finder** — composes `<FileManager sidebar={<FileTree ... />}>`. Both share the same `nodes` array; navigation in tree updates `currentFolderId`.
  3. **Full CRUD + clipboard** — wired callbacks + `<FileClipboardProvider>` so cut/copy/paste sync naturally.
  4. **Lazy load** — shallow nodes + `onLoadChildren` simulating fetch.
  5. **Custom item renderer** — image thumbnails for image files via `renderItem` (using a static placeholder URL since real assets aren't shipped with fixtures).
  6. **List view** — same data but `defaultViewMode="list"`.
- **`usage.tsx`** (~150 LOC) — 8 sections: data shape, controlled vs uncontrolled, navigation history, keyboard map, drag-and-drop, custom chrome, shared clipboard, gotchas.
- **`meta.ts`** — `version: 0.1.0`, `category: 'navigation'`, dependencies: `shadcn: ['alert-dialog', 'button', 'context-menu', 'dropdown-menu', 'input', 'tooltip', 'toggle-group']`, `npm: { 'lucide-react': '^1.11.0', '@tanstack/react-virtual': '^3.13.24' }`. **List-view virtualizes** at >=200 visible items via TanStack Virtual (same primitive file-tree uses; same auto/always/never mode prop). Grid-view does NOT virtualize at v0.1.0 (column-aware grid virtualization is more complex; defer).
- **`index.ts`** — Per the exported-names section above. Re-exports the FileManager top-level + all standalone parts + `useFileManager` + `mergeLoadedChildren` + `iconForExtension` + `DEFAULT_FILE_MANAGER_LABELS` + `<FileClipboardProvider>` + `useFileClipboard` + all public types.

## Dependencies

### npm (added to project root `package.json`)

None new. Already present:

- `react`, `react-dom`
- `lucide-react`
- `@tanstack/react-virtual` (already a project dep at `^3.13.24` — used optionally if list view grows beyond ~200 items; v0.1.0 may ship without virtualization for list view if grid view does it conditionally)

### shadcn primitives (verify present)

- `alert-dialog` ✓ (added during file-tree v0.1.0)
- `button` ✓
- `context-menu` ✓
- `dropdown-menu` ✓ (verify)
- `input` ✓
- `tooltip` ✓
- `toggle-group` ✓

### Internal registry deps

None at install time (the `_shared/file-clipboard.ts` lives outside `file-manager/` but inside `navigation/` — it's a sibling module that the registry build will need to bundle into both the file-manager registry artifact AND, eventually, the file-tree v0.2.0 artifact).

**Open call for plan-stage:** how does the registry-distribution `pnpm dlx shadcn@latest add @ilinxa/file-manager` ship the `_shared/file-clipboard.ts` file? Two options:

(a) Include it in the file-manager registry.json's `files` array at a path like `components/file-manager/_shared/file-clipboard.ts`. Drawback: when a consumer later installs `@ilinxa/file-tree` v0.2.0 (which also wants the shared module), they'd get a second copy.

(b) Ship a separate `@ilinxa/file-clipboard` registry item; both file-manager v0.1.0 and file-tree v0.2.0 declare it as a `registryDependency`. Drawback: file-manager DOES depend on something at install time (mild violation of "each component independently usable").

**Recommendation:** **(b)** — ship `@ilinxa/file-clipboard` as a third registry artifact alongside `@ilinxa/file-manager` + `@ilinxa/file-manager-fixtures`. The registryDependency pattern is the standard shadcn way to share code; consumers installing `@ilinxa/file-manager` get the clipboard automatically. The "independently usable" goal is preserved: file-manager works with no other ilinxa component installed (the clipboard module is its own primitive). When file-tree v0.2.0 lands, IT also depends on `@ilinxa/file-clipboard` and the registry deduplicates the install.

This is the only way to keep cut/copy/paste consistent across versions without diverging code copies in the wild.

## Composition pattern

Same shape as file-tree:

- **Controlled-data primary surface** — consumer owns `nodes` + `currentFolderId`.
- **Slot props for replaceable surfaces** — `renderItem`, `renderToolbar`, `renderContextMenu`, `renderEmpty`, `renderLoading`, `renderStatusBar`, `renderDeleteConfirm`.
- **Standalone parts via Context** — `<FileManagerToolbar>`, `<FileManagerPathBar>`, `<FileManagerViewToggle>`, `<FileManagerIconSizeControl>`, `<FileManagerSortMenu>`, `<FileManagerSearchInput>`, `<FileManagerStatusBar>` all read from `FileManagerContext` via `useFileManager()`.
- **Imperative ref for advanced control** — `FileManagerHandle` exposes `state` + `actions`.
- **Slots: `sidebar` and `details`** — render-prop ReactNode; consumer composes any component (file-tree for the dual-pane shape; properties pane / preview for details).
- **Shared clipboard via Provider** — multi-instance sync without per-instance prop plumbing.

## Client vs server

`"use client"` required at `file-manager.tsx`. Reasons (all the same as file-tree, plus marquee-specific):

- Refs (scroll container, marquee start point, item rects).
- Pointer events (marquee).
- Keyboard events.
- DnD.
- Internal state (current folder, selection, view mode, history).
- `<FileClipboardProvider>` Context.

`_shared/file-clipboard.ts` is also `"use client"` (uses `useState` + Context).

## Edge cases

| Case | Behavior |
|---|---|
| `nodes === []` and `currentFolderId === null` | Render `renderEmpty` slot or default empty-state. Toolbar still renders. Status bar shows "0 items". |
| Current folder has no children (and is loaded) | Same — empty state. |
| `currentFolderId` references a node that doesn't exist in `nodes` | Soft-fail: render empty state, log dev warning, status bar shows 0. |
| `currentFolderId` references a node that IS a file (not folder) | Soft-fail: render empty state + dev warning. `path` still resolves to file's parent chain so navigation up works. |
| Folder with `children === undefined` (lazy) | Show centered loading state in content pane. Fire `onLoadChildren`; on resolve, consumer merges; pane re-renders with children. |
| `onLoadChildren` rejects | Show centered error message + retry button. |
| Drop on a file row | Rejected — visual indicator destructive; no `onMove`. |
| Drop on whitespace, internal drag | No-op. Indicator stays neutral (items already in current folder). |
| Drop on whitespace, external drag | `onExternalDrop({ files, targetFolderId: currentFolderId })`. |
| Cycle detected during drag (drop a folder onto a descendant) | Rejected; visual indicator destructive. |
| Multi-select drag with descendants of target folder among sources | Reject the entire drop. |
| Marquee selection while shift held | Adds to existing selection (matches Mac Finder). Without shift: replaces. |
| Marquee starts on an item | Initiates a normal item drag instead (not marquee — pointer-down-on-item is reserved for drag). |
| Cut → navigate to a different folder → paste | Paste fires with `targetFolderId = currentFolderId` at paste time. |
| Cut → cut something else → original cut clears, new selection becomes "cut" | Standard clipboard behavior. |
| Empty selection + paste | No-op. |
| Cut + paste into the same folder (no-op move) | Manager fires `onPaste` anyway; consumer can detect and ignore (no-op). Same nuance as file-tree's F-03 finding. |
| `clipboard` controlled prop changes externally (consumer mutates state) | Manager re-renders item visuals (cut highlight). |
| Provider mode + multiple manager instances | All instances see the same clipboard. Cut in instance A appears as `cut` styling everywhere. |
| Rename to empty / duplicate name | Same as file-tree: `validateRename` (if provided) returns error message; commit blocked. |
| Type-ahead during rename input focus | Suppressed — the rename input owns keystrokes. |
| Cmd/Ctrl+A in the search input field | Selects search-input text (browser-native), not all items. |
| Search query active + navigate | Search clears on navigate (matches Mac Finder + Windows Explorer). |
| Sort change | Re-runs `use-visible-items` memo; preserves selection by id. |
| View-mode toggle while items selected | Selection preserved; focus moves to the focused item's new position in the new layout. |
| Icon size change | Visual only — no state churn beyond CSS. |
| Resize container | Grid columns reflow via CSS auto-fill; marquee tracking updates on next pointer-move. |
| `currentFolderId` set programmatically (not via user click) | Fires `onCurrentFolderChange({ folderId, cause: 'ref' })` if controlled-write happens via `actions.navigateTo`; doesn't fire if consumer mutates the prop directly. |
| Path bar typed input doesn't resolve | `onPathTyped` fires; consumer's responsibility to resolve. If consumer doesn't update `currentFolderId`, the manager stays where it is. |
| Back / forward at end of stack | Buttons disabled. |
| `<FileClipboardProvider>` not present + no `clipboard` prop | Manager uses its own internal clipboard. Cut/copy/paste work within the instance. |
| Multi-instance, no provider, no `clipboard` prop | Each instance has its OWN internal clipboard — they don't sync. Document clearly. |

## Accessibility

- **Outer container**: `role="region" aria-label="..."`. Single managed-focus outer; `tabIndex={focusedId === null ? 0 : -1}` (roving-tabindex pattern, same as file-tree).
- **Toolbar**: `role="toolbar"`. Buttons have `aria-label`; toggle groups use `aria-pressed`.
- **Path bar**: `<nav aria-label="Path">` with breadcrumb segments as `<a>`-equivalent buttons.
- **Content pane**:
  - Grid mode: `role="grid"` with `aria-multiselectable="true"`. Items: `role="gridcell"` with `aria-selected`, `aria-rowindex`, `aria-colindex` (computed from layout). Arrow nav handles 2D movement.
  - List mode: `role="grid"` (also; same composite-widget pattern; columns are sortable). `role="row"` for header + each item; `role="columnheader"` for the sort headers; `role="gridcell"` for the data cells.
- **Status bar**: `role="status" aria-live="polite"`. Reads current count + selection count + size.
- **Live-region**: hidden `<div role="status" aria-live="polite" sr-only>` for navigate / paste / delete / move announcements.
- **Focus management**: single tab stop into the manager. Inside, arrow keys + type-ahead manage focus; tabbing out goes to the next page element.
- **Focus-visible rings**: every interactive element using `--ring`.
- **Contrast ≥ AA** in both themes. Selected items use `--secondary` background; cut items use 50% opacity (verify contrast still passes — opacity reduces effective contrast).
- **Keyboard map** is documented in usage.tsx.
- **Screen-reader testing target**: VoiceOver (macOS Safari) + NVDA (Windows Firefox).
- **Lighthouse a11y target**: ≥ 95 on the demo page.

## Verification checklist

Before push to master:

- [ ] `pnpm tsc --noEmit` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm validate:meta-deps` — 40/40 (39 existing + file-manager) clean
- [ ] `pnpm build` — succeeds
- [ ] Demo renders correctly at `/components/file-manager` in dev mode
- [ ] All 6 demo modes interactive without errors
- [ ] `registry.json` updated with `file-manager` base + `file-manager-fixtures` + `file-clipboard` items
- [ ] `pnpm registry:build` regenerates `public/r/file-manager.json` + `public/r/file-manager-fixtures.json` + `public/r/file-clipboard.json`
- [ ] Manifest registered in `src/registry/manifest.ts`
- [ ] Smoke harness pass — `pnpm dlx shadcn@4.6.0 add @ilinxa/file-manager` from `e:/tmp/ilinxa-smoke-consumer/` + post-install `pnpm tsc --noEmit` clean
- [ ] GATE 3 spot-check review authored at `docs/procomps/file-manager-procomp/reviews/2026-05-10-v0.1.0-spotcheck.md`; verdict ≥ "Pass with follow-ups"
- [ ] STATUS.md updated (Components table + Active queue + Recent activity); component count goes from 39 → 40
- [ ] Memory updated (active queue: 3 of 6 shipped)

## Risks & alternatives

### Risks

- **Marquee + drag-from-OS interaction** — when user starts a pointer-down on whitespace, we don't yet know if they're starting a marquee OR if they're about to drag-out (no — drag-out is pointer-down-on-item). But what about pointer-down-on-item-while-OS-files-being-dragged-OVER? That should be handled by the dragenter logic ignoring marquee state. **Mitigation:** marquee is gated to only start on pointer-down on whitespace AND not during an active OS drag; track via `isExternalDragging` state.
- **Two-D arrow navigation in grid mode** — computing column count requires reading container width / item size. **Mitigation:** ResizeObserver on the scroll container; recompute on resize. Cache column count in ref.
- **`FileClipboardProvider` auto-detection** — `useContext` returns the default value when no provider is present. We need a sentinel (e.g., `__hasProvider: false` in default; `__hasProvider: true` when provider wraps). **Mitigation:** explicit sentinel in default Context value; document the pattern.
- **Cycle-detection cost during drag** — same as file-tree (~60Hz `dragover`). **Mitigation:** memoize `nodeIndex` at hook entry (carried over from file-tree's review).
- **List-view sort-header click + Cmd-click** — Cmd-click on the sort header should NOT toggle range-select on items; it should toggle sort order or be a no-op on the header. **Mitigation:** sort-header click handler stops propagation; no Cmd-click special handling.
- **Sidebar slot is consumer-rendered ReactNode** — consumer might render something that depends on its own provider (e.g., `<FileTree>` doesn't need a provider but a custom sidebar might). Manager has no awareness of sidebar internals. Acceptable; document.
- **Path-bar typed-input resolution** — depending on consumer's data shape, "/" might mean different things. We just fire `onPathTyped({ path })`; consumer resolves. **Mitigation:** explicit doc note.
- **Validation duplication maintenance** — file-manager ships its own copy of `validation.ts`. If file-tree's evolves, the copies diverge. **Mitigation:** document in code comment that the two copies should be kept in sync; future work might extract to `_shared/validation.ts` (deferred).

### Alternatives considered

- **Make file-manager `registryDependency` of file-tree** — rejected; couples them at install time. Each component should install independently.
- **Single shared registry artifact for both file-tree + file-manager** — rejected; they're different surfaces; consumer should pick what they need.
- **No back/forward history; consumer manages everything via routing** — rejected; standalone use cases (modal pickers, embedded panels) don't have routing infrastructure. Built-in default with opt-out covers both.
- **Scroll-virtualization for grid/list views** — deferred. Most file-manager use cases (~hundreds of items per folder) don't need it. Add in v0.2.0 if real demand surfaces. List view will likely benefit first.
- **`columns` view mode** — deferred to v0.2.0 (per Q3).
- **Drag-from-manager-to-OS export** — deferred to v0.2.0 (per Q17).
- **Image thumbnails for image files** — deferred to v0.2.0 (per Q23). Consumer composes via `renderItem`.
- **Built-in undo/redo** — rejected; consumer's job (matches file-tree).
- **Single context for both file-tree + file-manager** — rejected; they're different surfaces with different state shapes. Shared clipboard is the only shared concern, and it's its own primitive.

## Implementation order

Ordered to keep tsc + lint clean at every step.

1. Create `src/registry/components/navigation/_shared/file-clipboard.ts`. Author the FileClipboardProvider + useFileClipboard hook.
2. Add `_shared/file-clipboard.ts` to a new `@ilinxa/file-clipboard` registry artifact in `registry.json`.
3. `pnpm new:component navigation/file-manager` — scaffolds from `_template/`.
4. Author `types.ts` with all public types from the Final API section + `DEFAULT_FILE_MANAGER_LABELS`.
5. Author `lib/icons.tsx` (copy from file-tree, paths adjusted).
6. Author `lib/tree-utils.ts` (copy from file-tree + `getChildrenOf` helper).
7. Author `lib/validation.ts` (copy from file-tree).
8. Author `lib/path.ts` (`buildPath` + `parsePath`).
9. Author `lib/intersect.ts` (`rectangleIntersectsRect` + `getItemRects`).
10. Author `lib/format.ts` (`formatBytes` + `formatDate` + `formatItemCount`).
11. Author `dummy-data.ts` (re-use file-tree shape, locally; flat-grid fixture).
12. Author `hooks/use-file-manager-context.ts` (Context + useFileManager).
13. Author `hooks/use-current-folder.ts`.
14. Author `hooks/use-navigation-history.ts`.
15. Author `hooks/use-selection.ts`.
16. Author `hooks/use-clipboard.ts` (with provider auto-detect).
17. Author `hooks/use-sort-search.ts`.
18. Author `hooks/use-visible-items.ts`.
19. Author `hooks/use-lazy-load.ts`.
20. Author `hooks/use-marquee.ts`.
21. Author `hooks/use-drag.ts`.
22. Author `hooks/use-keyboard.ts`.
23. Author `hooks/use-type-ahead.ts`.
24. Author `parts/file-manager-rename-input.tsx`.
25. Author `parts/file-manager-item.tsx` (works in both view modes).
26. Author `parts/file-manager-grid-view.tsx`.
27. Author `parts/file-manager-list-view.tsx`.
28. Author `parts/file-manager-marquee.tsx`.
29. Author `parts/file-manager-content-pane.tsx` (orchestrates view + marquee + drag overlay).
30. Author `parts/file-manager-empty.tsx` + `file-manager-loading.tsx` + `file-manager-drag-overlay.tsx` + `file-manager-delete-confirm.tsx`.
31. Author `parts/file-manager-context-menu.tsx`.
32. Author the toolbar atoms: `file-manager-back-forward.tsx`, `file-manager-up-button.tsx`, `file-manager-path-bar.tsx`, `file-manager-view-toggle.tsx`, `file-manager-icon-size-control.tsx`, `file-manager-sort-menu.tsx`, `file-manager-search-input.tsx`, `file-manager-new-buttons.tsx`, `file-manager-refresh-button.tsx`.
33. Author `parts/file-manager-toolbar.tsx` (composes all atoms).
34. Author `parts/file-manager-status-bar.tsx`.
35. Author `file-manager.tsx` (top-level orchestrator) — wires everything together via Context.
36. Author `meta.ts` with full `ComponentMeta`.
37. Author `index.ts` barrel exports (including `<FileClipboardProvider>` re-export).
38. Author `demo.tsx` (six demos, including dual-pane with `<FileTree>` sidebar).
39. Author `usage.tsx`.
40. Register in `src/registry/manifest.ts` (3-line edit per scaffolder output).
41. Add to `registry.json` — base item + `file-manager-fixtures` item. Verify the `file-clipboard` artifact added in step 2 is correct.
42. Run `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps && pnpm build`.
43. Run `pnpm registry:build` and spot-check `public/r/file-manager.json` + `public/r/file-clipboard.json`.
44. Run smoke harness pass.
45. Author guide.md (`file-manager-procomp-guide.md`).
46. Author GATE 3 spot-check review.
47. Update STATUS.md (Components table row → 40 components, Active queue → 3/6 shipped, Recent activity).
48. Commit + push to master (Vercel auto-deploys).

---

> **Sign-off needed before scaffolding (`pnpm new:component`).** Reviewer should validate: (1) the `FileManagerProps` surface is complete; (2) the file-by-file plan covers the right separation of concerns (~32 files in the sealed folder + 1 in `_shared/`); (3) the `@ilinxa/file-clipboard` registry artifact decision (separate registry item that file-manager declares as `registryDependency` — see "Internal registry deps" Open call); (4) the validation-duplication trade-off is OK; (5) the implementation order is realistic. Push back on any specific decision OR confirm to proceed.
