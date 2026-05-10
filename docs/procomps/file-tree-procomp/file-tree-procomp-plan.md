# file-tree — procomp plan

> Stage 2: how. The implementation contract.
>
> **Predecessor:** [`file-tree-procomp-description.md`](./file-tree-procomp-description.md), confirmed by user with "confirmed" — all 21 open-question recommendations accepted.

## Substrate decisions (locked)

| Decision | Choice | Source |
|---|---|---|
| Slug | `file-tree` | Description Q1 |
| Category | new `navigation` (added in `categories.ts`) | Description Q2 |
| Data ownership | controlled (consumer owns `nodes`); component fires callbacks | Description in-scope |
| Lazy children | `onLoadChildren?: (args) => Promise<FsNode[]>` | Description in-scope |
| Default expanded (uncontrolled) | root-level folder ids only | Description Q20 |
| `FsNode` shape | id / name / type / parentId / children / ext / size / modifiedAt / icon / meta — no `disabled` / `readOnly` | Description Q3 |
| `children: undefined` vs `[]` | `undefined` triggers `onLoadChildren`; `[]` renders "(empty)" inline | Description Q4 |
| Cut / copy / paste | deferred to v0.2.0 (lands with folder-manager + shared clipboard) | Description Q19 |
| DnD | HTML5 native (`draggable` + `dragstart`/`dragover`/`drop`); no peer dep | Description Q5 |
| Drop legality | tree pre-validates cycle + self-drop; name-collision is consumer's call | Description Q21 |
| Drop-zone resolution | three-zones (before/inside/after) on folders; two-zones (above/below) on files | Description Q11 |
| Virtualization | `@tanstack/react-virtual` v3, auto at ≥200 visible nodes | Description Q7 |
| Default icons | `lucide-react` extension→category map (~15 categories) | Description Q6 |
| Icon priority | `node.icon` → `iconForNode(node)` → built-in default | Description Q14 |
| Selection | `single` default, `multi` opt-in; Cmd/Ctrl+click toggle, Shift+click range | Description Q8 |
| Confirm delete | shadcn `<AlertDialog>` by default; `confirmDelete={false}` opt-out; `renderDeleteConfirm` slot | Description Q9 |
| Multi-select drag | drags whole selection if dragged node is selected; otherwise replaces selection | Description Q10 |
| Header parts | export `<FileTreeHeader>`, `<FileTreeNewFileButton>`, `<FileTreeNewFolderButton>`, `<FileTreeRefreshButton>`, `<FileTreeCollapseAllButton>` as standalone atoms (read internal Context) | Description Q13 |
| Indent guides | on by default (`--border` @ 50%, 1px) | Description Q15 |
| Collapse-all | full collapse (every folder, all levels) | Description Q16 |
| Open semantics | Enter on file fires `onOpen`; Enter on folder toggles expansion | Description Q17 |
| Dummy data | small Next.js project shape (~40 nodes, 3–4 levels deep) | Description Q18 |

## Final API

### Public types — `types.ts`

