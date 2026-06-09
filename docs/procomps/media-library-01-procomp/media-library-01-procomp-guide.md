# media-library-01 — procomp guide

> Stage 3: consumer-facing usage. Ships with v0.1.0 (2026-06-09). For the *what & why* see the [description](./media-library-01-procomp-description.md); for the *how it's built* see the [plan](./media-library-01-procomp-plan.md).

A Google-Drive-style media library — folders + files, lazy loading, drag-drop upload, drag-to-move, right-click menus, and multi-type file preview. **Composition-first**: it owns the Drive shell and delegates every file render to the shipped viewers.

## When to use
- A CMS / app "Media library" surface (the canonical case).
- An asset browser with rich preview of images, video, PDFs, and text-based files (code / JSON / txt / Markdown).
- A constituent page of a larger panel (e.g. `cms-panel-01`).

## When NOT to use
- You only need to preview **one** file → use the standalone `<FilePreview node={…} />` (Tier C, no shell).
- You need image *editing* → that's `media-editor-01` / `media-carousel-editor-01`.
- You need a plain folder tree with no grid → use `file-tree` directly.

## The three tiers (shadcn compound model)

**Tier A — batteries-included.** One prop bag, all chrome on.
```tsx
import { MediaLibrary01 } from "@/components/media-library-01"

<MediaLibrary01
  nodes={tree}
  storage={{ used: 12.8e9, total: 50e9 }}
  onLoadChildren={fetchFolder}
  onUpload={uploadToCdn}
  onMove={moveAssets}
  onRename={renameAsset}
  onDelete={deleteAssets}
  onCreateFolder={createFolder}
/>
```

**Tier B — headless root + à-la-carte parts.** Drop what you don't need; the bundler tree-shakes the unused parts (and their lazy viewers) away.
```tsx
import {
  MediaLibraryRoot, MediaLibraryBreadcrumbs,
  MediaLibraryFolderRow, MediaLibraryFileGrid,
} from "@/components/media-library-01"

// No quota bar / chips / sidebar / lightbox → pdf.js, CodeMirror, marked never ship.
<MediaLibraryRoot nodes={tree} onMove={moveAssets} preview={false}>
  <MediaLibraryBreadcrumbs />
  <MediaLibraryFolderRow />
  <MediaLibraryFileGrid />
</MediaLibraryRoot>
```
All parts read context via `useMediaLibrary()`, so assembly is declarative — just place the part. Available parts: `MediaLibraryToolbar`, `MediaLibraryQuotaBar`, `MediaLibraryTypeFilters`, `MediaLibraryBreadcrumbs`, `MediaLibrarySidebar`, `MediaLibraryFolderRow`, `MediaLibraryFileGrid`, `MediaLibraryDetailsPane`, `MediaLibraryLightbox`, `MediaLibraryUploadOverlay`.

**Tier C — standalone primitives (no context).** `FilePreview` (the dispatcher), `QuotaBar`, `FileCard`, `FolderCard`, `FilePreviewLightbox`, `UploadOverlay`, `FileKindBadge`, `PreviewKindIcon`.
```tsx
import { FilePreview } from "@/components/media-library-01"
<FilePreview node={{ id: "1", name: "readme.md", type: "file",
  mimeType: "text/markdown", url: "/files/readme.md" }} />
```

## Data model
Nodes are `MediaNode` (a strict superset of the shared `FsNode` — any `FsNode[]` is a valid `MediaNode[]`):
```ts
interface MediaNode extends FsNode {
  url?: string;          // preview source
  thumbnailUrl?: string; // grid poster (images fall back to url)
  mimeType?: string;     // authoritative kind signal; ext is the fallback
  width?: number;
  height?: number;       // → the "2400 × 1350" badge
  owner?: string;
}
```
- `children: undefined` → triggers `onLoadChildren` on navigate (lazy). `children: []` → known-empty. `children: MediaNode[]` → inline.
- The **preview kind** resolves `mimeType → ext → unknown` into image / video / pdf / code / json / text / markdown. The **filter chip** maps to images / video / pdfs / docs (docs = code/json/text/markdown + office/unknown).

## Capabilities are opt-in
Omit a handler and its affordance disappears — a read-only gallery falls out for free:

| Omit | Hides |
|---|---|
| `onUpload` | Upload button + drop overlay |
| `onMove` | drag-to-move + cut/paste + Move menu items |
| `onRename` | inline rename + Rename menu item |
| `onDelete` | Delete menu item |
| `onCreateFolder` | New-folder button + inline create |
| `onDownload` | Download menu item + details-pane button |

## Upload contract
`onUpload(files, targetFolderId, progress)` is called **once per file**. Report that file's percent via `progress(pct)` and resolve with the real `MediaNode[]`:
```tsx
onUpload={(files, folderId, progress) =>
  uploadOne(files[0], folderId, (pct) => progress(pct))   // resolves to MediaNode[]
}
```
The library shows an optimistic placeholder with a live ring and replaces it on resolve; on reject it shows Retry. The lib performs **no network itself** (portability).

## Text preview
Code / JSON / txt / Markdown content is fetched from the node's `url` (with loading + error states). For auth / signed URLs / transforms, pass `resolveTextContent(node) => Promise<string>`.

## Gotchas
- **Preview is double-click / Open**, single-click selects (⌘/Ctrl-click toggles, Shift-click ranges, drag-rectangle marquees). The lightbox steps prev/next across the current folder's filtered files (ArrowLeft/Right, Esc).
- **Drag-to-move** uses a per-card grip handle for keyboard users; pointer-drag works on the whole card. Drops onto folders only; self/cycle drops are rejected.
- **Lazy heavy deps**: the four viewers (`pdf-viewer`/`code-block`/`markdown-editor`/`video-player-01`) are `React.lazy`-loaded. If you never mount `<MediaLibraryLightbox/>` or `<MediaLibraryDetailsPane/>`, none of pdf.js / CodeMirror / shiki / marked enters your bundle.
- **Graceful preview failure**: a viewer that throws (bad network, corrupt file) degrades to a "Couldn't load + Download" card via an error boundary; react-pdf's async fetch errors are surfaced the same way (they can't reach an error boundary, so `onError` is wired explicitly).
- **PDF worker**: the composed `pdf-viewer` loads pdf.js's worker from a CDN by default. For offline / locked-down environments, self-host `pdfjs-dist/build/pdf.worker.min.mjs` and pass its path via `pdfWorkerSrc` (threaded through to the viewer).
- **Sidebar** composes `file-tree` showing the full tree (folders + files): click a folder to navigate, a file to preview, and drag a folder/file onto another folder (or onto "Library") to move it. It reflects already-loaded folders; deep unvisited lazy folders populate as you navigate (see follow-ups).
- **Grid sizing**: the FOLDERS and FILES grids use a width-aware `auto-fill` layout, so cards stay readable as the sidebar / details pane change the available width — no fixed column counts.

## Still out of scope (as of v0.1)
- File-grid virtualization for very large folders (the `virtualizeThreshold` prop is reserved; v0.1 renders a plain responsive grid). → v0.2.
- Copy / duplicate (cut → paste-move works; duplicate needs a backend). → v0.2.
- Sharing / permissions UI, tagging / favourites / trash / versions, cross-folder global search, rich office-doc preview (office falls to a download fallback), lazy-expand in the sidebar tree.

## Composition origin
Built 2026-06-09. Composes (unchanged): `file-tree`, `pdf-viewer`, `code-block`, `markdown-editor`, `video-player-01`. Reuses the shared `FsNode` model. The authoring/management counterpart to those single-purpose viewers — it routes *to* them rather than duplicating them.
