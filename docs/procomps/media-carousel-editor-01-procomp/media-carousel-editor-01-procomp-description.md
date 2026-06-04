# media-carousel-editor-01 — procomp description

> Stage 1: what & why. **GATE 1 — ✅ SIGNED OFF (2026-06-04).** Proceeding to GATE 2 (plan).
>
> **Greenfield, but composition-first.** This procomp does NOT re-implement any media editing. It is a multi-item *orchestrator* that drives a **single shared** [`media-editor-01`](../media-editor-01-procomp/) instance — the *edit panel* — loaded with the selected item **one at a time** (never N concurrent editors). The decisive architectural call (see §"Why a new procomp") is: **media-editor-01 stays single-item and is not touched** — so its other consumer (`story-composer-01`, Instagram-story = one media) is unaffected, and we add zero breaking risk to a shipped, shared procomp.
>
> Driven by hands-on testing of `content-composer-01`'s post media step on 2026-06-04: the post slot needs Instagram-feed semantics (one OR more mixed photo/video items, arrangeable, each editable) — which media-editor-01's single-item model can't express.

## Problem

`content-composer-01`'s `post` config wants Instagram-feed-post media: **a carousel of one-or-more items, mixing photos and videos, that the author can add, reorder, remove, and edit individually.** Today the media slot is a 1:1 passthrough onto `media-editor-01`, which is **single-item** end-to-end (one draft, one `editorState`, one `exportedUrl`) and exposes camera capture-mode tabs (photo XOR video) rather than a true multi-file intake.

Three things are missing, and none of them belong in media-editor-01 (which is correctly a *single-item* editor):

1. **A real multi-file intake** — drag-and-drop a dropzone + a "Browse" button with `multiple`, accepting `image/*` and `video/*` together. (media-editor-01 has a working *single-file* gallery picker + `validateGalleryFile` that already accepts both types, but only inside the camera/permission paths — never as a standalone, multi-file dropzone.)
2. **An ordered, reorderable collection UI** — a thumbnail rail + a main preview area, with drag-to-reorder, select, remove, and add-more.
3. **Per-item editing** — clicking *Edit* on the selected item opens the full media-editor-01 surface for *that* item and writes the edited result back into the collection.

The clean way to deliver all three without destabilizing media-editor-01 is a **new sibling procomp** that wraps it.

## Why a new procomp (not a media-editor-01 expansion)

