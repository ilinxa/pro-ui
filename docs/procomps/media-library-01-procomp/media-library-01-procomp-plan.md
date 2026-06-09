# media-library-01 — procomp plan

> Stage 2: how (the implementation contract). **GATE 2 — ✅ SIGNED OFF (2026-06-09, "review, confirm aligned, move on").** Re-validated against code; F-01 type-import trap caught + fixed (FsNode declared locally — file-tree.tsx has no tail re-export band), compound shadcn model locked (§0.5/§1.2/§4), dumb-core↔context-wrapper relationship stated. Proceeding to scaffold + implementation.
>
> Builds on the signed-off [description](./media-library-01-procomp-description.md). Category `media`, slug `media-library-01`. Composes **five** shipped procomps unchanged (`file-tree`, `pdf-viewer`, `code-block`, `markdown-editor`, `video-player-01`) and imports the `FsNode` model + `mergeLoadedChildren`/`iconForExtension` helpers from `file-manager`/`file-tree`. **No shipped component is modified.**

## 0. The facts that drive the design (verified against code 2026-06-09)

1. **The shell is bespoke, not a `file-manager` wrapper.** `file-manager`'s barrel exports only `useFileManager` (context — valid *inside* a `<FileManager>`) + clipboard + `mergeLoadedChildren`/`iconForExtension`. Its selection/marquee/drag/keyboard hooks live at `hooks/use-*.ts` and are **private** (not barrel-exported; deep-importing them cross-procomp trips the F-01/F-S1 rewriter). → We build selection/dnd/marquee/keyboard fresh in this folder, reusing only the public `FsNode` + helpers.
2. **Clipboard is its own registry item** `@ilinxa/file-clipboard` → target `components/_shared/file-clipboard.tsx`, while its **dev source** is `navigation/_shared/file-clipboard.tsx`. The dev-path ≠ install-path asymmetry makes a portable relative import impossible from the `media/` category. → v0.1 cut/copy/paste is **internal reducer state**; cross-component clipboard *sync* (`@ilinxa/file-clipboard`) is a v0.2 additive opt-in. (Q3 honoured — cut/copy/paste ships; only the cross-instance-sync mechanism is deferred.)
3. **Every viewer takes a simple input** — `PdfViewer source` (`string|File|Blob|…`), `CodeBlock value` (string) + `mode="view"`, `MarkdownEditor value`+`onChange`+`readOnly`+`view="preview"` (and a standalone `parseMarkdown` for a CodeMirror-free path), `VideoPlayer01 src`+`poster`. → The dispatcher fetches text for text-kinds and passes URLs through for image/pdf/video.
4. **Heavy deps must be code-split.** pdf.js + CodeMirror + shiki + marked are large. Each viewer is `React.lazy` + `Suspense` so previewing only images never ships the others. (SSR-safe; `next/dynamic` is banned in registry code — use `React.lazy`, the story-composer Konva-boundary precedent.)
5. **Composability is a hard requirement (shadcn compound model).** The component must ship as a **headless `Root` provider + à-la-carte parts**, with one batteries-included `<MediaLibrary01>` assembly on top. A consumer who doesn't need the sidebar / quota bar / type chips / preview / upload **drops those parts** and assembles a lighter version — and the bundler tree-shakes the unused parts (and their lazy viewer imports) away because each part is a separate module export. This drives the export surface (§1.2) and the composition pattern (§4) — it is not optional polish.

## 1. Final API

### 1.1 Types (`types.ts`)

