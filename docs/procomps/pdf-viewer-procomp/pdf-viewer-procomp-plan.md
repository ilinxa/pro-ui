# pdf-viewer — procomp plan

> Stage 2: how. The implementation contract.
>
> **Predecessor:** [`pdf-viewer-procomp-description.md`](./pdf-viewer-procomp-description.md), confirmed by user with "confirmed" — all 16 open-question recommendations accepted.

## Substrate decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Library | `react-pdf@^10.4.1` (wraps `pdfjs-dist@5.4.296` as direct dep) | Slim React surface; we own all chrome; native text-layer for selection |
| Worker hosting | `?url` import of `pdfjs-dist/build/pdf.worker.min.mjs` | Bundler-native (Turbopack/Webpack5/Vite); no CDN; no postinstall |
| Worker override | `workerSrc?: string` prop | Escape hatch for older bundlers / self-hosters |
| Continuous scroll | Always (no paged mode) | Per description Q2 |
| Initial scale default | `'fit-width'` | Per description Q3 |
| Toolbar parts | Separately exported (`<PdfPageNav>`, `<PdfZoomControls>`, `<PdfActionMenu>`) | Per description Q4 |
| Print | pdf.js high-DPI canvas → hidden iframe → `print()` | Per description Q5 (sharp output) |
| Right-click scope | Only over canvas + text-layer | Per description Q7 |
| Annotation layer | Rendered (links work) | Per description Q11 |
| Permission gates | `allowDownload`, `allowPrint` props | Per description Q12 |
| Image selection | Out of scope | Per description (deferred) |
| Mobile toolbar | Auto-collapse below `sm` to overflow menu | Per description Q13 |

## Final API

### Public types

```ts
// types.ts

import type {
  CSSProperties,
  ComponentType,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

/** Anything react-pdf accepts as a document source. */
export type PdfSource = string | File | Blob | ArrayBuffer | Uint8Array;

/** Initial fit mode — `'fit-width'` is the default. Numeric value is a scale (1.0 = 100%). */
export type PdfInitialScale = "fit-width" | "fit-page" | number;

/** Discrete rotation in degrees. */
export type PdfRotation = 0 | 90 | 180 | 270;

/** Virtualization mode. `'auto'` engages above `virtualizeThreshold` pages. */
export type PdfVirtualizeMode = "auto" | "always" | "never";

/** Imperative actions exposed to toolbar slots, context-menu slots, and the imperative ref. */
export interface PdfActions {
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  setScale: (scale: number | "fit-width" | "fit-page") => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  rotate: (deltaDegrees?: number) => void; // default delta: +90
  setRotation: (rotation: PdfRotation) => void;
  download: () => void;
  print: () => void;
}

/** Read-only document state — surfaced to slots and onChange callbacks. */
export interface PdfDocumentState {
  /** 1-based current page (the page closest to the viewport top). */
  page: number;
  numPages: number;
  /** Numeric scale at the time of read (computed value, not the input mode). */
  scale: number;
  /** The fit-mode currently in effect, if any. `null` means user-set numeric. */
  fitMode: "fit-width" | "fit-page" | null;
  rotation: PdfRotation;
  loading: boolean;
  /** True after the document has parsed and `numPages` is available. */
  ready: boolean;
  error: Error | null;
  /** `null` until source resolves. */
  source: PdfSource | null;
  /** Selected text in the document, or empty string. Updated debounced. */
  selectedText: string;
}

/** Slot context for `renderToolbar`. Passed to consumer-supplied toolbars. */
export interface PdfToolbarContext extends PdfDocumentState {
  actions: PdfActions;
  allowDownload: boolean;
  allowPrint: boolean;
  /** True when consumer's viewport is below the `sm` breakpoint (480px default). */
  compact: boolean;
}

/** Slot context for `renderContextMenu`. Fires on right-click over the document surface. */
export interface PdfContextMenuContext extends PdfDocumentState {
  actions: PdfActions;
  /** Cursor position relative to the viewer root, in CSS pixels. */
  position: { x: number; y: number };
  /** Programmatically close the menu (call after a slot action runs). */
  closeMenu: () => void;
  /** Optional consumer-supplied search handler (registered via `onSearchSelection`). */
  onSearch: ((text: string) => void) | null;
}

/** Slot context for `renderPasswordPrompt`. */
export interface PdfPasswordPromptContext {
  /** Submit a password attempt. Wrong password keeps the prompt open with `error` populated. */
  submit: (password: string) => void;
  /** Abandon — viewer transitions to error state. */
  cancel: () => void;
  /** Last attempt's error, or null on first prompt. */
  error: Error | null;
  /** 0 on first prompt, increments on each wrong attempt. */
  attempts: number;
}

/** Imperative handle exposed via `ref`. */
export interface PdfViewerHandle {
  actions: PdfActions;
  state: PdfDocumentState;
  /** Underlying pdfjs document. `null` until `state.ready === true`. */
  pdfDocument: PDFDocumentProxy | null;
}

/** Localized labels — defaults English. */
export interface PdfViewerLabels {
  // Toolbar
  prevPage?: ReactNode;
  nextPage?: ReactNode;
  zoomIn?: ReactNode;
  zoomOut?: ReactNode;
  fitWidth?: ReactNode;
  fitPage?: ReactNode;
  resetZoom?: ReactNode;
  rotate?: ReactNode;
  download?: ReactNode;
  print?: ReactNode;
  pageOfTotal?: (page: number, total: number) => string; // default: "Page {page} of {total}"
  scalePercent?: (scale: number) => string; // default: "{round(scale*100)}%"
  more?: ReactNode; // overflow menu trigger

  // States
  loading?: ReactNode; // "Loading PDF…"
  emptyTitle?: ReactNode; // "No document loaded"
  emptyHint?: ReactNode; // "Drop a PDF here, or pass a `source` prop."
  errorTitle?: ReactNode; // "Couldn't load this PDF"
  errorRetry?: ReactNode; // "Try again"

  // Drag-drop overlay
  dropPdfHere?: ReactNode; // "Drop PDF here"
  notAPdfFile?: ReactNode; // "Only PDF files are supported"

  // Password prompt
  passwordTitle?: ReactNode; // "This PDF is password-protected"
  passwordHint?: ReactNode; // "Enter the password to view it."
  passwordPlaceholder?: string; // "Password"
  passwordSubmit?: ReactNode; // "Unlock"
  passwordCancel?: ReactNode; // "Cancel"
  passwordError?: ReactNode; // "Wrong password. Try again."

  // Context menu
  copyText?: ReactNode; // "Copy text"
  searchSelection?: ReactNode; // "Search selection"
  contextNextPage?: ReactNode; // shared with `nextPage` if absent
  contextPrevPage?: ReactNode;
  contextZoomIn?: ReactNode;
  contextZoomOut?: ReactNode;
  contextRotate?: ReactNode;
  contextDownload?: ReactNode;
  contextPrint?: ReactNode;
}

export interface PdfViewerProps {
  // ─── Source ──────────────────────────────────────────────────────
  /** PDF source. `null`/`undefined` + `enableDragDrop` → empty drop-zone state. */
  source?: PdfSource | null;

  // ─── Toolbar ─────────────────────────────────────────────────────
  /** Show the default toolbar. Default: `true`. Ignored when `renderToolbar` supplied. */
  toolbar?: boolean;
  /** Full-replacement slot for the toolbar. Receives state + actions. */
  renderToolbar?: (ctx: PdfToolbarContext) => ReactNode;

  // ─── Drag-and-drop ───────────────────────────────────────────────
  /** Accept drag-drop of a PDF onto the viewer. Default: `true`. */
  enableDragDrop?: boolean;
  /** Show "Drop PDF here" overlay during drag. Default: `true`. */
  dragDropOverlay?: boolean;

  // ─── Initial state ───────────────────────────────────────────────
  /** 1-based. Default: 1. Clamped to [1, numPages] once document is ready. */
  initialPage?: number;
  /** Default: 'fit-width'. */
  initialScale?: PdfInitialScale;
  /** Default: 0. */
  initialRotation?: PdfRotation;

  // ─── Virtualization ──────────────────────────────────────────────
  /** Default: 'auto'. */
  virtualize?: PdfVirtualizeMode;
  /** Page count above which 'auto' engages virtualization. Default: 50. */
  virtualizeThreshold?: number;

  // ─── Right-click ─────────────────────────────────────────────────
  /** Replace browser context menu over document surface. Default: `true`. */
  enableContextMenu?: boolean;
  /** Full-replacement slot for the context menu. */
  renderContextMenu?: (ctx: PdfContextMenuContext) => ReactNode;
  /** Wires the "Search selection" item. Absent → item hidden. */
  onSearchSelection?: (args: { text: string }) => void;

  // ─── Password handling ───────────────────────────────────────────
  /** Pre-supplied password (skips the prompt). Useful for known-encrypted docs. */
  password?: string;
  /** Full-replacement slot for the password prompt. */
  renderPasswordPrompt?: (ctx: PdfPasswordPromptContext) => ReactNode;

  // ─── Worker hosting ──────────────────────────────────────────────
  /** Override the bundled `?url` worker path. Default: bundled. */
  workerSrc?: string;

  // ─── Permissions ─────────────────────────────────────────────────
  /** Show download UI + handle Cmd/Ctrl+S. Default: `true`. */
  allowDownload?: boolean;
  /** Show print UI + handle Cmd/Ctrl+P. Default: `true`. */
  allowPrint?: boolean;
  /** Filename for download when `source` is Blob/ArrayBuffer. Default: 'document.pdf'. */
  downloadFilename?: string;

  // ─── Callbacks (object-shape per F-cross-12) ─────────────────────
  onLoad?: (args: { numPages: number; pdfDocument: PDFDocumentProxy }) => void;
  onError?: (args: { error: Error; source: PdfSource | null }) => void;
  onPageChange?: (args: { page: number; source: PdfSource | null }) => void;
  onScaleChange?: (args: { scale: number; fitMode: "fit-width" | "fit-page" | null }) => void;
  onRotationChange?: (args: { rotation: PdfRotation }) => void;
  onSelection?: (args: { text: string }) => void;
  onSourceChange?: (args: { source: PdfSource | null; reason: "prop" | "drop" }) => void;

  // ─── Theming ─────────────────────────────────────────────────────
  className?: string;
  style?: CSSProperties;
  /** Extra classes for the inner scroll container. */
  scrollContainerClassName?: string;
  /** Extra classes for the page wrapper (each rendered page). */
  pageClassName?: string;

  // ─── i18n ────────────────────────────────────────────────────────
  labels?: PdfViewerLabels;

  // ─── Accessibility ───────────────────────────────────────────────
  /** Override the section's accessible name. Default: 'PDF document viewer'. */
  ariaLabel?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_PDF_VIEWER_LABELS: Required<
  Omit<PdfViewerLabels, "pageOfTotal" | "scalePercent">
> & {
  pageOfTotal: (page: number, total: number) => string;
  scalePercent: (scale: number) => string;
};
```

