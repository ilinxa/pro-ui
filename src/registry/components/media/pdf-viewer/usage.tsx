export default function PdfViewerUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">Quick start</h3>
        <p className="text-muted-foreground">
          The simplest case: pass a URL. The viewer renders a continuous-scroll
          document with toolbar, zoom, selection, drag-drop, and right-click —
          all on by default.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { PdfViewer } from "@/components/pdf-viewer"

export function Example() {
  return (
    <div className="h-160">
      <PdfViewer source="/docs/manual.pdf" />
    </div>
  )
}`}</code>
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          The viewer fills its parent container — give it explicit height
          (here <code>h-160</code> = 640px). It does not impose a default size.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Sources</h3>
        <p className="text-muted-foreground">
          Accepts URL strings, <code>File</code>, <code>Blob</code>,{" "}
          <code>ArrayBuffer</code>, and <code>Uint8Array</code>. Drag-and-drop
          is on by default — drop a PDF onto the viewer and it loads.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`<PdfViewer source="/path.pdf" />              // string URL
<PdfViewer source={file} />                    // File from <input>
<PdfViewer source={blob} />                    // Blob (e.g. fetch().blob())
<PdfViewer source={arrayBuffer} />             // ArrayBuffer

// Empty viewer with drag-drop:
<PdfViewer />`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Toolbar customization</h3>
        <p className="text-muted-foreground">
          Three options. Default toolbar; full replacement via{" "}
          <code>renderToolbar</code>; or compose from the standalone parts
          inside your own layout.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`// 1. Default
<PdfViewer source={url} />

// 2. Toolbar off (minimal embed)
<PdfViewer source={url} toolbar={false} />

// 3. Full replacement
<PdfViewer
  source={url}
  renderToolbar={({ page, numPages, scale, actions }) => (
    <MyToolbar
      page={page}
      total={numPages}
      onPrev={actions.goToPrevPage}
      onNext={actions.goToNextPage}
    />
  )}
/>

// 4. Mix the standalone parts (read viewer context internally)
import {
  PdfViewer,
  PdfPageNav,
  PdfPageIndicator,
  PdfZoomControls,
} from "@/components/pdf-viewer"

<PdfViewer
  source={url}
  renderToolbar={() => (
    <div className="flex items-center gap-2 px-3 py-2">
      <PdfPageNav />
      <PdfPageIndicator />
      <PdfZoomControls />
    </div>
  )}
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Imperative control (ref)
        </h3>
        <p className="text-muted-foreground">
          For external &quot;jump to page&quot; buttons, deep-linked routes, or any
          control surface outside the viewer.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`const ref = useRef<PdfViewerHandle>(null)

<button onClick={() => ref.current?.actions.goToPage(12)}>
  Open page 12
</button>

<PdfViewer ref={ref} source={url} />`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Selection + right-click
        </h3>
        <p className="text-muted-foreground">
          Text selection works natively via pdf.js&apos;s text-layer. The{" "}
          <code>onSelection</code> callback fires (debounced) when the user
          changes their selection. Wire <code>onSearchSelection</code> to
          surface a &quot;Search selection&quot; item in the right-click menu.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`<PdfViewer
  source={url}
  onSelection={({ text }) => setQuoted(text)}
  onSearchSelection={({ text }) => router.push(\`/search?q=\${text}\`)}
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Password-protected PDFs
        </h3>
        <p className="text-muted-foreground">
          When the source is encrypted, the viewer renders a default Dialog
          asking for the password. Pass a known password via the{" "}
          <code>password</code> prop to skip the prompt; or replace the prompt
          UI via <code>renderPasswordPrompt</code>.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`// Pre-supplied password
<PdfViewer source={url} password="secret" />

// Custom prompt UI
<PdfViewer
  source={url}
  renderPasswordPrompt={({ submit, error, attempts }) => (
    <MyVaultDialog onUnlock={submit} error={error} attempts={attempts} />
  )}
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Worker hosting</h3>
        <p className="text-muted-foreground">
          pdf.js requires a Web Worker. The viewer bundles{" "}
          <code>pdfjs-dist/build/pdf.worker.min.mjs</code> via{" "}
          <code>new URL(..., import.meta.url)</code> — handled natively by
          Webpack 5, Turbopack, and Vite. Override via <code>workerSrc</code>{" "}
          if you self-host the worker file.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`<PdfViewer source={url} workerSrc="/static/pdf.worker.min.mjs" />`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Lazy loading</h3>
        <p className="text-muted-foreground">
          The PDF engine is heavy (~700 KB minified). On routes that don&apos;t
          always render a PDF, dynamic-import the component so the bundle
          ships only when needed.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import dynamic from "next/dynamic"

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then(m => m.PdfViewer),
  { ssr: false }
)`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Permissions (UX-only)</h3>
        <p className="text-muted-foreground">
          <code>allowDownload</code> and <code>allowPrint</code> hide the
          corresponding UI and suppress the keyboard shortcuts. They are{" "}
          <strong>not</strong> a security mechanism — anyone with browser dev
          tools can still extract the PDF. Use for &quot;preview-only&quot; surfaces in
          DRM-light contexts.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Notes</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            Continuous scroll only. No paged-mode toggle in this version.
          </li>
          <li>
            Image selection / extraction is out of scope today (pdf.js renders
            pages to a single canvas — individual images aren&apos;t DOM nodes).
          </li>
          <li>
            Auto-virtualization engages at <code>≥ 50</code> pages. Override
            via <code>virtualize</code> + <code>virtualizeThreshold</code>.
          </li>
          <li>
            Cross-origin URLs need CORS headers on the server. Without them,
            pdf.js fails the load and the error state shows the message.
          </li>
          <li>
            Print renders each page at 2× DPI for sharp output. Memory peaks
            briefly during the print render.
          </li>
        </ul>
      </section>
    </div>
  );
}
