import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "file-manager",
  name: "File Manager",
  category: "navigation",

  description:
    "Mac Finder-style file + folder browser with grid / list views, multi-select with marquee, cut/copy/paste, drag-and-drop, and a shared clipboard primitive.",
  context:
    "Pairs with `file-tree` (the sidebar primitive) for the dual-pane Finder layout — drop `<FileTree>` into `<FileManager>`'s `sidebar` slot. Use anywhere a current-folder content view is needed: asset libraries, document workspaces, attachment managers, S3-bucket explorers. Controlled-data, object-shape callbacks, lazy children. The new `<FileClipboardProvider>` syncs cut/copy/paste across multiple instances.",
  features: [
    "Grid + list view modes with three icon sizes (sm/md/lg) in grid mode",
    "Path bar / breadcrumbs with click-to-edit text input mode",
    "Back / Forward / Up navigation with built-in 50-entry history (controllable bypass)",
    "Multi-select with Cmd/Ctrl+click, Shift+click range, Cmd/Ctrl+A, plus marquee (drag-rectangle)",
    "Cut / copy / paste backed by a shared `<FileClipboardProvider>` primitive",
    "Right-click menu (Open / New / Cut / Copy / Paste / Rename / Delete / Refresh) with `renderContextMenu` slot",
    "Inline rename via F2 / double-click; optional `validateRename`",
    "Drag-and-drop within the manager (move) + drag-from-OS (`onExternalDrop`)",
    "Cycle / self-drop pre-validation; only folders are valid drop targets",
    "Lazy children loading via `onLoadChildren` + exported `mergeLoadedChildren` helper",
    "Built-in sort menu (Name / Modified / Size / Type, asc/desc) + sortable list-view headers",
    "Search input filtering current folder by name (case-insensitive substring)",
    "Type-ahead select (typing letters jumps focus to matching name)",
    "Status bar (item count / selected / total size); replaceable via `renderStatusBar`",
    "Sidebar + details slots for dual-pane / preview compositions",
    "List-view virtualization at >=200 items via TanStack Virtual",
    "Object-shape callbacks (F-cross-12-correct from day one)",
    "WCAG 2.1 AA — `role=grid`, `aria-multiselectable`, roving tabindex, live-region announcements",
  ],
  tags: [
    "file",
    "folder",
    "manager",
    "navigation",
    "explorer",
    "finder",
    "filesystem",
    "grid",
    "list",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-10",
  updatedAt: "2026-05-10",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "alert-dialog",
      "button",
      "context-menu",
      "dropdown-menu",
      "input",
      "toggle-group",
      "tooltip",
    ],
    npm: {
      "@tanstack/react-virtual": "^3.13.24",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["file-tree"],
};
