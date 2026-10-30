# `carousel-composer` — Pro-component Guide (Stage 3)

> **Status:** shipped · **v0.5.0** · maturity `alpha` · category `media`
> **Planning trio:** [description](carousel-composer-procomp-description.md) · [plan](carousel-composer-procomp-plan.md) · this guide
> **Loop record:** [carousel-composer-loop.md](carousel-composer-loop.md) ("Run — Part 3 release 6")
>
> Rewritten 2026-10-26 for v0.3.0; §6, §7, §10, §11 and §13 updated 2026-10-29 for v0.4.0 (one shared aspect, any
> ratio — "Run — release 8" in the media-editor loop record); §7, §8, §10, §11, §13 and the new §7b updated 2026-10-30 for
> v0.5.0 (pan, alt for videos, non-drag reorder, Escape guard — "Run — release 10"). Documented against source.

---

## 1. What it is

The authoring surface for a **multi-item media carousel**: drop or pick files, reorder them by
drag, select one, add alt text, show the host's upload progress, and hand the committed list back.
Image editing is an **opt-in add-on** (`@ilinxa/carousel-composer-editing`, built on
[`media-editor`](../media-editor-procomp/)) passed in through the `editing` prop — a plain install
pulls no media-editor and no Konva.

Think "Instagram carousel composer": a rail of thumbnails, a main preview, an optional edit panel.

## 2. When to use / when NOT to use

**Use when** the user is *building* a carousel — social composers, CMS gallery blocks, product
image sets.

**Skip when:**
- **You only need to display a carousel.** Use [`media-carousel`](../media-carousel-procomp/).
- **You need a full media library** with folders, search, and quota. That is
  [`media-library`](../media-library-procomp/).
- **You need single-image editing.** Use `media-editor` directly.

## 3. Installation

```bash
pnpm dlx shadcn@latest add @ilinxa/carousel-composer
# image editing (adds media-editor + Konva):
pnpm dlx shadcn@latest add @ilinxa/carousel-composer-editing
```

The base pulls `button`, `input`, `scroll-area`; npm `@dnd-kit/core`, `@dnd-kit/sortable`,
`@dnd-kit/utilities`, `lucide-react`. The editing item installs into
`components/carousel-composer/features/editing/` and pulls `@ilinxa/media-editor`.

## 4. Quick start

```tsx
import { CarouselComposer, PLATFORM_SAFE_MIME, type MediaCarouselItem } from "@/components/carousel-composer";

const [items, setItems] = useState<MediaCarouselItem[]>([]);

<CarouselComposer
  value={items}
  onChange={setItems}
  maxItems={10}
  acceptMime={PLATFORM_SAFE_MIME}   // jpeg / png / webp / gif / mp4 / quicktime — no WebM
  maxVideoSeconds={60}
  enableAltText
/>
```

Uncontrolled works too — pass `defaultValue` and read through `onChange` or the handle. A controlled
`value` wins on every render.

## 5. Object URLs — the thing to get right

Items the component creates from `File` objects carry **object URLs it owns** — the item `url` and,
for videos, the `posterUrl`. It revokes an owned URL once it has left the committed items (removed,
replaced by an edit or by your `updateItem` / `value`), on `reset()`, and on unmount. A URL is only
revoked after it has been seen in the committed items, so a controlled host that echoes `onChange` a
render late never renders a dead URL.

```tsx
revokeOnUnmount?: boolean   // default: true
```

> ⚠️ **Set `revokeOnUnmount={false}` only when a host deliberately preserves the live items across
> a remount and takes over cleanup itself** — the `content-composer` carousel cache is the reference
> case (it revokes item and poster URLs when the composer unmounts). Get this wrong in the other
> direction and you leak every blob the user ever picked; get it wrong in this direction and your
> previews turn into broken images the moment the component remounts.

## 6. Image editing (add-on)

