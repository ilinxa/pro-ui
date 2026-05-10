# file-tree — consumer guide

> Stage 3: how to use it. Authored alongside the v0.1.0 ship.
>
> **Predecessors:** [`description.md`](./file-tree-procomp-description.md), [`plan.md`](./file-tree-procomp-plan.md). Implementation at [`src/registry/components/navigation/file-tree/`](../../../src/registry/components/navigation/file-tree/).

## When to use

`<FileTree>` is the pro-ui answer to "render a hierarchical tree of files, folders, schemas, or anything tree-shaped, with the VS Code shape." Reach for it when:

- A sidebar, picker, or schema browser needs an indented expand-collapse list.
- The host has a `nodes: FsNode[]` array (or can build one) and wants to give users selection / rename / drag-drop / delete out of the box.
- Browser-native `<details>` / `<ul>` collapses the moment you need keyboard nav, multi-select, or DnD.
- A headless tree library (`react-arborist`, `react-complex-tree`) is theming overhead that doesn't pay for itself.

Real cases:

- IDE-like dev tools (code editors, query workbenches, log explorers)
- Document workspaces (knowledge base sidebars, wiki nav)
- Asset libraries (icon repos, design ops, template libraries)
- Schema / namespace browsers (DB UIs, API explorers, GraphQL schema viewers)
- Low-code / no-code page hierarchies
- Configuration UIs / feature-flag organizational trees
- The sidebar inside `folder-manager`'s dual-pane Finder layout

## When NOT to use

- **You need a Finder grid (icons + names in a content pane).** That's `folder-manager`'s job. `<FileTree>` is the vertical sidebar.
- **You need cut / copy / paste.** Out of scope for v0.1.0. Lands in v0.2.0 alongside `folder-manager` with a shared clipboard.
- **You need per-row hover-actions toolbars** (the "+" / "..." floating buttons VS Code shows). Defer; v0.1.0 is header buttons + RC menu.
- **You need cross-tree drag-drop** between two `<FileTree>` instances. Defer; not a v0.1.0 feature.
- **You need flat-array virtualized lists** with no hierarchy. Use a different primitive (TanStack Virtual directly).

## Composition patterns

### The drop-in case

```tsx
<div className="h-96">
  <FileTree
    nodes={projectNodes}
    onOpen={({ node }) => openFile(node)}
  />
</div>
```

Header, RC menu, drag-drop, keyboard — all on. Give it explicit height; the tree fills its container.

### Full CRUD

```tsx
const [nodes, setNodes] = useState<FsNode[]>(initialNodes);

<FileTree
  nodes={nodes}
  selectionMode="multi"
  onOpen={({ node }) => editor.open(node)}
  onCreate={({ parentId, type }) => setNodes(insertNode(parentId, type))}
  onRename={({ id, nextName }) => setNodes(renameNode(id, nextName))}
  onDelete={({ ids }) => setNodes(deleteNodes(ids))}
  onMove={({ ids, targetId, position }) =>
    setNodes(moveNodes(ids, targetId, position))
  }
  onRefresh={({ nodeId }) => refreshFolder(nodeId)}
/>
```

Every callback hands you the bag of args; you decide what to do. The component never mutates `nodes`.

### Lazy loading large filesystems

```tsx
import { mergeLoadedChildren } from "@/components/file-tree";

const [nodes, setNodes] = useState<FsNode[]>(rootOnly);

<FileTree
  nodes={nodes}
  onLoadChildren={async ({ nodeId }) => {
    const kids = await fs.list(nodeId);
    setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
    return kids;
  }}
/>;
```

Folders with `children: undefined` show a chevron without firing the loader; on first expand, the hook calls `onLoadChildren` and shows an inline spinner. `mergeLoadedChildren()` is the immutable splice helper you'll want for nested updates.

### Custom icons

Three layers of override, lowest to highest:

1. Built-in extension map (`<File>`, `<FileCode>`, `<FileImage>`, etc.).
2. Per-tree override via `iconForNode={(args) => ReactNode | null}` — return `null` to fall through to the built-in default.
3. Per-node override by setting `node.icon = <MyIcon/>` — wins over everything.

```tsx
function iconForNode({ node }: { node: FsNode }) {
  if (node.type === "folder") return null;       // default folder icon
  if (node.name.endsWith(".sql")) {
    return <Database className="size-4 text-emerald-500" />;
  }
  return null;                                    // default file icon
}

<FileTree nodes={nodes} iconForNode={iconForNode} />;
```

### Sidebar inside `folder-manager`

```tsx
<FolderManager
  sidebar={<FileTree nodes={projectNodes} onOpen={openFile} />}
  contents={<FolderContents folder={current} />}
/>
```

The most common composition — when `folder-manager` lands.

### Custom header

Replace the default header wholesale:

```tsx
<FileTree
  nodes={nodes}
  renderHeader={({ actions, totalCount, labels }) => (
    <div className="flex h-9 items-center gap-2 border-b px-3">
      <h2>My Tree ({totalCount})</h2>
      <button onClick={() => actions.expandAll()}>Expand All</button>
    </div>
  )}
/>
```

