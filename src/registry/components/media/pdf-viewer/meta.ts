import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "pdf-viewer",
  name: "PDF Viewer",
  category: "media",

  description:
    "Drop-in PDF reader with toolbar, zoom, selectable text, drag-drop, and right-click context menu — themed to your design system, no commercial SDK.",
  context:
    "Use anywhere a `File`, URL, `Blob`, or `ArrayBuffer` needs inline rendering — case management, contract review, knowledge bases, asset libraries, e-sign confirmations, attachment viewers. Continuous-scroll layout with native text selection via pdf.js text-layer; clickable embedded links via the annotation-layer.",
  features: [
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

  version: "0.1.3",
  status: "alpha",
  createdAt: "2026-05-10",
  updatedAt: "2026-05-10",

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

  related: ["media-carousel-01", "story-viewer-01", "video-player-01"],
};