### Public exports from `index.ts`

```ts
export { PdfViewer, default } from "./pdf-viewer";

// Toolbar parts — composable inside `renderToolbar` (read viewer context internally)
export { PdfToolbar } from "./parts/pdf-toolbar";
export { PdfPageNav } from "./parts/pdf-page-nav";
export { PdfZoomControls } from "./parts/pdf-zoom-controls";
export { PdfActionMenu } from "./parts/pdf-action-menu";
export { PdfPageIndicator } from "./parts/pdf-page-indicator";

// Hook for advanced consumers building bespoke chrome from scratch
export { usePdfViewer } from "./hooks/use-pdf-viewer-context";

// Defaults
export { DEFAULT_PDF_VIEWER_LABELS } from "./types";

export type {
  PdfSource,
  PdfInitialScale,
  PdfRotation,
  PdfVirtualizeMode,
  PdfActions,
  PdfDocumentState,
  PdfToolbarContext,
  PdfContextMenuContext,
  PdfPasswordPromptContext,
  PdfViewerHandle,
  PdfViewerLabels,
  PdfViewerProps,
} from "./types";
// `meta` intentionally NOT re-exported here — docs-site only (post-Phase-7 rule).
```

## File-by-file plan

```
src/registry/components/media/pdf-viewer/
├── pdf-viewer.tsx                       ← top-level component (~300 LOC)
├── parts/
│   ├── pdf-toolbar.tsx                     ← default <PdfToolbar> composition
│   ├── pdf-page-nav.tsx                    ← <PdfPageNav> sub-export
│   ├── pdf-zoom-controls.tsx               ← <PdfZoomControls> sub-export
│   ├── pdf-action-menu.tsx                 ← <PdfActionMenu> (rotate/download/print)
│   ├── pdf-page-indicator.tsx              ← <PdfPageIndicator> ("3 / 24")
│   ├── pdf-page.tsx                        ← single-page Page wrapper + text + annotation layers
│   ├── pdf-context-menu.tsx                ← right-click ContextMenu (shadcn primitive)
│   ├── pdf-password-prompt.tsx             ← default Dialog
│   ├── pdf-drop-overlay.tsx                ← drag-drop dimmer + label
│   ├── pdf-empty-state.tsx                 ← "No document loaded" (when drag-drop on)
│   ├── pdf-error-state.tsx                 ← failed load + retry
│   └── pdf-loading-state.tsx               ← skeleton
├── hooks/
│   ├── use-pdf-viewer-context.ts           ← public hook + Context
│   ├── use-pdf-document.ts                 ← load + parse via react-pdf primitives
│   ├── use-pdf-zoom.ts                     ← scale state + ctrl+wheel + pinch
│   ├── use-pdf-page-tracker.ts             ← IntersectionObserver → current page
│   ├── use-pdf-virtualization.ts           ← visible-page window + placeholders
│   ├── use-pdf-keyboard.ts                 ← Cmd+P / Cmd+S / Cmd+± / PgUp/PgDn / Esc
│   ├── use-pdf-drop.ts                     ← drag-drop handlers + objectURL lifecycle
│   ├── use-pdf-print.ts                    ← high-DPI canvas → iframe → print
│   ├── use-pdf-selection.ts                ← debounced selection text
│   └── use-object-url.ts                   ← create/revoke URL.createObjectURL
├── lib/
│   ├── normalize-source.ts                 ← unify PdfSource → react-pdf input
│   ├── worker-config.ts                    ← `?url` import + GlobalWorkerOptions wiring
│   ├── download.ts                         ← download helper (Blob → anchor click)
│   ├── compute-fit-scale.ts                ← compute fit-width / fit-page scale from viewport + page
│   └── clamp-scale.ts                      ← MIN/MAX scale clamp + zoom-step math
├── types.ts                                ← all type definitions + DEFAULT_PDF_VIEWER_LABELS
├── dummy-data.ts                           ← sample URL fixture + base64 PDF for offline demo
├── demo.tsx                                ← tabs: URL / File / Blob / DragDrop / CustomToolbar / CustomPasswordPrompt / Permissions / Mobile
├── usage.tsx                               ← consumer-facing prose
├── meta.ts                                 ← metadata
└── index.ts                                ← barrel (no meta export)
```