```ts
import type { CSSProperties, ReactNode, Ref } from "react";

/** Two node kinds. Folders can have children; files cannot. */
export type FsNodeType = "file" | "folder";

/**
 * Hierarchical-node shape. `children` semantics:
 *  - `undefined` = unknown / not yet loaded → triggers `onLoadChildren` on first expand
 *  - `[]`        = known-empty folder → renders "(empty)" inline placeholder
 *  - `FsNode[]`  = pre-loaded children
 */
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

export type FileTreeSelectionMode = "single" | "multi";
export type FileTreeDropPosition = "before" | "inside" | "after";
export type FileTreeVirtualizeMode = "auto" | "always" | "never";

/** Visible-row descriptor produced by the flattening pass. */
export interface FileTreeRow {
  node: FsNode;
  depth: number;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  hasChildren: boolean;        // type === 'folder' && (children === undefined || children.length > 0)
  childrenLoaded: boolean;     // children !== undefined
  loadingChildren: boolean;
}

/** Read-only state surfaced to slots and the imperative ref. */
export interface FileTreeState {
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  focusedId: string | null;
  renamingId: string | null;
  loadingFolderIds: Set<string>;
}

/** Imperative actions exposed to slots and the imperative ref. */
export interface FileTreeActions {
  expand: (id: string) => void;
  collapse: (id: string) => void;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  select: (idOrIds: string | string[]) => void;
  clearSelection: () => void;
  focusNode: (id: string) => void;
  startRename: (id: string) => void;
  cancelRename: () => void;
  triggerCreate: (parentId: string | null, type: FsNodeType) => void;
  triggerDelete: (ids: string[]) => void;
  refresh: (nodeId?: string | null) => void;
}

/** Imperative handle. */
export interface FileTreeHandle {
  state: FileTreeState;
  actions: FileTreeActions;
}

// ─── Callback arg shapes (object-shape per F-cross-12) ──────────────────────

export interface FileTreeOpenArgs            { node: FsNode }
export interface FileTreeCreateArgs          { parentId: string | null; type: FsNodeType }
export interface FileTreeRenameArgs          { id: string; node: FsNode; nextName: string }
export interface FileTreeDeleteArgs          { ids: string[] }
export interface FileTreeMoveArgs            { ids: string[]; targetId: string | null; position: FileTreeDropPosition }
export interface FileTreeRefreshArgs         { nodeId: string | null }
export interface FileTreeExternalDropArgs    { files: File[]; targetId: string | null }
export interface FileTreeLoadChildrenArgs    { nodeId: string; node: FsNode }
export interface FileTreeSelectionChangeArgs { ids: Set<string> }
export interface FileTreeExpandedChangeArgs  { ids: Set<string> }
export interface FileTreeValidateRenameArgs  { node: FsNode; nextName: string }
export interface FileTreeIconForNodeArgs     { node: FsNode }

// ─── Slot contexts ──────────────────────────────────────────────────────────

export interface FileTreeHeaderContext {
  state: FileTreeState;
  actions: FileTreeActions;
  totalCount: number;          // every node in the tree (recursive)
  visibleCount: number;        // currently rendered (expanded path) row count
  showNewFile: boolean;
  showNewFolder: boolean;
  showRefresh: boolean;
  showCollapseAll: boolean;
  title?: string;
  labels: Required<NonNullable<FileTreeProps["labels"]>>;
}

export interface FileTreeContextMenuItem {
  id: "open" | "new-file" | "new-folder" | "rename" | "delete" | "refresh";
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}

export interface FileTreeContextMenuContext {
  state: FileTreeState;
  actions: FileTreeActions;
  node: FsNode;
  defaultActions: FileTreeContextMenuItem[];
  position: { x: number; y: number };
  labels: Required<NonNullable<FileTreeProps["labels"]>>;
}

export interface FileTreeEmptyContext {
  actions: FileTreeActions;
  showNewFile: boolean;
  showNewFolder: boolean;
  labels: Required<NonNullable<FileTreeProps["labels"]>>;
}

export interface FileTreeRowRenderArgs {
  row: FileTreeRow;
  defaultRow: ReactNode;       // pre-rendered default row for composition
}

export interface FileTreeDeleteConfirmContext {
  ids: string[];
  nodes: FsNode[];             // resolved nodes (for "Delete N items" copy)
  onConfirm: () => void;
  onCancel: () => void;
  labels: Required<NonNullable<FileTreeProps["labels"]>>;
}

// ─── Top-level props ────────────────────────────────────────────────────────

export interface FileTreeProps {
  // ── Data ──
  nodes: FsNode[];
  loading?: boolean;

  // ── Selection ──
  selectionMode?: FileTreeSelectionMode;                     // default 'single'
  selectedIds?: Set<string>;                                  // controlled
  defaultSelectedIds?: Set<string>;                           // uncontrolled initial
  onSelectedChange?: (args: FileTreeSelectionChangeArgs) => void;

  // ── Expansion ──
  expandedIds?: Set<string>;                                  // controlled
  defaultExpandedIds?: Set<string>;                           // uncontrolled initial (default = root folder ids)
  onExpandedChange?: (args: FileTreeExpandedChangeArgs) => void;

  // ── Lazy loading ──
  onLoadChildren?: (args: FileTreeLoadChildrenArgs) => Promise<FsNode[]>;

  // ── Operations ──
  onOpen?: (args: FileTreeOpenArgs) => void;
  onCreate?: (args: FileTreeCreateArgs) => void;
  onRename?: (args: FileTreeRenameArgs) => void;
  onDelete?: (args: FileTreeDeleteArgs) => void;
  onMove?: (args: FileTreeMoveArgs) => void;
  onRefresh?: (args: FileTreeRefreshArgs) => void;
  onExternalDrop?: (args: FileTreeExternalDropArgs) => void;
  validateRename?: (args: FileTreeValidateRenameArgs) => string | null;

  // ── Rendering ──
  iconForNode?: (args: FileTreeIconForNodeArgs) => ReactNode;
  renderRow?: (args: FileTreeRowRenderArgs) => ReactNode;
  renderHeader?: (ctx: FileTreeHeaderContext) => ReactNode;
  renderContextMenu?: (ctx: FileTreeContextMenuContext) => ReactNode;
  renderEmpty?: (ctx: FileTreeEmptyContext) => ReactNode;
  renderLoading?: () => ReactNode;
  renderDeleteConfirm?: (ctx: FileTreeDeleteConfirmContext) => ReactNode;

  // ── Header config ──
  header?: boolean;                                           // default true
  title?: string;
  showNewFile?: boolean;                                      // default true
  showNewFolder?: boolean;                                    // default true
  showRefresh?: boolean;                                      // default true
  showCollapseAll?: boolean;                                  // default true

  // ── Context-menu config ──
  contextMenu?: boolean;                                      // default true
  contextMenuActions?: {                                      // per-action gate within the default menu
    open?: boolean;
    newFile?: boolean;
    newFolder?: boolean;
    rename?: boolean;
    delete?: boolean;
    refresh?: boolean;
  };

  // ── Behavior ──
  showHidden?: boolean;                                       // default false
  isHidden?: (node: FsNode) => boolean;                       // default: name.startsWith('.')
  sortNodes?: ((a: FsNode, b: FsNode) => number) | false;     // false = preserve consumer order
  indentGuides?: boolean;                                     // default true
  rowHeight?: number;                                         // default 28 (px)
  indent?: number;                                            // default 18 (px per level)

  // ── Confirmation ──
  confirmDelete?: boolean;                                    // default true

  // ── DnD ──
  enableInternalDrag?: boolean;                               // default true
  enableExternalDrop?: boolean;                               // default true

  // ── Virtualization ──
  virtualize?: FileTreeVirtualizeMode;                        // default 'auto'
  virtualizeThreshold?: number;                               // default 200

  // ── Polymorphic ──
  className?: string;
  style?: CSSProperties;

  // ── Imperative handle ──
  ref?: Ref<FileTreeHandle>;

  // ── i18n labels ──
  labels?: Partial<{
    title: string;                                            // header title fallback
    newFile: string;                                          // "New File"
    newFolder: string;                                        // "New Folder"
    refresh: string;                                          // "Refresh"
    collapseAll: string;                                      // "Collapse All"
    contextOpen: string;                                      // "Open"
    contextNewFile: string;
    contextNewFolder: string;
    contextRename: string;                                    // "Rename"
    contextDelete: string;                                    // "Delete"
    contextRefresh: string;                                   // "Refresh"
    deleteConfirmTitle: string;                               // "Delete {n} item(s)?"
    deleteConfirmDescription: string;                         // "This action cannot be undone."
    deleteConfirmAction: string;                              // "Delete"
    deleteConfirmCancel: string;                              // "Cancel"
    emptyTitle: string;                                       // "No items"
    loading: string;                                          // "Loading…"
    externalDropOverlay: string;                              // "Drop files here"
    nodeCount: string;                                        // "{n} item(s)"
  }>;
}
```

### Exported names — `index.ts`