```ts
import type { ReactNode, Ref } from "react";

// FsNode is DECLARED LOCALLY (not imported) — VERIFIED 2026-06-09: file-tree.tsx
// only *imports* FsNode (no tail re-export band), so a `.tsx`-entry import would
// fail; a `/types` subpath import trips the F-S1 slug-rewriter; adding a tail band
// to file-tree.tsx would modify a shipped component (forbidden). Re-declaring the
// (tiny, stable) interface keeps file-tree UNTOUCHED and zeroes the cross-procomp
// *type* surface — structural typing bridges at the composed `<FileTree nodes>`
// boundary (media-carousel-editor-01's "define your own type locally" precedent).
export type FsNodeType = "file" | "folder";
export interface FsNode {
  id: string;
  name: string;
  type: FsNodeType;
  parentId?: string | null;
  children?: FsNode[];          // undefined ⇒ lazy-load trigger; [] ⇒ known-empty
  ext?: string;
  size?: number;                // bytes
  modifiedAt?: string;          // ISO 8601
  icon?: ReactNode;
  meta?: Record<string, unknown>;
}

/** What viewer a file maps to. */
export type MediaPreviewKind =
  | "image" | "video" | "pdf" | "code" | "json" | "text" | "markdown" | "unknown";

/** Type-filter chip identity. */
export type MediaFilterCategory = "all" | "images" | "video" | "pdfs" | "docs";

/**
 * A media-library node. Strict superset of FsNode — every field added here is
 * optional, so any `FsNode[]` is assignable to `MediaNode[]` (interop with
 * file-tree / file-manager preserved).
 */
export interface MediaNode extends FsNode {
  /** Canonical asset URL — the preview source. */
  url?: string;
  /** Poster / thumbnail for the grid (images fall back to `url`). */
  thumbnailUrl?: string;
  /** Authoritative MIME type; `ext` is the fallback for kind resolution. */
  mimeType?: string;
  width?: number;
  height?: number;       // image/video dimension badge ("2400 × 1350")
  owner?: string;
  children?: MediaNode[];
}

export interface MediaLibrary01Storage {
  used: number;          // bytes
  total: number;         // bytes
}

/** Fires repeatedly during an upload; consumer-driven. */
export type MediaUploadProgressFn = (tempId: string, pct: number) => void;

export interface MediaLibrary01Labels {
  title?: string;                 // "Media library"
  searchPlaceholder?: string;     // "Search this folder"
  uploadButton?: string;          // "Upload"
  newFolderButton?: string;       // "New folder"
  foldersHeading?: string;        // "FOLDERS"
  filesHeading?: string;          // "FILES"
  libraryHeading?: string;        // "Library"
  quotaUsed?: string;             // "{used} of {total} used"
  filterAll?: string;             // "All"
  filterImages?: string;          // "Images"
  filterVideo?: string;           // "Video"
  filterPdfs?: string;            // "PDFs"
  filterDocs?: string;            // "Docs"
  emptyFolder?: string;           // "This folder is empty"
  emptyLibrary?: string;          // "No media yet — upload to get started"
  dropToUpload?: string;          // "Drop files to upload"
  previewLoading?: string;        // "Loading preview…"
  previewError?: string;          // "Couldn't load this file"
  noPreview?: string;             // "No preview available"
  download?: string;              // "Download"
  // context-menu verbs
  open?: string; rename?: string; move?: string; cut?: string; copy?: string;
  paste?: string; delete?: string; preview?: string;
  // a11y
  itemAria?: string;              // "{name}, {kind}"
  uploadingAria?: string;         // "Uploading {name}"
}

export interface MediaLibrary01Props {
  // data
  nodes: MediaNode[];
  currentFolderId?: string | null;
  defaultCurrentFolderId?: string | null;
  onCurrentFolderChange?: (folderId: string | null) => void;
  onLoadChildren?: (folderId: string) => Promise<MediaNode[]>;

  // storage quota
  storage?: MediaLibrary01Storage;

  // selection (controlled / uncontrolled)
  selectedIds?: Set<string>;
  defaultSelectedIds?: Set<string>;
  onSelectedChange?: (ids: Set<string>) => void;

  // mutation operations (consumer owns the backend; omit to hide the affordance)
  onUpload?: (files: File[], targetFolderId: string | null,
              progress: MediaUploadProgressFn) => Promise<MediaNode[]>;
  onMove?: (ids: string[], targetFolderId: string | null) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (ids: string[]) => void;
  onCreateFolder?: (parentId: string | null, name: string) => void;
  onDownload?: (ids: string[]) => void;
  validateRename?: (id: string, name: string) => string | null;

  // preview content sourcing (URL-based; text kinds fetched by the lib)
  resolveTextContent?: (node: MediaNode) => Promise<string>;   // optional override of the default fetch(url)
  onPreviewOpen?: (id: string) => void;
  onPreviewClose?: () => void;

  // chrome toggles (all default-on per Q2)
  showQuota?: boolean;
  showTypeFilters?: boolean;
  showSidebar?: boolean;               // file-tree on the left
  preview?: "pane" | "lightbox" | "both" | false;   // default "both"
  enableUploadDrop?: boolean;          // default true (when onUpload set)
  enableInternalDrag?: boolean;        // default true (when onMove set)
  enableContextMenu?: boolean;         // default true

  // perf
  virtualizeThreshold?: number;        // default 120 — file grid switches to virtual

  labels?: Partial<MediaLibrary01Labels>;
  className?: string;
  ref?: Ref<MediaLibrary01Handle>;
}

export interface MediaLibrary01Handle {
  navigateTo: (folderId: string | null) => void;
  refresh: (folderId?: string | null) => void;
  openPreview: (id: string) => void;
  closePreview: () => void;
  triggerUpload: () => void;           // opens the OS picker for the current folder
  getSelectedIds: () => string[];
  clearSelection: () => void;
}
```

