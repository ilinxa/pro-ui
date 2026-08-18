import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "pdf-viewer",
  name: "PDF Viewer",
  category: "media",

  description:
    "Drop-in PDF reader — toolbar, zoom, selectable text, drag-drop, and a themed context menu. No commercial SDK.",
  context:
    "Use anywhere a `File`, URL, `Blob`, or `ArrayBuffer` needs inline rendering — case management, contract review, knowledge bases, asset libraries, e-sign confirmations, attachment viewers. Continuous-scroll layout with native text selection via pdf.js text-layer; clickable embedded links via the annotation-layer.",
  features: [
    "v0.1.6 — the `renderContextMenu` slot opens on right-click at the pointer with a working `closeMenu` (Escape closes); it previously rendered unconditionally in the corner and could not be dismissed",
    "Sources: URL / File / Blob / ArrayBuffer",
    "Drag-and-drop a PDF onto the viewer to open it",
    "Continuous-scroll page rendering",
    "Built-in toolbar + renderToolbar slot + standalone toolbar parts",
    "Ctrl/Cmd + wheel zoom with cursor-anchored scaling",
    "Pinch-zoom on touch devices via Pointer Events",
    "Selectable text via pdf.js text-layer; native browser copy",
    "Right-click context menu (text-aware) with custom slot override",
    "Auto-virtualization for large PDFs (≥50 pages by default)",
    "Password-protected PDFs with default Dialog + custom slot",
    "High-DPI print rendering via hidden iframe",
    "Theme-aware (light + dark via design tokens)",
    "Object-shape callbacks (F-cross-12-correct from day one)",
    "WCAG 2.1 AA — toolbar role, aria-live page indicator, keyboard nav",
    "v0.1.4 — F-cross-13 path-b sweep: toolbar parts drop `asChild` (Tooltip/DropdownMenu triggers render directly as buttons via `buttonVariants(…)`; ContextMenuTrigger wraps via `className=\"contents\"` — Base-UI consumer primitives lack Slot support). Zero public-API change.",
  ],
  tags: [
    "pdf",
    "viewer",
    "document",
    "reader",
    "media",
    "attachment",
    "react-pdf",
    "pdfjs",
  ],

  version: "0.1.6",
  status: "alpha",
  artifactBudgetKB: 110,
  createdAt: "2026-05-10",
  updatedAt: "2026-08-19",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "button",
      "context-menu",
      "dialog",
      "dropdown-menu",
      "input",
      "separator",
      "skeleton",
      "tooltip",
    ],
    npm: {
      "react-pdf": "^10.4.1",
      "pdfjs-dist": "5.4.296",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["media-carousel", "story-viewer", "video-player"],
};