```tsx
import { carouselEditing, type CarouselEditorProps } from "@/components/carousel-composer/features/editing";

const editorProps: CarouselEditorProps = { enabledTools: ["crop", "filters", "adjust"] };

<CarouselComposer value={items} onChange={setItems} editing={carouselEditing} editorProps={editorProps} />
```

- **Without `editing`** there is no Edit button (and no "video not editable" caption); `openEditor()`
  and `editorProps` each log one development warning.
- **`canEditItem(item)`** decides per item (default: images). A video is never editable — its output
  is always the original file.
- **`editorProps`** reaches the panel; the add-on's panel forwards only `enabledTools`, `stickers`,
  `fonts`, `colorPresets`, `filterPresets`, `labels`. Crop aspect, the source and the editor's modes
  stay the carousel's (§7).
- **Your own editor:** `editing={{ Panel }}` — `Panel` receives `{ item, aspect, aspectRatio, labels, editorProps,
  onApply(id, patch), onCancel, onBusyChange? }` (`CarouselEditorPanelProps`; `onBusyChange` 0.5.0, see §9). `aspect` is a named ratio, `"free"` or `"W:H"` —
  never `"original"`, which arrives resolved to item 1's pixels (`"4000:3000"`) — and `aspectRatio` is its width /
  height (`null` for free). `onApply` is accepted only for the
  item being edited.
- **The edit closes by itself** when its item leaves the list, when `editing` is removed, or when
  `canEditItem` turns false for it (`onEditCancel` fires).
- **Focus:** the panel takes focus when it opens (unless your Panel moves focus inside it) and focus
  returns to the Edit button, or the selected thumb, when it closes.
- **Done with no change keeps the item** (0.3.1): nothing is re-encoded and `onEditCancel` fires, as for Cancel.
  After a change, the add-on exports only the photo's area (`region: "media"`) at the photo's own resolution, so no
  letterbox bars are baked in, and the item's `width` / `height` are the image's pixels. **0.4.0:** with a shared
  ratio the result is then trimmed, centred, to the largest rect of that ratio inside its own pixels (never upscaled),
  so an edited item comes back at the shared aspect even when the crop tool was not used. Needs media-editor 0.7.0
  for `"W:H"` aspects (0.6.0 for the rest).
- **Applying an edit clears the item's `status` / `progress` / `error`** — the edited media is not
  the file you uploaded; re-upload it from `onEditApply`.
- **Typed edit fields:** the base keeps `item.editorState` opaque (`unknown`) and `item.exportMeta` as
  a small `CarouselExportMeta`; read them typed with `editorStateOf(item)` / `exportMetaOf(item)` from
  the add-on.

## 7. The shared-aspect guarantee

