import type { MediaNode, MediaPreviewKind } from "../types";

/** Extension → preview kind. Lower-case, no leading dot. */
const EXT_TO_KIND: Record<string, MediaPreviewKind> = {
  // image
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image",
  avif: "image", svg: "image", bmp: "image", ico: "image", heic: "image",
  // video
  mp4: "video", webm: "video", ogv: "video", mov: "video", m4v: "video",
  mkv: "video", avi: "video",
  // pdf
  pdf: "pdf",
  // json
  json: "json", jsonc: "json", geojson: "json",
  // markdown
  md: "markdown", markdown: "markdown", mdx: "markdown",
  // code
  ts: "code", tsx: "code", js: "code", jsx: "code", mjs: "code", cjs: "code",
  html: "code", htm: "code", css: "code", scss: "code", less: "code",
  py: "code", rb: "code", go: "code", rs: "code", java: "code", php: "code",
  swift: "code", kt: "code", c: "code", h: "code", cpp: "code", cc: "code",
  cs: "code", sh: "code", bash: "code", zsh: "code", yaml: "code", yml: "code",
  toml: "code", ini: "code", sql: "code", xml: "code", graphql: "code",
  vue: "code", svelte: "code", dockerfile: "code",
  // plain text
  txt: "text", log: "text", csv: "text", tsv: "text", env: "text",
};

/** Extract the lower-cased extension from `node.ext` or the file name. */
export function extOf(node: { name: string; ext?: string }): string {
  if (node.ext) return node.ext.replace(/^\./, "").toLowerCase();
  const dot = node.name.lastIndexOf(".");
  return dot > 0 ? node.name.slice(dot + 1).toLowerCase() : "";
}

/**
 * Resolve which viewer a file maps to: `mimeType` is authoritative for the
 * broad buckets, `ext` refines/falls back, else `"unknown"` (download-only).
 */
export function resolvePreviewKind(node: MediaNode): MediaPreviewKind {
  if (node.type === "folder") return "unknown";
  const mime = node.mimeType?.toLowerCase();
  const ext = extOf(node);

  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf") return "pdf";
    if (mime === "application/json") return "json";
    if (mime === "text/markdown" || mime === "text/x-markdown") return "markdown";
    if (
      mime === "text/html" ||
      mime === "text/css" ||
      mime === "text/javascript" ||
      mime === "application/javascript" ||
      mime === "application/typescript" ||
      mime === "application/xml" ||
      mime === "text/xml"
    ) {
      return "code";
    }
    if (mime === "text/plain" || mime === "text/csv") {
      // refine with ext when present (e.g. a `.ts` served as text/plain)
      return EXT_TO_KIND[ext] ?? "text";
    }
  }

  return EXT_TO_KIND[ext] ?? "unknown";
}

/** Text-based kinds the lib fetches content for. */
export function isTextKind(kind: MediaPreviewKind): boolean {
  return kind === "code" || kind === "json" || kind === "text" || kind === "markdown";
}
