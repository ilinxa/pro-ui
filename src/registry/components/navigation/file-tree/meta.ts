import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "file-tree",
  name: "File Tree",
  category: "navigation",

  description:
    "VS Code-style hierarchical file tree with format-aware icons, full CRUD, drag-and-drop, lazy children, and multi-select.",
  context:
    "Use anywhere a hierarchical-node array needs an interactive tree — code editors, document workspaces, asset libraries, schema browsers, low-code builders, or as the sidebar inside a dual-pane Finder layout. Controlled-data; consumer owns the `nodes` array; component fires object-shape callbacks on every operation.",
  features: [
    "Arbitrary-depth nesting with chevron expand/collapse",
    "Format-aware Lucide icons (override per-node or via `iconForNode`)",
    "Controlled or uncontrolled selection + expansion",
    "Single + multi-select with Cmd/Ctrl+click and Shift+click range",
    "Right-click menu with default actions + `renderContextMenu` slot",
    "Inline rename via F2 / double-click + optional `validateRename`",
    "Drag-and-drop reorder with cycle / self-drop pre-validation",
    "Drag-from-OS support — `onExternalDrop` fires with files + targetId",
    "Lazy children loading via `onLoadChildren` + exported `mergeLoadedChildren` helper",
    "Auto-virtualization at ≥200 visible rows (TanStack Virtual)",
    "Indent guides + sticky header + sortable + hide-dotfiles",
    "Built-in delete confirmation dialog (replaceable via slot)",
    "Standalone header parts for custom chrome composition",
    "Object-shape callbacks (F-cross-12-correct from day one)",
    "WCAG 2.1 AA — `role=tree`, `aria-level/setsize/posinset/expanded/selected`, focus-visible",
  ],
  tags: [
    "tree",
    "navigation",
    "filesystem",
    "explorer",
    "hierarchy",
    "file",
    "folder",
    "vscode",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-10",
  updatedAt: "2026-05-10",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["alert-dialog", "button", "context-menu", "tooltip"],
    npm: {
      "@tanstack/react-virtual": "^3.13.24",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: [],
};