`aspect` is owned **here**, not by the embedded editor. A carousel whose items crop to different shapes is a broken
carousel, so the composer holds that dial and every frame follows it: the main preview, the rail thumbs (the shared ratio
inside a 7.5 × 4 rem box: 4 rem tall, wide ratios shorter; at least 2 rem wide), the edit panel (media-editor's canvas `aspect` and its only crop aspect) and
the edit's export.

```tsx
const [aspect, setAspect] = useState<CarouselAspectRatio>("4:5");

<CarouselComposer
  value={items}
  onChange={setItems}
  aspect={aspect}                                   // controlled (0.4.0)…
  onAspectChange={setAspect}
  aspectOptions={["original", "1:1", "4:5", "1.91:1"]}
/>
// …or uncontrolled: defaultAspect="4:5" (onAspectChange still reports)
```

| Value | Frame |
|---|---|
| `"9:16"`, `"1:1"`, `"16:9"`, `"4:5"`, any `"W:H"` (`"1.91:1"`) | that ratio (an invalid `"W:H"` → 1:1, one development warning) |
| `"original"` | item 1's own ratio (1:1 until its size is known) |
| `"auto"` (default) | the nearest of `aspectOptions` (their named / `"W:H"` entries; without options the four named ratios) to item 1's ratio, 1:1 until known — nearest by ratio, so a 4:3 photo snaps to 1:1 among the four |
| `"free"` | 1:1 frames, each item keeps its own ratio, no trim, no `crop` |

- **The switch** (`aspectOptions`, at least two distinct valid entries) shows on the main preview while item 1 is
  selected and nothing is being edited — the first photo decides, as on Instagram. Its buttons are `aria-pressed`,
  the group is named `labels.aspectSwitch`, each option `labels.aspectOption(aspect, format)`. A pick calls
  `onAspectChange` (not for the option already selected). A controlled `aspect` without `onAspectChange` makes the
  switch do nothing — one development warning.
- **What you upload.** `handle.export()` gives each image of known size a `crop` — the rect of the shared ratio in
  that item's media pixels, centred unless the author panned it (§7b), the whole image when it already has the ratio
  (as an edit does). Upload the region, or crop server-side, to publish every item at the shared aspect. Videos,
  `"free"` and items of unknown size get no `crop`. `centredCropRect(width, height, ratio)` is exported for your own
  uploads.
- **After a switch** items edited earlier keep the aspect they were edited at (their pixels outside it were trimmed);
  their `crop` is the centred crop of that image. Re-edit restores the original photo (`sourceBlob`).

## 7b. Pan inside the frame (0.5.0)

`enablePan` lets the author drag a photo inside the shared frame (Instagram): every photo after the first is no
longer stuck at its centre.

```tsx
<CarouselComposer value={items} onChange={setItems} aspect="1:1" enablePan
  onCropOffsetChange={(id, offset) => saveFraming(id, offset)} />
```

- **What moves:** the item's `cropOffset` `{ x, y }` — a focal point from 0 to 1 over the image's own pixels (`x` 0 =
  left edge; images are not mirrored in RTL), 0.5 = centred (the default). Only the axis the image overflows on matters.
- **Who follows it:** the main preview and the rail thumb (`object-position`) and `export()`'s `crop` — one formula,
  so what the author sees is what you upload. An edit made after a pan keeps the framing (the edit panel trims at it)
  and then clears `cropOffset` (the new image already has the ratio).
- **Gestures:** pointer drag on the preview (buttons on it — aspect switch, Edit — still click), arrow keys on the
  focused preview (5 %, Shift 20 %), named by `labels.panHint`. Only images whose ratio differs from the frame pan;
  videos, `"free"` and items of unknown size don't. On touch the preview takes only the overflow axis
  (`touch-pan-y` for a wide photo), so the page still scrolls the other way.
- **Kept / cleared:** an upload that swaps the item's `url` for the uploaded one keeps the offset; an `updateItem`
  that changes `width` / `height` (a different image) clears it unless the same patch sets it.
- **Controlled hosts:** the dragged position stays on screen until your `value` carries it; a host that never
  accepts the change keeps showing the dragged position (there is no reject signal). No zoom.

## 8. Alt text, upload status, video

- **Alt text** (`enableAltText`, `maxAltLength` default 200): a labelled field and counter under the selected item;
  typing updates `item.alt` through `onChange`. `true` / `"images"`: images only; `"all"` (0.5.0): videos too, with
  `labels.altPlaceholderVideo`; a function `(item) => boolean` decides per item. Every `<img>` uses
  `alt ?? fileName ?? ""`; the preview `<video>` is named by its `alt`.
- **Upload status** is yours: set `status` (`"pending" | "uploading" | "uploaded" | "error"`),
  `progress` (0–1) and `error` on the item — in `value` (controlled) or with
  `ref.current.updateItem(id, patch)`. The thumb and the preview show a progress indicator, an error
  with a Retry (when `onRetry` is wired), and each status change is announced politely (a change of
  `error` text too). Focus moves to the item's progress indicator after Retry, to the neighbouring
  thumb (or the Browse button) after Remove, and back into the component after the error alert's
  Dismiss. Remove buttons and progress indicators are named with the item's position.
- **Videos:** on add the carousel reads `duration` and grabs a JPEG poster frame at `posterAt`
  (default 0.5 s, `false` for none; the frame is scaled to at most 1280 px on its longer edge) into
  `posterBlob` / `posterUrl`; thumbs show the poster and a duration badge (`formatDuration`, default
  `m:ss` with digits in `locale`). A video's `blob` is the identical `File` you added — nothing in the
  folder re-encodes video. A video whose metadata can't be read in 8 s is accepted without a duration
  or poster, so `maxVideoSeconds` cannot be checked for it.

## 9. Commit semantics

An open edit is **not** part of the value until applied:

- applying flattens the edit into the item and fires `onChange` + `onEditApply`;
- `handle.export()` resolves a copy of the **committed** ordered items only.

> ⚠️ **Gate publish while an edit is open.** Track `onEditOpen` / `onEditApply` / `onEditCancel` (or
> `onEditingChange(editing)`, 0.5.0) and disable your submit button between open and apply.

**Escape and a host dialog (0.5.0).** A panel reports work in progress with `onBusyChange(busy)` (the shipped editing
add-on reports its photo load and its Done save). While a panel is busy the carousel swallows Escape at window capture,
before Radix or Base UI see it, so a dialog around the carousel does not close mid-preparation. A custom panel calls
`onBusyChange(true)` / `(false)` around its own async work; unmounting clears it. When nothing is busy Escape behaves
as before — gate your dialog's close on `onEditingChange` if you want it to stay open during any edit.

**Reorder without drag (0.5.0).** `reorderButtons` adds a "move earlier / move later" pair to each rail thumb, shown while
the thumb is hovered or one of the pair has focus (Tab reaches it) (`labels.moveEarlier` / `moveLater({ position, total })`, logical — earlier is towards item 1 in any
direction), announced with `labels.moved(position, total)`. Focus stays on the button; at the ends it is
`aria-disabled`. Each move fires `onReorder` and `onMove(id, delta)`; `handle.moveItem(id, delta)` does the same
without UI (clamped; ignored while an edit is open) — the testable path.

## 10. Imperative handle

```tsx
const ref = useRef<CarouselComposerHandle>(null);

ref.current?.getItems();            // the latest items, synchronously (also inside your callbacks)
await ref.current?.export();        // copy of the committed items (see §9), images with `crop` (§7)
ref.current?.getAspect();           // { aspect, ratio } as resolved now — "auto" / "original" resolved (0.4.0)
await ref.current?.addFiles(files); // File[] | FileList — same path as the dropzone, current props
ref.current?.removeItem(id);
ref.current?.moveItem(id, delta);   // −1 earlier / +1 later, clamped; fires onReorder + onMove (0.5.0)
ref.current?.updateItem(id, patch); // status / progress / error / url / alt / cropOffset …; unknown id = no-op
ref.current?.select(id);            // null clears selection
ref.current?.openEditor(id);        // needs `editing`; videos and refused items are ignored (dev-warn)
ref.current?.reset();               // revokes owned URLs and clears
```

## 11. Labels and locale

Every visible and announced string is in `labels`; strings that carry a value are functions
(`dropzoneHint(max)`, `maxReached(max)`, `itemAria({ position, total, kind, alt, status })`,
`itemsAdded(count)`, `altCounter(length, max)`, `uploadProgress(progress, { position, total })`,
`removeItem({ position, total, kind })`, `uploadStatus(…)`,
`durationLabel(formatted)`, `aspectOption(aspect, format)` (0.4.0), `errors.*`, `drag.*`). The 0.4.0 keys
`aspectSwitch` / `aspectOption` are optional in `CarouselComposerLabels`, so a full 0.3 labels object still
type-checks — and shows those two in English until you add them. The 0.5.0 keys `altPlaceholderVideo`, `panHint`,
`moveEarlier`, `moveLater` and `moved` are optional the same way. `errors` and `drag` merge key by key; a key set to
`undefined` keeps the default. `drag.instructions` replaces dnd-kit's built-in English keyboard
instructions. Defaults: `defaultCarouselComposerLabels`. `locale` (default `"en"`) formats the
duration and aspect-option digits (no grouping: `"1920:1080"`); an invalid tag falls back to `"en"` (Arabic-Indic digits need a tag such as `"ar-EG"`).
`dir` (default: read from the page after mount) mirrors the rail in RTL; pass it if your app switches direction
without remounting. `remove` is deprecated in favour of `removeItem({ position, total, kind })` — a 0.2 `remove`
translation still names the remove buttons until you add `removeItem`.

## 12. Validation + limits

| Prop | Default | Notes |
|---|---|---|
| `maxItems` | `10` | Exceeding it fires `onMaxItemsExceeded(attempted, max)` and shows `maxReached` |
| `maxFileSizeMb` | `50` | `file-too-large` |
| `accept` | `["image", "video"]` | Kind-level filter (`unsupported-type`) |
| `acceptMime` | any `image/*` / `video/*` | Exact allow-list, also the file input's `accept` (filtered by `accept`); `PLATFORM_SAFE_MIME` refuses WebM |
| `maxVideoSeconds` | none | `video-too-long` (with `durationSeconds` / `maxSeconds`) |
| `sources` | `["upload"]` | `"library"` is ignored — there is no library picker here |

Rejections surface through `onValidationError` with a `MediaCarouselError` (`kind`, `message` from
`labels.errors`, `file`) and in the component's alert.

## 13. Migrating from 0.4

Nothing breaks: every 0.5.0 surface is optional and the defaults behave as 0.4.0.

| 0.4 | 0.5.0 | What to do |
|---|---|---|
| `enableAltText: boolean` | `boolean \| "images" \| "all" \| (item) => boolean` | nothing; `"all"` to describe videos |
| `crop` always centred | follows `cropOffset` (only when `enablePan` or the host sets it) | upload `crop` as before |
| `CarouselEditorPanelProps` | `+ onBusyChange?` | a custom panel may report busy; code that builds these props needs nothing |
| `CarouselComposerHandle` | `+ moveItem()` | hand-written handle mocks add it |
| add-on and base versions | the 0.5.0 add-on calls `onBusyChange` and `offsetCropRect` from the 0.5.0 base | **update both together** |

## 13a. Migrating from 0.3

| 0.3 | 0.4.0 | What to do |
|---|---|---|
| `CarouselEditorPanelProps.aspect`: five values | named, `"free"` or `"W:H"` (never `"original"`), plus a required `aspectRatio` | **Breaking for your own `Panel` only:** handle `"W:H"` (or use `aspectRatio`); code that builds these props adds `aspectRatio` |
| `CarouselAspectRatio` (and the deprecated `AspectRatio` alias): five values | media-editor's `CropAspect` values (`"original"`, `"W:H"`) | an exhaustive `switch` / `Record<CarouselAspectRatio, …>` handles the new values |
| `aspect` was a fixed setting | controlled when set (`onAspectChange`), `defaultAspect` otherwise | nothing — a fixed `aspect` keeps working |
| edited items came back at the photo's own ratio | trimmed to the shared aspect on Done | nothing; content-composer's post step gets trimmed edits too |
| square rail thumbs | the shared ratio | check custom thumb styling |
| `CarouselComposerHandle` | `+ getAspect()` | hand-written handle mocks add it |
| add-on and base versions | the 0.4.0 add-on imports `centredCropRect` from the 0.4.0 base | **update both together** (`shadcn add` does not overwrite an installed base; registry dependencies don't pin versions) |

## 13b. Migrating from 0.2

| 0.2 | 0.3.0 | What to do |
|---|---|---|
| Edit button built in; `@ilinxa/media-editor` installed with the base | editing is the add-on | `pnpm dlx shadcn@latest add @ilinxa/carousel-composer-editing`, pass `editing={carouselEditing}`. Delete the old `components/carousel-composer/parts/edit-panel.tsx` from your tree (the CLI never deletes files). The deprecated alias `media-carousel-editor-01` installs only the base too. |
| `EditPanel` / `EditPanelProps` from the barrel | `CarouselEditPanel` in the add-on | import from `…/features/editing` |
| `item.editorState: MediaEditorState`, `exportMeta: ExportMetadata` | `unknown` / `CarouselExportMeta` | `editorStateOf(item)` / `exportMetaOf(item)` from the add-on |
| `editorProps: Pick<MediaEditorProps, …>` | untyped in the base | type it with the add-on's `CarouselEditorProps` |
| `dropzoneHint: "or drop up to {max} files"`, `maxReached`, `itemAria` templates | functions | `(max) => …`, `({ position, total, kind }) => …`; an old string is ignored (English default + one dev warning) |
| `AspectRatio` (in `types.ts`), `DEFAULT_CAROUSEL_LABELS` | `CarouselAspectRatio`, `defaultCarouselComposerLabels` | old names remain as deprecated aliases (`AspectRatio` only in `types.ts`, as in 0.2; the barrel exports `CarouselAspectRatio`) |
| recomposed parts (`PreviewRail`, `RailThumb`, `MainPreview`, `MediaDropzone`) | new props | `PreviewRail` / `RailThumb` require `formatDuration` and the label functions; `MainPreview` takes an optional `editingEnabled` (default false — no Edit button) — copy what `carousel-composer.tsx` passes |

## 14. Gotchas

1. **`sources: ["library"]` does nothing.**
2. **`revokeOnUnmount` cuts both ways** — see §5.
3. **`export()` omits an open edit** — see §9.
4. **Reordering fires `onReorder` *and* `onChange`.** Do not apply the change twice.
5. **Replacing an item's id** (a temporary id swapped for the server's) makes it a new item: its first
   status is not announced as a change.
6. **content-composer's post step** wires the editing add-on but does not yet expose `acceptMime`,
   `labels`, alt text, upload status, `aspectOptions` or the `crop` of unedited items (its re-design owns that).
7. **The switch lives on item 1** — it hides when another item is selected or while editing.

## 15. Public exports

`CarouselComposer` · `useCarouselState` · parts `MediaDropzone`, `PreviewRail`, `RailThumb`,
`MainPreview`, `AspectSwitch` (0.4.0) · helper `centredCropRect` (0.4.0) · values `defaultCarouselComposerLabels`, `DEFAULT_CAROUSEL_LABELS` (deprecated),
`PLATFORM_SAFE_MIME` · types `MediaCarouselItem`, `MediaCarouselItemPatch`, `MediaCarouselItemStatus`,
`MediaKind`, `MediaCarouselSource`, `MediaCarouselError`, `MediaCarouselErrorKind`,
`CarouselAspectRatio`, `CarouselCropRect`, `CarouselCropOffset`, `CarouselExportMeta`, `CarouselEditingExtension`, `CarouselEditorPanelProps`,
`ApplyEditPatch`, `CarouselComposerProps`, `CarouselComposerHandle`, `CarouselComposerLabels`,
`CarouselComposerLabelsInput`, `CarouselComposerErrorLabels`, `CarouselComposerDragLabels`,
`UseCarouselStateOptions`, `UseCarouselStateResult`, `CarouselStateCallbacks`, and each part's props
type. Add-on (`…/features/editing`): `carouselEditing`, `CarouselEditPanel`, `editorStateOf`,
`exportMetaOf`, `CarouselEditorProps`, and the media-editor types `MediaEditorState`, `ExportMetadata`,
`InitialSource`, `MediaEditorHandle`.