| Option | Verdict |
|---|---|
| **Expand media-editor-01 to multi-item** (`multiple`/`maxItems` props + a new array state branch) | ❌ **Rejected.** media-editor-01 is shipped (v0.1.2) and shared. `story-composer-01` v0.2.1 depends on its single-item semantics. Bolting a multi-item model onto it muddies its identity (it's the *per-item* editor) and risks breaking a live consumer. |
| **New procomp `media-carousel-editor-01` that drives ONE media-editor-01 (the shared edit panel)** | ✅ **Recommended.** Pure composition — media-editor-01 untouched, story-composer-01 unaffected, zero breaking risk. A **single** editor instance is loaded with the selected item serially (never N concurrent editors — that would be heavy and trip media-editor-01's multi-instance guard). Mirrors the library's philosophy (content-composer composes media-editor; story-composer composes media-editor). The new procomp owns the *collection* concerns (intake, rail, order, preview, edit-panel lifecycle); media-editor-01 keeps owning the *single-item* concerns (capture, canvas, tools, export). |

This procomp is the **authoring counterpart to the existing [`media-carousel-01`](../../../src/registry/components/media/media-carousel-01/) viewer**: the viewer *displays* an ordered media set; this editor *produces* one. Their data shapes should align so the editor's output can feed the viewer directly (interop is a stated success criterion).

## What this procomp owns vs. delegates

**media-carousel-editor-01 owns:**
- Multi-file intake: drag-and-drop dropzone + `multiple` Browse button (image + video mixed); per-file type/size validation (reusing `validateGalleryFile`); `maxItems` cap.
- The ordered item collection model (`MediaItem[]`): add / remove / reorder / select.
- The **preview rail** — horizontal thumbnail strip, selectable, drag-to-reorder (`@dnd-kit/sortable`, horizontal strategy — **already a repo dependency**; `kanban-board-01` uses it, so no new package), keyboard-reorderable, remove-per-item, add-more affordance.
- The **main preview area** — renders the selected item (image or video).
- The **Edit lifecycle** — an Edit button pushes the *selected* item into a **single shared edit panel** (one media-editor-01 instance occupying the main area, keyed/seeded with that item via `initialSource`); on apply, the export replaces that item's content; selecting a different item and pressing Edit reloads the *same* panel with the new item. **Never more than one editor mounted at a time.** On exit, the panel collapses back to the read-only preview.
- Controlled + uncontrolled value (`MediaItem[]`), `onChange`, and an imperative handle (`getItems` / `export` / `addFiles`).

**Delegates to media-editor-01 (unchanged):**
- Capture surface, Konva canvas, all 6 edit tools, undo/redo, pan/zoom, filter/sticker libraries, single-item compositing + export.

## In scope (v0.1.0)

- Drag-and-drop + Browse intake (`multiple`), mixed `image/*` + `video/*`.
- Ordered `MediaItem[]` model; add / remove / reorder / select.
- Preview rail (thumbnails) with pointer **and** keyboard reorder; remove + add-more.
- Main preview area (image + video rendering).
- Per-item Edit → push selected item into the single shared edit panel (media-editor-01) → write-back on apply → collapse to preview.
- Per-file validation (type + size, via `validateGalleryFile`); `maxItems` cap (default 10, Instagram parity).
- Controlled / uncontrolled value; `onChange`; imperative handle (`getItems` / `export` / `addFiles`).
- Empty state (dropzone-only) ↔ populated state (rail + preview) transition.
- Pull-only export (mirrors media-editor-01's contract — the host calls `export()` at publish; the component never exports on its own).
- Design-token compliance + a11y (keyboard intake trigger, rail roving focus + keyboard reorder, labelled controls).

## Out of scope (v0.1.0 — deferred)

- **`"library"` source** (pick from existing backend media) — rides behind media-editor-01 v0.2 library source; the prop is *modeled* (declared) but clamped, same pattern content-composer used for the post config.
- **Camera as an add-source** — v0.1 intake is upload/drop/browse only. (Camera-per-item is a v0.2 candidate; media-editor-01 already owns the camera surface, so it's additive later.)
- **Full video editing per item** — media-editor-01 is photo-first; video items get preview + reorder + remove + (limited) edit. Depth tracks media-editor-01's own video maturity.
- **content-composer-01 integration** — wiring this into the post media slot is a **separate follow-on gate** (content-composer v0.2, breaking: `MediaSlotValue` grows single-URL → array). This description scopes the **standalone procomp**; it ships and demos on its own first. (See Q5 — resolved: standalone first.)
- Cross-item bulk operations (apply one filter to all), captions/alt-text per item, cover-frame selection for video.

## Target consumers

| Consumer | How it uses it |
|---|---|
| `content-composer-01` post slot (follow-on) | The post media step mounts this instead of media-editor-01; export feeds the (future) `post-content-item` adapter as an ordered media array. |
| Chat attachments (future `chat-panel`) | Multi-attachment compose tray. |
| Product/listing galleries (future) | Author an ordered product image/video set. |
| Any feed-post / album / carousel authoring surface | Drop-in multi-media composer. |

## Rough API sketch (illustrative — final shape is GATE 2)

```ts
type MediaKind = "image" | "video";

interface MediaItem {
  id: string;
  kind: MediaKind;
  source: { blobUrl: string } | { url: string };  // object-URL while local; remote URL on re-edit
  editorState?: SerializableMediaEditorState;       // media-editor-01 round-trip state (photo)
  exportedUrl?: string;                             // populated after export()
}

interface MediaCarouselEditor01Props {
  value?: MediaItem[];                 // controlled
  defaultValue?: MediaItem[];          // uncontrolled
  onChange?: (items: MediaItem[]) => void;
  maxItems?: number;                   // default 10
  maxFileSizeMb?: number;              // passthrough to validation + editor
  accept?: MediaKind[];                // default ["image","video"]
  sources?: ("upload" | "library")[]; // default ["upload"]; "library" clamped in v0.1
  editorProps?: Pick<MediaEditor01Props, "enabledTools" | "cropAspects" | "aspect" | "labels">;
  labels?: Partial<MediaCarouselEditorLabels>;
  // events (illustrative)
  onItemAdd?(item: MediaItem): void;
  onItemRemove?(id: string): void;
  onReorder?(items: MediaItem[]): void;
  onEditOpen?(id: string): void;
}

interface MediaCarouselEditor01Handle {
  getItems(): MediaItem[];
  export(): Promise<MediaItem[]>;      // pull-only; resolves exportedUrl per item
  addFiles(files: File[] | FileList): void;
}
```

(All items share **one aspect derived from item 1**, overridable — Q2, resolved.)

## Example usages

1. **Standalone (this gate's demo):** `<MediaCarouselEditor01 maxItems={10} editorProps={{ enabledTools: ["crop","filters","adjust"] }} onChange={setItems} />` — drop 4 photos + a video, reorder, edit item 2, publish.
2. **content-composer post slot (follow-on):** the post config's `mediaSlot` mounts this; `export()` returns the ordered array to the post adapter.
3. **Re-edit (CMS):** seed `defaultValue` with remote URLs of an existing post's media; author reorders/adds/edits and re-publishes.

## Success criteria

- Drop **and** browse-pick multiple mixed image+video files → they appear in the rail, ordered, validated.
- Rail reorders by pointer drag and by keyboard; selection drives the main preview; remove works; add-more works.
- Edit on the selected item opens the single shared edit panel (one media-editor-01); applying writes the edited result back to that exact item without disturbing order; switching to another item and editing reuses the same panel. At most one editor mounted at any time.
- `export()` returns an ordered array; output shape is consumable by `media-carousel-01` (viewer interop).
- **media-editor-01 source is unchanged** (diff touches only the new folder + registry/manifest); story-composer-01 still passes its gates.
- tsc / lint / meta-deps clean; GATE 3 spot-check ≥ Pass with follow-ups.

## Carried risk (from content-composer-01 v0.1.1 / F-01)

This procomp composes media-editor-01, so it will import a value (`validateGalleryFile`) and types from it. The F-01 lesson: the shadcn rewriter **mangles cross-procomp `@/registry/.../types` subpath imports**, and a cross-procomp dependency needs a `registryDependency` entry **even if it looks type-only**. Mitigations carried into GATE 2: (a) import `validateGalleryFile` + types from media-editor-01's **package entry / `.tsx` path**, never a deep `/types` subpath; (b) declare `@ilinxa/media-editor-01` as a `registryDependency`; (c) verify with a **local-registry re-smoke** (serve `public/r`, repoint a tmp consumer, `shadcn add` + `tsc`) before push — the ship→smoke→patch→re-smoke pattern.

## Open questions — RESOLVED (2026-06-04 sign-off)

- **Q1 — Name.** ✅ **`media-carousel-editor-01`** (pairs with the `media-carousel-01` viewer; unambiguous editor counterpart).
- **Q2 — Aspect.** ✅ **Shared, derived from item 1** (Instagram behaviour), **configurable/overridable**. The shared edit panel crops each item to match.
- **Q3 — Edit presentation.** ✅ **Single shared edit panel** occupies the main area. Edit pushes the selected item in; on done the output replaces that item; switching items reloads the same panel. One editor instance, serial use — not N.
- **Q4 — Video Edit depth in v0.1.** ✅ **Accepted default:** video items get preview + reorder + remove + limited edit; full video editing tracks media-editor-01's own video maturity.
- **Q5 — content-composer integration timing.** ✅ **Standalone first, separate follow-on gate.** This procomp ships + demos + GATE-3s on its own; a later gate wires it into content-composer's post slot (breaking content-composer v0.2).
- **Q6 — `maxItems` default.** ✅ **10** (Instagram parity), overridable via prop.
