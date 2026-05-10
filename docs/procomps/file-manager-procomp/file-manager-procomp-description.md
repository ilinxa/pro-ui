# file-manager — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Greenfield component.** Not a migration. Second component in the "file-system" family — first was [`file-tree`](../file-tree-procomp/) (shipped 2026-05-10, the sidebar primitive). `file-manager` is the Mac-Finder-style **content pane** that pairs with `file-tree`: where the tree handles hierarchical nav, the manager handles "what's in this folder right now, let me act on it." Reuses the `FsNode` data shape locked by `file-tree`.

## Problem

Every internal tool that lets users browse + manipulate a flat folder of items — asset libraries, document workspaces, attachment managers, digital-asset-management (DAM) tools, media organizers, ticket-attachment viewers, file-upload UIs, S3-bucket explorers — needs the same surface: **a Mac-Finder-style content view of the current folder, with multi-select, copy/cut/paste, rename, delete, view-mode toggle, and drag-drop, themed to the app**.

Today's options all fail one way:

- **Roll your own with a CSS grid** — works for read-only display; falls apart the moment you need multi-select with shift+click range, marquee (drag-rectangle) selection, keyboard nav, breadcrumbs, view-mode toggle, sort, clipboard semantics, drag-and-drop, or rename UX. Every team rebuilds the same surface with subtle bugs.
- **Use a generic `<Table>` or `<DataGrid>`** — these are tabular-data primitives. They don't know about file/folder semantics (icon-by-extension, double-click-to-open-folder vs file, breadcrumbs, current-folder context). You end up wrapping a table with file-management chrome.
- **`react-files-ui`, `chonky`, `react-keyed-file-browser`** — capable but each comes with its own opinionated styling, peer-dep weight (chonky is ~30KB+), and conventions that don't match our token system. Theming them to ilinxa is wrapper-on-wrapper.
- **Per-app rebuilds** — what teams actually do today. The result is N slightly-different file-managers with N slightly-different keyboard maps, N different DnD semantics, N different rename UX patterns. This is exactly the duplication ilinxa-ui-pro exists to delete.

Pro-ui's `file-tree` covers the sidebar/hierarchy side. `file-manager` closes the content-pane gap with one opinionated, themeable, controlled-data Finder that drops in alongside `<FileTree>` (or standalone) wherever a current-folder + items array exists.

## Architectural relationship to `file-tree`

- **Shared substrate**: same `FsNode` shape (id / name / type / parentId / children / ext / size / modifiedAt / icon / meta). No duplicate types — `file-manager` re-uses the canonical type by convention. (Compatible-by-convention, not registry-coupled — each component installs independently; consumers wanting both install both.)
- **Composition**: `file-manager` exposes an optional `sidebar` slot. The standard "dual-pane Finder" UX is `<FileManager sidebar={<FileTree ... />}>`. Standalone use is also supported (no sidebar = grid/list pane only).
- **Different surfaces**: `file-tree` is vertical, indented, hierarchical; `file-manager` is the current-folder content view (grid / list). Tree is for *navigating*; manager is for *inspecting + acting on the current folder*.
- **Cut / copy / paste lands here** (deferred from `file-tree` v0.1.0). Will be backed by a shared clipboard primitive both components can consume.

## In scope

### Layout + chrome

- **Toolbar at top** — sticky horizontal bar. `toolbar={false}` hides it entirely; `renderToolbar` replaces wholesale. Default contents:
  - Back / Forward buttons (when navigation history > 0)
  - Up button (parent folder)
  - **Path bar / breadcrumbs** — clickable segments of the current path (e.g., `My Drive › Projects › 2026 › Q1`). Each segment is clickable to navigate. Optional editable mode (click empty space → input field for typed path; fires `onPathTyped`).
  - View-mode toggle (grid / list — see §View modes)
  - Icon-size control (small / medium / large) — only relevant in grid mode
  - Sort menu (by Name / Date Modified / Size / Type, asc/desc)
  - Search input (filters items in the current folder by name; not cross-folder search; fires `onSearchQueryChange`)
  - New File / New Folder buttons (gated by booleans, default `true` if callbacks wired)
  - Refresh button
  - Action overflow (kebab menu) for less-frequent actions
