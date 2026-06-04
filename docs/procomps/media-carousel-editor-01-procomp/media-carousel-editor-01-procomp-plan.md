# media-carousel-editor-01 — procomp plan

> Stage 2: how (the implementation contract). **GATE 2 — awaiting sign-off.** No code until signed off.
>
> Builds on the signed-off [description](./media-carousel-editor-01-procomp-description.md). Category `media`. Composes the shipped [`media-editor-01`](../media-editor-01-procomp/) v0.1.2 as a **single, serially-loaded edit panel** — media-editor-01 source is NOT modified.

## 0. The one fact that drives the whole design

media-editor-01 supports **edit-only mode**: `enabledModes={[]}` + `initialSource={…}` → it skips the entire capture surface (no camera, **no photo/video tabs**) and lands directly on the edit canvas for the supplied media ([types.ts:402](../../../src/registry/components/media/media-editor-01/types.ts#L402), [`MediaEditor01Props`](../../../src/registry/components/media/media-editor-01/types.ts#L400)). The carousel mounts exactly one such instance, keyed by the item being edited. This is why "don't separate photo/video" falls out for free: intake is file-based (MIME decides `kind`), and the editor never shows capture chrome.

## 1. Final API

### 1.1 Types (`types.ts`)

```ts
import type {
  AspectRatio,
  ExportMetadata,
  MediaEditor01Props,
  MediaEditorState,
} from "@/registry/components/media/media-editor-01/media-editor-01";
// ↑ Only the DIRECTLY-referenced types, and ONLY those the .tsx tail re-export band
//   actually exposes (VERIFIED: MediaEditor01Props/Handle, MediaEditorState,
//   ExportMetadata, InitialSource, ComposerMode, EditTool, MediaSource, AspectRatio).
//   `ValidationError` is NOT in that band — so we do NOT import it (keeps
//   media-editor-01 untouched); the carousel defines its own `MediaCarouselError`.
//   Imported from the .tsx entry (the F-01-proven path — NOT a /types subpath).

export type MediaKind = "image" | "video";
export type MediaCarouselSource = "upload" | "library"; // "library" clamped in v0.1

// Own error type — media-editor-01's `ValidationError` is NOT re-exported from its
// .tsx entry, and we keep media-editor-01 untouched. Structurally compatible.
export interface MediaCarouselError {
  kind: "unsupported-type" | "file-too-large" | "max-items";
  message: string;
  file?: File;
}

/**
 * One item in the carousel. `url` is the CURRENT displayable source (object URL
 * for local/edited media; remote URL for re-edit seeds). After an edit-apply,
 * `url`/`blob` reflect the flattened export; `editorState` retains the editable
 * layers so a re-open can `loadState` them (photo round-trip).
 */
export interface MediaCarouselItem {
  id: string;
  kind: MediaKind;
  url: string;
  blob?: Blob;                 // present for local/edited media; absent for remote-only seed
  editorState?: MediaEditorState; // present once edited (photo path; videoBlob always nulled)
  exportMeta?: ExportMetadata;    // from the last export()
  width?: number;
  height?: number;
  fileName?: string;
}

export interface MediaCarouselEditor01Labels {
  dropzoneTitle?: string;      // "Drag photos & videos here"
  dropzoneBrowse?: string;     // "Browse"
  dropzoneHint?: string;       // "or drop up to {max} files"
  addMore?: string;            // "Add more"
  edit?: string;               // "Edit"
  editDone?: string;           // "Done"
  editCancel?: string;         // "Cancel"
  remove?: string;             // "Remove"
  reorderHint?: string;        // "Drag to reorder"
  maxReached?: string;         // "Maximum {max} items reached"
  videoNotEditable?: string;   // "Video editing arrives in v0.2"
  itemAria?: string;           // "Media item {n} of {total}, {kind}"
}

export interface MediaCarouselEditor01Props {
  // value
  value?: MediaCarouselItem[];          // controlled
  defaultValue?: MediaCarouselItem[];   // uncontrolled
  onChange?: (items: MediaCarouselItem[]) => void;

  // capability dials
  maxItems?: number;                    // default 10
  maxFileSizeMb?: number;               // default 50 (mirrors media-editor-01)
  accept?: MediaKind[];                 // default ["image","video"]
  sources?: MediaCarouselSource[];      // default ["upload"]; "library" clamped/no-op
  aspect?: AspectRatio | "auto";        // default "auto" → derive from item 1 dims

  // forwarded subset of media-editor-01 dials (edit panel). NOTE: crop aspect is
  // OWNED by the carousel's `aspect` prop (shared-aspect guarantee) — deliberately
  // NOT in this Pick, so a consumer can't fight the shared aspect.
  editorProps?: Pick<
    MediaEditor01Props,
    "enabledTools" | "stickers" | "fonts" | "colorPresets" | "filterPresets" | "labels"
  >;

  labels?: Partial<MediaCarouselEditor01Labels>;
  className?: string;

  // events
  onItemAdd?: (item: MediaCarouselItem) => void;
  onItemRemove?: (id: string) => void;
  onReorder?: (items: MediaCarouselItem[]) => void;
  onSelect?: (id: string | null) => void;
  onEditOpen?: (id: string) => void;
  onEditApply?: (item: MediaCarouselItem) => void;
  onEditCancel?: (id: string) => void;
  onValidationError?: (error: MediaCarouselError) => void;
  onMaxItemsExceeded?: (attempted: number, max: number) => void;
}

export interface MediaCarouselEditor01Handle {
  getItems: () => MediaCarouselItem[];
  /** Pull-only: resolves a defensive copy of the COMMITTED ordered items
   *  (already flattened on edit-apply). An open-but-unapplied edit is NOT
   *  included — the host should gate publish while editing (mirrors
   *  content-composer's active-step gating + media-editor-01's pull-only export). */
  export: () => Promise<MediaCarouselItem[]>;
  addFiles: (files: File[] | FileList) => void;
  removeItem: (id: string) => void;
  select: (id: string | null) => void;
  openEditor: (id: string) => void;
  /** Revoke all owned object URLs; clears items. Also auto-runs on unmount. */
  reset: () => void;
}
```

### 1.2 Exported names (`index.ts`)

`MediaCarouselEditor01` (component) + all of: `MediaCarouselItem`, `MediaKind`, `MediaCarouselSource`, `MediaCarouselEditor01Props`, `MediaCarouselEditor01Handle`, `MediaCarouselEditor01Labels`. Plus the public parts (`PreviewRail`, `RailThumb`, `MainPreview`, `MediaDropzone`, `EditPanel`) for sealed-folder consumers, mirroring media-editor-01's barrel style.

## 2. File-by-file plan (sealed `data-table` shape)

```
src/registry/components/media/media-carousel-editor-01/
├── media-carousel-editor-01.tsx   root: state, DndContext, layout, handle, "use client"
├── types.ts                        §1.1
├── parts/
│   ├── media-dropzone.tsx          empty-state dropzone + Browse (also "add more" compact variant)
│   ├── preview-rail.tsx            SortableContext (horizontal) + scroll container
│   ├── rail-thumb.tsx              useSortable thumb: select / remove / drag handle / kind badge
│   ├── main-preview.tsx            renders selected item (img/video) + Edit affordance
│   └── edit-panel.tsx              wraps <MediaEditor01 enabledModes={[]}> + Done/Cancel frame
├── hooks/
│   ├── use-carousel-state.ts       items + selectedId + editingId reducer; URL lifecycle
│   └── use-controllable-state.ts   sealed local copy (navigation/account-switcher-01 + code-block precedent)
├── lib/
│   ├── file-intake.ts              filesToItems(): validate + infer kind + objectURL + read dims
│   ├── validate-media-file.ts      LOCAL reimpl of the ~15-line type+size check (NOT imported — F-01)
│   ├── aspect.ts                   resolveAspect(items, prop) → AspectRatio (derive from item 1)
│   └── clamp-sources.ts            "library" → "upload" (mirrors content-composer clamp)
├── dummy-data.ts                   sample items (remote placeholder URLs) for demo + fixtures
├── demo.tsx                        docs demo (SwipeTabsList tabs)
├── usage.tsx                       usage doc
├── meta.ts                         ComponentMeta
└── index.ts                        barrel
```

### Root component responsibilities (`media-carousel-editor-01.tsx`)
- `"use client"`. Calls `useCarouselState` (controllable). Wraps the rail in a single `DndContext`.
- Layout: a **main region** (top) + a **rail** (bottom). Main region shows, by UI mode:
  - `items.length === 0` → `<MediaDropzone variant="empty">`.
  - `editingId == null` → `<MainPreview item={selected}>` (Edit button overlaid).
  - `editingId != null` → `<EditPanel key={editingId} item={editing} …>` (the single media-editor-01 instance).
- Rail always visible once `items.length > 0`: `<PreviewRail>` + trailing `<MediaDropzone variant="add-more">` when `< maxItems`.
- Forwards `ref` → `MediaCarouselEditor01Handle` (via `useImperativeHandle`).

### Edit handshake (`edit-panel.tsx`) — the core contract
1. Mount `<MediaEditor01 ref={editorRef} key={item.id} enabledModes={[]} presentation="inline" initialSource={initialSourceFor(item)} aspect={resolvedAspect} cropAspects={[resolvedAspect]} enabledTools={editorProps?.enabledTools} … />`.
2. `initialSourceFor(item)`: `item.blob ? {kind:"blob",blob,mode} : {kind:"url",url,mode}` where `mode = item.kind === "video" ? "video" : "photo"`. **v0.1 note:** video Edit is disabled (§6), so the panel only ever opens for images → `mode` is always `"photo"` in v0.1; the video branch is future-proofing for v0.2.
3. On mount, if `item.editorState` exists → `useEffect(() => editorRef.current?.loadState(item.editorState))` (restore editable layers for re-edit).
4. Carousel-owned header: **Done** + **Cancel** (media-editor-01 inline renders no publish/close chrome — the consumer owns it, exactly as content-composer's media-substrate does).
5. **Done** → `const { blob, metadata } = await editorRef.current.export();` → `const url = URL.createObjectURL(blob)` → revoke old item url (if owned) → `applyEdit(item.id, { url, blob, editorState: editorRef.current.getState(), exportMeta: metadata, kind, dims })` → `setEditingId(null)`. Fire `onEditApply`.
6. **Cancel** → `setEditingId(null)` (item unchanged). Fire `onEditCancel`.

### State hook (`use-carousel-state.ts`)
- `useReducer` over `{ items, selectedId, editingId }`. Actions: `addItems`, `removeItem`, `reorder`, `select`, `openEditor`, `applyEdit`, `cancelEdit`, `reset`.
- **Controllable**: if `value` provided → controlled (reducer derives from `value`, mutations call `onChange` only); else internal state seeded from `defaultValue`. There is **no shared helper** — each procomp seals its OWN `hooks/use-controllable-state.ts` (registry portability rule). Copy the proven generic from `navigation/account-switcher-01/hooks/use-controllable-state.ts` (also in code-block) and use it for the `items` controllable; `selectedId` / `editingId` stay internal `useReducer` state.
- **Object-URL ownership**: track which URLs the component created (a `Set<string>` in a ref). Revoke on `removeItem`, on `applyEdit` (old url), and on unmount. Never revoke remote/consumer-supplied URLs.
- Removing the selected item → select previous neighbor (or `null`). Removing while editing that item → `cancelEdit` first.

## 3. Dependencies

| Kind | Items | Notes |
|---|---|---|
| npm | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | **Already in `package.json`** (kanban-board-01). No new package. |
| internal registry | `@ilinxa/media-editor-01` | The ONLY cross-procomp dep. Import `MediaEditor01` + types from its `.tsx` entry. Declare as `registryDependency`. |
| shadcn primitives | `button`, `scroll-area` | Browse/Edit/Done/Cancel/remove = `button`; rail horizontal scroll = `scroll-area`. (**Tooltip dropped at impl** — the local-registry smoke caught an F-cross-13 divergence: producer `radix-ui` tooltip uses `asChild`, Base-UI consumers use `render`. The only tooltip was the video "coming in v0.2" hint → switched to a native `title`, removing the primitive + the divergence surface.) |

**Cross-procomp import surface = exactly one module:** `@/registry/components/media/media-editor-01/media-editor-01` (the component value + the types `AspectRatio` / `ExportMetadata` / `InitialSource` / `MediaEditorState` / `MediaEditor01Props` / `MediaEditor01Handle` — all confirmed present in that file's tail re-export band). `validateGalleryFile` is **reimplemented locally** (`lib/validate-media-file.ts`) and the carousel defines its **own `MediaCarouselError`** (the `.tsx` does not re-export `ValidationError`). Net: media-editor-01 source stays untouched and the cross-procomp surface is exactly one module. F-01 mitigation, made concrete.

## 4. Composition pattern

- **Headless-ish state hook + presentational parts.** `useCarouselState` owns the model; parts are dumb. Root wires them.
- **Controlled/uncontrolled** value (RHF-free; the library's standard `value`/`defaultValue`/`onChange` triad).
- **Imperative handle** (`forwardRef` + `useImperativeHandle`) — pull-only export, mirrors media-editor-01.
- **Single delegated editor instance**, keyed remount per edit session (no N instances; respects media-editor-01's multi-instance guard).
- **dnd**: one `DndContext` at root; `SortableContext` (items = ids, `horizontalListSortingStrategy`) in the rail; `useSortable` per thumb. **Drag `listeners`/`attributes` attach to a dedicated drag-handle inside each thumb (NOT the whole thumb)** so the thumb body stays a click-to-select button and the Remove button works; Remove `onClick` calls `stopPropagation`. Sensors: `PointerSensor` (`activationConstraint: { distance: 4 }`) + `KeyboardSensor` (`sortableKeyboardCoordinates`). `onDragEnd` → `arrayMove` → `reorder`. Mirror kanban-board-01's setup ([use-drag-handlers.ts](../../../src/registry/components/data/kanban-board-01/hooks/use-drag-handlers.ts)).

## 5. Client vs server

Entire component is `"use client"` — object URLs, `FileReader`/`Image`/`<video>` dimension reads, `@dnd-kit`, refs, and the composed media-editor-01 (Konva, `dynamic({ssr:false})`) are all browser-only. No server entry. Registry rule: no `next/*` imports (portable).

## 6. Edge cases

| Case | Behaviour |
|---|---|
| 0 items | Full dropzone empty state. |
| `maxItems` reached | Drop/Browse rejects the overflow; fire `onMaxItemsExceeded`; "add more" hidden + `maxReached` label. Partial accept (fill to cap) for a drop that exceeds. |
| Remove selected | Select previous neighbor, or `null` if list empties (→ back to empty dropzone). |
| Remove while editing it | Exit edit mode first (`cancelEdit`), then remove. |
| **Video item Edit (v0.1)** | Edit **disabled** for `kind:"video"` (tooltip `videoNotEditable`). Preview + reorder + remove only. (Q4: limited edit; full video editing tracks media-editor-01 maturity.) |
| Re-edit seed (remote URL, no blob) | `initialSource = {kind:"url"}`. CORS/fetch failures surface via media-editor-01's `onInitialSourceError`; carousel shows the item uneditable + a toast-free inline note. |
| Dims not yet known | Async read (`img.onload` / video `loadedmetadata`); aspect resolves once item 1 dims land; placeholder frame = 1:1 until then. |
| Duplicate file | Allowed — unique `id` per add (no dedupe in v0.1). |
| Very large / many files | Per-file size validation; `maxItems` cap; rail scrolls horizontally. |
| RTL | Rail scroll + dnd honour `dir`; thumbs logical-flow. |
| Unmount mid-session | Revoke all owned object URLs. |

## 7. Accessibility

- **Dropzone**: visible **Browse** `<button>` triggers a hidden `<input type="file" multiple>` whose `accept` is derived from the `accept` prop (`image/*` and/or `video/*`); the drop region is decorative (drag-drop is an enhancement, never the only path). `aria-label` on the region; dnd-over state announced visually + `aria-busy` while ingesting.
- **Rail**: `@dnd-kit` `KeyboardSensor` gives space-to-lift / arrows-to-move / space-to-drop, with built-in `DndContext` live-region announcements (provide localized `announcements`). Each thumb: a `<button>` (selects) with `aria-label = itemAria` and `aria-current`/`aria-selected` on the active one; nested **Remove** `<button>` labelled `remove`; explicit drag-handle with `aria-label = reorderHint`.
- **Edit panel**: on open, focus moves into the editor surface; **Done/Cancel** are labelled buttons; on close, focus returns to the edited item's thumb. media-editor-01 owns its internal canvas a11y.
- **Motion**: respect `prefers-reduced-motion` for the preview/panel transition (`motion-safe:` only). Single coherent transition, not per-element.
- **Contrast/tokens**: hold the design-system mandate (signal-lime accent + near-black foreground; cool off-white / graphite surfaces; Onest/JetBrains Mono). Selected-thumb ring uses `--ring`; Edit/primary CTAs use `--primary` + `--primary-foreground`.

## 8. Risks & alternatives

| # | Risk | Mitigation |
|---|---|---|
| R1 | **F-01 cross-procomp import** (rewriter mangles deep subpaths; type-only deps still need install) | Import component + types from the `.tsx` entry only; reimplement validation locally; declare `@ilinxa/media-editor-01` registryDependency; **local-registry re-smoke** before push (serve `public/r` → repoint tmp consumer → `shadcn add` + `tsc`). |
| R2 | media-editor-01 inline + `enabledModes:[]` might render unexpected chrome | **Impl-start spike**: mount edit-only inline, confirm it lands on the edit canvas with no capture UI and no publish bar (content-composer already proves inline export works). If stray chrome appears, suppress within the EditPanel frame. |
| R3 | Video editing immaturity | v0.1 disables video Edit (R6/Q4). Honest tooltip; revisit when media-editor-01 ships video tools. |
| R4 | Object-URL leaks | Owned-URL `Set` + revoke on remove/apply/unmount; never revoke consumer URLs. |
| R5 | Hard aspect-forcing (Instagram crops all to one aspect) | v0.1 = **soft**: preview/rail use `object-fit: cover` in the resolved-aspect frame; the edit panel's crop tool *defaults* to the shared aspect. Hard pixel-crop-on-add is a follow-up. |
| R6 | Video thumbnail poster | v0.1 = `<video preload="metadata">` thumb with a kind badge; poster-frame extraction (canvas grab at t=0.1s) is a follow-up. |
| — | **Alt: extend media-editor-01** | Rejected at GATE 1 (breaking a shared shipped procomp). |
| — | **Alt: editor as a render-slot** | Rejected — defeats the batteries-included compose-media-editor goal; consumers would re-wire the handshake. |

## 9. Verification plan (pre-GATE-3)

- `pnpm tsc --noEmit` clean; `pnpm lint` no new findings; `pnpm validate:meta-deps` clean (declare the media-editor-01 dep + shadcn primitives in `meta.ts`).
- `pnpm build` green; docs render at `/components/media-carousel-editor-01`.
- `pnpm registry:build`; spot-check `public/r/media-carousel-editor-01.json` (base + `-fixtures`).
- **Local-registry consumer-tsc re-smoke** (R1) — the F-01 gate.
- GATE 3 spot-check (5 dims: planning-docs / registry-distribution / meta+manifest / verification / + rotating dim = **Robustness** given object-URL + dnd + delegated-editor state surface). Verdict ≥ Pass with follow-ups.

## 10. Out of this plan (deferred — restated from description)

`"library"` source (clamped), camera-as-add-source, full video editing, hard aspect-crop-on-add, video poster extraction, cross-item bulk ops, per-item caption/alt-text, and the **content-composer-01 post-slot integration** (separate follow-on gate; content-composer v0.2 breaking — `MediaSlotValue` single-URL → array).
