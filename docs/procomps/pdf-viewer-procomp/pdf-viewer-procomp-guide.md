# pdf-viewer — consumer guide

> Stage 3: how to use it. Authored alongside the v0.1.0 ship.
>
> **Predecessors:** [`description.md`](./pdf-viewer-procomp-description.md), [`plan.md`](./pdf-viewer-procomp-plan.md). Component implementation lives at [`src/registry/components/media/pdf-viewer/`](../../../src/registry/components/media/pdf-viewer/).

## When to use

`pdf-viewer` is the pro-ui answer to "render a PDF inline, themed to the app, with consistent behavior across browsers." Reach for it when:

- A user-facing surface needs to display a PDF without forcing download.
- The host app already has the PDF as a `File`, URL, `Blob`, or `ArrayBuffer`.
- Browser-native `<embed>` / `<iframe>` PDF rendering looks foreign next to the rest of your UI, or you need selection events / right-click handlers.
- A commercial SDK (Apryse, Nutrient, Foxit) is overkill for the use case.

Real cases:

- Document review (legal contract review, audit, compliance)
- Case management (government, healthcare, customer support attachment viewers)
- CMS / asset library preview
- E-sign confirmation flows (rendering the signed PDF)
- Knowledge base attachments
- Invoice / receipt processing
- Product spec sheets / datasheets in e-commerce

## When NOT to use

- **You need to edit PDFs** — annotations, form filling, signing, drawing. Out of scope. Use a commercial SDK or look for a `pdf-annotator` sibling component (not yet built).
- **You need to extract individual images from PDFs** — pdf.js renders pages to canvas; per-image extraction is non-trivial and explicitly deferred. Region-rectangle copy is a future enhancement.
- **You need full-text search across the document** — browser's `Ctrl+F` finds text on the visible page; cross-page search would need its own UI and isn't shipped.
- **You need a "paged" reader UX** (one page at a time, click-to-advance) — viewer is continuous-scroll only.
- **You're rendering 10 thousand+ page PDFs** — the engine parses the whole document on load. Practical ceiling is ~500–1000 pages.

## Composition patterns

### The drop-in case

```tsx
<div className="h-160">
  <PdfViewer source="/docs/contract.pdf" />
</div>
```

Toolbar, zoom, drag-drop, selection, right-click — all on. Give it explicit height; the viewer fills its container.

### File-input + drag-drop combo

```tsx
const [file, setFile] = useState<File | null>(null);

<input
  type="file"
  accept="application/pdf"
  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
/>
<div className="h-160">
  <PdfViewer source={file} />
</div>
```

Drag-drop is on by default — dropping replaces the source. The `<input>` and the drag-drop both feed the same `source` state.

### Two-pane review surface

```tsx
<div className="grid h-full grid-cols-[2fr_1fr]">
  <PdfViewer
    source={contractFile}
    onSelection={({ text }) => setQuotedText(text)}
    onSearchSelection={({ text }) =>
      router.push(`/clauses?q=${encodeURIComponent(text)}`)
    }
  />
  <ClauseSidebar quotedText={quotedText} />
</div>
```

Right-click → "Search selection" hands selected text to a route. `onSelection` continuously updates a side panel.

### Custom toolbar

```tsx
<PdfViewer
  source={url}
  renderToolbar={({ page, numPages, scale, actions, allowDownload }) => (
    <div className="flex items-center gap-3 px-4 py-2">
      <YourLogo />
      <span className="ml-auto font-mono text-sm">
        {page} / {numPages}
      </span>
      <Button onClick={actions.zoomOut}>−</Button>
      <span>{Math.round(scale * 100)}%</span>
      <Button onClick={actions.zoomIn}>+</Button>
      {allowDownload && (
        <Button onClick={actions.download}>Download</Button>
      )}
    </div>
  )}
/>
```

The slot receives state + actions + computed flags. Build whatever chrome matches your app.

### Composing standalone toolbar parts

```tsx
import {
  PdfViewer,
  PdfPageNav,
  PdfPageIndicator,
  PdfZoomControls,
} from "@/components/pdf-viewer";

<PdfViewer
  source={url}
  renderToolbar={() => (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted">
      <PdfPageNav />
      <PdfPageIndicator />
      <PdfZoomControls />
    </div>
  )}
/>
```

The parts read state from the viewer's internal context — no prop-drilling. Each accepts a `className` for cosmetic overrides.

### Imperative control via ref

```tsx
const ref = useRef<PdfViewerHandle>(null);

useEffect(() => {
  // Open at a specific page from a URL param
  const targetPage = Number(searchParams.get("page"));
  if (Number.isFinite(targetPage)) {
    ref.current?.actions.goToPage(targetPage);
  }
}, [searchParams]);

<PdfViewer ref={ref} source={url} />
```

The handle exposes `actions`, `state`, and the underlying `pdfDocument`. Useful for deep-linked routes and external control surfaces.

### Custom password prompt

```tsx
<PdfViewer
  source={url}
  renderPasswordPrompt={({ submit, cancel, error, attempts }) => (
    <YourVaultDialog
      open={true}
      onUnlock={submit}
      onClose={cancel}
      error={error}
      attempts={attempts}
    />
  )}
/>
```

