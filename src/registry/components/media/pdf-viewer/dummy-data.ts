/**
 * Mozilla's public-domain "TraceMonkey" PDF — used as the official pdf.js
 * demo file. Hosted on GitHub Pages with CORS headers, so we can render it
 * directly without proxying. ~14 pages, mixed text + figures.
 */
export const PDF_VIEWER_DUMMY_URL =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

/**
 * A second, smaller sample for compact / single-page demos.
 * Single-page Berkeley computer science paper sample, also CORS-friendly.
 */
export const PDF_VIEWER_DUMMY_SHORT_URL =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

/**
 * Construct a Blob from one of the sample URLs (for demos that want to
 * exercise the Blob source path). Used in demo.tsx via `useEffect`.
 */
export async function pdfViewerDummyBlob(
  url = PDF_VIEWER_DUMMY_URL,
): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sample PDF (${res.status})`);
  return await res.blob();
}

/**
 * Construct an ArrayBuffer from one of the sample URLs.
 */
export async function pdfViewerDummyArrayBuffer(
  url = PDF_VIEWER_DUMMY_URL,
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sample PDF (${res.status})`);
  return await res.arrayBuffer();
}
