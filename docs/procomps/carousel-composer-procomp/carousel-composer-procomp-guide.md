# `carousel-composer` — Pro-component Guide (Stage 3)

> **Status:** shipped · **v0.3.1** · maturity `alpha` · category `media`
> **Planning trio:** [description](carousel-composer-procomp-description.md) · [plan](carousel-composer-procomp-plan.md) · this guide
> **Loop record:** [carousel-composer-loop.md](carousel-composer-loop.md) ("Run — Part 3 release 6")
>
> Rewritten 2026-10-26 for v0.3.0. Documented against source.

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
- **Your own editor:** `editing={{ Panel }}` — `Panel` receives `{ item, aspect, labels, editorProps,
  onApply(id, patch), onCancel }` (`CarouselEditorPanelProps`). `onApply` is accepted only for the
  item being edited.
- **The edit closes by itself** when its item leaves the list, when `editing` is removed, or when
  `canEditItem` turns false for it (`onEditCancel` fires).
- **Focus:** the panel takes focus when it opens (unless your Panel moves focus inside it) and focus
  returns to the Edit button, or the selected thumb, when it closes.
- **Done with no change keeps the item** (0.3.1): nothing is re-encoded and `onEditCancel` fires, as for Cancel.
  After a change, the add-on exports only the photo's area (`region: "media"`) at the photo's own resolution (capped
  at 4096 px), so no letterbox bars are baked in, and the item's `width` / `height` are the image's pixels. Needs
  media-editor 0.6.0 (with an older vendored editor the add-on falls back to always re-exporting).
- **Applying an edit clears the item's `status` / `progress` / `error`** — the edited media is not
  the file you uploaded; re-upload it from `onEditApply`.
- **Typed edit fields:** the base keeps `item.editorState` opaque (`unknown`) and `item.exportMeta` as
  a small `CarouselExportMeta`; read them typed with `editorStateOf(item)` / `exportMetaOf(item)` from
  the add-on.

## 7. The shared-aspect guarantee

`aspect` is owned **here**, not by the embedded editor:

```tsx
aspect?: CarouselAspectRatio | "auto"   // default "auto" → derived from the first item's dimensions
```

A carousel whose items crop to different shapes is a broken carousel, so the composer holds that dial
and the editing panel passes it as the only crop aspect.

## 8. Alt text, upload status, video

- **Alt text** (`enableAltText`, `maxAltLength` default 200): a labelled field under the selected
  image; typing updates `item.alt` through `onChange`. Every `<img>` uses `alt ?? fileName ?? ""`.
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

> ⚠️ **Gate publish while an edit is open.** Track `onEditOpen` / `onEditApply` / `onEditCancel` and
> disable your submit button between open and apply.

## 10. Imperative handle

```tsx
const ref = useRef<CarouselComposerHandle>(null);

ref.current?.getItems();            // the latest items, synchronously (also inside your callbacks)
await ref.current?.export();        // copy of the committed items (see §9)
await ref.current?.addFiles(files); // File[] | FileList — same path as the dropzone, current props
ref.current?.removeItem(id);
ref.current?.updateItem(id, patch); // status / progress / error / url / alt …; unknown id = no-op
ref.current?.select(id);            // null clears selection
ref.current?.openEditor(id);        // needs `editing`; videos and refused items are ignored (dev-warn)
ref.current?.reset();               // revokes owned URLs and clears
```

## 11. Labels and locale

Every visible and announced string is in `labels`; strings that carry a value are functions
(`dropzoneHint(max)`, `maxReached(max)`, `itemAria({ position, total, kind, alt, status })`,
`itemsAdded(count)`, `altCounter(length, max)`, `uploadProgress(progress, { position, total })`,
`removeItem({ position, total, kind })`, `uploadStatus(…)`,
`durationLabel(formatted)`, `errors.*`, `drag.*`). `errors` and `drag` merge key by key; a key set to
`undefined` keeps the default. `drag.instructions` replaces dnd-kit's built-in English keyboard
instructions. Defaults: `defaultCarouselComposerLabels`. `locale` (default `"en"`) formats the
duration digits; an invalid tag falls back to `"en"` (Arabic-Indic digits need a tag such as `"ar-EG"`).
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

## 13. Migrating from 0.2

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
   `labels`, alt text or upload status (its re-design owns that).

## 15. Public exports

`CarouselComposer` · `useCarouselState` · parts `MediaDropzone`, `PreviewRail`, `RailThumb`,
`MainPreview` · values `defaultCarouselComposerLabels`, `DEFAULT_CAROUSEL_LABELS` (deprecated),
`PLATFORM_SAFE_MIME` · types `MediaCarouselItem`, `MediaCarouselItemPatch`, `MediaCarouselItemStatus`,
`MediaKind`, `MediaCarouselSource`, `MediaCarouselError`, `MediaCarouselErrorKind`,
`CarouselAspectRatio`, `CarouselExportMeta`, `CarouselEditingExtension`, `CarouselEditorPanelProps`,
`ApplyEditPatch`, `CarouselComposerProps`, `CarouselComposerHandle`, `CarouselComposerLabels`,
`CarouselComposerLabelsInput`, `CarouselComposerErrorLabels`, `CarouselComposerDragLabels`,
`UseCarouselStateOptions`, `UseCarouselStateResult`, `CarouselStateCallbacks`, and each part's props
type. Add-on (`…/features/editing`): `carouselEditing`, `CarouselEditPanel`, `editorStateOf`,
`exportMetaOf`, `CarouselEditorProps`, and the media-editor types `MediaEditorState`, `ExportMetadata`,
`InitialSource`, `MediaEditorHandle`.