- **Content pane** — the main grid/list of the current folder.
- **Optional `sidebar` slot** — left rail. Consumer drops `<FileTree>` (or anything else) here for the dual-pane Finder.
- **Optional `details` slot** — right rail. Consumer-managed preview / properties for the selected item(s). Renders only when `details` is non-null.
- **Status bar at bottom** — shows "23 items · 2 selected · 4.2 MB". Toggle off via `showStatusBar={false}`. Replaceable via `renderStatusBar` slot.

### View modes

- **Grid** (default) — Mac-Finder shape. Items render as `[icon above name]` cards arranged in a CSS grid. Configurable item size: `'sm' | 'md' | 'lg'` mapping to defined column-track widths. Icons are 80% opacity at rest, 100% on hover/select (the "semi-transparent" feel).
- **List** — single-line rows with `[icon][name][size][modified][kind]` columns. Sortable columns (click header to toggle).
- **Columns mode (Mac-style multi-pane drilldown)** — explicit out-of-scope for v0.1.0. Defer.

### Operations

- **Open** — double-click a file fires `onOpen({ node })`; double-click a folder navigates into it (fires `onCurrentFolderChange({ folderId: node.id })` and the manager updates `currentFolderId`).
- **Navigate** — clicking a breadcrumb segment, Up button, Back/Forward, or a folder double-click all fire `onCurrentFolderChange({ folderId })`. Internally the manager keeps a small back/forward history (capped at 50 entries).
- **Multi-select**:
  - Click → replace selection with one item.
  - Cmd/Ctrl+click → toggle item in selection.
  - Shift+click → range-select between anchor and click.
  - Cmd/Ctrl+A → select all visible items in the current folder.
  - **Marquee selection** (drag-rectangle on empty space) → select items intersecting the rectangle. Standard desktop-OS UX.
- **Right-click menu** — replaces browser default within the manager surface. Default actions (each gated by a boolean prop):
  - Open / Open Folder
  - **Cut / Copy / Paste** (NEW vs file-tree — uses the shared clipboard primitive)
  - New File / New Folder (when right-click hits empty space → root of current folder)
  - Rename
  - Delete (with optional `<AlertDialog>` confirm)
  - Refresh
  - Replaceable wholesale via `renderContextMenu` slot.
- **Inline rename** — F2 / double-click on the *name label* (not the icon — double-click on the icon opens). Enter commits, Esc cancels, click-elsewhere commits. Optional `validateRename`.
- **Cut / copy / paste**:
  - Cut → marks items as "cut" (visually: 50% opacity); fires `onClipboardChange({ kind: 'cut', ids })`.
  - Copy → marks items as "copy"; fires `onClipboardChange({ kind: 'copy', ids })`.
  - Paste → fires `onPaste({ ids, kind, targetFolderId })`. Consumer handles the actual move/copy and updates `nodes`. After paste, manager clears the clipboard (cut) or keeps it (copy, by Finder convention).
  - Backed by a small **shared clipboard primitive** — see §Shared clipboard.
- **Drag-and-drop**:
  - Within the manager: drag selected items onto a folder → `onMove({ ids, targetId, position: 'inside' })`. Cycle / self-drop pre-validated using the same `lib/validation.ts` shape file-tree uses. **Drops on files are rejected** (visual indicator turns destructive) — only folders are valid drop targets in grid/list mode (no reorder-between-siblings semantic since the mode is sort-driven, not consumer-order-driven).
  - **Drop on empty whitespace within the current folder** is a no-op for internal drags (the items are already in the current folder; nothing to do). Visual indicator stays neutral.
  - Drag from manager into the sidebar (when `<FileTree>` is in the sidebar slot, or any other registered drop target) — works via standard HTML5 native DnD with a shared `application/x-ilinxa-file-tree` MIME marker; consumer wires the drop handler in the sidebar component.
  - **Drag-from-OS** — outermost surface accepts file drops from the desktop. `onExternalDrop({ files, targetFolderId })` fires; if the drop landed on a folder item, `targetFolderId = that folder's id`; if on whitespace or a file row, `targetFolderId = currentFolderId`. Visual overlay during drag.

### Data + state