```ts
export { FileTree } from "./file-tree";
export { FileTreeHeader } from "./parts/file-tree-header";
export { FileTreeNewFileButton } from "./parts/file-tree-new-file-button";
export { FileTreeNewFolderButton } from "./parts/file-tree-new-folder-button";
export { FileTreeRefreshButton } from "./parts/file-tree-refresh-button";
export { FileTreeCollapseAllButton } from "./parts/file-tree-collapse-all-button";
export { useFileTree } from "./hooks/use-file-tree-context";
export { mergeLoadedChildren } from "./lib/tree-utils";
export { iconForExtension } from "./lib/icons";
export type {
  FsNode,
  FsNodeType,
  FileTreeProps,
  FileTreeHandle,
  FileTreeState,
  FileTreeActions,
  FileTreeRow,
  FileTreeSelectionMode,
  FileTreeDropPosition,
  FileTreeVirtualizeMode,
  FileTreeOpenArgs,
  FileTreeCreateArgs,
  FileTreeRenameArgs,
  FileTreeDeleteArgs,
  FileTreeMoveArgs,
  FileTreeRefreshArgs,
  FileTreeExternalDropArgs,
  FileTreeLoadChildrenArgs,
  FileTreeSelectionChangeArgs,
  FileTreeExpandedChangeArgs,
  FileTreeValidateRenameArgs,
  FileTreeIconForNodeArgs,
  FileTreeContextMenuItem,
  FileTreeHeaderContext,
  FileTreeContextMenuContext,
  FileTreeEmptyContext,
  FileTreeRowRenderArgs,
  FileTreeDeleteConfirmContext,
} from "./types";
```

The `useFileTree()` hook is the public entry point for consumers building a custom header / chrome. Returns `{ state, actions, ...config }` from the internal Context. Throws if called outside a `<FileTree>`.

## File-by-file plan

```
src/registry/components/navigation/file-tree/
├── file-tree.tsx                        — top-level orchestrator ("use client")
├── parts/
│   ├── file-tree-row.tsx                — single row (icon + indent + chevron + label + adornments)
│   ├── file-tree-row-list.tsx           — virtualized scroll surface
│   ├── file-tree-header.tsx             — default header strip
│   ├── file-tree-new-file-button.tsx    — "+ File" header button
│   ├── file-tree-new-folder-button.tsx  — "+ Folder" header button
│   ├── file-tree-refresh-button.tsx     — refresh button
│   ├── file-tree-collapse-all-button.tsx — collapse-all button
│   ├── file-tree-context-menu.tsx       — right-click menu (shadcn ContextMenu wrapper)
│   ├── file-tree-rename-input.tsx       — inline rename <input> with validation
│   ├── file-tree-empty.tsx              — empty-state default
│   ├── file-tree-loading.tsx            — skeleton rows
│   ├── file-tree-drag-overlay.tsx       — "Drop files here" external-drop overlay
│   └── file-tree-delete-confirm.tsx     — default AlertDialog wrapper
├── hooks/
│   ├── use-file-tree-context.ts         — Context provider + `useFileTree()` consumer
│   ├── use-tree-state.ts                — controlled/uncontrolled expansion + selection state
│   ├── use-tree-flatten.ts              — visible-row flattening (memoized)
│   ├── use-tree-keyboard.ts             — keyboard handlers (↑/↓/←/→/Enter/Space/F2/Delete/Esc/Home/End/Cmd+A)
│   ├── use-tree-drag.ts                 — internal drag state + external-drop wiring
│   ├── use-tree-virtual.ts              — TanStack Virtual integration with auto-threshold
│   └── use-lazy-load.ts                 — onLoadChildren orchestration + loading state
├── lib/
│   ├── icons.ts                         — extension→Lucide-icon map + folder-icon helper
│   ├── tree-utils.ts                    — getDescendants, getParents, sortDefault, findNode
│   └── validation.ts                    — isCycle(srcId, targetId, nodeIndex), isSelfDrop, isLegalDrop
├── types.ts                             — public types (above)
├── dummy-data.ts                        — ~40-node Next.js project shape
├── demo.tsx                             — docs-site demo
├── usage.tsx                            — docs-site usage notes
├── meta.ts                              — registry meta
└── index.ts                             — barrel exports
```

### `file-tree.tsx` (top-level orchestrator, ~280 LOC)

- Marked `"use client"` (uses refs, keyboard, DnD).
- Wraps the entire surface in `<FileTreeContext.Provider>` so parts and `useFileTree()` work.
- Calls `useTreeState`, `useTreeFlatten`, `useLazyLoad` to derive visible rows.
- Renders: `[header (if header !== false)] + [virtualized row list OR empty/loading state]`, and conditionally the external-drop overlay during drag-from-OS.
- Wires keyboard handlers via `useTreeKeyboard` on the outer root (`role="tree"`, `tabIndex={0}`).
- Forwards `ref` to expose the imperative `FileTreeHandle`.
- Soft-validates `nodes` (cycles, missing parents, dup ids) on mount via `lib/validation.ts`; warns in dev.

### `parts/file-tree-row.tsx` (~140 LOC)

- Renders one row at a fixed `rowHeight`. Layout: `[depth-indent] [chevron OR spacer] [icon] [label OR rename-input] [grow-spacer] [trailing-adornment slot]`.
- `role="treeitem"` with `aria-level`, `aria-expanded` (folders only), `aria-selected`, `aria-setsize`, `aria-posinset`.
- Click: toggles selection (replaces in single, modifies in multi via Cmd/Ctrl+click + Shift+click range).
- Click on chevron: toggles expansion only, not selection.
- Double-click: file → fires `onOpen`; folder → toggles expansion (matches Q17).
- Drag handlers (HTML5 native): `draggable`, `onDragStart` (set `dataTransfer` payload), `onDragOver` / `onDragLeave` (compute position via y-fraction of `boundingClientRect`), `onDrop`.
- During hover-drop: visual indicator via absolute-positioned `<div>` with `--ring` (ring for `inside`, line for `before`/`after`).
- Indent guides: a thin `<div>` per ancestor depth, positioned absolutely within the row.

### `parts/file-tree-row-list.tsx` (~110 LOC)

