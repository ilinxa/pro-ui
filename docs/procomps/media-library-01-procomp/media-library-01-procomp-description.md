# media-library-01 — procomp description

> Stage 1: what & why. **GATE 1 — ✅ SIGNED OFF (2026-06-09, "go with recommendations").** Proceeding to GATE 2 (plan). All seven open questions resolved to the recommended answers (see §"Open questions"). Author: assistant, 2026-06-09.
>
> **Greenfield, composition-first.** A Google-Drive-style media library: folders + files, lazy-loaded, with drag-drop upload, drag-drop move, right-click context menus, and **multi-type file preview**. The decisive call (see §"Why a new procomp" + §"Reuse boundary"): this procomp **does not re-implement any file viewer** — every preview is delegated to an existing shipped procomp (`pdf-viewer`, `code-block`, `markdown-editor`, `video-player-01`, plain `<img>`), and it reuses the shared `FsNode` data model + clipboard helpers that `file-manager`/`file-tree` already export. It owns only the *Drive shell* (quota bar, type-filter chips, folder-card row, thumbnail grid, upload pipeline, preview dispatcher).
>
> Driven by a CMS "Media library" surface (see reference screenshot): a quota bar, type-filter chips (All / Images / Video / PDFs / Docs), a FOLDERS card row, and a FILES thumbnail grid.

## Problem

A CMS / app needs a **central media library** — "every image, video and document for the site, organized in folders." Concretely that means:

1. **Browse** — folders + files, breadcrumb navigation, lazy-loaded children, large libraries (virtualized).
2. **Upload** — drag a file (or many) onto the surface, or click Upload; see optimistic items + progress.
3. **Organize** — drag files/folders to move them; right-click for Open / Rename / Move / Download / Delete / New folder.
4. **Preview** — open any file and see it rendered in-place: images, video, PDF, and text-based files (code, JSON, plain text, Markdown).
5. **The CMS chrome** — a storage-quota bar, type-filter chips with counts, a folder-card row distinct from the file grid, an Upload + New-folder action pair.

The library already ships the hard parts in isolation:

- **The browser shell** — `file-manager` (navigation) has grid/list, multi-select, breadcrumbs, right-click context menus, internal drag-move, an `onExternalDrop` upload hook, `onLoadChildren` lazy loading, and TanStack virtualization. `file-tree` (navigation) is the matching folder sidebar. Both share one `FsNode` model + `FileClipboardProvider` + `mergeLoadedChildren`/`iconForExtension` helpers.
- **Every previewer** — `pdf-viewer` (PDF; `string | File | Blob`), `code-block` (`mode="view"` read-only syntax highlight for code/JSON/txt, 30+ langs), `markdown-editor` (`readOnly view="preview"` → GFM-rendered HTML), `video-player-01` (HTML5 video), and a plain `<img>` for images (or `media-carousel-01` for a multi-image lightbox).

What's **missing** is the *Drive experience that wires these together*: the media-tuned layout from the screenshot, the upload pipeline, and — the headline gap — a **single component that maps a file to the right viewer** ("preview for images / pdf / text / code / md / json") behind one modal + one side pane. That dispatcher is the heart of this procomp.

## Why a new procomp (not a file-manager expansion)

| Option | Verdict |
|---|---|
| **Expand `file-manager` with quota bar + type chips + folder cards + preview dispatcher** | ❌ **Rejected.** `file-manager` is a shipped, generic, file-system browser (alpha v0.1.0). Bolting a media-library identity (quota, media thumbnails, type taxonomy, viewer composition with 4 new heavy registry deps) onto it muddies its scope and forces every `file-manager` consumer to inherit pdf.js/CodeMirror/marked. Media-specific layout (FOLDERS card row ≠ FILES grid) fights its uniform grid. |
| **New procomp `media-library-01` (hybrid reuse)** | ✅ **Recommended.** Owns the media-tuned shell + upload pipeline + preview dispatcher; reuses the **shared `FsNode` model** + clipboard/helpers, composes `file-tree` (sidebar) and the previewers wholesale, and implements its own bespoke grid/selection/dnd/context-menu. `file-manager` stays untouched (zero breaking risk to its consumers), and the heavy viewer deps live only here. Mirrors the library's composition philosophy (`media-carousel-01` composes `video-player-01`; `media-carousel-editor-01` composes `media-editor-01`). |