Replace the default shadcn Dialog with whatever flow you have for credentials (vault lookup, biometrics, etc.).

## Gotchas

### pdf.js needs browser globals — render client-only

The viewer requires `DOMMatrix`, `Worker`, `Canvas`, and `IntersectionObserver`. None of these exist during Next.js / SSR. Wrap the import in `next/dynamic` with `ssr: false`:

```tsx
import dynamic from "next/dynamic";

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfViewer),
  { ssr: false }
);
```

Without this, the route will throw `ReferenceError: DOMMatrix is not defined` on the server.

### Worker hosting

By default, the viewer loads pdf.js's worker from the unpkg CDN at the version react-pdf bundles. This keeps the component drop-in across Webpack 5 / Turbopack / Vite without bundler-specific asset imports.

For offline-first apps, copy the worker into your `public/` folder at build time and pass that path:

```tsx
<PdfViewer source={url} workerSrc="/pdf.worker.min.mjs" />
```

You can do the copy via a `postinstall` script:

```json
{
  "scripts": {
    "postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/"
  }
}
```

### Bundle size

`react-pdf` + `pdfjs-dist` is roughly 700 KB minified — too heavy to ship on every route. Always dynamic-import the viewer (the same `next/dynamic` example above doubles as a code-splitting boundary).

### Cross-origin sources

A `source="https://other-origin/file.pdf"` requires CORS headers on the responding server. Without them, pdf.js cannot read the bytes. The error state will surface a network-error message; document this for your end users.

If you control the other origin, set `Access-Control-Allow-Origin` appropriately. If you don't, proxy the PDF through your own backend.

### Image extraction — out of scope

The viewer does NOT support per-image right-click / "Save image as" / region-rectangle screenshot. pdf.js renders pages to a single canvas; individual images are pixels, not DOM nodes. This is a planned future enhancement; not v0.1.

### Permissions are UX-only

`allowDownload={false}` and `allowPrint={false}` hide the buttons and suppress shortcuts. **They are not security**. Anyone with browser dev tools can open the network tab, find the PDF response, and save it. Use these props for surfaces where you want to discourage casual download — not for DRM.

### Print quality

The print path renders each page to a hidden canvas at 2× scale, embeds the canvases as images in a hidden iframe, and triggers `print()` on that iframe. This produces sharp output across browsers. Memory peaks briefly during the print render — for 200+ page documents, expect a noticeable pause.

### Mobile

- Pinch-zoom is wired explicitly via Pointer Events. Pinching the canvas zooms the document, not the page.
- Toolbar collapses below 480px container width — secondary buttons (rotate / download / print) move into an overflow menu.
- Touch-scroll for page nav works as expected.

### Selection across re-renders

When you change zoom or rotation, pdf.js re-renders the text-layer; browser selection may be cleared as a side-effect. This is consistent with most PDF readers' behavior. Document for your users that they should select-and-copy first, zoom after.

### Right-click scope

The custom right-click menu only attaches to the document surface (canvas + text-layer). Right-clicking on the toolbar, scrollbar, or empty viewer regions falls through to the browser's native menu. This preserves "inspect element" and similar developer affordances.

### File drops outside the viewer

When the user drops a file *outside* the viewer (anywhere else in your page), the browser's default behavior takes over (typically: navigate away to the file, or download it). If your app needs to swallow stray drops, add a top-level dragover/drop handler on the document or page root with `preventDefault()`.

## Migration notes

This is a greenfield component — no migration from a prior pro-ui PDF surface.

If you're moving away from a `<embed src=".pdf">` or `<iframe>`-with-pdf approach, the migration is mostly:

1. Wrap your existing render site in `<PdfViewer source={url} />`.
2. Add explicit height to the container (the viewer fills its parent).
3. Remove the iframe-specific styling (no more `border: 0` hacks; the viewer comes themed).

If you're moving from `@react-pdf-viewer/core`, `pdfjs-dist` raw, or a commercial SDK:

1. The default toolbar is built-in; you don't need to register plugins.
2. `renderToolbar` replaces the entire toolbar — no plugin-config object.
3. State + actions are accessible via `usePdfViewer()` (inside the viewer) or a `ref` (outside).

## Open follow-ups

Tracked for future enhancement:

- **Image selection / extraction** — region-rectangle copy ("drag a box, copy the pixels").
- **Outline / TOC sidebar** — collapsible left-side panel of `pdfDocument.getOutline()` entries.
- **Thumbnail sidebar** — left-side scrollable column of small page previews for visual nav of long PDFs.
- **In-document search** — a real search bar with cross-page result counter (browser native `Ctrl+F` only finds text on the visible page).
- **Annotations** — highlights, sticky notes, drawings. Different feature surface; likely a sibling component.

Open an issue or surface real demand before any of these graduate to a procomp plan.

## Component-readiness review

v0.1.0 spot-check review at [`./reviews/2026-05-10-v0.1.0-spotcheck.md`](./reviews/2026-05-10-v0.1.0-spotcheck.md). Verdict captured there per the [component-readiness review rule](../../../.claude/rules/component-readiness-review.md).
