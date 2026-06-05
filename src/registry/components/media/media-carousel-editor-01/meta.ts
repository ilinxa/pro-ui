import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-carousel-editor-01",
  name: "Media Carousel Editor 01",
  category: "media",

  description:
    "Multi-item media composer (Instagram-feed-post semantics): drag-drop / browse one-or-more mixed photo+video files into an ordered, reorderable rail with a main preview, and edit any item through a single shared media-editor-01 panel.",
  context:
    "The authoring counterpart to the media-carousel-01 viewer. Composes the shipped media-editor-01 WITHOUT modifying it: a single editor instance is loaded serially with the selected item (never N at once, so it can't trip media-editor-01's multi-instance guard). The procomp owns the collection concerns — file intake (drop + multiple browse, MIME-inferred so there are no photo/video capture tabs), the ordered MediaCarouselItem model, the @dnd-kit reorderable thumbnail rail, the main preview, and the edit-panel lifecycle (Edit → mount media-editor-01 in edit-only mode → flatten export back into the item). Edits flatten on apply so the rail/preview are always publish-ready; export() is pull-only. v0.1 intake is upload-only (library clamped) and video items are preview/reorder/remove + limited edit. Output is shaped to feed media-carousel-01. Primary downstream consumer: content-composer-01's post media slot (wired in content-composer-01 v0.2 via the mediaCarouselSlot substrate).",
  features: [
    "Multi-file intake — drag-and-drop dropzone + multiple Browse, mixed image + video (MIME-inferred, no capture-mode tabs)",
    "Ordered MediaCarouselItem model — add / remove / reorder / select",
    "Reorderable thumbnail rail (@dnd-kit horizontal sortable) with pointer + keyboard reorder and a dedicated drag handle",
    "Main preview of the selected item (image cover-fit; video on a black mat)",
    "Single shared media-editor-01 edit panel — Edit pushes the selected item in, flattens the export back on Done, reloads the same panel for the next item",
    "Shared aspect across the carousel (Instagram behaviour) — `aspect=\"auto\"` derives from item 1, overridable",
    "Controlled / uncontrolled value (value / defaultValue / onChange) + imperative handle (getItems / export / addFiles / removeItem / select / openEditor / reset)",
    "Pull-only export() — items already flattened on edit-apply",
    "Per-file type + size validation; maxItems cap (default 10, Instagram parity)",
    "Object-URL lifecycle managed (revoked on remove / replace / reset / unmount)",
  ],
  tags: [
    "media-carousel-editor-01",
    "carousel",
    "gallery",
    "media",
    "uploader",
    "editor",
    "drag-and-drop",
    "instagram",
  ],

  version: "0.1.2",
  status: "alpha",
  createdAt: "2026-06-05",
  updatedAt: "2026-06-05",

  author: { name: "ilinxa" },

  dependencies: {
    // @dnd-kit drives the rail reorder (already a repo dep via kanban-board-01).
    // Konva/react-konva arrive transitively through media-editor-01's
    // registryDependency, not re-declared here. react + lucide-react are
    // baseline (audit-whitelisted). Re-audited via validate:meta-deps.
    shadcn: ["button", "scroll-area"],
    npm: {
      "@dnd-kit/core": "^6.3.1",
      "@dnd-kit/sortable": "^10.0.0",
      "@dnd-kit/utilities": "^3.2.2",
    },
    internal: ["media-editor-01"],
  },

  related: ["media-editor-01", "media-carousel-01", "content-composer-01"],
};