This procomp is the **library/manager counterpart** to the existing single-purpose viewers — it does not duplicate them, it *routes to* them.

## Reuse boundary (the "Hybrid" decision, made explicit)

You chose **Hybrid**: bespoke media layout, cherry-pick reuse. Made concrete — and constrained by what `file-manager`'s barrel actually exports today:

**Reused as-is (imported):**
- **`FsNode` data model** — the shared file/folder shape (extended via a typed `meta`, see §Data model). Keeps interop with `file-tree`/`file-manager`.
- **`file-manager` exported helpers** — `mergeLoadedChildren(nodes, parentId, children)` for lazy-load merging, `iconForExtension(ext)` for fallback icons, `FileClipboardProvider`/`useFileClipboard`/`EMPTY_CLIPBOARD` for cut/copy/paste.
- **`file-tree`** — composed wholesale in the left sidebar slot (folder navigation tree).
- **The previewers** — `pdf-viewer`, `code-block`, `markdown-editor`, `video-player-01` composed wholesale inside the dispatcher.

**Built fresh in this sealed folder (NOT cherry-picked from file-manager internals):**
- The bespoke media grid (folder cards + thumbnail cards), quota bar, type-filter chips, toolbar.
- Selection state, marquee, and drag-drop (`@dnd-kit` directly — already a repo dep via `kanban-board-01`/`media-carousel-editor-01`).
- The right-click context menu (shadcn `context-menu` primitive directly).
- The upload pipeline + the **preview dispatcher** (the new value this procomp adds).

> **Why not import file-manager's selection/dnd/marquee hooks?** Its `index.ts` barrel exposes `useFileManager` (context, only valid inside a `<FileManager>`), the clipboard, and helpers — **not** the internal selection/dnd hooks. Reusing those would mean *modifying a shipped component to widen its exports* (added risk + a version bump on `file-manager`). Per the `media-carousel-editor-01` precedent ("don't touch the shipped shared component"), v0.1 keeps these self-contained. Promoting reusable hooks out of `file-manager` is a possible later, additive cleanup — see Q5.

## What this procomp owns vs. delegates

**media-library-01 owns:**
- The CMS shell: **quota bar** (`used`/`total`), **type-filter chips** (All / Images / Video / PDFs / Docs, with live counts), toolbar (Upload + New folder + search), **breadcrumb path**.
- The **layout**: a FOLDERS card row (folder tiles with item-count + modified) above a FILES **thumbnail grid** (image/video posters, type-badged icon tiles for non-visual files), matching the screenshot.
- **Selection** (click, ⌘/Ctrl-click, shift-range, marquee), **drag-drop move** (file/folder → folder), **drag-drop upload** (OS files → current folder, with a drop overlay), **right-click context menu**.
- The **upload pipeline** — optimistic placeholder items + per-file progress, driven by a consumer `onUpload` callback (the lib performs no network I/O itself — portability rule).
- The **preview dispatcher** — given a node, pick the viewer by MIME/extension and render it in **both** a right-side details pane (on select) and a **full-screen lightbox** (on open) with prev/next across siblings.
- Lazy children loading (`onLoadChildren`), grid virtualization for large folders, controlled/uncontrolled selection + current-folder, an imperative handle.

**Delegates (composed, unchanged):**
- All actual file rendering → `pdf-viewer` / `code-block` / `markdown-editor` / `video-player-01` / `<img>`.
- Folder-tree sidebar navigation → `file-tree`.
- Cut/copy/paste clipboard mechanics → `FileClipboardProvider`.

## In scope (v0.1.0 — full screenshot fidelity)

