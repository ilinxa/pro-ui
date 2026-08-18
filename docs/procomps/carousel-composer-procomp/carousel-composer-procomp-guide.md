# `carousel-composer` — Pro-component Guide (Stage 3)

> **Status:** shipped · **v0.2.0** · maturity `alpha` · category `media`
> **Planning trio:** [description](carousel-composer-procomp-description.md) · [plan](carousel-composer-procomp-plan.md) · this guide
>
> Written 2026-08-19 while closing the guide-doc gap. Documented against source.

---

## 1. What it is

The authoring surface for a **multi-item media carousel**: drop or pick files, reorder them by
drag, select one, edit it in place, and hand the committed list back to the host. It composes
[`media-editor`](../media-editor-procomp/) for the per-item edit step — this is one of the
library's inter-procomp dependencies, not a re-implementation.

Think "Instagram carousel composer": a rail of thumbnails, a main preview, an edit panel.

## 2. When to use / when NOT to use

**Use when** the user is *building* a carousel — social composers, CMS gallery blocks, product
image sets.

**Skip when:**
- **You only need to display a carousel.** Use [`media-carousel`](../media-carousel-procomp/).
  This component is the editor; it pulls `media-editor` and `@dnd-kit` with it.
- **You need a full media library** with folders, search, and quota. That is
  [`media-library`](../media-library-procomp/).
- **You need single-image editing.** Use `media-editor` directly — this adds a rail and ordering
  you would not use.

## 3. Installation

```bash
pnpm dlx shadcn@latest add @ilinxa/carousel-composer
```

Pulls **`@ilinxa/media-editor`** as a registry dependency, plus `button` and `scroll-area`.
npm: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`.

## 4. Quick start

```tsx
const [items, setItems] = useState<MediaCarouselItem[]>([]);

<CarouselComposer
  value={items}
  onChange={setItems}
  maxItems={10}
  accept={["image", "video"]}
/>
```

Uncontrolled works too — pass `defaultValue` and read via the handle or `onChange`.

## 5. Object URLs — the thing to get right

Items the component creates from `File` objects carry **object URLs it owns**. On unmount it
revokes them.

```tsx
revokeOnUnmount?: boolean   // default: true
```

> ⚠️ **Set `revokeOnUnmount={false}` only when a host deliberately preserves the live items across
> a remount and takes over cleanup itself** — the `content-composer` carousel cache is the reference
> case. Get this wrong in the other direction and you leak every blob the user ever picked; get it
> wrong in this direction and your previews turn into broken images the moment the component
> remounts, because the URLs were revoked out from under the items you kept.

This is the single most consequential prop on the component.

## 6. The shared-aspect guarantee

`aspect` is owned **here**, not by the embedded editor:

```tsx
aspect?: AspectRatio | "auto"   // default "auto" → derived from the first item's dimensions
```

`editorProps` is a deliberate `Pick` of `media-editor` props — `enabledTools`, `stickers`, `fonts`,
`colorPresets`, `filterPresets`, `labels` — and **crop aspect is excluded on purpose**. A carousel
whose items crop to different shapes is a broken carousel, so the composer holds that dial and the
editor is not allowed to contradict it.

## 7. Commit semantics

An open edit is **not** part of the value until applied:

- `onEditApply` flattens the edit into the item and fires `onChange`.
- `handle.export()` resolves a defensive copy of the **committed** ordered items only.
- An open-but-unapplied edit is excluded.

> ⚠️ **Gate publish while an edit is open.** The handle will happily export without the in-flight
> edit, which silently drops the user's work from the payload. Track `onEditOpen` / `onEditApply` /
> `onEditCancel` and disable your submit button between open and apply.

## 8. Imperative handle

```tsx
const ref = useRef<CarouselComposerHandle>(null);

ref.current?.getItems();        // synchronous, current committed items
await ref.current?.export();    // defensive copy (see §7)
ref.current?.addFiles(files);   // File[] | FileList — same path as the dropzone
ref.current?.removeItem(id);
ref.current?.select(id);        // null clears selection
ref.current?.openEditor(id);
ref.current?.reset();           // revokes owned URLs and clears
```

## 9. Recomposing the surface

The component ships its parts and its state hook, so you can rebuild the layout:

```tsx
import {
  useCarouselState,
  MediaDropzone, PreviewRail, RailThumb, MainPreview, EditPanel,
} from "@/components/carousel-composer";
```

`useCarouselState` is the headless model — items, selection, editing, and the object-URL lifecycle.
If you recompose, **you inherit the URL-revocation contract from §5**: the hook owns the URLs it
creates, so mount it once and keep it mounted for the surface's lifetime.

## 10. Validation + limits

| Prop | Default | Notes |
|---|---|---|
| `maxItems` | `10` | Exceeding it fires `onMaxItemsExceeded(attempted, max)` |
| `maxFileSizeMb` | `50` | Mirrors `media-editor` |
| `accept` | `["image", "video"]` | Kind-level filter |
| `sources` | `["upload"]` | `"library"` is **clamped to a no-op** — there is no library picker here |

Rejections surface through `onValidationError` with a `MediaCarouselError`. Wire it: a silently
rejected 60 MB video looks identical to a broken dropzone.

## 11. Gotchas

1. **`sources: ["library"]` does nothing.** It is accepted and clamped. Use `media-library` if you
   need a picker.
2. **`revokeOnUnmount` cuts both ways** — see §5.
3. **`export()` omits an open edit** — see §7.
4. **Crop aspect is not forwardable** through `editorProps` by design — see §6.
5. **Reordering fires `onReorder` *and* `onChange`.** Do not treat them as alternatives and apply
   the change twice.
6. **Video items edit through the same panel, with a caveat.** They open `media-editor` in video
   mode, but the applied patch persists `editorState` with `videoBlob: null` — so a *re-edit*
   resumes from the exported frame, not the original video track. (The demo used to say video edit
   was "deferred to v0.2"; that line predated the feature and was stale by v0.2.0.)

## 12. Public exports

`CarouselComposer` · `useCarouselState` · parts `MediaDropzone`, `PreviewRail`, `RailThumb`,
`MainPreview`, `EditPanel` · `DEFAULT_CAROUSEL_LABELS` · types `MediaCarouselItem`, `MediaKind`,
`MediaCarouselSource`, `MediaCarouselError`, `CarouselComposerProps`, `CarouselComposerHandle`,
`CarouselComposerLabels`, `UseCarouselStateOptions`, `UseCarouselStateResult`,
`CarouselStateCallbacks`, `ApplyEditPatch`, and each part's props type.
