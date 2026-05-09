# pdf-viewer — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Greenfield component.** Not a migration. First component in a "document-rendering" family. Future siblings (TBD): `office-viewer` (docx/xlsx/pptx via something like docx-preview), `image-viewer` (zoomable image with EXIF), `archive-browser` (zip/tar contents preview).

## Problem

Every app that handles documents — case management, contract review, knowledge bases, asset libraries, e-signing, compliance audit, invoice processing, customer support attachment viewers — needs the same surface: **render a PDF inline, themed to the app, with consistent behavior across browsers**.

Today's options all fail one way:

- **`<embed>` / `<iframe>` with `application/pdf`** — gets you the browser's native renderer. Different chrome on Chrome / Firefox / Safari. Looks foreign. Can't be themed. No selection events. No control over zoom, page nav, or download. Mobile renders inconsistently. The browser may decide to download instead of preview based on Content-Disposition.
- **Direct `<iframe>` to a hosted Mozilla pdf.js viewer** — better consistency but the chrome is Mozilla's purple/gray UI, not ours. Theming is hacking iframe contents. Cross-origin issues for blob URLs.
- **Commercial SDKs (Apryse, Nutrient, Foxit)** — feature-rich but 5-figure annual licenses and 5–20 MB of JS. Wildly disproportionate for "render a PDF nicely."
- **Per-app rebuilds with raw `pdfjs-dist`** — every team writes their own React bindings, makes the same mistakes (worker config, scale arithmetic, scroll-restoration on zoom, mobile touch, accessibility). Code drift between apps.

Pro-ui's existing media components (`media-carousel-01`, `story-viewer-01`, `video-player-01`) cover image and video. PDF is the missing third leg — the format teams hand to users alongside images and videos in attachment lists, content libraries, and document workflows.

This component closes that gap with one opinionated, themeable, chrome-owned viewer that drops in anywhere a `File` / `Blob` / `URL` / `ArrayBuffer` exists.

## In scope

- **Sources** — accepts all four shapes natively: `string` URL, `File`, `Blob`, `ArrayBuffer`. No source-conversion gymnastics on the consumer side.
- **Drag-and-drop a PDF into the viewer to load it** — outermost surface accepts file drops. While dragging, an overlay shows "Drop PDF here." Drop replaces the current document. Opt-out via `enableDragDrop={false}`.
- **Continuous-scroll rendering** — all pages stacked vertically in one scroll container; consumer scrolls naturally between pages. Default mode. (Single-page paginated mode is *not* in scope; consumers wanting that can show one page via `initialPage` + control external nav, but the component does not ship a "paged" mode.)
- **Built-in toolbar** — sticky at top of viewer; replaceable via `renderToolbar` slot. Default toolbar contains:
  - Page indicator + jump-to-page input ("3 / 24")
  - Previous / next page buttons
  - Zoom out / zoom in / fit-width / fit-page / 100%
  - Rotate 90° (visual only — does not modify the source PDF)
  - Download (only when source is URL or includes a known filename for `Blob`/`File`)
  - Print