### `pdf-viewer.tsx` — top-level component (~300 LOC)

`"use client"` (required — pdf.js needs Web Worker, Canvas, browser APIs).

Structure:

1. **Worker init** — `useEffect(() => ensureWorkerConfigured(workerSrc), [workerSrc])` (only if not already configured for this `workerSrc`).
2. **Source normalization** — `useMemo`-equivalent (React Compiler) → `normalizedSource = normalizeSource(internalSource)`. `internalSource` is local state, initialized from `source` prop, mutated by drop.
3. **Document loading** — `usePdfDocument({ source, password, onPasswordRequired })` returns `{ pdfDocument, numPages, status, error }`.
4. **Viewer state hooks** — `usePdfZoom(...)`, `usePdfPageTracker(...)`, `usePdfVirtualization(...)`, `usePdfKeyboard(...)`, `usePdfDrop(...)`, `usePdfSelection(...)`, `usePdfPrint(...)`.
5. **Actions** — derived object with stable identities (Compiler memoizes); each action is a thin wrapper around hook setters or imperative methods.
6. **Imperative ref** — `useImperativeHandle(ref, () => ({ actions, state, pdfDocument }))`.
7. **Context provider** — `<PdfViewerContext.Provider value={contextValue}>` so toolbar parts read state+actions without prop-drilling.
8. **Render tree:**
   ```
   <section role="document" aria-label={…}>
     {toolbar && (renderToolbar?.(ctx) ?? <PdfToolbar />)}
     {status === 'empty' && <PdfEmptyState/>}
     {status === 'error' && <PdfErrorState onRetry={...}/>}
     {status === 'password' && (renderPasswordPrompt?.(ctx) ?? <PdfPasswordPrompt/>)}
     {status === 'loading' && <PdfLoadingState/>}
     {status === 'ready' && (
       <div className="scroll-container" ref={scrollRef} onWheel={zoomHandler} onDrop={dropHandler}>
         <PdfContextMenu ...>
           <Document file={normalizedSource} onLoadSuccess={...} onPassword={...}>
             {visiblePages.map((n) => <PdfPage key={n} pageNumber={n} scale={scale} rotation={rotation} virtualPlaceholder={...}/>)}
           </Document>
         </PdfContextMenu>
       </div>
     )}
     {isDragging && dragDropOverlay && <PdfDropOverlay/>}
   </section>
   ```
9. **Status state machine** — `'empty' | 'loading' | 'password' | 'ready' | 'error'`. Single source of truth driven by `usePdfDocument` + drop state.
10. **Effect ordering** — source change → reset page/scale/rotation to initials → load.

### `parts/pdf-page.tsx` — single-page renderer

Wraps `react-pdf`'s `<Page>`. Handles:
- text-layer rendering (`renderTextLayer={true}`)
- annotation-layer rendering (`renderAnnotationLayer={true}` — Q11)
- canvas at appropriate device-pixel ratio
- placeholder height when virtualized-out (page has known height from `pdfDocument.getPage(n).getViewport({scale}).height` cached at parse time)
- per-page `data-page-number` attribute for IntersectionObserver

### `parts/pdf-toolbar.tsx` — default toolbar

Composes the standalone parts:
```tsx
<div role="toolbar" aria-label={labels.toolbarAriaLabel}>
  <PdfPageNav />
  <PdfPageIndicator />
  <Separator orientation="vertical" />
  <PdfZoomControls />
  <Separator orientation="vertical" />
  {compact ? <PdfActionMenu compact /> : <PdfActionMenu />}
</div>
```

`compact` is true under the `sm` breakpoint (480px) — collapses rotate/download/print into a `<DropdownMenu>` overflow.

### `parts/pdf-page-nav.tsx`, `pdf-zoom-controls.tsx`, `pdf-action-menu.tsx`, `pdf-page-indicator.tsx` — sub-exports

Each reads `usePdfViewer()` for state+actions; renders shadcn Buttons / Inputs. Roughly 30–60 LOC each. All accept a `className` prop for cosmetic overrides; otherwise opinionated.

`<PdfPageNav>`:
- Prev/next buttons (disabled at boundaries)
- (page indicator is a separate sub-export; nav is just buttons)