- **Quota bar** — `used`/`total` bytes → percent + humanized label; design-token progress fill.
- **Type-filter chips** — All / Images / Video / PDFs / Docs, each with a live count; filters the current folder's files (folders always shown). Taxonomy derived from MIME/extension.
- **FOLDERS card row** + **FILES thumbnail grid** — the two-zone layout from the screenshot; thumbnail uses `thumbnailUrl`/`url` for images & video posters, a type-badged icon tile otherwise.
- **Breadcrumb path** + folder open/navigate; **lazy `onLoadChildren`**; **grid virtualization** for big folders.
- **Selection** (single, ⌘/Ctrl, shift-range, marquee) + **status/footer count**.
- **Drag-drop move** (internal) + **drag-drop upload** (OS → folder, drop overlay) + **Upload button** + **New folder**.
- **Right-click context menu** — Open / Preview / Rename / Move (or cut+paste) / Download / Delete / New folder; role/selection-aware.
- **Upload pipeline** — optimistic items + progress, via `onUpload`; error + retry surface.
- **Preview dispatcher** — image / pdf / video / code / json / txt / markdown, in **both** a side details pane (select) and a **full-screen lightbox** (open) with prev/next; **URL-based content** — for text-based types the component **fetches** the item's `url` (loading/error states); image/pdf/video pass the url straight through.
- Empty state (empty folder / empty library), loading state, design-token compliance, a11y (grid roving focus, dialog focus-trap, labelled controls, SR announcements for upload/selection).

## Out of scope (v0.1.0 — deferred)

- **Real upload transport / chunking / resumable uploads** — the lib calls `onUpload` and renders progress; the network is the consumer's. (Trigger to revisit: a consumer needs a built-in `tus`/multipart helper.)
- **Sharing / permissions / link-generation UI** — `meta` can carry it; no UI in v0.1.
- **Office/RTF/etc. rich preview** (docx, xlsx) — those fall to a generic "no preview / download" fallback in v0.1; only the 7 listed types render.
- **Tagging, favourites/starred, trash/restore, versions** — `meta`-modelable, deferred.
- **Cross-folder global search** — v0.1 search filters the current folder only (matches `file-manager`).
- **Inline image editing** — that's `media-editor-01`'s job; out of a *library* surface.
- **Multi-image lightbox via `media-carousel-01`** — v0.1 uses a single `<img>` + the dispatcher's own prev/next; carousel composition is a v0.2 candidate.

## Target consumers

| Consumer | How it uses it |
|---|---|
| CMS "Media library" route (the screenshot) | Full surface: quota + chips + folders + grid + upload + preview. |
| `cms-panel-01` (in-flight panel) | A constituent page — the media management route. |
| Asset picker (modal mode, future) | Open the library in a dialog to pick a file for a form/field. |
| Any app needing a Drive-like file browser with rich preview | Drop-in. |

## Data model

Built on the shared `FsNode`, extended with media fields via a typed `meta` (keeps `file-tree`/`file-manager` interop):

```ts
// from file-manager/file-tree (shared, imported)
interface FsNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId?: string | null;
  children?: FsNode[];          // undefined ⇒ lazy-load trigger
  ext?: string;
  size?: number;                // bytes
  modifiedAt?: string;          // ISO 8601
  icon?: ReactNode;
  meta?: Record<string, unknown>;
}

// media-library-01 reads these from meta (all optional)
interface MediaMeta {
  url?: string;                 // canonical asset URL (preview source)
  thumbnailUrl?: string;        // poster/thumb for grid (falls back to url for images)
  mimeType?: string;            // authoritative type; ext is the fallback
  width?: number;
  height?: number;              // for image/video dimension badge (screenshot shows "2400 × 1350")
  owner?: string;
}
```

The **preview kind** is resolved `mimeType → ext → "unknown"` into one of: `image | video | pdf | code | json | text | markdown | unknown`. The **filter category** (chip) maps to: `images | video | pdfs | docs` (docs = pdf + text/code/md/json + office).

## Rough API sketch (illustrative — final shape is GATE 2)