### 1.2 Exported names (`index.ts`) — the compound surface (§0.5)

Three tiers, all exported, so a consumer picks their altitude:

**Tier A — batteries-included (the "1 full example"):**
- `MediaLibrary01` — single-prop-driven full assembly (all `MediaLibrary01Props`). Internally = `<MediaLibraryRoot>` + the canonical children, gated by the `show*`/`preview`/`enable*` toggles. This is what the demo and the screenshot use.

**Tier B — headless root + context-connected parts (assemble your own lighter version):**
- `MediaLibraryRoot` — the provider. Takes the data + handler props (`MediaLibraryRootProps` — the same surface as `MediaLibrary01Props` **minus** the chrome toggles, since composition replaces them) and renders `children`. Holds all state; provides `MediaLibraryContext`.
- `useMediaLibrary()` — context hook the parts read (and consumers can read to build bespoke parts).
- Context-connected parts (each a separate module → individually tree-shakeable; each reads context, no prop wiring needed): `MediaLibraryToolbar`, `MediaLibraryQuotaBar`, `MediaLibraryTypeFilters`, `MediaLibraryBreadcrumbs`, `MediaLibrarySidebar`, `MediaLibraryFolderRow`, `MediaLibraryFileGrid`, `MediaLibraryDetailsPane`, `MediaLibraryLightbox`, `MediaLibraryUploadOverlay`.

**Tier C — standalone primitives (no context, pure props — usable anywhere, even outside a library):**
- `FilePreview` — the dispatcher; `{ node, variant?, resolveTextContent? }`. Drop it in any detail page to preview one file. **This is the single most reusable export** and works with zero `Root`.
- `QuotaBar` — `{ used, total, label? }`.
- `FileCard` / `FolderCard` — `{ node, selected?, onOpen?, … }` dumb tiles.
- `FilePreviewLightbox` — `{ nodes, activeId, onClose, onNavigate }` controlled, contextless.

> **Tier B ↔ Tier C relationship (one file, two exports):** each part module holds a **dumb core** (Tier C, explicit props, no context) and a thin **context wrapper** (Tier B, reads `useMediaLibrary()` then renders the dumb core). So `parts/quota-bar.tsx` exports both `QuotaBar({used,total})` (Tier C) and `MediaLibraryQuotaBar()` (Tier B = `<QuotaBar used={ctx.storage.used} …/>`); `parts/preview-lightbox.tsx` exports `FilePreviewLightbox` (Tier C controlled) + `MediaLibraryLightbox` (Tier B context); `parts/file-card.tsx` exports `FileCard` (dumb) consumed by `MediaLibraryFileGrid`. This is what makes both "use the full thing" and "grab one primitive standalone" work from the same code with no duplication.

**Helpers:** `resolvePreviewKind`, `resolveFilterCategory`, `formatBytes`, `formatRelativeTime`.
**Types:** all `MediaLibrary01*` / `MediaLibraryRootProps` / `MediaNode` / `MediaPreviewKind` / `MediaFilterCategory` / part-prop types.

> **Naming:** flat `MediaLibrary*` exports (not a dotted `MediaLibrary.Root` namespace object) — a namespace object defeats tree-shaking (the bundler keeps the whole object). This matches shadcn's own choice (`SidebarProvider` / `SidebarContent`, not `Sidebar.Provider`). The compound *ergonomics* without the tree-shaking penalty.