`<PdfPageIndicator>`:
- "Page {page} of {numPages}" with editable `<input type="number">` for page jump
- JetBrains Mono for the numbers

`<PdfZoomControls>`:
- Zoom out, zoom percent, zoom in buttons + DropdownMenu (fit-width / fit-page / 50% / 75% / 100% / 150% / 200%)

`<PdfActionMenu>`:
- Rotate (icon button)
- Download (icon button — hidden when `!allowDownload`)
- Print (icon button — hidden when `!allowPrint`)
- `compact` prop collapses all three into an overflow `<DropdownMenu>` with kebab trigger

### `parts/pdf-context-menu.tsx` — right-click

Wraps shadcn `<ContextMenu>` around the document surface. Items:
- "Copy text" (visible when `selectedText !== ''`)
- "Search selection" (visible when both `selectedText !== ''` AND `onSearchSelection` registered)
- Separator
- Previous page / Next page
- Zoom in / Zoom out
- Rotate
- Separator
- Download (when `allowDownload`)
- Print (when `allowPrint`)

Consumer override via `renderContextMenu` slot replaces this entirely.

Right-click outside the document surface (toolbar / scrollbar / overlays) gets the browser's native menu — we attach the `<ContextMenu>` only to the page-render area.

### `parts/pdf-password-prompt.tsx` — default Dialog

shadcn Dialog with:
- Title: `labels.passwordTitle`
- Description: `labels.passwordHint`
- Input (`type="password"`) with `aria-invalid` when `error`
- Error message (sr-only and visible) when wrong password
- Buttons: Cancel + Unlock
- Submits on Enter; Esc cancels

Consumer override via `renderPasswordPrompt` slot.

### `parts/pdf-drop-overlay.tsx` — drag-drop visual

Absolute-positioned overlay over the scroll container. Rendered when `isDragging === true`. Dashed border + centered label + lime-tinted background. `pointer-events: none` so the underlying `onDrop` still fires. ~25 LOC.

### `parts/pdf-empty-state.tsx`, `pdf-error-state.tsx`, `pdf-loading-state.tsx`

Each ~40 LOC. Use shadcn Skeleton for loading. Empty state shows the drop hint when `enableDragDrop`. Error state shows error message + retry button (calls `actions.setSource(currentSource)` to reload).

### Hooks

#### `hooks/use-pdf-viewer-context.ts`

```ts
const PdfViewerContext = createContext<PdfViewerContextValue | null>(null);

export function usePdfViewer(): PdfViewerContextValue {
  const ctx = useContext(PdfViewerContext);
  if (!ctx) throw new Error("usePdfViewer must be used inside <PdfViewer>");
  return ctx;
}
```

`PdfViewerContextValue` = `PdfDocumentState & { actions: PdfActions; labels: Required<PdfViewerLabels>; allowDownload: boolean; allowPrint: boolean; compact: boolean }`.

#### `hooks/use-pdf-document.ts`

Wraps react-pdf's `<Document>` lifecycle. Returns `{ pdfDocument, numPages, status, error, retry }`. Internally uses react-pdf's onLoadSuccess/onLoadError/onPassword. Exposes `passwordCallback` so the prompt can call it.

#### `hooks/use-pdf-zoom.ts`