- Owns the scroll container.
- Picks `mode: 'virtual' | 'naive'` based on `virtualize` prop + visible-row count vs `virtualizeThreshold`.
- Virtual mode: `useVirtualizer` from `@tanstack/react-virtual` with fixed `rowHeight`. Total height = `rows.length * rowHeight`. Renders `getVirtualItems()` rows absolutely positioned.
- Naive mode: maps rows directly. Used below threshold.
- Both modes render `<FileTreeRow>` with the same props — virtualization is invisible to row internals.

### `parts/file-tree-header.tsx` (~80 LOC)

- Default header layout: `[title (h2 with `JetBrains Mono` for the count)] [grow] [+File] [+Folder] [Refresh] [CollapseAll]`.
- Each button gated by its `show*` prop AND its corresponding callback being wired (showing a button without a handler is useless).
- Reads from `useFileTree()` so it's standalone-callable inside a custom `renderHeader`.
- Delegates click handlers to `actions.triggerCreate`, `actions.refresh`, `actions.collapseAll`.
- Each header button wrapped in shadcn `<Tooltip>` exposing the corresponding `labels.*` text — covers icon-only discoverability without bloating the layout.

### `parts/file-tree-context-menu.tsx` (~120 LOC)

- Wraps the row-list area in a shadcn `<ContextMenu>`.
- On `onContextMenu`, identifies the target row (or null for empty space), composes `defaultActions` array per node type and the `contextMenuActions` gate prop.
- Disables `New File` / `New Folder` items when target is a file (creation is folder-scoped); falls back to root when right-click hits empty space.
- "Delete" routes through `<FileTreeDeleteConfirm>` if `confirmDelete` is `true`.
- If `renderContextMenu` is provided, calls it with `FileTreeContextMenuContext`; else renders default menu items.

### `parts/file-tree-rename-input.tsx` (~70 LOC)

- Renders an `<input>` styled to match the row label; auto-focuses + selects the basename (text before final `.` for files; whole name for folders).
- Enter commits → calls `validateRename` if provided → if returns `string`, shows inline error, doesn't fire `onRename`. Else fires `onRename({ id, node, nextName })` and exits rename mode.
- Esc cancels (no callback).
- Blur commits (same as Enter).

### `parts/file-tree-drag-overlay.tsx` (~50 LOC)

- Absolutely positioned full-bleed overlay shown only during drag-from-OS.
- Visible on `dragenter` over the root when `e.dataTransfer.types.includes('Files')`; hidden on `dragleave` (count ref to track nested enters/leaves) or `drop`.
- Renders a centered `[FileUp icon] [labels.externalDropOverlay]` over a translucent backdrop.

### `parts/file-tree-delete-confirm.tsx` (~40 LOC)