- **Ctrl/Cmd + mouse-wheel zoom** — standard reader UX. Smooth scaling around cursor position. Trackpad pinch on macOS recognized as Ctrl+wheel by the browser, so this works on touchpads natively.
- **Pinch-zoom on touch devices** — wired explicitly via Pointer Events (no peer dep). Centers around midpoint of the pinch, not the page center.
- **Selectable text** — pdf.js text-layer overlays transparent text on top of the canvas; native browser selection + Cmd/Ctrl+C work without extra code. Selection survives across pages within the viewer.
- **Right-click context menu** — replaces the browser's native context menu within the viewer surface. Text-aware: when text is selected, shows "Copy text" + "Search selection" (consumer-supplied search handler). Always shows: page nav, zoom, rotate, download, print. Replaceable via `renderContextMenu` slot.
- **Keyboard shortcuts** — Page Up / Page Down (page nav), Cmd/Ctrl+ / Cmd/Ctrl- / Cmd/Ctrl 0 (zoom in / out / reset), Cmd/Ctrl+P (print), Cmd/Ctrl+S (download — when applicable), Esc (close any viewer-overlay state).
- **Loading + error states** — `loading` skeleton (page-shaped placeholder + indeterminate spinner) while the document parses; `error` state with retry button + error message when the document fails (corrupt, network, unsupported version).
- **Password-protected PDFs** — when the source requires a password, default behavior shows an inline shadcn Dialog asking for the password. Replaceable via `renderPasswordPrompt` slot for custom UX. Wrong password keeps the prompt open with an error message.
- **Worker bundling** — pdf.js requires a Web Worker. We import the worker via `?url` (Webpack 5 / Vite / Turbopack / Next.js 16 native syntax) and wire `GlobalWorkerOptions.workerSrc` once at module init. Consumer override via the `workerSrc` prop for custom hosting.
- **Auto-virtualization** — for large PDFs (≥50 pages by default), only render visible pages + a small look-ahead buffer; off-screen pages render as height-locked placeholders. Threshold configurable via `virtualize: 'auto' | 'always' | 'never'`. Default `'auto'` with `virtualizeThreshold={50}`.
- **Responsive toolbar** — under a small breakpoint, secondary toolbar buttons (rotate, download, print) collapse into an overflow menu (DropdownMenu). Page nav + zoom remain inline.
- **Theme support** — light / dark via existing design tokens. Toolbar uses card/popover surfaces, signal-lime accent for the active page indicator focus, JetBrains Mono for the page-number input.
- **Object-shape callbacks** from day one (per F-cross-12 lessons): `onLoad?: (args: { numPages, pdfDocument }) => void`, `onError?: (args: { error, source }) => void`, `onPageChange?: (args: { page, source }) => void`, `onScaleChange?: (args: { scale, source }) => void`, `onSelection?: (args: { text }) => void` (debounced).
- **Polymorphic root** — accepts a `className` for the outer container and a `style` prop. Aspect / size are consumer responsibility (the viewer fills its parent's height/width); the component does not impose a default size.
- **Accessibility** — `<section role="document" aria-label="...">` outer wrapper, page indicator announces page changes via `aria-live="polite"`, toolbar buttons have explicit `aria-label`s, keyboard navigation lands focus on a logical first element, focus-visible rings on all interactive elements, contrast ratios ≥ AA against both light and dark surfaces.
- **Soft-failure** — if `source` is `null`/`undefined`, render the empty state ("No document loaded" + drop zone, when drag-drop is enabled). If `source` is invalid (e.g., a string that's not a URL or data URI), render the error state with a useful message.

## Out of scope

Explicitly deferred. Each is real demand we choose not to address now to keep scope tractable.

- **Image selection / extraction** — pdf.js renders pages to canvas; individual images aren't DOM nodes. Adding region-rectangle selection or per-image overlays is a non-trivial separate feature. Deferred until real consumer demand surfaces.
- **Full-text search** — `Cmd/Ctrl+F` opens browser's native page-find by default; that searches the visible text-layer, which is *partially* useful but doesn't cross page boundaries cleanly. A real in-document search bar (like Adobe's) is its own feature with its own UI, scroll-to-match logic, and result counter. Deferred.
- **Annotations** — highlights, sticky notes, drawings, comments. Big surface; persistence story; collaborative-editing implications. Belongs in a sibling component (`pdf-annotator`?) or later expansion.
- **Form filling** — interactive PDF forms (AcroForm / XFA). pdf.js supports rendering them; submission and persistence are consumer concerns. Deferred until a consumer asks.
- **Digital signatures** — both verification and signing flows. Whole separate domain.
- **Outline / bookmarks panel** — collapsible left-side TOC built from `pdfDocument.getOutline()`. Useful for long PDFs (textbooks, contracts). Reasonable next addition; defer.
- **Thumbnail sidebar** — left-side scrollable column of small page previews. Useful for visual nav of long PDFs. Defer (likely the same expansion as outline).
- **Per-image right-click actions** — see "image selection" above.
- **Multi-document compare view** — two PDFs side-by-side with synced scroll. Different layout shape entirely.
- **Print preview** — we expose `window.print()` against the document; we do not render a separate print-preview pane.
- **Page rotation persistence** — rotation is visual session state only. Component does not write back to the source PDF.
- **Performance instrumentation hooks** — render time, memory, etc. Expose later if a real need surfaces.
- **Animation / transitions on page change** — continuous scroll means there's no discrete "page change" animation. Out of scope by construction.

## Target consumers

- **Document review surfaces** — legal contract review, audit tools, compliance dashboards
- **Case management apps** — government, healthcare, customer support attachment viewers
- **CMS and asset libraries** — preview a PDF before downloading
- **E-signing follow-throughs** — render the signed PDF after DocuSign/Adobe Sign returns
- **Knowledge-base / wiki attachments** — inline PDF preview alongside articles
- **Invoice / receipt processing** — accounting, expense management
- **Form-heavy government / banking surfaces** — render official PDFs without forcing download
- **E-commerce product spec sheets** — manuals, datasheets attached to product pages

The consumer is a **frontend dev with a `File` / URL / Blob / ArrayBuffer reference to a PDF** and the requirement "render this inline in our app, themed to match." They do not want to write pdf.js bindings.

## Rough API sketch

```tsx
// URL source — simplest possible usage
<PdfViewer source="/docs/manual.pdf" />

// File from input — drag-drop also works (default ON)
<PdfViewer
  source={selectedFile}
  onLoad={({ numPages }) => setTotal(numPages)}
  onError={({ error }) => toast.error(error.message)}
/>

// Blob / ArrayBuffer (e.g., from fetch().arrayBuffer())
<PdfViewer source={pdfBlob} initialPage={1} initialScale="fit-width" />

// Toolbar customization — replace the entire toolbar
<PdfViewer
  source={url}
  renderToolbar={({ page, numPages, scale, actions }) => (
    <MyCustomToolbar
      page={page}
      total={numPages}
      onJump={actions.goToPage}
      onZoomIn={actions.zoomIn}
      onZoomOut={actions.zoomOut}
    />
  )}
/>

// Toolbar OFF — for embed-style minimal viewer
<PdfViewer source={url} toolbar={false} enableDragDrop={false} />

// Custom password prompt
<PdfViewer
  source={url}
  renderPasswordPrompt={({ submit, error }) => (
    <MyVaultDialog onUnlock={submit} error={error} />
  )}
/>

// Selection-aware app feature
<PdfViewer
  source={url}
  onSelection={({ text }) => setQuoteForCommentBox(text)}
/>

// Custom worker location (consumer hosts pdf.worker.min.mjs themselves)
<PdfViewer source={url} workerSrc="/static/pdf.worker.min.mjs" />
```

## Example usages

**1. Contract review surface (case management)**

A two-pane layout: left pane is the contract `<PdfViewer source={contractFile} />`; right pane is a list of clauses with comments. The user reads, highlights text in the PDF, and the `onSelection` callback feeds selected text into a "quote in comment" composer on the right. Continuous scroll matters — reviewers cross-reference paragraphs across pages constantly. Selection across pages is required.

**2. Invoice attachment preview in an admin panel**

A grid of expense rows with a "preview" button per row. Click expands a side panel with `<PdfViewer source={invoiceUrl} toolbar={true} />`. Most invoices are 1–3 pages; toolbar helps with zoom-in for fine print and download for the accountant's records. No drag-drop here (the source is fixed per row).

**3. Customer-support ticket attachment viewer**

Tickets have attachments — screenshots and PDFs. The PDF gets `<PdfViewer source={attachmentBlob} />` rendered inline in the ticket thread. Support agent skims, optionally downloads. Right-click "Copy text" lets them quote portions back into the ticket reply. Compact UX — toolbar collapses to overflow on the narrow ticket pane.

**4. Knowledge base article with embedded reference PDF**

A wiki article includes `<PdfViewer source="/refs/spec-v3.pdf" toolbar={true} initialScale="fit-page" />`. Reader uses Page Up / Page Down to flip, zooms with Ctrl+scroll. Theme matches the rest of the wiki (dark mode aware).

**5. Drag-drop quick-look (no upload, no source URL)**

A dashboard has a `<PdfViewer />` with no `source` prop — empty state shows "Drop a PDF here to preview." User drags a file from Finder, the viewer loads it locally, no upload, no server trip. Useful for ad-hoc preview workflows.

## Success criteria

The component is "done" when:

1. **All four sources work** — URL string, `File` (via `<input type="file">` and via drag-drop), `Blob`, `ArrayBuffer` — verified in the demo.
2. **Continuous scroll renders smoothly** for typical PDFs (1–50 pages). No layout jank, no flicker on page transitions, no scroll-position loss on zoom.
3. **Auto-virtualization kicks in** at 50+ pages without manual config; tested against a 200-page sample PDF; off-screen pages don't allocate canvas memory.
4. **Ctrl/Cmd+scroll zoom** is smooth (no per-frame re-render thrash), preserves cursor position, clamps at sensible min/max (e.g., 0.25× to 5×).
5. **Pinch-zoom on touch devices** works naturally (tested on iOS Safari + Android Chrome).
6. **Toolbar functional** — page nav (prev/next/jump), zoom (in/out/fit-width/fit-page/100%), rotate, download, print all work. Active page indicator updates as user scrolls.
7. **Right-click menu replaces browser default** within the viewer surface; text-aware ("Copy text" appears only when selection exists); other actions always present.
8. **Selectable text + copy** works across pages.
9. **Drag-and-drop** loads a dropped file; visual overlay shows during drag; dropping outside the viewer is ignored.
10. **Loading + error states** polished — skeleton matches final shape; error message is actionable.
11. **Password-protected PDFs** prompt with the default Dialog; wrong password shows error inline; correct password loads the document.
12. **Theme support** — light + dark verified; toolbar surfaces use card/popover tokens; signal-lime used appropriately (not on the canvas itself).
13. **Accessibility** — keyboard navigation reaches every toolbar control in tab order, page-change announcements via aria-live, focus-visible rings on all interactive elements, Lighthouse a11y audit ≥ 95 on the demo.
14. **Object-shape callbacks** throughout — no positional shapes.
15. **Worker bundles correctly** — `?url` import resolves under Turbopack (dev) and Webpack/Turbopack (prod build); consumer override via `workerSrc` prop verified.
16. **Smoke harness install + tsc pass** — `pnpm dlx shadcn add @ilinxa/pdf-viewer` succeeds against the smoke consumer; consumer-side `pnpm tsc --noEmit` clean.
17. **Procomp doc trio complete** — description (this), plan, guide. Demo demonstrates URL / File / Blob / ArrayBuffer + drag-drop + custom toolbar + custom password prompt. Usage doc covers gotchas: worker hosting alternatives, large PDFs, password handling, mobile UX.
18. **Meta + manifest in sync; registry.json shipped** (base + fixtures items).
19. **Build clean** — `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`, `pnpm validate:meta-deps` all pass.
20. **GATE 3 spot-check review** — verdict ≥ "Pass with follow-ups."

## Open questions

1. **Slug — `pdf-viewer` or `pdf-viewer-01`?** Existing pattern is mixed: bigger composed surfaces (`data-table`, `markdown-editor`, `entity-picker`, `properties-form`, `workspace`, `detail-panel`, `stat-card`, `filter-stack`) drop the suffix; smaller pattern-style components (`media-carousel-01`, `story-viewer-01`, `video-player-01`, `kanban-board-01`) keep it. **Recommendation:** drop the suffix → `pdf-viewer`. This is a flagship composed surface, not a numbered variant pattern.

2. **Continuous scroll vs paged scroll mode toggle.** Some users prefer "one page at a time, click to advance" (Adobe-like). **Recommendation:** ship continuous-only. Paged-scroll is its own UX with snap-points + spacebar nav; mixing both bloats the component. Real demand can graduate it later.

3. **Default initial scale — `'fit-width'`, `'fit-page'`, or `1.0`?** **Recommendation:** `'fit-width'`. Most-used reader default; most natural starting point on portrait screens. Configurable.

4. **Toolbar piece-by-piece composability.** Should we ship `<PdfPageNav>`, `<PdfZoomControls>`, `<PdfActionMenu>` as separately exported parts so consumers can reassemble subsets, in addition to `renderToolbar` for full replacement? **Recommendation:** YES — export the parts. Real consumers will want "page nav + zoom only, no rotate/download/print" without writing the whole toolbar from scratch. The parts are essentially free once we've split the toolbar internally.

5. **Print implementation — `window.print()` vs pdf.js's print rendering.** `window.print()` against the rendered canvas typically produces blurry output (canvas is at viewport DPI, not print DPI). pdf.js exposes a `getPage().render({ canvasContext, viewport: page.getViewport({ scale: 2.5 }) })` pattern at print resolution we can route to a hidden iframe and call `print()` on. **Recommendation:** pdf.js high-DPI render path. More code but the only path to acceptable print quality.

6. **Download — when do we show the button?** When `source` is a URL string we have the URL to download. When it's a `File` we have a filename. When it's a `Blob` we don't have a filename — should we fall back to `"document.pdf"` or hide the button? When it's an `ArrayBuffer` same problem. **Recommendation:** show the button always; default name `"document.pdf"` for Blob/ArrayBuffer; consumer can override via `downloadFilename` prop.

7. **Right-click — replace native menu always, or only when over the canvas + text-layer?** If the user right-clicks on the toolbar or scrollbar area, do we still hijack the menu? **Recommendation:** only on the document surface (canvas + text-layer). Toolbar / scrollbar / overlay regions get the browser's native menu. Avoids the "I just want to inspect element" frustration.

8. **Selection callback debounce window.** `onSelection` fires as the user drags; firing on every mousemove is too noisy. **Recommendation:** debounce 150ms after `selectionchange` settles; document the timing in guide.md.

9. **Drag-drop scope — single file or multiple?** **Recommendation:** single PDF only (first file in `dataTransfer.files` filtered to `application/pdf`). Multi-document is a different feature (compare view) which is out of scope. Non-PDF drops show a transient toast/inline message: "Only PDF files supported."

10. **Empty state when no `source` AND `enableDragDrop=false`.** Renders nothing? Renders a blank card? Renders a "Pass a `source` prop" warning? **Recommendation:** render `null` (component disappears). Empty state with copy is only meaningful when drag-drop is the entry; without it, the consumer is in an error/misconfiguration path.

11. **Annotation layer overlay.** pdf.js produces an annotation-layer DIV that surfaces clickable links (a `[mailto:](mailto:)` link in the PDF, an http link, a within-doc nav). It's free if we render it. **Recommendation:** render the annotation-layer (links work as expected); explicitly out of scope: editing/creating annotations, just showing the existing ones.

12. **Print + download permission gates.** Consumer might want to disable download (DRM-light contexts). **Recommendation:** `allowDownload?: boolean` (default `true`), `allowPrint?: boolean` (default `true`). Hide buttons + ignore keyboard shortcuts when `false`. Note: this is UX-level, not security — anyone with browser dev tools can extract the PDF; document this clearly in guide.md.

13. **Touch UX — full-toolbar always, or auto-collapse on small viewports?** **Recommendation:** auto-collapse below `sm` breakpoint to overflow menu (page nav + zoom inline; rotate/download/print/etc behind a kebab menu).

14. **Worker source — same `?url` import works under all bundlers in scope?** Next.js 16 + Turbopack: yes. Webpack 5 (consumers using create-react-app, etc.): yes since 5.0. Vite: yes. Older Webpack 4 / Parcel 1: no. **Recommendation:** document the requirement (modern bundler, ESM, asset-as-URL support). Expose `workerSrc` prop as the explicit override for consumers on older toolchains.

15. **Memory pressure on very large PDFs.** A 1000-page PDF with virtualization still parses the whole document on load. pdf.js exposes a `getPage()` lazy interface but the `getDocument()` call materializes the parsed structure. **Recommendation:** document the practical ceiling (~500–1000 page typical PDFs, depending on density). Beyond that, range-requests and partial loading become necessary — defer to a future enhancement.

16. **`react-pdf` peer dep version.** Pin to current major (v9 at time of writing — verify in plan stage). Document the peer dep clearly so consumers don't get a duplicate-pdfjs-dist warning.

---

> **Sign-off needed before Stage 2 (plan).** Open questions above represent active uncertainties; recommendations are starting positions. Reviewer should mark each open-question with their preferred resolution OR push back on the recommendation.