## 2. File-by-file plan (sealed `data-table` shape)

```
src/registry/components/media/media-library-01/
├── media-library-01.tsx          Tier A: canonical assembly = <MediaLibraryRoot> + gated children + handle
├── types.ts                       §1.1
├── parts/
│   ├── media-library-root.tsx     Tier B provider: "use client", context, DndContext, controllable state, handle
│   ├── library-toolbar.tsx        title + search + Upload + New folder
│   ├── quota-bar.tsx              storage progress (shadcn progress) + humanized label
│   ├── type-filters.tsx           the 5 chips with live counts (shadcn badge/button)
│   ├── folder-row.tsx             FOLDERS heading + horizontal folder-card row
│   ├── folder-card.tsx            one folder tile (icon + name + "{n} items · {ago}"), drop target
│   ├── file-grid.tsx              FILES heading + thumbnail grid; virtual when > threshold
│   ├── file-card.tsx              thumbnail/icon tile + name + type badge + dimension badge; draggable
│   ├── breadcrumbs.tsx            path bar (walks parentId)
│   ├── upload-overlay.tsx         full-surface "Drop files to upload" scrim on dragover
│   ├── upload-progress.tsx        optimistic uploading items (progress ring per temp item)
│   ├── context-menu.tsx           shadcn context-menu wrapper, selection/permission-aware
│   ├── details-pane.tsx           right-side preview pane (renders <FilePreview>)
│   ├── preview-lightbox.tsx       shadcn dialog full-screen + prev/next + <FilePreview>
│   ├── file-preview.tsx           THE DISPATCHER: kind → lazy viewer
│   └── sidebar.tsx                composes <FileTree> (folder navigation)
├── hooks/
│   ├── use-controllable-state.ts  sealed (account-switcher-01 / code-block precedent)
│   ├── use-media-library.ts       reducer: currentFolder, selection, clipboard, preview, uploads
│   ├── use-selection.ts           click / ⌘-click / shift-range / select-all / marquee math
│   ├── use-upload.ts              onUpload orchestration + optimistic temp items + progress
│   ├── use-text-content.ts        fetch(url) | resolveTextContent → {loading,error,text}; abortable
│   └── use-lazy-children.ts       onLoadChildren + mergeLoadedChildren cache + loading set
├── lib/
│   ├── preview-kind.ts            resolvePreviewKind(node): mimeType→ext→unknown (reuses FILENAME_TO_LANG_MAP)
│   ├── filter-category.ts         resolveFilterCategory(kind) + counts; "docs" taxonomy (Q4)
│   ├── format.ts                  formatBytes / formatRelativeTime (date-fns is a dep)
│   └── drag.ts                    dnd payload typing + self/cycle drop validation
├── dummy-data.ts                  the screenshot's tree (Photos/Brand/Documents/Video folders + 3 files)
├── demo.tsx                       docs demo (SwipeTabsList)
├── usage.tsx                      usage doc
├── meta.ts                        ComponentMeta
└── index.ts                       barrel
```

### Provider responsibilities (`parts/media-library-root.tsx` — Tier B)
- `"use client"`. Builds the context value from `useMediaLibrary` + `useSelection` (+ controllable selection & currentFolder). Provides `<MediaLibraryContext>`.
- Owns the one `<DndContext>` spanning folder cards (drop targets) + file/folder cards (draggables) + the upload-drop surface — so hand-assembled layouts get dnd too.
- Renders `children` (no fixed layout). `forwardRef` → `MediaLibrary01Handle`.

### Canonical assembly (`media-library-01.tsx` — Tier A)
- Thin: `<MediaLibraryRoot {...rootProps} ref={ref}>` wrapping the fixed child tree, each child gated by a toggle:
  - `showQuota` → `<MediaLibraryQuotaBar/>`, `showTypeFilters` → `<MediaLibraryTypeFilters/>`, always `<MediaLibraryToolbar/>` + `<MediaLibraryBreadcrumbs/>`, `showSidebar` → `<MediaLibrarySidebar/>`, main = `<MediaLibraryFolderRow/>` + `<MediaLibraryFileGrid/>`, `preview` ∈ {pane,both} → `<MediaLibraryDetailsPane/>`, `preview` ∈ {lightbox,both} → `<MediaLibraryLightbox/>`, `enableUploadDrop` → `<MediaLibraryUploadOverlay/>`.
