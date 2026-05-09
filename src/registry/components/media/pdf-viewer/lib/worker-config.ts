import { pdfjs } from "react-pdf";

let appliedSrc: string | null = null;

/**
 * pdf.js's Web Worker. Default: load from the unpkg CDN at the same version
 * react-pdf bundles (`pdfjs.version` is set by react-pdf at module init).
 *
 * For offline-first apps, copy `pdfjs-dist/build/pdf.worker.min.mjs` into
 * your `public/` directory at build time and pass that path via the
 * `workerSrc` prop, e.g. `<PdfViewer workerSrc="/pdf.worker.min.mjs" />`.
 *
 * The CDN default keeps the component drop-in without bundler-specific asset
 * imports (which vary across Webpack 5 / Turbopack / Vite / older bundlers).
 */
function defaultWorkerSrc(): string {
  return `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export function ensureWorkerConfigured(override?: string): void {
  const desired = override ?? defaultWorkerSrc();
  if (appliedSrc !== desired) {
    pdfjs.GlobalWorkerOptions.workerSrc = desired;
    appliedSrc = desired;
  }
}
