import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "carousel-composer",
  name: "Carousel Composer",
  category: "media",

  description:
    "Multi-item media post composer — drag in photos and videos, reorder them on a rail, alt text and upload status per item; image editing is an add-on.",
  context:
    "The authoring counterpart to the media-carousel viewer. The base owns the collection concerns — file intake (drop + multiple browse, MIME-inferred, an optional exact MIME allow-list and video length limit), the ordered MediaCarouselItem model (controlled or uncontrolled), the @dnd-kit reorderable thumbnail rail, the main preview, per-image alt text, host-owned upload status / progress / retry, and a poster frame + duration for each video. A video item's output is always the original file — nothing in the folder re-encodes video. Image editing is NOT in the base: the feature item `carousel-composer-editing` (into `features/editing/`) supplies an edit panel built on media-editor and is passed in through the `editing` prop, so a plain install pulls no media-editor or Konva; a host can also inject its own panel. Edits flatten on apply, so the rail and preview are always publish-ready; export() is pull-only. Intake is upload-only (`\"library\"` is ignored). Output is shaped to feed media-carousel. Primary downstream consumer: content-composer's post media slot (mediaCarouselSlot substrate), which wires the editing add-on.",
  features: [
    "Multi-file intake — drag-and-drop dropzone + multiple Browse, mixed image + video (MIME-inferred, no capture-mode tabs)",
    "Type checks — `accept` kinds plus an exact `acceptMime` allow-list (also the file input's accept); `PLATFORM_SAFE_MIME` refuses WebM; `maxVideoSeconds` from the file's duration",
    "Ordered MediaCarouselItem model — add / remove / reorder / select; controlled `value` wins every render",
    "Reorderable thumbnail rail (@dnd-kit horizontal sortable) with pointer + keyboard reorder, a dedicated drag handle and labelled drag announcements",
    "Main preview of the selected item (image cover-fit; video on a media-overlay mat)",
    "Alt text (`enableAltText`, `maxAltLength`) — images by default; `\"all\"` or a per-item function describes videos too (the preview video is named by it); carried on the item through onChange",
    "Pan inside the shared frame (`enablePan`) — drag or arrow keys move an image's `cropOffset`; preview, rail thumb and `export()`'s `crop` follow it (`onCropOffsetChange`)",
    "Non-drag reorder (`reorderButtons`) — a move earlier / later pair per thumb (shown on thumb hover or when focused, logical in RTL, announced), `onMove`, handle `moveItem`",
    "Escape guard — while an edit panel reports busy (`onBusyChange`; the add-on reports its load and save) Escape never reaches a host dialog; `onEditingChange` lets a host gate its own dialog",
    "Host-owned upload status — `status` / `progress` / `error` on the item, a progress indicator on thumb and preview, Retry via `onRetry`, polite announcements on status changes, handle `updateItem`",
    "Video poster frame (JPEG `posterBlob` at `posterAt`) and a duration badge (`formatDuration` / `locale`); the video itself is never re-encoded",
    "Image editing as an opt-in add-on (`editing` prop, `@ilinxa/carousel-composer-editing`) — no Edit button and no media-editor in the install without it; `canEditItem` decides per item",
    "Shared aspect across the carousel (Instagram behaviour) — any media-editor crop aspect (named, `\"original\"` = item 1's ratio, `\"W:H\"` such as `\"1.91:1\"`); `\"auto\"` snaps item 1 to the nearest option; controlled (`aspect` + `onAspectChange`) or `defaultAspect`; an `aspectOptions` switch on item 1; preview, rail thumbs and the edit panel follow it, an edit exports at it, and `export()` reports each image's centred `crop`",
    "Imperative handle — getItems / export / addFiles / removeItem / moveItem / updateItem / select / openEditor / reset; pull-only export()",
    "Every string in `labels` (functions where a value varies); media-overlay tokens; logical (RTL-safe) layout",
    "Per-file type + size validation; maxItems cap (default 10, Instagram parity)",
    "Object-URL lifecycle managed (items and posters revoked on remove / replace / reset / unmount)",
  ],
  tags: [
    "carousel-composer",
    "carousel",
    "gallery",
    "media",
    "uploader",
    "editor",
    "drag-and-drop",
    "instagram",
  ],

  version: "0.5.0",
  status: "alpha",
  // 0.3.0: 70 → 115 on the built size after both fix waves (105.3 KB; U1 estimated ~64).
  // The growth is the labels surface + JSDoc in types.ts, the alt / upload-status /
  // poster features and the review / browser fixes (focus hand-off, URL ownership, RTL); image editing
  // left for the feature item (~10 KB).
  // 0.4.0: shared any-ratio aspect (resolution, switch part, guarded number format, crop
  // rects, thumb box) + the fix wave: built 121.1 KB → 115 → 135.
  // 0.5.0: alt for videos, pan (pending offset, pointer capture, keys), Escape guard, reorder
  // buttons + two review / browser fix waves: built 147.8 KB → 135 → 155.
  artifactBudgetKB: 155,
  createdAt: "2026-06-05",
  updatedAt: "2026-10-30",

  author: { name: "ilinxa" },

  dependencies: {
    // @dnd-kit drives the rail reorder (already a repo dep via kanban-board).
    // react is baseline (audit-whitelisted); lucide-react is declared
    // explicitly (review 3.3 — transitive-only installs break Base-UI
    // consumers). Re-audited via validate:meta-deps, which walks the whole
    // folder including `features/editing/` — so `internal` lists media-editor
    // for the editing feature. The base registry item does NOT depend on it;
    // only `carousel-composer-editing` does (registry.json).
    shadcn: ["button", "input", "scroll-area"],
    npm: {
      "@dnd-kit/core": "^6.3.1",
      "@dnd-kit/sortable": "^10.0.0",
      "@dnd-kit/utilities": "^3.2.2",
      "lucide-react": "^1.11.0",
    },
    internal: ["media-editor"],
  },

  slices: [
    {
      name: "editing",
      item: "carousel-composer-editing",
      description:
        "Image editing through media-editor — the edit panel, re-edit of earlier edits and typed readers for the edit fields, wired in through the editing prop.",
    },
  ],

  related: ["media-editor", "media-carousel", "content-composer"],
};