- Contains **no state or handler logic** beyond forwarding props to `Root` — everything lives in the provider + parts (so a hand-assembly is never second-class).

### The preview dispatcher (`file-preview.tsx`) — the heart
```tsx
const LazyPdf = React.lazy(() =>
  import("../../pdf-viewer/pdf-viewer").then(m => ({ default: m.PdfViewer })));
const LazyCode = React.lazy(() =>
  import("../../../code/code-block/code-block").then(m => ({ default: m.CodeBlock })));
const LazyVideo = React.lazy(() =>
  import("../../video-player-01/video-player-01").then(m => ({ default: m.default })));
// markdown: prefer the CodeMirror-free path — parseMarkdown(text) → sanitized HTML.
// If GFM render needs the full pipeline, lazy <MarkdownEditor readOnly view="preview" />.
```
- `resolvePreviewKind(node)` → switch:
  - `image` → `<img src={url} alt={name}>` (object-fit contain, checkerboard bg).
  - `video` → `<Suspense><LazyVideo src={url} poster={thumbnailUrl} controls /></Suspense>`.
  - `pdf` → `<Suspense><LazyPdf source={url} /></Suspense>`.
  - `code | json | text` → `useTextContent(node)`; `<Suspense><LazyCode value={text} filename={node.name} mode="view" readOnly /></Suspense>` with loading (`skeleton`) + error states. **Pass `filename` and let `CodeBlock` auto-detect the language internally** — avoids importing `resolveLang` (one fewer cross-procomp value import; `CodeBlock` already owns `filename`→lang via its built-in map).
  - `markdown` → `useTextContent(node)`; render `parseMarkdown(text)` into a sanitized prose container (or lazy `MarkdownEditor` preview if richer GFM features are needed — decided at impl after a spike; both paths verified available).
  - `unknown` → `noPreview` + a Download button (Q4 office types land here in v0.1).
- Same component renders inside **both** `details-pane` (constrained) and `preview-lightbox` (full-screen) via a `variant` prop.