State: `scale: number`, `fitMode: 'fit-width' | 'fit-page' | null`. Listens to `wheel` events with `ctrlKey`; `e.preventDefault()`; recomputes scale around cursor (compute scroll offset adjustment to preserve cursor's document-space position). Min 0.25, max 5.0, step 1.2× per click.

Pinch (touch): tracks 2 PointerEvents; computes distance ratio; applies as scale factor centered on midpoint. Same scroll-restoration math.

Resize observer on the scroll container — recomputes fit-mode scale on container resize.

Returns `{ scale, fitMode, setScale, zoomIn, zoomOut, resetZoom, setFitMode }`.

#### `hooks/use-pdf-page-tracker.ts`

IntersectionObserver on each rendered `[data-page-number]` element; current page = the page whose top is closest to the scroll container's top edge (within a small tolerance). Debounced 50ms to avoid thrash during fast scrolls.

Returns `{ currentPage, scrollToPage }`. `scrollToPage(n)` does `el.scrollIntoView({ behavior: 'smooth', block: 'start' })`.

#### `hooks/use-pdf-virtualization.ts`

Computes `visiblePageNumbers: number[]` from current scroll position + container height + page heights. When `mode === 'never'`, returns `[1..numPages]`. When `'always'` (or `'auto'` && numPages >= threshold), returns `[max(1, current-1) .. min(numPages, current+2)]` (1 page above, 2 below). Page heights cached from initial parse via `pdfDocument.getPage(n).getViewport({ scale: 1 })`.

#### `hooks/use-pdf-keyboard.ts`

Window-level `keydown` listener while viewer has focus (or when `e.target` is inside the viewer's root):
- `Cmd/Ctrl+P` → print (preventDefault if `allowPrint`)
- `Cmd/Ctrl+S` → download (preventDefault if `allowDownload`)
- `Cmd/Ctrl+0` → reset zoom
- `Cmd/Ctrl++` / `Cmd/Ctrl+=` → zoom in
- `Cmd/Ctrl+-` → zoom out
- `PageUp` → previous page
- `PageDown` → next page
- `Home` → first page
- `End` → last page
- `Esc` → close password prompt (when open)

#### `hooks/use-pdf-drop.ts`

Outer container `onDragOver` (preventDefault to allow drop), `onDragEnter`, `onDragLeave`, `onDrop`. Tracks `isDragging` (counter-based to handle nested dragenter/leave correctly). On drop: filter `dataTransfer.files` for `application/pdf`; take first; call `setSource(file, { reason: 'drop' })`. Non-PDF drop → transient toast/inline message via `labels.notAPdfFile`.

Returns `{ isDragging, dropProps }`.

#### `hooks/use-pdf-print.ts`

`print()` action:
1. Get `pdfDocument`.
2. Create hidden iframe (`position: fixed; left: -9999px`) with empty body.
3. For each page, render to a hidden canvas at `scale: 2` (or higher for higher device DPI).
4. Append each canvas as `<img src={canvas.toDataURL('image/png')}>` to the iframe body, one per print-page (CSS `page-break-after: always`).
5. iframe's `<head>` includes minimal CSS: `@page { margin: 0; }`, `body { margin: 0; }`, `img { width: 100%; height: 100vh; object-fit: contain; }`.
6. `iframe.contentWindow.print()`.
7. Cleanup iframe after 1s timeout (or on `afterprint` event of iframe.contentWindow when supported).

Memory note: builds N data URLs upfront (N = numPages). For ≤200-page PDFs this is fine; very large PDFs we render in batches. Document this ceiling in guide.md.

#### `hooks/use-pdf-selection.ts`

Listens to `selectionchange` on `document`. Filters to selections inside the viewer's root. Debounced 150ms. Updates `selectedText`. Calls `onSelection({ text })` callback.

#### `hooks/use-object-url.ts`

```ts
function useObjectUrl(input: File | Blob | null): string | null
```

Creates URL on input change; revokes previous on unmount or input change. Used internally when source is File/Blob (react-pdf accepts these directly via `{ data: blob }` but for some flows we need a URL — e.g., download).

### `lib/normalize-source.ts`

```ts
export function normalizeSource(input: PdfSource | null | undefined): DocumentProps["file"] | null {
  if (input == null) return null;
  if (typeof input === "string") return input; // URL or data URI
  if (input instanceof ArrayBuffer || input instanceof Uint8Array) return { data: input };
  if (input instanceof Blob) return input; // covers File too
  return null;
}
```

Stable identity matters for react-pdf (changes trigger reload). We rely on the consumer to pass stable refs (documented).

### `lib/worker-config.ts`

```ts
import { pdfjs } from "react-pdf";
// `?url` import — Webpack 5 / Turbopack / Vite native syntax
import bundledWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let appliedSrc: string | null = null;

export function ensureWorkerConfigured(override?: string): void {
  const desired = override ?? bundledWorkerSrc;
  if (appliedSrc !== desired) {
    pdfjs.GlobalWorkerOptions.workerSrc = desired;
    appliedSrc = desired;
  }
}
```

### `lib/download.ts`

```ts
export async function downloadAsFile(
  source: PdfSource | null,
  filename: string,
): Promise<void>
```

Behavior:
- `string` URL → if same-origin, `<a href download>` click; if cross-origin, `fetch().blob()` → blob URL → click → revoke
- `File` → `<a href={URL.createObjectURL(file)} download={file.name}>` click → revoke
- `Blob` / `ArrayBuffer` → wrap in Blob → object URL → click → revoke (use `filename`)
- `Uint8Array` → wrap in Blob → same as above

### `lib/compute-fit-scale.ts`

Given `containerWidth`, `containerHeight`, and a representative page's `viewport.width` / `viewport.height` at scale 1, compute the scale that makes the page fit by width or by height. Used by `usePdfZoom` when `fitMode` is set or container resizes.

### `lib/clamp-scale.ts`

```ts
const MIN = 0.25;
const MAX = 5.0;
const STEP = 1.2;
export const clampScale = (s: number) => Math.max(MIN, Math.min(MAX, s));
export const nextZoomIn = (s: number) => clampScale(s * STEP);
export const nextZoomOut = (s: number) => clampScale(s / STEP);
```

### `dummy-data.ts`

```ts
// A small public-domain PDF on a CDN for the URL demo
export const PDF_VIEWER_DUMMY_URL =
  "https://cdn.jsdelivr.net/gh/mozilla/pdf.js@<commit>/test/pdfs/tracemonkey.pdf";

// A short base64 PDF (~5KB) embedded in the source for the offline / Blob / ArrayBuffer demos
export const PDF_VIEWER_DUMMY_BASE64 = "JVBERi0xLjQK..." /* ~5KB hello-world PDF */;

// Helpers
export function pdfViewerDummyArrayBuffer(): ArrayBuffer { /* base64 → ArrayBuffer */ }
export function pdfViewerDummyBlob(): Blob { /* base64 → Blob */ }
export function pdfViewerDummyFile(): File { /* base64 → File("hello.pdf") */ }
```

### `demo.tsx` — Tabs (`shadcn/ui` Tabs)

```
- URL              → <PdfViewer source={PDF_VIEWER_DUMMY_URL} />  (full-featured)
- File             → file <input> + <PdfViewer source={selectedFile} />
- Blob             → <PdfViewer source={pdfViewerDummyBlob()} />
- ArrayBuffer      → <PdfViewer source={pdfViewerDummyArrayBuffer()} />
- DragDrop         → <PdfViewer /> (no source) showing empty + drop hint
- CustomToolbar    → <PdfViewer renderToolbar={...}/> with bespoke toolbar
- CustomPassword   → password-protected dummy PDF + custom prompt slot
- Permissions      → allowDownload=false + allowPrint=false toggles
- Mobile           → responsive demo (uses container query / max-width: 480px wrapper)
- ToolbarOff       → <PdfViewer toolbar={false}/> minimal embed
- DarkTheme        → wrapped in `data-theme="dark"` div
```

### `usage.tsx` — written guidance

Sections:
- **Quick start** — minimal URL usage
- **Sources** — URL / File / Blob / ArrayBuffer; drag-and-drop
- **Toolbar** — default vs `renderToolbar` slot vs assembling parts
- **Zoom** — Ctrl+scroll, pinch, fit modes
- **Selection + right-click** — text selection, custom search handler
- **Password-protected PDFs** — default Dialog, custom prompt
- **Worker hosting** — bundled `?url` (default) and override path
- **Permissions** — `allowDownload` / `allowPrint` for DRM-light contexts
- **Performance** — virtualization, large PDFs, lazy loading recommendation

Imports use `@/components/pdf-viewer/*` paths (consumer-side per F-cross-06).

### `meta.ts` — metadata

```ts
export const meta: ComponentMeta = {
  slug: "pdf-viewer",
  name: "PDF Viewer",
  category: "media",
  description:
    "Drop-in PDF reader with toolbar, zoom, selectable text, drag-drop, and right-click context menu — themed to your design system, no commercial SDK.",
  context:
    "Use anywhere a `File`, URL, Blob, or ArrayBuffer needs inline rendering — case management, contract review, knowledge bases, asset libraries, e-sign confirmations, attachment viewers.",
  features: [
    "Sources: URL / File / Blob / ArrayBuffer",
    "Drag-and-drop a file to load it",
    "Continuous-scroll layout",
    "Built-in toolbar + renderToolbar slot + standalone parts",
    "Ctrl/Cmd+wheel zoom with cursor-anchored scaling",
    "Pinch-zoom on touch devices",
    "Selectable text via pdf.js text-layer",
    "Right-click context menu (text-aware)",
    "Auto-virtualization for large PDFs (≥50 pages)",
    "Password-protected PDFs with default Dialog + custom slot",
    "High-DPI print rendering",
    "Theme-aware (light + dark via design tokens)",
    "Object-shape callbacks (F-cross-12-correct from day one)",
    "WCAG 2.1 AA — toolbar role, aria-live page indicator, keyboard nav",
  ],
  tags: ["pdf", "viewer", "document", "reader", "media", "attachment"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-09",
  updatedAt: "2026-05-09",
  author: { name: "ilinxa" },
  dependencies: {
    shadcn: ["button", "dialog", "dropdown-menu", "context-menu", "input", "skeleton", "separator", "tooltip"],
    npm: {
      "react-pdf": "^10.4.1",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },
  related: ["media-carousel-01", "story-viewer-01", "video-player-01"],
};
```

### `index.ts` — barrel

Per the post-Phase-7 rule (no `meta` re-export). Exports per the "Public exports from `index.ts`" section above.

## Dependencies

| Type | Item | Purpose |
|---|---|---|
| **shadcn primitive** | `button` | Toolbar buttons |
| **shadcn primitive** | `dialog` | Default password prompt |
| **shadcn primitive** | `dropdown-menu` | Zoom presets, overflow menu |
| **shadcn primitive** | `context-menu` | Right-click menu |
| **shadcn primitive** | `input` | Page jump |
| **shadcn primitive** | `skeleton` | Loading state |
| **shadcn primitive** | `separator` | Toolbar dividers |
| **shadcn primitive** | `tooltip` | Toolbar button labels |
| **npm peer** | `react-pdf@^10.4.1` | Engine wrapper (pulls `pdfjs-dist@5.4.x` transitively) |
| **npm peer** | `lucide-react@^1.11.0` | Toolbar icons |

No internal registry-component composition.

## Composition pattern

- **Internal Context** (`PdfViewerContext`) carries state + actions. Top-level `<PdfViewer>` provides; toolbar parts consume via `usePdfViewer()`. Avoids prop-drilling without exposing the implementation detail to consumers (the public hook is documented as "use to build bespoke chrome").
- **Slot pattern** for `renderToolbar` / `renderContextMenu` / `renderPasswordPrompt` — each receives a typed context object; full takeover.
- **Sub-export composition** — `<PdfPageNav>` / `<PdfZoomControls>` / `<PdfActionMenu>` / `<PdfPageIndicator>` / `<PdfToolbar>` are exports consumers can mix inside their own `renderToolbar` value. Each part reads context internally; no props needed for state.
- **Imperative ref handle** (`PdfViewerHandle`) — for consumers needing programmatic control from outside the viewer (e.g., external "next page" button, deep-link to page from URL params).
- **Headless via `usePdfViewer()`** — public hook for advanced consumers building bespoke chrome from scratch. Same context the parts read.
- **State location**: all viewer state lives in the top-level component. No redux/zustand/external store. Source of truth = the single `<PdfViewer>` instance.
- **Render-prop signatures use object shape** (per F-cross-12).

## Client vs server

**`"use client"` is required** at the top of `pdf-viewer.tsx`. pdf.js needs:
- `Worker` (Web Worker for the parsing engine)
- `Canvas` (rendering target)
- `URL.createObjectURL` (for File/Blob sources)
- `IntersectionObserver` (page tracking + virtualization)
- `PointerEvent` (pinch-zoom)

None of this is available in RSC. The component is pure-client.

**RSC tree compatibility:** the component compiles inside an RSC tree as a client boundary. Consumers can import `<PdfViewer>` from a server component; React handles the boundary. The component itself, all its parts, and all its hooks are client.

**Lazy import recommendation** (consumer-side): for routes that don't always render a PDF, dynamic import:

```tsx
import dynamic from "next/dynamic";
const PdfViewer = dynamic(() => import("@/components/pdf-viewer").then(m => m.PdfViewer), { ssr: false });
```

This is documented in `usage.tsx` and `guide.md`. We do not bake a lazy strategy into the component itself (consumer's bundler choice).

## Edge cases

| Case | Behavior |
|---|---|
| `source` undefined / null | `enableDragDrop` true → empty state with drop hint; false → render `null` |
| `source` changes mid-session | Reload document; reset `page`/`scale`/`rotation` to initial values; fire `onSourceChange({ source, reason: 'prop' })` |
| Drag-drop replaces source | Same as prop change but `reason: 'drop'`; revoke previous object URL if applicable |
| Dropped file not PDF | Show transient toast/message via `labels.notAPdfFile`; do NOT change source |
| Multiple files dropped | Take first PDF (`.filter(f => f.type === 'application/pdf')[0]`); ignore rest |
| Source is invalid URL | `onError` fires; render error state with retry |
| Password-protected, no `password` prop | Render password prompt; on submit, retry document load with the supplied password |
| Wrong password | Keep prompt open; show inline error; increment `attempts` counter; do NOT close |
| User cancels password prompt | Render error state with "Authentication required" message |
| `password` prop wrong | Treat same as wrong-password path (prompt re-opens with `attempts: 1`) |
| 0-page PDF | Treat as error |
| 1-page PDF | Page nav buttons disabled; page indicator shows "1 / 1"; PgDn/PgUp no-op |
| Very small PDF (< viewport) | `fit-width` scales up; `fit-page` centers vertically |
| Very wide PDF (landscape) | Horizontal scroll within viewer; pinch-zoom still works |
| Zoom beyond min/max | Clamped silently |
| Ctrl+wheel during loading | Ignored (no-op) |
| Pinch on touch during loading | Ignored |
| Right-click on toolbar/scrollbar | Browser native menu (we don't intercept) |
| Right-click on document with no selection | Menu shows nav/zoom/actions (no copy/search items) |
| Print while loading | Print button + Cmd+P disabled |
| Print with `allowPrint=false` | Cmd+P does NOT preventDefault → browser tries to print the page; UI button is hidden. Document this in guide.md (true UX-only gate, not security) |
| Download with `allowDownload=false` | Same UX-only gate |
| Cross-origin URL without CORS | `onError` with network error; error state |
| Worker fails to load | `onError` with worker load error; error state with retry |
| `?url` import unsupported by consumer's bundler | Bundler error at build time. Document override path. |
| Window resize during fit-mode | Recompute fit scale; preserve current page's vertical position |
| Tab switch (browser tab backgrounded) | pdf.js worker continues; rendering pauses for off-screen canvas; resumes on visibility |
| Long tall PDF (1000+ pages) with virtualization=never | Acceptable degradation; document the "use virtualization=auto" recommendation |
| RTL layout | Toolbar buttons flip via Tailwind logical properties; document content does NOT flip (PDFs are intrinsically directional); page nav arrows flip |
| Mobile portrait, small viewport | Toolbar collapses to overflow at `< sm`; pinch-zoom replaces ctrl+wheel; touch-scroll for nav |

## Accessibility

### Markup shape

```html
<section role="document" aria-label="…">
  <div role="toolbar" aria-label="PDF viewer controls">
    <!-- prev/next/page-input/zoom/rotate/download/print -->
    <span aria-live="polite" aria-atomic="true">{labels.pageOfTotal(page, total)}</span>
    <span aria-live="polite" aria-atomic="true" class="sr-only">{labels.scalePercent(scale)}</span>
  </div>
  <div class="scroll-container" tabindex="0">
    <!-- right-click context menu attached here only -->
    <div data-page-number={n}>
      <canvas ...>
      <div class="text-layer" ...>  <!-- transparent overlay, browser selection works natively -->
      <div class="annotation-layer" ...>  <!-- pdf.js renders link <a> tags here -->
    </div>
    <!-- ...more pages... -->
  </div>
</section>
```

### Specific behaviors

- **`role="document"`** — outer wrapper announces "document region" to screen readers.
- **`role="toolbar"`** — the toolbar is announced as such; arrow keys move between buttons (Radix Toolbar primitive handles this — but we're using individual `<Button>`s, so we add explicit roving-tabindex via Radix's `<Toolbar>` if accessible; OR we accept Tab-through-each-button as the simpler-and-still-valid keyboard model. Decision in implementation: try Radix Toolbar first; fall back to plain buttons if it complicates layout).
- **`aria-live="polite"`** on the page indicator and (sr-only) zoom percent — page changes and zoom changes announce naturally.
- **Loading state** — `aria-busy="true"` on the section + sr-only "Loading PDF…" text.
- **Error state** — `role="alert"` on the error message container so screen readers announce immediately.
- **Password prompt** — shadcn Dialog handles role="dialog" + focus trap + Esc-to-close.
- **Context menu** — shadcn ContextMenu handles role="menu" + keyboard nav.
- **Scroll container `tabindex="0"`** — focusable so PgUp/PgDn keyboard shortcuts work when user clicks into the document area.
- **Text selection** — works via native browser selection on the text-layer; copy via Cmd/Ctrl+C is browser-native.
- **Annotation links** — pdf.js renders `<a>` tags in the annotation-layer; native focus + Enter activation work.
- **Focus rings** — `focus-visible:ring-2 ring-primary` on all interactive elements (toolbar buttons, page input, password input, context menu items).
- **Screen-reader-only labels** — every icon-only button has an `aria-label` derived from `labels.*`.
- **Reduced motion** — `motion-safe:` only for the loading skeleton pulse and the drop-overlay fade.

### Keyboard map (full)

| Key | Action |
|---|---|
| Tab | Move through toolbar buttons → into scroll container → out |
| PageUp / PageDown | Previous / next page (when scroll container has focus) |
| Home / End | First / last page |
| Cmd/Ctrl + 0 | Reset zoom |
| Cmd/Ctrl + + | Zoom in |
| Cmd/Ctrl + - | Zoom out |
| Cmd/Ctrl + P | Print (suppressed when `!allowPrint`) |
| Cmd/Ctrl + S | Download (suppressed when `!allowDownload`) |
| Esc | Close password prompt / context menu |
| Enter (on page input) | Jump to typed page |
| Arrow keys (in toolbar) | Move between toolbar buttons (Radix Toolbar) |

## Verification checklist

(Mirrors `docs/component-guide.md §13`. Every box must be `[x]` before GATE 3 spot-check review.)

### Build + correctness
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm validate:meta-deps` reports `38 / 38 clean`
- [ ] `pnpm dev` shows the component at `/components/pdf-viewer` with no console warnings
- [ ] `pnpm build` succeeds (offline-friendly post F-cross-04)

### Content + presentation
- [ ] All 11 demo tabs render correctly in light + dark
- [ ] URL / File / Blob / ArrayBuffer sources all load successfully in their respective tabs
- [ ] Drag-and-drop loads dropped file; non-PDF drop shows toast/inline message
- [ ] Ctrl+wheel zoom works smoothly with cursor anchoring; pinch-zoom works on a touch device (or simulator)
- [ ] Toolbar functional in default + compact (mobile) modes
- [ ] Custom toolbar slot replaces default
- [ ] Right-click on document surface shows custom context menu; on toolbar shows browser native
- [ ] Selectable text + Cmd/Ctrl+C copies; selection survives across pages
- [ ] Password-protected PDF prompts; wrong password shows error; correct unlocks
- [ ] Custom password prompt slot replaces default
- [ ] Download produces correct file; Print produces high-DPI output
- [ ] `allowDownload=false` / `allowPrint=false` hide UI + suppress shortcuts
- [ ] Loading state renders with shape-matched skeleton; error state retry reloads
- [ ] Auto-virtualization engages on a 200-page sample; off-screen pages don't allocate canvas
- [ ] Worker bundles correctly under Turbopack dev + production build
- [ ] `workerSrc` prop override loads from custom path

### Conventions
- [ ] `meta.slug === "pdf-viewer"` matches folder + URL
- [ ] No `meta` re-export from `index.ts` (post-Phase-7 rule)
- [ ] No positional callbacks (F-cross-12 lessons applied)
- [ ] No `next/*` imports anywhere in registry code
- [ ] Component compiles inside RSC tree as client boundary

### Registry distribution
- [ ] Added to `registry.json` — base + `pdf-viewer-fixtures` items
- [ ] Files list excludes `demo.tsx`, `usage.tsx`, `meta.ts`
- [ ] All file `target` values prefixed with `components/pdf-viewer/`
- [ ] `dependencies.npm` lists `react-pdf` and `lucide-react`

### Component readiness review (GATE 3)
- [ ] Spot-check review file authored at `docs/procomps/pdf-viewer-procomp/reviews/<DATE>-v0.1.0-spotcheck.md`
- [ ] Smoke harness pass — `pnpm dlx shadcn add @ilinxa/pdf-viewer` succeeds; consumer-side `pnpm tsc --noEmit` clean (F-cross-11 path b)
- [ ] Verdict ≥ `Pass with follow-ups`; follow-ups have owner + bump target

## Risks & alternatives

### Risks

1. **Bundle size** — `react-pdf` + `pdfjs-dist` ≈ 700 KB minified (pdfjs-dist is the bulk). The viewer is dead-weight on routes that don't render PDFs. Mitigations:
   - Document a strong "use `next/dynamic` + `ssr: false`" recommendation in usage.tsx and guide.md.
   - The component lives in `media/` with peers like `video-player-01` that are also weighty; consumers self-select.

2. **`?url` worker import portability** — Webpack 5 / Turbopack / Vite all support `?url`; older bundlers (Webpack 4, Parcel 1) do not. Mitigation: explicit `workerSrc` prop override + clear documentation in usage.tsx of the supported toolchains.

3. **Cross-origin URL sources** — fetching a PDF from another origin requires CORS headers on the server. If they're missing, pdf.js fails. Mitigation: `onError` surfaces the network error; error state shows a useful message; document the requirement.

4. **High-DPI print memory cost** — rendering each page to a 2×-scale canvas uses ~4× the pixel memory per page. For 200-page PDFs this is ~hundreds of MB peak during print. Mitigation: render in batches of 10; release canvas between batches. Document the practical ceiling.

5. **Touch-event conflicts with browser zoom** — pinch-zoom must `preventDefault` to prevent the browser's page-zoom from kicking in. We attach pinch handlers only to the scroll container; the toolbar uses default touch behavior. Tested explicitly in the Mobile demo tab.

6. **`page` state drift on fast scroll** — IntersectionObserver fires for many pages during fast scroll; debouncing too long → laggy page indicator; too short → flicker. Default 50ms; tunable via internal const if needed.

7. **Selection loss on zoom** — re-rendering pages at a new scale can clear browser selection. pdf.js's text-layer is recreated on scale change. Mitigation: re-apply selection from cached text-range after re-render. If too complex, document the limitation (selection is lost on zoom — common pattern in PDF readers anyway).

8. **Annotation-layer link clicks during text selection** — clicking inside an `<a>` from the annotation layer might be interpreted as a navigation when the user was trying to start a text selection. pdf.js handles this; document any UX gotcha.

9. **`react-pdf` major version bumps** — react-pdf v10 is current. Past major bumps have changed worker import paths and Document props. Mitigation: pinned to `^10.4.1` major; CI lock via lockfile; bump deliberately with smoke pass.

10. **Smoke harness payload** — the smoke consumer's `pnpm tsc --noEmit` will pull in pdf.js types (a few hundred files). This is a one-time cost in CI; doesn't affect end consumers. Verify the smoke harness still completes within reasonable bounds.

### Alternatives considered

- **`@react-pdf-viewer/core`** with custom theme overrides. Rejected per description Q1 — fights its built-in chrome and theme system.
- **Raw `pdfjs-dist`** — rejected as 3× implementation cost for unneeded control.
- **Commercial SDK (Apryse / Nutrient / Foxit)** — rejected per description (5-figure license + 5–20 MB JS).
- **Single-page paged scroll mode** — rejected per description Q2 (continuous-only).
- **CDN worker hosting** — rejected per Q14 (network dep at runtime; bad for offline).
- **`postinstall` worker copy script** — rejected as fragile (consumers' postinstall behavior varies; CI / Docker quirks).
- **Built-in lazy-loading** (component dynamically imports react-pdf on first render) — rejected because (a) it forces `Suspense` boundary discipline on the consumer, (b) consumers' bundlers handle this better via their own `dynamic()` wrappers, (c) adds an internal fallback UI that complicates the loading-state contract.
- **Built-in page thumbnails sidebar** — rejected per description (out of scope; future addition).
- **Virtual scrolling via `@tanstack/react-virtual`** — rejected as additional peer dep when our use case is "render N pages with known heights, hide off-screen ones" — solvable with a 60-line custom hook (`use-pdf-virtualization`) using IntersectionObserver. Deferred adoption until a real reason emerges.
- **Outline / TOC sidebar** — rejected per description (next addition; not first ship).
- **Annotation-layer disabled by default** — rejected; annotation-layer enables embedded link navigation which is expected behavior. Per Q11.
- **Worker-init via component effect on first instance only** — current design init's on every mount (cheap idempotent check via `appliedSrc` flag). Module-level init was an alternative but couples consumer's app-startup to react-pdf's import — bad for tree-shaking when the component isn't rendered.

## Implementation order

1. Author `types.ts` (the contract).
2. Author `lib/worker-config.ts`, `lib/normalize-source.ts`, `lib/clamp-scale.ts`, `lib/compute-fit-scale.ts`, `lib/download.ts`.
3. Author `hooks/use-object-url.ts`, `hooks/use-pdf-viewer-context.ts`.
4. Author `hooks/use-pdf-document.ts` (load + parse + password lifecycle).
5. Author `parts/pdf-page.tsx`, `pdf-loading-state.tsx`, `pdf-error-state.tsx`, `pdf-empty-state.tsx`, `pdf-drop-overlay.tsx`.
6. Author `hooks/use-pdf-zoom.ts`, `use-pdf-page-tracker.ts`, `use-pdf-virtualization.ts`, `use-pdf-keyboard.ts`, `use-pdf-drop.ts`, `use-pdf-selection.ts`, `use-pdf-print.ts`.
7. Author `parts/pdf-page-nav.tsx`, `pdf-zoom-controls.tsx`, `pdf-action-menu.tsx`, `pdf-page-indicator.tsx`.
8. Author `parts/pdf-toolbar.tsx` (composes the above).
9. Author `parts/pdf-context-menu.tsx`, `pdf-password-prompt.tsx`.
10. Author `pdf-viewer.tsx` (top-level — orchestrates everything).
11. Author `dummy-data.ts` (URL fixture + base64 PDF + helpers).
12. Author `meta.ts`.
13. Author `demo.tsx` (11 tabs).
14. Author `usage.tsx`.
15. Author `index.ts`.
16. Add to `manifest.ts`.
17. Verify `/components/pdf-viewer` renders.
18. Add to `registry.json` (base + fixtures items).
19. `pnpm registry:build`; spot-check `public/r/pdf-viewer.json`.
20. Author `pdf-viewer-procomp-guide.md`.
21. **GATE 3: spot-check review** (per [`.claude/rules/component-readiness-review.md`](../../.claude/rules/component-readiness-review.md)).
22. Update `STATUS.md`.
23. Commit + push.

---

> **Sign-off needed before any code lands.** This plan is the implementation contract; once signed off, scaffold → implement → review (GATE 3) per the workflow.
