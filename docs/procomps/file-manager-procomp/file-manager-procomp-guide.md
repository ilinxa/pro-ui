# file-manager — consumer guide

> Stage 3: how to use it. Authored alongside the v0.1.0 ship.
>
> **Predecessors:** [`description.md`](./file-manager-procomp-description.md), [`plan.md`](./file-manager-procomp-plan.md). Implementation at [`src/registry/components/navigation/file-manager/`](../../../src/registry/components/navigation/file-manager/).

## When to use

`<FileManager>` is the Mac-Finder content pane. Reach for it when:

- You have a hierarchical-node array and need a "what's in this folder" view with multi-select, sort, and view-mode switching.
- You want the dual-pane Finder shape: drop `<FileTree>` into `<FileManager>`'s `sidebar` slot.
- You want users to cut / copy / paste / rename / delete / drag items in a familiar shape, themed to your app.

Real cases:

- Asset libraries / DAM (design ops, brand assets, icon repos)
- CMS media library "Insert" dialogs
- Internal file-share dashboards
- S3-bucket explorers
- KB attachment viewers
- Compliance audit document trails

## When NOT to use

- **You need just a sidebar tree.** Use `<FileTree>` standalone — `<FileManager>` is the content pane.
- **You need column / Miller view (Mac Finder's multi-pane drilldown).** Out of scope at v0.1.0; defer to v0.2.0.
- **You want to drag files OUT to the OS desktop.** Out of scope at v0.1.0.
- **You need built-in image / PDF / video previews.** Compose via the `details` slot using `pdf-viewer` / `media-carousel-01` etc.
- **You need cross-tab clipboard sync.** v0.1.0 syncs across instances on a single page (via `<FileClipboardProvider>`); cross-tab is out of scope.

## Composition patterns

### Drop-in (read-only)

```tsx
<div className="h-130">
  <FileManager
    nodes={fileNodes}
    defaultCurrentFolderId={null}
    onOpen={({ node }) => preview(node)}
  />
</div>
```

Toolbar, RC menu, drag-drop, marquee selection, keyboard nav — all on. Give it explicit height; the manager fills its container.

### Dual-pane Finder

```tsx
import { FileManager, FileClipboardProvider } from "@/components/file-manager";
import { FileTree } from "@/components/file-tree";

<FileClipboardProvider>
  <div className="h-180">
    <FileManager
      nodes={nodes}
      currentFolderId={current}
      onCurrentFolderChange={({ folderId }) => setCurrent(folderId)}
      sidebar={
        <FileTree
          nodes={nodes}
          onOpen={({ node }) => {
            if (node.type === "folder") setCurrent(node.id);
            else openFile(node);
          }}
        />
      }
    />
  </div>
</FileClipboardProvider>;
```

Tree on the left handles deep navigation; manager on the right handles the current-folder content + actions. Wrapping in `<FileClipboardProvider>` is what makes copy-in-tree → paste-in-manager work (when file-tree gets paste in v0.2.0; today the provider just syncs across multiple managers).

### Full CRUD

```tsx
const [nodes, setNodes] = useState<FsNode[]>(initial);

<FileManager
  nodes={nodes}
  currentFolderId={current}
  onCurrentFolderChange={({ folderId }) => setCurrent(folderId)}
  onCreate={({ parentId, type }) => setNodes(addNode(parentId, type))}
  onRename={({ id, nextName }) => setNodes(renameNode(id, nextName))}
  onDelete={({ ids }) => setNodes(deleteNodes(ids))}
  onMove={({ ids, targetId }) => setNodes(moveNodes(ids, targetId))}
  onPaste={({ ids, kind, targetFolderId }) =>
    kind === "cut"
      ? setNodes(moveNodes(ids, targetFolderId))
      : setNodes(copyNodes(ids, targetFolderId))
  }
  onExternalDrop={({ files, targetFolderId }) =>
    uploader.upload(files, targetFolderId)
  }
/>;
```

Every callback hands you the bag of args; you decide what to do. The component never mutates `nodes`.

### Lazy loading

```tsx
import { mergeLoadedChildren } from "@/components/file-manager";

<FileManager
  nodes={shallowNodes}
  currentFolderId={current}
  onCurrentFolderChange={({ folderId }) => setCurrent(folderId)}
  onLoadChildren={async ({ nodeId }) => {
    const kids = await fs.list(nodeId);
    setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
    return kids;
  }}
/>;
```

When the user navigates into a folder with `children: undefined`, the manager fires `onLoadChildren` and shows a loading state. On resolve, you splice the children into `nodes` via `mergeLoadedChildren` and the manager re-renders.

### With a preview details pane

```tsx
const selected = useMemo(
  () => firstSelected(selection, nodes),
  [selection, nodes],
);

<FileManager
  nodes={nodes}
  selectedIds={selection}
  onSelectedChange={({ ids }) => setSelection(ids)}
  details={
    selected ? <PropertiesPanel node={selected} /> : null
  }
/>;
```

The `details` slot renders only when non-null. Width is consumer-controlled via the slot's own `className`; default min-width is 280px.

### Custom toolbar (compose standalone parts)

```tsx
import {
  FileManagerToolbar,
  FileManagerPathBar,
  FileManagerSearchInput,
  FileManagerNewButtons,
  FileManagerViewToggle,
} from "@/components/file-manager";

<FileManager
  nodes={nodes}
  renderToolbar={() => (
    <div className="flex h-10 items-center gap-1 border-b px-2">
      <FileManagerPathBar />
      <FileManagerSearchInput />
      <FileManagerViewToggle />
      <div className="ml-auto">
        <FileManagerNewButtons />
      </div>
    </div>
  )}
/>;
```

The standalone parts read from `useFileManager()` so you don't need to wire actions yourself.

### Custom item renderer (image thumbnails, etc.)

```tsx
function thumbnailItem({ item, defaultItem, viewMode }: FileManagerItemRenderArgs) {
  const url = item.node.meta?.thumbnailUrl as string | undefined;
  if (!url || viewMode !== "grid") return defaultItem;
  return (
    <div className="flex flex-col items-center gap-1.5 p-2">
      <img src={url} alt={item.node.name} className="size-12 rounded-sm" />
      <span className="text-xs">{item.node.name}</span>
    </div>
  );
}

<FileManager nodes={assets} renderItem={thumbnailItem} />;
```

`defaultItem` is the pre-wired item view; you can wrap it, replace it, or fall through.

## Shared clipboard

```tsx
<FileClipboardProvider>
  <FileManager nodes={...} />
  <FileManager nodes={...} />
</FileClipboardProvider>
```

Without the provider, each manager keeps its own internal clipboard. With the provider, multiple instances share state. When file-tree gets paste in v0.2.0, it'll consume the same provider for cross-component sync.

For controlled-mode (your app drives the clipboard, e.g. for command-palette integration):

```tsx
<FileManager
  nodes={...}
  clipboard={clipboard}
  onClipboardChange={({ clipboard }) => setClipboard(clipboard)}
/>
```

## Keyboard map

| Key | Action |
|---|---|
| **Arrow keys** | Move focus (2-D nav in grid mode using auto-detected column count; up/down only in list mode) |
| **Enter** | File: fires `onOpen`. Folder: navigates into. |
| **Backspace** | With selection: deletes (with confirm). No selection: navigates up. |
| **F2** | Rename focused item. |
| **Delete** | Delete selected items (with confirm if enabled). |
| **Esc** | Clear selection or cancel rename. |
| **Cmd/Ctrl+A** | Select all visible items. |
| **Cmd/Ctrl+X / C / V** | Cut / copy / paste. |
| **Cmd/Ctrl+[** / **Cmd/Ctrl+]** | Back / Forward. |
| **Home** / **End** | Focus first / last item. |
| **Type-ahead** | Typing letters jumps focus to the first matching item name. Resets after 800ms idle. |

Single tab stop into the manager; once focused, arrow keys + type-ahead manage focus.

## Drag-and-drop

### Internal moves

Drag selected items onto a folder. Drop indicator turns green (ring) when valid, destructive when not (cycle / self-drop). **Drops on file rows are rejected** — only folders are valid drop targets in grid/list mode (no reorder semantic since the mode is sort-driven).

```tsx
<FileManager
  nodes={nodes}
  onMove={({ ids, targetId }) => setNodes(moveNodes(ids, targetId))}
/>
```

### Drag-from-OS

Drop OS files onto the manager to fire `onExternalDrop({ files, targetFolderId })`. If the drop landed on a folder item, `targetFolderId` is that folder; otherwise it's the current folder.

### Marquee selection

Drag a rectangle on empty whitespace to select multiple items. Shift+drag adds to the existing selection. Items intersecting the rectangle are selected on every move event.

Disabled with `enableMarqueeSelection={false}`.

## Gotchas

- **You own the data.** `nodes` is yours; the component never mutates. If your `onMove` doesn't update state, the move doesn't reflect.
- **Drops on files are rejected.** Only folders are valid drop targets. Drops on whitespace = no-op for internal drag, upload-to-current-folder for external drag.
- **Selection clears on navigate by default.** Set `preserveSelectionOnNavigate={true}` to keep it across folders.
- **Cut + paste into the same folder = no-op move.** The manager fires `onPaste` anyway; your handler should detect (e.g., compare source parent to target) if you want to skip the round-trip.
- **Without `<FileClipboardProvider>`, multiple managers don't sync.** Each instance has its own internal clipboard. Wrap them under a provider if you want cut-here / paste-there to work across instances.
- **Path bar typed input** fires `onPathTyped` on Enter / blur (commit), not per keystroke. You're responsible for resolving the typed string to a folder id and updating `currentFolderId`.
- **List view virtualizes at >= 200 items** (default). Grid view does NOT virtualize at v0.1.0; folders > 500 items in grid mode will scroll heavily. Consider the list view for huge folders.
- **`onLoadChildren` errors** show an inline error + retry button. Throw real `Error` objects with useful messages.
- **The component is `"use client"`.** Don't render from a server component without an intermediate client boundary.

## Migration notes

Greenfield. Second component in the file-system family (after `file-tree`). Reuses `FsNode` shape compatible-by-convention; ships its own copy of `lib/validation.ts` / `lib/tree-utils.ts` / `lib/icons.tsx` to keep both components independently installable.

The `_shared/file-clipboard.ts` primitive is new in this release and will be consumed by `file-tree` v0.2.0 when it gains paste.

## Open follow-ups

| Tag | What | Bump target |
|---|---|---|
| Columns view (Mac Finder) | Multi-pane drilldown layout | v0.2.0 if real demand |
| Drag-from-manager-to-OS | Drag files out to desktop | v0.2.0 (needs consumer Blob source) |
| Image thumbnails | Built-in tile previews for images | v0.2.0 (consumer composes via `renderItem` today) |
| Grid-view virtualization | Column-aware grid virtualizer | v0.2.0 (list view virtualizes today) |
| Cross-tab clipboard sync | `BroadcastChannel` / `storage` events | v0.2.0+ |
| Quicklook / spacebar preview | Mac-style spacebar peek | v0.2.0+ |
| Tags / labels system | Colored Finder-style labels | v0.2.0+ |