```ts
interface MediaLibrary01Props {
  nodes: FsNode[];                              // root-level (children lazy or inline)
  currentFolderId?: string | null;             // controlled
  defaultCurrentFolderId?: string | null;
  onCurrentFolderChange?(folderId: string | null): void;

  onLoadChildren?(folderId: string): Promise<FsNode[]>;   // lazy load

  // storage quota bar
  storage?: { used: number; total: number };

  // selection (controlled / uncontrolled)
  selectedIds?: Set<string>;
  defaultSelectedIds?: Set<string>;
  onSelectedChange?(ids: Set<string>): void;

  // operations (consumer owns the backend)
  onUpload?(files: File[], targetFolderId: string | null,
            progress: (id: string, pct: number) => void): Promise<FsNode[]>;
  onMove?(ids: string[], targetFolderId: string | null): void;
  onRename?(id: string, name: string): void;
  onDelete?(ids: string[]): void;
  onCreateFolder?(parentId: string | null, name: string): void;
  onDownload?(ids: string[]): void;

  // preview content (URL-based; text types fetched by the lib)
  resolveTextContent?(node: FsNode): Promise<string>;   // optional override of the default url-fetch

  // layout / chrome toggles
  showQuota?: boolean;
  showTypeFilters?: boolean;
  showSidebar?: boolean;                        // file-tree on the left
  preview?: "pane" | "lightbox" | "both" | false;   // default "both"

  labels?: Partial<MediaLibrary01Labels>;
  className?: string;
  ref?: Ref<MediaLibrary01Handle>;
}

interface MediaLibrary01Handle {
  navigateTo(folderId: string | null): void;
  refresh(folderId?: string | null): void;
  openPreview(id: string): void;
  closePreview(): void;
  triggerUpload(): void;                        // opens the OS file picker
  getSelectedIds(): string[];
}
```

## Example usages