### Lightbox (`preview-lightbox.tsx`)
- shadcn `dialog`, full-screen. Holds the **sibling list** (current folder's files, post-filter) + active index. Prev/next buttons + ArrowLeft/Right keys + Esc to close. Calls `onPreviewOpen`/`onPreviewClose`. Focus-trapped (dialog default); on close, focus returns to the opening card.

### Upload (`use-upload.ts` + `upload-overlay.tsx` + `upload-progress.tsx`)
- Drop on the surface (or a folder card) OR the Upload button → collect `File[]` → for each, create an **optimistic temp node** (`id: "tmp-…"`, name, kind from MIME, `progress: 0`) shown in the grid → call `onUpload(files, targetFolderId, progress)`; `progress(tempId, pct)` updates the ring → on resolve, replace temp nodes with the returned real `MediaNode[]` (consumer's source of truth) → on reject, mark temp node errored with a retry affordance. The lib performs **no network** itself (portability).

### Selection (`use-selection.ts`)
- click = replace; ⌘/Ctrl-click = toggle; shift-click = range over the current visible (filtered) order; ⌘/Ctrl+A = select all; Escape = clear. Marquee = pointer-drag rectangle over the file grid → intersect card rects (own ~30-line impl; `file-manager`'s `use-marquee`/`intersect` are private). Controlled via `selectedIds`/`onSelectedChange`.

## 3. Dependencies

| Kind | Items | Notes |
|---|---|---|
| npm | `@dnd-kit/core`, `@dnd-kit/utilities` | **Already in package.json.** Drag-move + drop targets. (No `@dnd-kit/sortable` — no reordering here.) |
| npm | `@tanstack/react-virtual` | **Already present** (file-manager/file-tree). File-grid virtualization > threshold. |
| npm | `date-fns` | **Already present.** Relative "2h ago" in folder cards. |
| internal registry | `@ilinxa/file-tree` | Sidebar tree + the `FsNode` model + `mergeLoadedChildren`/`iconForExtension`. |
| internal registry | `@ilinxa/pdf-viewer` | PDF preview (lazy). |
| internal registry | `@ilinxa/code-block` | code/json/text preview (lazy) + `resolveLang`/`FILENAME_TO_LANG_MAP`. |
| internal registry | `@ilinxa/markdown-editor` | markdown preview (`parseMarkdown` or lazy editor). |
| internal registry | `@ilinxa/video-player-01` | video preview (lazy). |
| shadcn primitives | `button`, `card`, `badge`, `progress`, `input`, `context-menu`, `dialog`, `scroll-area`, `skeleton`, `separator`, `tooltip` | All verified present in `src/components/ui/`. |

**Cross-procomp import surface (F-01 / F-S1 discipline) — VALUE imports only, zero TYPE imports:**
- Import each composed component's **value** from its `.tsx` entry via a RELATIVE path: `../../pdf-viewer/pdf-viewer` (`PdfViewer`), `../../../code/code-block/code-block` (`CodeBlock`), `../../video-player-01/video-player-01` (default), `../../../forms/markdown-editor/markdown-editor` (`MarkdownEditor`, only if the editor-preview path is chosen over `parseMarkdown`), and `../../../navigation/file-tree/file-tree` (`FileTree`). All five `.tsx` entries are **VERIFIED to export these values** (their `index.ts` re-exports `from "./<file>"`).
- **No cross-procomp TYPE import.** `FsNode` is declared locally (§1.1); structural typing bridges at `<FileTree nodes={mediaNodes}>`. This sidesteps the F-01 `/types`-mangling + F-S1 slug-substitution entirely and keeps every shipped component untouched.
- Each of the five is declared as a `registryDependency` in both `meta.ts` and `registry.json` (the content-composer F-01 lesson: a cross-procomp dep needs an install entry **even when it looks type-only** — here the deps are genuine value deps, so doubly required). `code-block`/`markdown-editor` live in `code/`/`forms/` (one extra `../`); `file-tree`/`pdf-viewer`/`video-player-01` are `media`↔`navigation`/`media` siblings.
- For the **light markdown path**, `parseMarkdown` is a value at `../../../forms/markdown-editor/lib/parse-markdown` — confirm that file is in markdown-editor's `registry.json` roster at impl (if not, fall back to the lazy `<MarkdownEditor view="preview">` path, which is rostered). The impl spike (R4) picks the path.

> **Clipboard:** v0.1 does **not** depend on `@ilinxa/file-clipboard` (dev-path vs install-path asymmetry — §0.2). Cut/copy/paste is internal reducer state. v0.2 may add an opt-in `clipboard`/`onClipboardChange` pair backed by `@ilinxa/file-clipboard` for cross-component sync.

## 4. Composition pattern — the shadcn compound model (§0.5, the headline)

**`MediaLibraryRoot` is a headless provider; the parts are context-connected presentational modules; `MediaLibrary01` is just the canonical assembly.** Three ways to consume, escalating in control:

```tsx
// 1 — Full (the screenshot, zero config). One prop bag, all chrome on.
<MediaLibrary01 nodes={tree} storage={q} onUpload={up} onLoadChildren={load} onMove={mv} />

// 1b — Full, but toggle chrome off (cheapest customization).
<MediaLibrary01 nodes={tree} showSidebar={false} showQuota={false} preview="lightbox" />

// 2 — Lighter, hand-assembled: keep grid + preview, drop sidebar/quota/chips/upload.
<MediaLibraryRoot nodes={tree} onLoadChildren={load}>
  <MediaLibraryBreadcrumbs />
  <MediaLibraryFolderRow />
  <MediaLibraryFileGrid />
  <MediaLibraryLightbox />        {/* omit this line → no pdf.js/CodeMirror/marked shipped */}
</MediaLibraryRoot>

// 3 — Just the dispatcher, no library at all (e.g. a CMS detail page).
<FilePreview node={someFile} variant="pane" />
```

- **Tree-shaking is real, not aspirational:** each part is its own module re-exported from the barrel; an unimported part (and its `React.lazy(() => import(...))` viewer chunk) is dropped by the bundler. Dropping `<MediaLibraryLightbox/>` + `<MediaLibraryDetailsPane/>` ⇒ the four viewer deps never enter the consumer's graph. The flat-export naming (§1.2) is what preserves this.
- **Parts are context-connected, not prop-drilled:** every Tier-B part calls `useMediaLibrary()` for state + handlers, so assembly is declarative (just place the part) — no wiring. Tier-C primitives (`FilePreview`, `QuotaBar`, `FileCard`) take explicit props and need no `Root`.
- **`MediaLibrary01` contains no logic the parts don't** — it's `<MediaLibraryRoot {...props}>` + a fixed child tree gated by `show*`/`preview`/`enable*`. Anything the full component does, a hand-assembly can do.
- **One `DndContext` + the context provider live in `Root`** (not `MediaLibrary01`), so dnd works in hand-assembled layouts too. Marquee/upload-overlay are parts that opt into it.
- **Controlled/uncontrolled** `selectedIds` + `currentFolderId` (standard `value`/`default`/`onChange`; sealed `use-controllable-state`). **Imperative handle** via `forwardRef` on both `MediaLibrary01` and `MediaLibraryRoot`.
- **Capability-gated affordances:** omit `onUpload`/`onMove`/`onDelete`/`onRename`/`onCreateFolder` → the matching buttons + menu items + dnd hide (read-only gallery falls out for free), independent of which parts are mounted.
- **Lazy-loaded delegated viewers** (`React.lazy` + `Suspense`) — code-split per type, the mechanism that makes "drop a part, drop its weight" true.

## 5. Client vs server
Entire component is `"use client"` — `DndContext`, file inputs, object URLs, `fetch` for text, `React.lazy`, refs, dialog, and all composed viewers (pdf.js / CodeMirror / Konva-free but browser-only) are client-only. No server entry. No `next/*` (portable).

## 6. Edge cases
| Case | Behaviour |
|---|---|
| Empty library (no nodes) | `emptyLibrary` state with an Upload CTA. |
| Empty folder | `emptyFolder` state; quota + chips + breadcrumbs still render. |
| Folder children not loaded (`children: undefined`) | On navigate → `onLoadChildren` → `mergeLoadedChildren`; `skeleton` grid while loading; error → inline retry. |
| Drag file onto itself / its own subtree / a non-folder | Drop rejected (cycle/self/target-not-folder validation in `lib/drag.ts`); no `onMove`. |
| Upload reject / network fail | Temp node marked errored + Retry; never silently drops (the v0.1.x manual-test lesson). |
| Type chip with 0 matches | Chip shows count 0, disabled/dimmed; selecting it → filtered-empty state. |
| Text fetch fails / huge file | `useTextContent` surfaces error (`previewError`) + Download fallback; abort on preview close/navigate. |
| `mimeType` absent | Fall back to `ext`; then `unknown` (Download-only). |
| Unknown/office type | `noPreview` + Download (Q4). |
| Preview while file is an optimistic temp (no real url yet) | Preview disabled until upload resolves. |
| Large folder (> threshold) | File grid virtualizes (`@tanstack/react-virtual`); folder-card row stays non-virtual (few folders). |
| RTL | Grid, breadcrumbs, drag, lightbox prev/next honour `dir`. |
| `preview={false}` | Open is a no-op for preview; double-click still navigates folders. |

## 7. Accessibility
- **Grid**: `role="grid"`/`gridcell`, roving `tabIndex`, arrow-key navigation across cards, `aria-selected`, `aria-multiselectable`. Live-region announces selection count + upload start/finish.
- **Folder cards**: `<button>`, Enter/double-click navigates; drop-target has `aria-dropeffect` analog (visual + SR text).
- **Type filters**: a `role="tablist"`-style group or toggle buttons with `aria-pressed`; counts in the accessible name.
- **Upload**: visible Upload `<button>` triggers a hidden `<input type="file" multiple>`; drag-drop is an enhancement, never the only path.
- **Lightbox/details**: dialog focus-trap; prev/next labelled; Esc closes; focus returns to the opener. Each composed viewer owns its own internal a11y.
- **Context menu**: shadcn `context-menu` (keyboard-openable via the menu key / a visible "⋯" affordance on each card so it's not pointer-only).
- **Motion**: one coherent reveal; respect `prefers-reduced-motion`.
- **Tokens**: signal-lime accent + near-black foreground; cool off-white page / pure-white cards (light), graphite surfaces (dark); Onest / JetBrains Mono. Quota fill + active chip use `--primary`; selection ring uses `--ring`. (designer skill engaged at impl.)

## 8. Risks & alternatives
| # | Risk | Mitigation |
|---|---|---|
| R1 | **F-01 cross-procomp imports** (5 deps; rewriter mangles `/types`; type-only deps still need install) | Import values/types from `.tsx` entries via relative paths; declare all five as `registryDependency` in meta + registry.json; **local-registry consumer-tsc re-smoke** before push. |
| R2 | **Bundle bloat** (pdf.js + CodeMirror + shiki + marked) | `React.lazy` per viewer (§0.4) — verified each entry is lazy-importable (pdf-viewer/video-player default exports; code-block/markdown named → `.then(m=>({default:m.X}))`). Image-only consumers ship none of them. |
| R3 | **F-cross-13** Radix↔Base-UI divergence across composed primitives (dialog/context-menu/tooltip/progress) | Apply the defensive pattern (no `asChild` on triggers; direct children; native `title` over Tooltip for trivial hints); the re-smoke surfaces real sub-traps to patch (4-ship pattern). |
| R4 | **Markdown sanitization** — `parseMarkdown` emits HTML | Render into a sanitized container; if untrusted content is a concern, prefer the `MarkdownEditor` preview path (it owns sanitization). Decide at impl spike. |
| R5 | **SSR** — `React.lazy` + browser-only viewers | Component is `"use client"`; lazy children mount client-side under `Suspense` (story-composer Konva-boundary precedent). No `next/dynamic`. |
| R6 | **Object-URL leaks** from upload temp items | Owned-URL `Set` in a ref; revoke on temp→real swap, on remove, on unmount. |
| R7 | **Clipboard path asymmetry** (§0.2) | Internal clipboard state in v0.1; `@ilinxa/file-clipboard` sync deferred to v0.2. |
| — | **Alt: wrap `file-manager` wholesale** | Rejected at GATE 1 — media layout fights its uniform grid; forces its consumers to inherit heavy viewer deps; can't add the FOLDERS-card-row cleanly. |
| — | **Alt: bespoke everything (re-impl viewers)** | Rejected — duplicates 5 shipped procomps; the whole point is composition. |

## 9. Verification plan (pre-GATE-3)
- `pnpm tsc --noEmit` clean; `pnpm lint` no new findings; `pnpm validate:meta-deps` clean (5 internal deps + shadcn primitives declared in `meta.ts`).
- `pnpm build` green; docs render at `/components` + `/components/media-library-01`.
- `pnpm registry:build`; spot-check `public/r/media-library-01.json` (base + `-fixtures`); confirm `demo.tsx`/`usage.tsx`/`meta.ts` are NOT shipped.
- **Local-registry consumer-tsc re-smoke** (R1) — serve `public/r`, repoint a tmp consumer's `components.json`, `pnpm dlx shadcn add @ilinxa/media-library-01`, then consumer-side `pnpm tsc --noEmit` clean. The F-01 gate; expect + patch F-cross-13 sub-traps (ship→smoke→patch→re-smoke).
- Manual click-through (the de-facto gate, per the v0.1.x lessons): upload via drop + button; move via drag; rename/delete/new-folder; preview all 7 kinds in both pane + lightbox; prev/next; type chips + counts; lazy folder load; quota bar.
- GATE 3 spot-check — 4 fixed dims + rotating dim = **Robustness** (upload/dnd/lazy-fetch/object-URL/5-way composition state surface is the risk). Verdict ≥ Pass with follow-ups.

## 10. Out of this plan (deferred — restated from description)
Real upload transport/chunking/resumable; sharing/permissions UI; rich office-doc preview; tagging/favourites/trash/versions; cross-folder global search; inline image editing (that's `media-editor-01`); `media-carousel-01` multi-image lightbox composition; `@ilinxa/file-clipboard` cross-component clipboard sync.
```