Or compose subsets using the standalone parts (which read from `useFileTree()` so you don't wire actions yourself):

```tsx
import {
  FileTreeHeader,
  FileTreeNewFileButton,
  FileTreeRefreshButton,
} from "@/components/file-tree";

<FileTree
  nodes={nodes}
  renderHeader={() => (
    <div className="flex h-9 items-center gap-1 border-b px-3">
      <span>Project</span>
      <div className="ml-auto flex gap-0.5">
        <FileTreeNewFileButton />
        <FileTreeRefreshButton />
      </div>
    </div>
  )}
/>;
```

### Custom right-click menu

```tsx
<FileTree
  nodes={nodes}
  renderContextMenu={({ node, defaultActions }) => (
    <>
      {defaultActions.map((a) => (
        <ContextMenuItem
          key={a.id}
          variant={a.destructive ? "destructive" : "default"}
          onSelect={a.onSelect}
        >
          {a.icon}
          {a.label}
        </ContextMenuItem>
      ))}
      {node?.type === "file" ? (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => duplicate(node)}>
            Duplicate
          </ContextMenuItem>
        </>
      ) : null}
    </>
  )}
/>
```

`renderContextMenu` returns the contents of the menu; the wrapper / portal is provided. You can render any combination of `<ContextMenuItem>` and friends from `@/components/ui/context-menu`.

## Keyboard map

| Key | Action |
|---|---|
| **↑** / **↓** | Move focus to prev/next visible row |
| **→** | Folder collapsed → expand. Folder expanded → focus first child |
| **←** | Folder expanded → collapse. Else → focus parent |
| **Enter** | File: fires `onOpen`. Folder: toggles expansion |
| **Space** | Toggle selection on focused row |
| **F2** | Start rename on focused row |
| **Delete** / **Backspace** | Delete selected (with confirmation if `confirmDelete` is on) |
| **Esc** | Clear selection (or cancel an active rename) |
| **Cmd/Ctrl+A** | Select all visible rows (multi-select mode only) |
| **Home** / **End** | Focus first / last visible row |

The tree is a single tab stop; once focused, arrow keys take over.

## Drag-and-drop

### Internal moves

Drag any row onto a folder (drop indicator = ring) or above/below another row (drop indicator = horizontal line). The tree pre-validates structurally:

- **Cycle detection** — dropping a folder into one of its descendants is refused; indicator turns red, `onMove` doesn't fire.
- **Self-drop** — dropping a node onto itself is refused.
- **Multi-select drag** — if the dragged row is part of a multi-select, all selected rows move together.

`onMove({ ids, targetId, position })` fires only on legal drops. Name collisions are your call — handle them in your `onMove` (silently rename, prompt, reject, etc.).

### Drag-from-OS

Drop OS files (from Finder / Explorer / desktop) onto the tree to fire `onExternalDrop({ files, targetId })`. `targetId` is the folder the user dropped on; `null` means the empty whitespace (root). Wire your upload flow there.

```tsx
<FileTree
  nodes={nodes}
  enableExternalDrop
  onExternalDrop={async ({ files, targetId }) => {
    for (const file of files) {
      await uploader.upload(file, targetId);
    }
    refreshTree();
  }}
/>
```

Visual overlay shows during drag-over. Opt out with `enableExternalDrop={false}`.

## Gotchas

- **You own the data.** Every operation fires a callback; nothing mutates `nodes` for you. If your `onMove` doesn't update state, the tree won't reflect the move. Use the exported helpers (`mergeLoadedChildren`) for nested updates.
- **`children: undefined` vs `children: []`.** `undefined` triggers `onLoadChildren` on first expand; `[]` is treated as known-empty (no loader fires; "(empty)" placeholder renders inline). Make sure your data layer returns `[]` for empty folders, not `undefined`.
- **`onLoadChildren` rejection** shows an inline error row + retry button under the folder. Throw real `Error` objects with useful messages (`throw new Error("Permission denied")`) — the `.message` is what the user reads.
- **Cut / copy / paste are not in v0.1.0.** Right-click → Cut isn't there. Use drag-to-move and right-click → Delete in the meantime. They land alongside `folder-manager` in v0.2.0 with a shared clipboard primitive.
- **Hidden files (dotfiles)** are filtered by default. Override with `showHidden={true}` or pass an `isHidden` predicate for app-specific rules (e.g., hide files with a `meta.archived` flag).
- **Selection ids are sanitized.** If you delete a node from `nodes` whose id is in `selectedIds`, the tree drops it from the visible selection on the next render. You don't need to clean up.
- **Indent saturates at 200px.** Trees deeper than ~10 levels visually flatten; the indent guide line still shows depth even when text indent caps.
- **The component is `"use client"`.** Don't try to render it from a server component without an intermediate client boundary.

## Migration notes

Greenfield component — no migration source. First "navigation" category entry; future siblings: `folder-manager` (Mac Finder dual-pane) and `command-palette` (cmd+k).

## Open follow-ups

| Tag | What | Bump target |
|---|---|---|
| Cut / copy / paste | Lands with `folder-manager` and a shared clipboard primitive | v0.2.0 |
| `dnd-kit` upgrade | If real consumer demand for polished touch DnD surfaces | v0.2.0 |
| Search / filter input | Inline search box that filters visible rows + auto-expands matches | v0.2.0 / sibling |
| Outline-style status badges | Git status (M/A/D), unsaved-dot, error/warn squiggles | v0.2.0+ |
| `disabled` / `readOnly` per-node | With visual treatment + op-blocking | v0.2.0 |
| Per-row hover actions | VS Code-style inline "+" / "+" / "..." per folder | v0.2.0+ |

Re-validation against real consumer use will surface what to prioritize first.