- **Controlled data**: consumer owns `nodes: FsNode[]` (the full hierarchy, same as file-tree) and `currentFolderId: string | null`. Component renders the children of `currentFolderId`. Mutations fire callbacks; consumer updates state.
- **Lazy children loading**: same `onLoadChildren` pattern as file-tree — when navigating into a folder whose `children === undefined`, the manager fires `onLoadChildren` and shows a loading state until consumer merges the resolved children.
- **Selection state**: controlled (`selectedIds` + `onSelectedChange`) OR uncontrolled (component holds internal selection set). Cleared on navigation by default; opt-out via `preserveSelectionOnNavigate`.
- **Clipboard state**: controlled (`clipboard` + `onClipboardChange`) OR uncontrolled. Single clipboard per `<FileManager>` instance by default. See §Shared clipboard for cross-component sync.

### Sort + filter

- **Sort**: default folders-first, then alpha by name. Override via `sortItems` prop or interactive sort menu (toolbar). Sort state is controlled or uncontrolled.
- **Filter**: optional search input in the toolbar filters items by name match (case-insensitive substring). Consumer override via `filterItems` predicate. Search is current-folder-only (cross-folder search is out of scope).
- **Hidden items**: `showHidden` defaults to `false` (filters dotfiles). Override predicate: `isHidden`.

### Keyboard navigation

- **↑ / ↓ / ← / →**: move focus among visible items (depends on grid layout — left/right within row, up/down between rows in grid mode; up/down only in list mode).
- **Enter**: open file (`onOpen`) or open folder (`onNavigate`).
- **Backspace** (no selection): navigate up to parent folder.
- **F2**: rename focused item.
- **Delete** / **Backspace** (with selection): trigger delete (with confirm if enabled).
- **Cmd/Ctrl+X / C / V**: cut / copy / paste.
- **Cmd/Ctrl+A**: select all visible.
- **Cmd/Ctrl+Z**: NOT in scope — consumer's job (the manager fires callbacks; consumer owns undo).
- **Cmd/Ctrl+ ↑** / **Backspace at root**: navigate up. **Cmd/Ctrl+[**: back. **Cmd/Ctrl+]**: forward.
- **Esc**: clear selection (or cancel rename).
- **Home** / **End**: focus first / last item.
- **Type-ahead select** — typing letters when focus is in the manager jumps to the first item whose name starts with the typed prefix. Standard desktop-OS UX. Reset after 800ms.

### Theme

- Light / dark via existing tokens.
- Selected items: signal-lime accent at low chroma against `--secondary` background.
- Cut items: 50% opacity to signal "in clipboard, will move on paste."
- Drop indicator on folder items: ring with `--primary`.
- Marquee rectangle: `--primary/30` fill with `--primary` border.
- Icon defaults: 80% opacity at rest, 100% on hover/selected — produces the "semi-transparent" Finder feel the user requested.

### Object-shape callbacks (F-cross-12-correct from day one)

`onOpen`, `onCurrentFolderChange`, `onCreate`, `onRename`, `onDelete`, `onMove`, `onPaste`, `onClipboardChange`, `onRefresh`, `onExternalDrop`, `onSelectedChange`, `onLoadChildren`, `onSortChange`, `onViewModeChange`, `onIconSizeChange`, `onSearchQueryChange`, `onPathTyped`. Every callback takes a single `args` object.

### Polymorphic root + a11y

- `className` + `style` on the outer container.
- Outer surface: `role="region" aria-label="..."`. Toolbar: `role="toolbar"`. Content pane: `role="grid"` (grid mode) or `role="list"` (list mode); items get `role="gridcell"` / `role="listitem"`.
- Single managed focus into the content pane; arrow keys move focus.
- `aria-selected` on each item; `aria-multiselectable` on the pane.
- Live-region announcements for navigate / paste / delete / move outcomes.
- Contrast ≥ AA in both themes; focus-visible rings everywhere.

## Shared clipboard

Cut / copy / paste should sync between `file-tree` (when it gets clipboard ops in v0.2.0) and `file-manager`. Plan-stage will lock the shape, but the broad design:

- A small primitive at `src/registry/components/navigation/_shared/file-clipboard.ts` (or similar shared-types location).
- Exports: `FileClipboard` type (`{ kind: 'cut' | 'copy' | null; ids: string[] }`), `useFileClipboard()` hook (Context + provider), `<FileClipboardProvider>` component.
- **Three usage modes** for `<FileManager>`:
  1. **Solo, no provider, no `clipboard` prop** → manager keeps its own internal clipboard. Cut/copy/paste work within this instance only.
  2. **Wrapped in `<FileClipboardProvider>` with siblings** → manager auto-detects the provider and syncs through it. A user copies in `<FileTree>` (v0.2.0+) and pastes in `<FileManager>`, or copies in one `<FileManager>` and pastes in another.
  3. **Controlled clipboard** → consumer passes `clipboard` + `onClipboardChange` props. Manager defers to consumer for state. Used when consumer needs to integrate with their app's command-palette / undo-redo stack.
- File-tree's v0.2.0 paste will land by consuming the same primitive — same three modes for that component.
- This keeps **both components independently usable** (no provider required for solo use) AND **synced when both mount under a shared provider**.

## Out of scope

Explicitly deferred. Each is real demand we choose not to address now to keep scope tractable.

- **Columns view mode** — Mac-style multi-pane drilldown (Finder's "Columns" view). Different layout shape; complex sub-component. Defer to v0.2.0+ if real consumer demand surfaces.
- **Properties dialog** ("Get Info") — modal showing extended file metadata, permissions, tags. Consumer's job; manager fires no event for "properties open."
- **Tags / labels system** — colored Finder labels. Tag-data semantics are app-specific; reserve `meta.tags` on FsNode for consumer use; no built-in tag UI.
- **File preview viewers** — when an image / PDF / video is selected, show a preview. Consumer wires this into the `details` slot using existing pro-ui components (`pdf-viewer`, etc.). Manager doesn't ship preview internally.
- **Cross-folder search** — full-text or filename search across the entire tree. Different surface (would benefit from a sibling `file-search` component). v0.1.0 search is current-folder-only.
- **File-type associations** — "Open with..." menu. Consumer wires via `renderContextMenu`.
- **Network locations / cloud / mounting** — `nodes` is whatever the consumer passes. No filesystem subscription, no auto-refresh, no cloud-storage adapters.
- **Undo / redo** — manager fires callbacks; consumer owns undo. Same as file-tree.
- **Quicklook / spacebar preview** — Mac Quicklook UX (spacebar to peek). Defer.
- **Trash / restore** — `onDelete` is destructive; consumer's choice whether to soft-delete (move to trash) or hard-delete. No built-in trash UI.
- **Permission display** — file/folder permission chips. Consumer can render via custom item-renderer; not built-in.
- **Cross-tab / cross-window clipboard sync** — multiple manager instances on a single page sync via `<FileClipboardProvider>` (see §Shared clipboard), but cross-browser-tab sync (via `BroadcastChannel` / `storage` events) is not in scope. Cut in tab A, paste in tab B = no-op for v0.1.0.
- **Sidebar and details slots are render-prop only, not built-in panels** — we don't ship `<FileTreeSidebar>` or `<FilePreviewPanel>` as parts of file-manager. Consumer composes whatever they want into the slots.

## Target consumers

- **Asset libraries / DAM tools** — design ops, brand asset managers, image / icon repositories.
- **Document workspaces / wiki / KB attachments** — knowledge bases, document versioning surfaces.
- **CMS attachment managers** — e-commerce product images, blog post assets, marketing creative repos.
- **Email / message attachment viewers** — list of attachments per email/thread.
- **Internal file-share dashboards** — team file-share landing pages, with both upload + browse.
- **S3-bucket / cloud-storage explorers** — admin tools for cloud-stored files.
- **Compliance / audit document trails** — listing case files for review.
- **Low-code builders' "media" panels** — pick-an-asset dialogs in form builders, page builders.
- **`pdf-viewer` / `image-viewer` / `video-player` consumers** — file-manager picks an item, hands it to the viewer.

The consumer is a **frontend dev with a hierarchical-node array, a `currentFolderId`, and the requirement "let users browse + act on the current folder, themed to match."**

## Rough API sketch

```tsx
// Simplest read-only file manager (current folder only)
<FileManager
  nodes={fileNodes}
  currentFolderId={null}
  onCurrentFolderChange={({ folderId }) => setCurrent(folderId)}
  onOpen={({ node }) => preview(node)}
/>

// Controlled — consumer owns navigation history + selection + view mode
<FileManager
  nodes={fileNodes}
  currentFolderId={current}
  onCurrentFolderChange={({ folderId }) => setCurrent(folderId)}
  selectedIds={selection}
  onSelectedChange={({ ids }) => setSelection(ids)}
  viewMode={view}
  onViewModeChange={({ mode }) => setView(mode)}
/>

// Full CRUD
<FileManager
  nodes={fileNodes}
  currentFolderId={current}
  onCurrentFolderChange={({ folderId }) => navigateTo(folderId)}
  onCreate={({ parentId, type }) => fs.create(parentId, type)}
  onRename={({ id, nextName }) => fs.rename(id, nextName)}
  onDelete={({ ids }) => fs.delete(ids)}
  onMove={({ ids, targetId, position }) => fs.move(ids, targetId, position)}
  onPaste={({ ids, kind, targetFolderId }) =>
    kind === "cut" ? fs.move(ids, targetFolderId) : fs.copy(ids, targetFolderId)
  }
  onExternalDrop={({ files, targetFolderId }) => fs.upload(files, targetFolderId)}
/>

// Dual-pane Finder layout
<FileManager
  nodes={fileNodes}
  currentFolderId={current}
  sidebar={
    <FileTree
      nodes={fileNodes}
      onOpen={({ node }) =>
        node.type === "folder" ? setCurrent(node.id) : preview(node)
      }
    />
  }
/>

// With preview details pane
<FileManager
  nodes={fileNodes}
  currentFolderId={current}
  details={
    selectedNode ? <PropertiesPanel node={selectedNode} /> : null
  }
/>

// Lazy-load children on navigate
<FileManager
  nodes={shallowNodes}
  currentFolderId={current}
  onLoadChildren={async ({ nodeId }) => {
    const kids = await fs.list(nodeId);
    setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
    return kids;
  }}
/>

// Custom toolbar (full replacement)
<FileManager
  nodes={fileNodes}
  currentFolderId={current}
  renderToolbar={({ path, viewMode, actions }) => (
    <MyToolbar
      path={path}
      onUp={actions.navigateUp}
      onChangeView={actions.setViewMode}
    />
  )}
/>

// Toolbar off entirely
<FileManager nodes={fileNodes} currentFolderId={null} toolbar={false} />
```

## Example usages

**1. Asset library (design system)**

A design ops app shows `<FileManager nodes={assetTree} currentFolderId={current} sidebar={<FileTree ... />} />`. Folders are categories; files are SVG icons / PNG mockups. Designer drills via tree on the left, sees the current category's icons in a grid on the right. Drags icons between categories (`onMove`). Multi-selects + downloads. Search box filters icons by name within the current category.

**2. CMS media library**

A content editor's "Insert media" dialog renders `<FileManager nodes={mediaTree} ...>` over a modal. Multi-select images → "Insert" closes the dialog and pipes the selected IDs back to the editor. View mode = grid for visual scan; toolbar has the editor's "Upload" button (consumer-supplied via `renderToolbar` extension).

**3. Knowledge base attachment viewer**

A docs app has `<FileManager nodes={attachmentTree} currentFolderId="article-42-attachments" toolbar={false} sidebar={null} />` embedded in an article. Read-only; clicking a PDF fires `onOpen` which routes to `pdf-viewer` in a side drawer. No upload / no CRUD here.

**4. Internal file-share dashboard**

`<FileManager nodes={shareTree} currentFolderId={current} ...>` as a full-page surface. Sidebar shows "Recent / Starred / Shared with me / All Files" via `<FileTree>` in the sidebar slot. Toolbar has Upload + New Folder + Search. Drag-from-OS handles upload. Cut/copy/paste lets users reorganize.

**5. S3-bucket explorer (admin tool)**

DevOps admin tool shows `<FileManager nodes={s3Tree} currentFolderId={prefix} onLoadChildren={listS3} />`. Lazy-loads S3 keys per prefix on navigate. Cut/copy/paste maps to S3 move/copy operations. Status bar: "23 objects · 4.2 MB".

**6. Compliance audit document trail**

A regulatory app shows `<FileManager nodes={caseFiles} currentFolderId={caseId} toolbar={true} ...>`. Read-mostly; users navigate per-case. Right-click → "Mark reviewed" via custom `renderContextMenu` extension. Multi-select for bulk actions ("Export selected to PDF").

## Success criteria

The component is "done" when:

1. **Renders a current-folder grid + list view** correctly; both view modes interactive without errors.
2. **Mac-Finder feel** — semi-transparent (80% opacity) icons at rest; full opacity on hover/select; signal-lime tint on selection.
3. **Path bar / breadcrumbs** clickable to navigate; back / forward / up buttons functional.
4. **Multi-select** — click, Cmd/Ctrl+click, Shift+click range, Cmd/Ctrl+A all work; **marquee (drag-rectangle) selection** works on empty space.
5. **Right-click menu** with Cut / Copy / Paste / New / Rename / Delete / Refresh; replaceable via `renderContextMenu`.
6. **Cut / copy / paste** — visual cut state (50% opacity); paste fires `onPaste` with the right kind + targetFolderId; clipboard clears on cut-paste.
7. **Inline rename** via F2 / double-click on label; Enter commits; Esc cancels.
8. **Drag-and-drop** within the manager (move) + drag-from-OS (`onExternalDrop`); cycle / self-drop pre-validation; visual drop indicator.
9. **Lazy children** on navigate — `onLoadChildren` resolves; loading state shows; error state with retry shows on rejection.
10. **Sort** — by name / date / size / type, asc/desc; default folders-first.
11. **Search** filters current folder by name (substring, case-insensitive); consumer override via `filterItems`.
12. **View-mode toggle** (grid / list) with state preserved across navigation; icon-size control in grid mode.
13. **Sidebar + details slots** — both render when populated, hidden when null.
14. **Status bar** — accurate counts + size.
15. **Keyboard navigation** — full keyboard map per documented spec; focus-visible rings; type-ahead select.
16. **Object-shape callbacks** throughout — no positional shapes.
17. **Theme support** — light + dark verified.
18. **Accessibility** — Lighthouse a11y ≥ 95 on demo; ARIA roles + live-region announcements correct.
19. **Smoke harness** — `pnpm dlx shadcn add @ilinxa/file-manager` against the smoke consumer; consumer-side `pnpm tsc --noEmit` clean.
20. **Procomp doc trio complete** — description (this), plan, guide. Demo demonstrates: standalone, dual-pane with file-tree sidebar, view-mode toggle, multi-select + bulk actions, cut/copy/paste, drag-from-OS, lazy load, custom chrome.
21. **Meta + manifest in sync; registry.json shipped** (base + fixtures items).
22. **Build clean** — `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`, `pnpm validate:meta-deps` all pass.
23. **GATE 3 spot-check review** — verdict ≥ "Pass with follow-ups."

## Open questions

1. **Slug — `file-manager`.** **Confirmed** in pre-description discussion; locked here. Sibling slug to `file-tree`; both `file-*` prefixed primitives in the `navigation` category.

2. **Category — `navigation`.** Same as `file-tree`. **Recommendation:** lock. Alternative: a new `data` placement, but file-manager's primary affordance is "browse + navigate the current folder", which fits navigation. Consistent with file-tree.

3. **View modes shipped at v0.1.0 — `grid + list`, or also `columns` (Mac-style multi-pane)?** **Recommendation:** ship `grid + list` only. Columns mode is a separate UI shape (multiple linked panes side-by-side) that would significantly bump complexity; defer to v0.2.0 if real consumer demand surfaces. Two view modes cover 90% of use cases.

4. **Icon-size control granularity — three discrete steps (`sm / md / lg`) or continuous slider?** **Recommendation:** three steps. Discrete = matches Finder + Windows Explorer exactly + simpler API + cleaner Tailwind class mapping. Continuous slider is overkill for this UX. Three sizes mapped to grid track widths: `sm` ≈ 80px, `md` ≈ 120px, `lg` ≈ 180px.

5. **Path bar — clickable breadcrumbs, editable text input, or both?** **Recommendation:** clickable breadcrumbs by default. Click empty area on the breadcrumb bar → switches to text-input mode (typed path → fires `onPathTyped`, consumer resolves). Esc reverts to breadcrumbs. Mac Finder + Windows Explorer both support this dual mode. Implementation cost is moderate; pays back in power-user delight.

6. **Navigation history (back / forward) — built-in or consumer-managed?** **Recommendation:** built-in with controllable bypass. Manager keeps an internal stack capped at 50 entries; back/forward buttons consume from it. Consumer can override via `historyBackIds` / `historyForwardIds` props (controlled mode) or pass `enableHistory={false}` to disable buttons + skip stack maintenance. Default: built-in history.

7. **Selection clearing on navigate — preserve or clear?** **Recommendation:** clear by default (matches Mac Finder + Windows Explorer). Opt-out via `preserveSelectionOnNavigate={true}` for surfaces where selection is sticky across folders.

8. **Marquee selection (drag-rectangle on empty space) — in scope at v0.1.0?** **Recommendation:** yes. It's a desktop-OS expectation that breaks the "Finder feel" if absent. Implementation: native pointer events; track drag-start position, draw an absolute-positioned `<div>` rectangle, intersect against item bounding rects, update selection on every move event. ~80 LOC for the hook + ~30 LOC for the rectangle render.

9. **Clipboard primitive location — `_shared/file-clipboard.ts` (sibling shared-types module) OR file-manager's `lib/`?** Consequence: if shared, `file-tree`'s v0.2.0 paste consumes the same module — keeps cut/copy/paste synced across instances. If not shared, each component has its own clipboard. **Recommendation:** ship the shared primitive at `src/registry/components/navigation/_shared/file-clipboard.ts` from day one (consumed by file-manager for v0.1.0; consumed by file-tree starting v0.2.0). Setting this up now is cheaper than retrofitting later.

10. **Default view mode — grid or list?** **Recommendation:** grid. Mac-Finder default; matches the "semi-transparent icons + names" UX the user originally described. List is the secondary mode.

11. **Sort — built-in or consumer-managed?** **Recommendation:** built-in default + consumer override. Default: folders-first, alpha by name. Sort menu in toolbar offers Name / Date Modified / Size / Type, asc/desc. Consumer can override via `sortItems` prop or use the `defaultSortKey` / `defaultSortOrder` for uncontrolled initial state.

12. **Type-ahead select — in scope?** **Recommendation:** yes. Standard desktop-OS UX (typing "rea" focuses the first item starting with "rea"). ~30 LOC for the hook (debounce + prefix tracking + reset). High UX payoff for power users.

13. **Status bar — built-in or slot-only?** **Recommendation:** built-in default (showing count + selected count + total size); replaceable via `renderStatusBar`; hideable via `showStatusBar={false}`. Mirrors Mac Finder's bottom bar.

14. **`details` slot semantics — fixed-width right rail or consumer-controlled?** **Recommendation:** consumer-controlled width via the slot's own `className`. Manager renders `details` in a `<aside>` next to the content pane only when `details !== null`. Default min-width: 280px; consumer overrides with their own className.

15. **Consumer-supplied search vs built-in search input — overlap?** **Recommendation:** built-in search input with a `defaultSearchQuery` for uncontrolled, `searchQuery` + `onSearchQueryChange` for controlled. Consumer can hide the input via `showSearch={false}` and drive search externally if they want a different UI. `filterItems` predicate as the deepest override (still consumer-driven).

16. **`onNavigate` vs `onCurrentFolderChange` — both, or pick one?** **Recommendation:** **`onCurrentFolderChange`** (controlled-prop pattern, mirrors `onSelectedChange` etc.). Drop `onNavigate` to avoid two callbacks for the same event. Document that breadcrumb-click / Up / Back / Forward / folder-double-click all fire `onCurrentFolderChange`.

17. **Drag-from-manager-to-OS (export) — in scope?** **Recommendation:** **out of scope** at v0.1.0. Mac/Windows let you drag files OUT of the file manager onto the desktop to download. Implementing this requires writing real `Blob`s into `dataTransfer` on dragstart, which is consumer-data-shape-specific (we don't have the file bytes — we have FsNode metadata). Defer.

18. **Drop-target validation — same `lib/validation.ts` as file-tree?** **Recommendation:** reuse the cycle / self-drop logic but ship a *copy* of the validation file inside file-manager's sealed folder (per the registry-distribution convention; sealed-folder primitive can't depend on file-tree at runtime unless we add registry-deps coupling). Slightly duplicative; the alternative — making file-tree a `registryDependency` of file-manager — couples them at install time, which violates "each component independently usable" (Q-from-architecture-discussion).

19. **What ships in `dummy-data.ts`?** **Recommendation:** reuse the same Next.js project shape from file-tree (same data; consumers see consistent fixtures across both demos). Plus a flat-grid fixture (~30 image-named items) to demo the grid view's icon density.

20. **Dependencies on `file-tree` demo-side?** Demo composes `<FileManager sidebar={<FileTree ... />}>`. **Recommendation:** since the docs site already imports file-tree, the demo can reference it directly. The shipped registry artifact (`@ilinxa/file-manager`) does NOT depend on `@ilinxa/file-tree` — they install independently. A consumer who wants the dual-pane shape installs both.

21. **Drag-from-tree-into-manager (cross-component drop)?** When a user drags a node from `<FileTree>` and drops it into the manager's content pane, what happens? **Recommendation:** manager treats this as a normal HTML5 drop (the source signals the same `application/x-ilinxa-file-tree` MIME we use today); fires `onMove({ ids, targetId: currentFolderId })`. This works because both components use HTML5 native DnD with a shared MIME marker. Will exercise this in the dual-pane demo.

22. **Consumer-supplied item renderer (`renderItem`)?** Power consumers may want totally custom item rendering (think: an asset library showing image thumbnails inline). **Recommendation:** ship `renderItem?: (args: { item: FileManagerItem; defaultItem: ReactNode }) => ReactNode` slot from day one. Same composition pattern as file-tree's `renderRow`. Allows consumers to wrap or replace.

23. **Image-thumbnail rendering for image files — built-in or consumer-only via `renderItem`?** Mac Finder shows tiny inline previews for images. Built-in would mean: when an FsNode has an image extension AND the consumer provided a way to fetch a thumbnail URL, render it instead of the generic icon. The hard part is the URL — `FsNode.meta.thumbnailUrl` would be the convention, but defining it forces consumers to provide one. **Recommendation:** **out of scope at v0.1.0**. Consumer composes via `renderItem` if they want thumbnails; they have the context to know how to fetch thumbnail URLs. Document the pattern in guide.md. Built-in thumbnails are a v0.2.0 candidate once we see real consumer demand patterns.

---

> **Sign-off needed before Stage 2 (plan).** Open questions above represent active uncertainties; recommendations are starting positions. Reviewer should mark each open-question with their preferred resolution OR push back on the recommendation. The 3-5 highest-leverage decisions for plain-English follow-up are: shared clipboard primitive (Q9), columns view scope (Q3), navigation history default (Q6), `onCurrentFolderChange` vs `onNavigate` (Q16), and drag-from-manager-to-OS (Q17).

## Sign-off

**User confirmed 2026-05-10** — all 23 starting-position recommendations accepted. "review and confirm it then move on."

Locked decisions for Stage 2:

- **Slug:** `file-manager`
- **Category:** `navigation` (alongside `file-tree`)
- **View modes:** grid + list at v0.1.0; columns deferred to v0.2.0
- **Icon size:** three discrete steps (sm/md/lg) mapped to grid track widths
- **Path bar:** clickable breadcrumbs + click-empty-area-to-edit dual mode
- **Navigation history:** built-in default; `enableHistory={false}` opt-out; controllable via `historyBackIds` / `historyForwardIds`
- **Selection on navigate:** clear by default; `preserveSelectionOnNavigate={true}` opt-in
- **Marquee selection:** in scope at v0.1.0
- **Shared clipboard primitive:** ship `_shared/file-clipboard.ts` from day one; three usage modes (solo / provider / controlled)
- **Default view mode:** grid
- **Sort:** built-in (folders-first, alpha) + consumer override
- **Type-ahead select:** in scope
- **Status bar:** built-in default; replaceable via `renderStatusBar`; hideable via `showStatusBar={false}`
- **Details slot width:** consumer-controlled via the slot's own `className`; default min-width 280px
- **Search:** built-in input + controlled props + `filterItems` predicate
- **Navigation callback:** `onCurrentFolderChange` only (no `onNavigate`)
- **Drag-from-manager-to-OS:** out of scope at v0.1.0
- **Validation duplication:** ship a copy of `validation.ts` inside file-manager's sealed folder (no registry-deps coupling)
- **Dummy data:** Next.js project shape from file-tree + flat-grid fixture (~30 image-named items)
- **Cross-component drops:** shared `application/x-ilinxa-file-tree` MIME marker
- **`renderItem` slot:** ship from day one
- **Image thumbnails:** out of scope at v0.1.0; consumer composes via `renderItem`
- **All other Q-recommendations:** accepted as written