- Wraps shadcn `<AlertDialog>` with default copy keyed off `labels`.
- Description interpolates count + sample names ("Delete `report.pdf` and 3 other items?").
- Confirm → `onConfirm` (consumer's `onDelete` fires); Cancel → `onCancel`.

### Trivial parts (one-liners)

The following parts are thin wrappers that read from `useFileTree()` and dispatch the matching action. Each is ~30 LOC:

- **`parts/file-tree-new-file-button.tsx`** — shadcn `<Button variant="ghost" size="icon">` with a `<FilePlus>` lucide icon, wrapped in `<Tooltip>` with `labels.newFile`. On click: `actions.triggerCreate(null, 'file')` (or scoped to the focused folder if one is focused). Renders `null` if `showNewFile === false`.
- **`parts/file-tree-new-folder-button.tsx`** — same shape, `<FolderPlus>` icon, `labels.newFolder`. On click: `actions.triggerCreate(null, 'folder')` (folder-scoped if focused). Renders `null` if `showNewFolder === false`.
- **`parts/file-tree-refresh-button.tsx`** — `<RefreshCw>` icon, `labels.refresh`. On click: `actions.refresh(null)` (whole-tree refresh from header). Renders `null` if `showRefresh === false`.
- **`parts/file-tree-collapse-all-button.tsx`** — `<ChevronsDownUp>` icon, `labels.collapseAll`. On click: `actions.collapseAll()`. Renders `null` if `showCollapseAll === false`.
- **`parts/file-tree-empty.tsx`** — centered placeholder: small icon + `labels.emptyTitle` (defaults to `"No items"`) + optional `<FileTreeNewFileButton>` / `<FileTreeNewFolderButton>` row when those buttons are enabled. Replaceable wholesale via `renderEmpty`.
- **`parts/file-tree-loading.tsx`** — three to five height-locked skeleton rows (`bg-muted animate-pulse` divs). Replaceable via `renderLoading`. Uses Tailwind only — no extra shadcn primitive needed.

### `hooks/use-file-tree-context.ts` (~60 LOC)

```ts
export interface FileTreeContextValue {
  state: FileTreeState;
  actions: FileTreeActions;
  // header config so standalone parts read flags correctly:
  showNewFile: boolean;
  showNewFolder: boolean;
  showRefresh: boolean;
  showCollapseAll: boolean;
  totalCount: number;
  visibleCount: number;
  title?: string;
  labels: Required<NonNullable<FileTreeProps["labels"]>>;
}

export const FileTreeContext = createContext<FileTreeContextValue | null>(null);

export function useFileTree(): FileTreeContextValue {
  const ctx = useContext(FileTreeContext);
  if (!ctx) {
    throw new Error("useFileTree() must be called inside <FileTree>");
  }
  return ctx;
}
```

### `hooks/use-tree-state.ts` (~140 LOC)

Manages controlled-or-uncontrolled state for `expandedIds`, `selectedIds`, `focusedId`, `renamingId`, `loadingFolderIds`, plus internal `selectionAnchorId` (used for Shift+click range selection — anchor is the last node clicked WITHOUT shift; range goes anchor → click). Uses the standard "controlled-fallback-to-internal" pattern:

```ts
const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
  defaultExpandedIds ?? deriveRootIds(nodes)
);
const expandedIds = controlledExpandedIds ?? internalExpanded;
const setExpanded = useCallback((next: Set<string>) => {
  if (controlledExpandedIds === undefined) setInternalExpanded(next);
  onExpandedChange?.({ ids: next });
}, [controlledExpandedIds, onExpandedChange]);
```

Same pattern for selection. Rename + focus + loading-folders are always internal (no controlled story).

### `hooks/use-tree-flatten.ts` (~90 LOC)

Walks the tree, applies `sortNodes` + `isHidden` per level, produces `FileTreeRow[]` for visible rows only. Memoized on `[nodes, expandedIds, selectedIds, focusedId, sortNodes, showHidden, isHidden, loadingFolderIds]`. Output drives the virtualizer.

### `hooks/use-tree-keyboard.ts` (~140 LOC)

Returns event handlers for the `<FileTree>` root. Reads visible rows + focused index from Context. Map:

| Key | Action |
|---|---|
| `↑` / `↓` | Move focus to prev/next visible row |
| `→` | If focused folder is collapsed → expand. Else → move focus to first child |
| `←` | If focused folder is expanded → collapse. Else → move focus to parent |
| `Enter` | File: `onOpen({ node })`. Folder: toggle expansion. |
| `Space` | Toggle row selection (additive in multi, replace in single) |
| `F2` | Start rename on focused node |
| `Delete` | Trigger delete on selected ids (with confirm if enabled) |
| `Esc` | Cancel rename if active; else clear selection |
| `Cmd/Ctrl+A` | Select all *visible* rows (multi mode only) |
| `Home` / `End` | Focus first / last visible row |

Cmd/Ctrl detection via `event.metaKey || event.ctrlKey`. macOS uses `metaKey` per convention; the `||` covers both.

### `hooks/use-tree-drag.ts` (~150 LOC)

Internal drag (within tree):

- `onDragStart(rowId)`: if rowId is in `selectedIds` and selectionMode=multi, payload = `selectedIds`. Else, replace selection with `rowId` and payload = `[rowId]`.
- `onDragOver(rowId)`: compute drop position via y-fraction; pre-validate via `lib/validation.ts` (cycle, self-drop). If invalid → `dropEffect = 'none'` and visual indicator turns destructive.
- `onDrop(rowId)`: if valid, fire `onMove({ ids, targetId, position })`.

External drag (OS files):

- Outer root listens for `dragenter` with `e.dataTransfer.types.includes('Files')` → opens overlay (refcount nested enters/leaves).
- `onDrop`: extract `Array.from(e.dataTransfer.files)`, identify target row (or null for root), fire `onExternalDrop({ files, targetId })`.

### `hooks/use-tree-virtual.ts` (~60 LOC)

Picks mode based on `virtualize` prop and row count. Returns `{ mode, virtualizer, scrollContainerRef }`. When `mode === 'naive'`, virtualizer is undefined and the row-list maps directly.

### `hooks/use-lazy-load.ts` (~80 LOC)

Listens for expand events on folders with `children === undefined`. Adds id to `loadingFolderIds`, calls `onLoadChildren({ nodeId, node })`, removes id on settle. Errors → store per-id error; render error row with retry button (under the folder).

The merged children are NOT injected by this hook — consumer is responsible for updating `nodes` based on the resolved promise. The hook only manages loading-state + error-state UI.

### `lib/icons.ts` (~80 LOC)

Default extension→category map (lucide icons):

| Pattern | Lucide icon |
|---|---|
| `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` | `<FileCode>` |
| `.json`, `.jsonc` | `<FileJson>` |
| `.md`, `.mdx`, `.markdown`, `.txt`, `.rtf` | `<FileText>` |
| `.html`, `.htm`, `.xml` | `<FileCode2>` |
| `.css`, `.scss`, `.sass`, `.less` | `<FileCode>` |
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.ico`, `.svg` | `<FileImage>` |
| `.pdf` | `<FilePdf>` *(falls back to `<FileText>` if not in installed lucide version)* |
| `.zip`, `.tar`, `.gz`, `.7z`, `.rar` | `<FileArchive>` |
| `.mp4`, `.mov`, `.webm`, `.mkv`, `.avi` | `<FileVideo>` |
| `.mp3`, `.wav`, `.ogg`, `.flac` | `<FileAudio>` |
| `.py`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.swift`, `.cpp`, `.c`, `.h`, `.cs`, `.php`, `.lua` | `<FileCode>` |
| `.lock`, `.gitignore`, `.gitattributes`, `.env`, `.editorconfig` | `<File>` (de-emphasized) |
| _default_ | `<File>` |

Folders: `<Folder>` (closed), `<FolderOpen>` (expanded). Loading folder: `<Folder>` with a small `<Loader2 className="animate-spin">` overlay.

Public helper: `iconForExtension(ext: string): ReactNode`. Used internally; also exported as `iconForExtension` for consumers building custom icon registries that fall back to defaults.

### `lib/tree-utils.ts` (~150 LOC)

```ts
export function indexNodes(nodes: FsNode[]): Map<string, FsNode>;
export function getDescendantIds(nodeId: string, index: Map<string, FsNode>): Set<string>;
export function getParentChain(nodeId: string, index: Map<string, FsNode>): FsNode[];
export function findNode(id: string, nodes: FsNode[]): FsNode | undefined;
export function defaultSort(a: FsNode, b: FsNode): number;  // folders first, then alpha
export function deriveRootExpandedIds(nodes: FsNode[]): Set<string>;  // every top-level folder
export function getNodeExtension(node: FsNode): string;     // node.ext ?? derive from name

/**
 * Public consumer helper for merging lazy-loaded children into the tree
 * after `onLoadChildren` resolves. Returns a new top-level array.
 *
 * Usage in consumer code:
 *   onLoadChildren={async ({ nodeId }) => {
 *     const kids = await fs.list(nodeId);
 *     setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
 *     return kids;
 *   }}
 */
export function mergeLoadedChildren(
  nodes: FsNode[],
  parentId: string,
  children: FsNode[]
): FsNode[];
```

`mergeLoadedChildren` is exported from the barrel for consumer use. Reduces the most common friction point of controlled-data lazy loading (immutable splice into nested children).

### `lib/validation.ts` (~50 LOC)

```ts
export function isSelfDrop(srcIds: string[], targetId: string | null): boolean;
export function isCycle(srcIds: string[], targetId: string | null, index: Map<string, FsNode>): boolean;
export function isLegalDrop(args: {
  srcIds: string[];
  targetId: string | null;
  position: FileTreeDropPosition;
  index: Map<string, FsNode>;
}): boolean;
```

`isCycle` walks the parent chain of `targetId` and returns true if any ancestor is in `srcIds`.

### `dummy-data.ts` (~140 LOC)

A small Next.js project shape, ~40 nodes:

```
my-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   └── header.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── types/
│       └── index.d.ts
├── public/
│   ├── favicon.ico
│   └── images/
│       └── hero.png
├── package.json
├── tsconfig.json
├── next.config.ts
├── README.md
└── .gitignore
```

Plus a few extras for icon coverage: `archive.zip`, `data.json`, `script.py`, `style.scss`, `notes.md`, `video.mp4`, `audio.mp3`. Exported as `dummyFsNodes` (top-level array) plus `largeDummyFsNodes` (~250 nodes — generated programmatically — to demo virtualization).

### `demo.tsx` (~180 LOC)

Six demo cards in a grid:

1. **Read-only tree** — basic display with `onOpen` toast.
2. **Full CRUD** — controlled state + all callbacks wired (uses `useState` for `nodes` mutation).
3. **Lazy-load** — root nodes only; `onLoadChildren` simulates fetch (200 ms timeout, returns mock children).
4. **Multi-select + bulk delete** — `selectionMode="multi"`; bulk delete callback removes N nodes.
5. **Custom icons** — overrides `iconForNode` with a small custom set.
6. **Virtualized large tree** — uses `largeDummyFsNodes`; renders 250 nodes; smooth scroll.

### `usage.tsx` (~120 LOC)

Concise inline notes covering: data shape, controlled vs uncontrolled, lazy loading, icon overrides, slot replacements, keyboard map, accessibility, and known limitations (no cut/copy/paste, no search). Lists 3 common gotchas: forgetting to update `nodes` after `onMove`, not handling `onLoadChildren` rejection, and trying to drop a folder into itself.

### `meta.ts`

```ts
import type { ComponentMeta } from "@/registry/types";

export const meta: ComponentMeta = {
  slug: "file-tree",
  name: "File Tree",
  category: "navigation",
  description:
    "A VS Code-style hierarchical file tree with format-aware icons, full CRUD, drag-and-drop, lazy children, and multi-select.",
  status: "alpha",
  version: "0.1.0",
  added: "2026-05-10",
  updated: "2026-05-10",
  tags: ["tree", "navigation", "filesystem", "explorer", "hierarchy"],
  dependencies: {
    npm: ["lucide-react", "@tanstack/react-virtual"],
    shadcn: ["context-menu", "alert-dialog", "button", "tooltip"],
  },
  // ... etc per existing meta convention
};
```

`validate-meta-deps` will be re-run after the implementation lands to confirm declared deps match actual imports.

### `index.ts`

Per the exported-names section above. Re-exports the component, the standalone parts, the `useFileTree()` hook, and all public types.

## Dependencies

### npm (added to project root `package.json`)

- `@tanstack/react-virtual@^3` — windowed virtualization. Pin to `^3.x`. `pnpm add @tanstack/react-virtual` from project root before scaffolding.

### Already present (no install)

- `react@^19`, `react-dom@^19`
- `lucide-react` (project-wide icon set)
- `@radix-ui/react-context-menu` (via shadcn primitive)
- `@radix-ui/react-alert-dialog` (via shadcn primitive)
- `@radix-ui/react-tooltip` (via shadcn primitive)
- `clsx` / `tailwind-merge` (via `cn()` in `@/lib/utils`)

### shadcn primitives (added before code if missing)

- `pnpm dlx shadcn@latest add context-menu` (verify presence)
- `pnpm dlx shadcn@latest add alert-dialog` (verify presence)
- `pnpm dlx shadcn@latest add button` (verify presence)
- `pnpm dlx shadcn@latest add tooltip` (verify presence)

### Internal registry deps

None. `file-tree` is a standalone primitive; no other registry components composed in.

## Composition pattern

**Controlled-data + render-props slots + Context for parts.**

- **Controlled-data primary surface** — consumer owns `nodes`. Component never mutates the array. Every operation fires a callback; consumer rewrites state. Aligns with `data-table`, `properties-form` precedents.
- **Slot props for replaceable surfaces** — `renderHeader`, `renderRow`, `renderContextMenu`, `renderEmpty`, `renderLoading`, `renderDeleteConfirm`. Each receives a typed context object with `state`, `actions`, and the data needed for that slot.
- **Standalone parts via Context** — `<FileTreeHeader>`, `<FileTreeNewFileButton>`, `<FileTreeNewFolderButton>`, `<FileTreeRefreshButton>`, `<FileTreeCollapseAllButton>` read from `FileTreeContext`. Used inside a custom `renderHeader` to assemble subsets without writing all the wiring. Mirrors pdf-viewer's `<PdfPageNav>` etc. pattern.
- **Imperative ref for advanced control** — `FileTreeHandle` exposes `state` + `actions` for consumers that need to call `expandAll()` / `select(id)` / `startRename(id)` from outside the tree. Optional; not required for normal use.

No render-prop children pattern (`<FileTree>{(state) => ...}</FileTree>`) — slots cover the same need with better naming.

## Client vs server

**`"use client"` is required at `file-tree.tsx`.** Reasons:

- Refs (scroll container, input focus, drop-overlay refcount).
- Keyboard events (focus management, arrow nav).
- DnD (`dragstart` etc. all client-only).
- TanStack Virtual hooks (use `useLayoutEffect`, client-only).
- Internal state (expansion, selection, rename, focus, loading).

A pure-server "render-only" subset is not feasible without losing core features. Consumers SSR-render the parent page; the tree itself hydrates on client.

## Edge cases

| Case | Behavior |
|---|---|
| `nodes === []` (empty data, not loading) | Render `renderEmpty` slot or default empty-state. Header still renders if enabled. |
| `loading === true` | Render `renderLoading` slot or default skeleton (3–5 ghost rows). Header still renders if enabled. |
| Folder with `children === undefined` | Show chevron; on first expand, call `onLoadChildren`, render inline spinner; on resolve, consumer updates `nodes` and tree re-renders. |
| Folder with `children === []` | No chevron OR disabled chevron. On expand-attempt, render inline `(empty)` placeholder. Decision: **show a chevron** (still expandable conceptually), and the placeholder appears as the only "child row" when expanded. |
| `onLoadChildren` rejects | Render an inline error row under the folder with the error message + retry button. Retry re-fires `onLoadChildren`. |
| Cycle detected during drag | `dropEffect = 'none'`; drop indicator turns `--destructive`; release → no `onMove`. |
| Self-drop (drag a node onto itself with `position='inside'`) | Same as cycle. |
| Drop on `before` / `after` of self | Same as cycle (no-op move). |
| Multi-select drag where some selected nodes are descendants of the target | Reject the entire drop (cycle for at least one). Treat as illegal. |
| Drag-from-OS to root (drop on empty whitespace) | `targetId = null`; `onExternalDrop({ files, targetId: null })`. |
| Drag-from-OS to a file row | `targetId = node's parentId` (treat the file's parent folder as target). Or if the file is at root, `targetId = null`. |
| Rename to empty string | `validateRename` (if provided) returns error; commit blocked. If no `validateRename`, default to blocking empty names with a hard-coded error. |
| Rename to existing sibling name | Consumer-defined via `validateRename`; default behavior allows it (consumer's `onRename` decides). |
| Click outside during rename | Commits the rename (matches VSCode and most desktop OS conventions). |
| Long node names | Truncate with `text-overflow: ellipsis`; full name in tooltip on hover. |
| RTL locale | Swap chevron direction (right-pointing for collapsed in RTL); indent flows right-to-left; tested in plan stage. |
| `nodes` array changes parent of a focused node | Focus follows the node by id (stays valid as long as id persists). If id disappears, focus clears. |
| Selected ids no longer present in `nodes` | Quietly drop them from the internal selection set on next render. |
| Rapid expand-all on a 5000-node tree | Virtualization handles render; flatten step is O(n) but ≤ ~50ms at 5000 nodes. Acceptable. |
| Deep nesting (>20 levels) | Indent saturates at `maxIndent = 200px` to prevent runaway horizontal overflow. Configurable via `indent` prop (one specific override is to set `indent={0}` for a flat virtual file list — RC menu still works). |
| Auto-scroll during drag | When dragging a row near the top/bottom 20px of the scroll container, the list scrolls in that direction at `~200 px/sec`. Implemented in `use-tree-drag.ts` via `requestAnimationFrame` loop activated on `dragover` near the edge; deactivated on `dragleave` / `drop` / `dragend`. |
| First arrow-key press with no focused node | If `focusedId === null`, ↓ / ↑ / Home / End all set focus to the first visible row. Subsequent arrows behave normally. |
| Shift+click without prior selection | If `selectionAnchorId === null`, the Shift+click acts as a normal click (sets the anchor, single-selects). Subsequent Shift+clicks then range-select from that anchor. |

## Accessibility

- **`role="tree"`** on the outer container. Single tab stop into the tree (`tabIndex={0}`); arrow keys move focus among rows.
- **`role="treeitem"`** on every row. Per-row attributes:
  - `aria-level={depth + 1}` (1-based)
  - `aria-setsize={N}` (siblings at this level)
  - `aria-posinset={i+1}` (1-based)
  - `aria-expanded={true|false}` on folders only
  - `aria-selected={true|false}` (always set explicitly when selectable)
- **Focus management** — single managed focus per tree; the focused row has `tabIndex={0}`, all others have `tabIndex={-1}`. Focus follows arrow nav.
- **Live-region announcements** — `<div role="status" aria-live="polite" className="sr-only">` reads on rename ("Renamed `old` to `new`"), delete ("Deleted N items"), move ("Moved N items"), and load-children resolve ("Loaded N items in `Folder`").
- **Keyboard map** as documented in `use-tree-keyboard.ts`. Documented in usage.tsx.
- **Focus-visible rings** on every interactive element using `--ring`. No `outline: none` without a replacement.
- **Contrast ≥ AA** in both themes:
  - Selected row background: `bg-secondary` (verified ≥ AA against `--foreground`).
  - Focus ring: `ring-2 ring-ring ring-offset-2 ring-offset-background`.
  - Indent guides: `--border` at 50% opacity (decorative; not on the contrast path).
- **Screen-reader testing target** — VoiceOver (macOS Safari) + NVDA (Windows Firefox). Verified during smoke pass.
- **Lighthouse a11y target** — ≥ 95 on the demo page.
- **No tabbable elements inside rows** — rename input is the only exception, and only while in rename mode (rename mode breaks the `tabIndex={0}` invariant temporarily; recovered on commit/cancel).

## Verification checklist

Before push to master:

- [ ] `pnpm tsc --noEmit` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm validate:meta-deps` — 39/39 (38 existing + file-tree) clean
- [ ] `pnpm build` — succeeds
- [ ] Demo renders correctly at `/components/file-tree` in dev mode
- [ ] All 6 demo modes interactive without errors
- [ ] `registry.json` updated with `file-tree` base + `file-tree-fixtures` items
- [ ] `pnpm registry:build` regenerates `public/r/file-tree.json` (and fixtures)
- [ ] Manifest registered in `src/registry/manifest.ts`
- [ ] Smoke harness pass — `pnpm dlx shadcn@4.6.0 add @ilinxa/file-tree` from `e:/tmp/ilinxa-smoke-consumer/` + post-install `pnpm tsc --noEmit` clean
- [ ] GATE 3 spot-check review authored at `docs/procomps/file-tree-procomp/reviews/2026-05-10-v0.1.0-spotcheck.md`; verdict ≥ "Pass with follow-ups"
- [ ] STATUS.md updated (Components table + Active queue + Recent activity)
- [ ] `categories.ts` updated with new `navigation` category

## Risks & alternatives

### Risks

- **TanStack Virtual integration with rename mode** — when a row enters rename mode it temporarily contains an `<input>` (different focus behavior); the virtualizer's row reuse could break focus. **Mitigation:** key virtualized row by `node.id` (not virtualizer index) so React preserves the input element across re-orderings.
- **HTML5 native DnD edge cases** — `dragleave` fires nested-element transitions, leading to flicker. **Mitigation:** ref-counted enter/leave (well-known pattern); fall back to `dragend` for cleanup.
- **Cycle-detection cost** — `isCycle` walks the parent chain on every `dragover`, which fires ~60 times per second. **Mitigation:** memoize the result by `(srcIds-key, targetId)`; cache cleared on drag start.
- **Deep nesting visual collapse** — indent saturation at ~10–12 levels makes deeply nested trees visually flat. **Mitigation:** indent guide preserves visual depth even when text indent saturates; document `maxIndent` behavior.
- **Lazy-load + sort interaction** — when `onLoadChildren` resolves and consumer merges the new children, default sort runs on next render. If consumer's order matters, they pass `sortNodes={false}`. Documented in guide.md.

### Alternatives considered

- **`react-arborist`** — capable headless tree library. Rejected: pulls a peer-dep tree, has its own controlled-data conventions that wouldn't match our object-shape callback style, and we'd own a wrapper around it forever. Building once on top of Lucide + TanStack Virtual + our own state is cleaner and matches the rest of the library's style.
- **`react-complex-tree`** — rich feature set including DnD and rename. Rejected for similar reasons + its DOM structure isn't compatible with our token system out of the box.
- **`dnd-kit`** for DnD — better touch + a11y. Deferred to v0.2.0 if consumer demand surfaces (description Q5).
- **`@radix-ui/react-tree`** — does not exist. Closest Radix primitive is `Collapsible`, which doesn't recurse.
- **Render-prop `children`** instead of slot props (`renderRow`, `renderHeader`) — equivalent in capability but slot props are easier to type and discover. Slot pattern matches `pdf-viewer`'s `renderToolbar` / `renderContextMenu` / `renderPasswordPrompt` precedent.
- **Mutable internal model** instead of controlled-data — simpler API at the cost of consumer ownership. Rejected because every real consumer eventually needs to reflect external changes (network sync, undo/redo, external rename), which mutable-internal can't model cleanly.

## Implementation order

Ordered to keep tsc + lint clean at every step. Each step compiles before the next begins.

1. Add `navigation` category to `categories.ts` (with `ComponentCategorySlug` + `CATEGORIES` updated).
2. `pnpm add @tanstack/react-virtual` at project root.
3. Verify shadcn primitives present (`context-menu`, `alert-dialog`, `button`, `tooltip`); add any missing.
4. `pnpm new:component navigation/file-tree` — scaffolds from `_template/_template/`.
5. Author `types.ts` with all public types from the Final API section.
6. Author `lib/icons.ts` with the extension→icon map and `iconForExtension` helper.
7. Author `lib/tree-utils.ts` with the indexNodes / getDescendantIds / getParentChain / findNode / defaultSort / deriveRootExpandedIds / getNodeExtension utilities.
8. Author `lib/validation.ts` with isCycle / isSelfDrop / isLegalDrop.
9. Author `dummy-data.ts` (small Next.js project + large 250-node generator).
10. Author `hooks/use-file-tree-context.ts` (Context + `useFileTree`).
11. Author `hooks/use-tree-state.ts` (controlled+uncontrolled state).
12. Author `hooks/use-tree-flatten.ts` (visible-row flattening).
13. Author `hooks/use-lazy-load.ts` (loading-state orchestration).
14. Author `hooks/use-tree-virtual.ts` (TanStack Virtual mode-pick).
15. Author `parts/file-tree-row.tsx` (single row + click + double-click + drag handlers).
16. Author `parts/file-tree-rename-input.tsx` (inline rename).
17. Author `parts/file-tree-row-list.tsx` (virtualized vs naive row list).
18. Author `parts/file-tree-empty.tsx` + `parts/file-tree-loading.tsx`.
19. Author `parts/file-tree-drag-overlay.tsx` (external-drop overlay).
20. Author `parts/file-tree-delete-confirm.tsx` (default AlertDialog).
21. Author `hooks/use-tree-drag.ts` (internal + external drag wiring).
22. Author `hooks/use-tree-keyboard.ts` (keyboard map).
23. Author `parts/file-tree-context-menu.tsx` (RC menu).
24. Author standalone parts: `file-tree-header.tsx`, `file-tree-new-file-button.tsx`, `file-tree-new-folder-button.tsx`, `file-tree-refresh-button.tsx`, `file-tree-collapse-all-button.tsx`.
25. Author `file-tree.tsx` (top-level orchestrator) — wires everything together via Context.
26. Author `meta.ts` with full `ComponentMeta`.
27. Author `index.ts` barrel exports.
28. Author `demo.tsx` (six demo cards).
29. Author `usage.tsx` (concise inline notes).
30. Register in `src/registry/manifest.ts` (3-line edit per scaffolder output).
31. Add to `registry.json` — base item + `file-tree-fixtures` item.
32. Run `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps && pnpm build`.
33. Run `pnpm registry:build` and spot-check `public/r/file-tree.json`.
34. Run smoke harness pass.
35. Author guide.md (`file-tree-procomp-guide.md`).
36. Author GATE 3 spot-check review.
37. Update STATUS.md (Components table row, Active queue, Recent activity).
38. Commit + push to master (Vercel auto-deploys).

---

> **Sign-off needed before scaffolding (`pnpm new:component`).** Reviewer should validate: (1) the `FileTreeProps` surface is complete and the types match what they want consumers to write, (2) the file-by-file plan covers the right separation of concerns, (3) TanStack Virtual is acceptable as a new project peer dep, and (4) the `navigation` category addition is OK. Push back on any specific decision OR confirm to proceed.