1. **CMS media library (this gate's demo):** `<MediaLibrary01 nodes={tree} storage={{used: 12.8e9, total: 50e9}} onUpload={uploadToCdn} onLoadChildren={fetchFolder} onMove={...} />` — drop 3 images, open `hero-home.jpg` in the lightbox, step to `og-card.png`, preview `config.json` (code-block), preview `README.md` (markdown render), preview the brand PDF.
2. **Asset picker (modal):** mount in a dialog, `preview="pane"`, double-click to select-and-return.
3. **Read-only gallery:** omit `onUpload`/`onMove`/`onDelete` → all mutation affordances hide; pure browse + preview.

## Success criteria

- Drag files onto the surface (or click Upload) → optimistic items appear with progress; on resolve they become real nodes. Drag a file onto a folder card → `onMove` fires; drop validation rejects self/cycle.
- Right-click yields a selection-aware menu; Rename/Delete/New folder/Download all fire their callbacks.
- Opening each of the 7 types renders the correct viewer in **both** the side pane and the lightbox; lightbox prev/next steps across siblings; text types fetch + show loading/error.
- Type chips filter the file grid with correct live counts; quota bar shows the right percent + humanized label; FOLDERS row + FILES grid match the screenshot.
- Lazy `onLoadChildren` populates folders on navigate; large folders virtualize without jank.
- **No shipped component is modified** (diff touches only the new folder + `manifest.ts` + `registry.json`); `file-manager`/`file-tree` consumers unaffected.
- tsc / lint / `validate:meta-deps` clean; `pnpm build` + `registry:build` clean; GATE 3 spot-check ≥ Pass with follow-ups.

## Carried risk (cross-procomp composition — from content-composer-01 / media-carousel-editor-01 F-01)

This procomp composes **five** registry components (`file-tree`, `pdf-viewer`, `code-block`, `markdown-editor`, `video-player-01`) and imports values/types from `file-manager` (helpers + `FsNode`). The hard-won F-01 lessons apply at scale here:

1. **Import cross-procomp types/values from the source's package entry / `.tsx` path, never a deep `@/registry/.../types` subpath** — the shadcn rewriter mangles `/types` subpaths. Use the locked F-S1 relative-import pattern for any cross-procomp path.
2. **Every cross-procomp dependency needs a `registryDependency` entry even if it looks "type-only"** — the consumer's `tsc` needs the module installed to resolve it.
3. **Heavy transitive deps**: this single component pulls in pdf.js, CodeMirror, shiki, marked. That's expected for a media library, but the dispatcher must **lazy-load each viewer** (`React.lazy` + `Suspense`, SSR-safe — `next/dynamic` is banned in registry code) so a consumer previewing only images never ships the PDF/markdown bundles. This is a v0.1 requirement, not a nicety.
4. **Verify with a local-registry re-smoke** (serve `public/r`, repoint a tmp consumer, `shadcn add` + `tsc`) before push — the ship → smoke → patch → re-smoke pattern. Expect F-cross-13 sub-traps (Radix↔Base-UI divergence) across the composed primitives.

## Open questions — RESOLVED (2026-06-09 sign-off, "go with recommendations")

- **Q1 — Slug + category.** ✅ **`media/media-library-01`** (the name + previewer composition lean media; `media` category is "Image galleries, video players, carousels, file viewers"). Cheap to relocate before scaffold if reconsidered.
- **Q2 — Quota / chips / sidebar as opt-out chrome?** ✅ **All three default-on** (`showQuota`/`showTypeFilters`/`showSidebar` = true) so the screenshot is the zero-config default; each individually toggleable.
- **Q3 — Move semantics.** ✅ **Both** — drag-to-move for the common case, **plus** reuse `FileClipboardProvider` for keyboard cut/copy/paste parity with `file-manager`. (GATE 2 must resolve the packaging wrinkle: the clipboard lives in `src/registry/components/_shared/file-clipboard.tsx`, a *sibling* module outside file-manager's sealed folder — so the registry artifact must vendor `_shared/file-clipboard.tsx` into this component's folder, or depend on it explicitly. Verified: it is NOT inside file-manager's `index.ts`-rooted folder tree.)
- **Q4 — "Docs" chip taxonomy.** ✅ **PDFs** = `application/pdf`; **Docs** = text/code/markdown/json **+** office types (docx/xlsx/pptx — office gets the download fallback, not a rich preview, in v0.1).
- **Q5 — Promote reusable selection/dnd hooks out of `file-manager`?** ✅ **Self-contained for v0.1** — file-manager's barrel verified to expose only `useFileManager` (context) + clipboard + helpers, not its selection/dnd internals. No touching a shipped component. Extraction deferred to a later additive cleanup if a third consumer wants them.
- **Q6 — Image lightbox.** ✅ **Own prev/next in v0.1** (the dispatcher already needs sibling-stepping for all types); `media-carousel-01` composition deferred to v0.2.
- **Q7 — Upload progress contract.** ✅ `onUpload(files, targetFolderId, progress) => Promise<FsNode[]>` (consumer drives the bytes, calls `progress(id, pct)`, resolves with the real `FsNode[]`).

## Verification pass (2026-06-09 — pre-GATE-2 re-validation)

Load-bearing claims checked against the actual code before locking:

- `file-manager`/`file-tree` barrels **do** export `FsNode`, `FsNodeType`, `mergeLoadedChildren`, `iconForExtension`, and (file-manager) `FileClipboardProvider`/`useFileClipboard`/`EMPTY_CLIPBOARD`. ✅
- file-manager exposes **only** `useFileManager` (context) of its hooks — internal selection/dnd/marquee hooks are private → Q5 self-contained decision confirmed. ✅
- `@dnd-kit/core` + `/sortable` + `/utilities` and `@tanstack/react-virtual` are existing deps → drag-move + virtualization add **no new packages**. ✅
- Previewer entry points + input contracts confirmed: `PdfViewer` (`source: string|File|Blob|ArrayBuffer|Uint8Array`), `CodeBlock` (`value: string`, `mode="view"`, plus exported `resolveLang`/`FILENAME_TO_LANG_MAP`), `MarkdownEditor` (`value`+`onChange`, `readOnly`, `view="preview"`, **plus standalone `parseMarkdown`** → markdown preview can render GFM→HTML without mounting CodeMirror — a lighter dispatcher path, to be weighed in GATE 2), `VideoPlayer01` (`src`, `poster`). ✅
- Quota example corrected to `12.8e9 / 50e9` to match the reference screenshot ("12.8 GB of 50 GB"). ✅
