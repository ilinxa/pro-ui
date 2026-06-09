import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-library-01",
  name: "Media Library 01",
  category: "media",

  description:
    "A Google-Drive-style media library: folders + files with lazy loading, drag-drop upload, drag-to-move, right-click menus, and multi-type file preview (image / video / PDF / code / JSON / text / Markdown).",
  context:
    "A composition-first CMS/asset surface. It owns the Drive shell — storage-quota bar, type-filter chips, folder-card row, thumbnail grid, upload pipeline, and a preview dispatcher — and delegates every actual file render to the shipped viewers (pdf-viewer, code-block, markdown-editor, video-player-01) plus a folder-navigation file-tree. Ships shadcn-style: one batteries-included <MediaLibrary01> plus a headless <MediaLibraryRoot> + à-la-carte parts, so consumers drop what they don't need and tree-shake the unused viewers away.",
  features: [
    "Three tiers: full <MediaLibrary01>, headless <MediaLibraryRoot> + parts, and standalone primitives (FilePreview, QuotaBar, FileCard)",
    "Multi-type preview dispatcher (image / video / pdf / code / json / text / markdown) in both a side pane and a full-screen lightbox with prev/next",
    "Lazy-loaded viewers (React.lazy) — dropping the preview parts drops pdf.js / CodeMirror / marked from the bundle",
    "Drag-drop upload (optimistic items + per-file progress + retry) via a consumer onUpload callback",
    "Drag-to-move files/folders with self/cycle drop validation; right-click context menus; cut → paste move",
    "Storage-quota bar, type-filter chips with live counts, breadcrumb navigation, lazy onLoadChildren",
    "Controlled/uncontrolled selection + current folder; imperative handle; full label i18n",
  ],
  tags: ["media", "library", "files", "drive", "upload", "preview", "drag-drop", "folders", "cms"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-06-09",
  updatedAt: "2026-06-09",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "context-menu", "dialog", "input", "progress", "skeleton"],
    npm: {
      "@dnd-kit/core": "^6.3.1",
      "date-fns": "^4.1.0",
      "lucide-react": "^1.11.0",
    },
    internal: ["file-tree", "pdf-viewer", "code-block", "markdown-editor", "video-player-01"],
  },

  related: [
    "file-manager",
    "file-tree",
    "pdf-viewer",
    "code-block",
    "markdown-editor",
    "video-player-01",
  ],
};
