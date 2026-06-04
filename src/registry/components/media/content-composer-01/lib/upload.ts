import type { ExportMetadata } from "@/registry/components/media/media-editor-01/types";

export type Uploader = (
  blob: Blob,
  meta: ExportMetadata,
) => Promise<{ url: string }>;

/**
 * Resolve a concrete uploader from the primary `uploader` fn or the `uploadUrl`
 * shorthand (QP-8). The shorthand POSTs a multipart form to `uploadUrl` and
 * expects a JSON `{ url }` back. Returns `undefined` when neither is provided —
 * the shell then can't produce a hero URL and surfaces an error at assembly.
 */
export function resolveUploader(
  uploader?: Uploader,
  uploadUrl?: string,
): Uploader | undefined {
  if (uploader) return uploader;
  if (uploadUrl) {
    return async (blob, meta) => {
      const form = new FormData();
      form.append("file", blob, fileNameFor(meta));
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      if (!res.ok) throw new Error(`content-composer-01: upload failed (${res.status}).`);
      const data: unknown = await res.json().catch(() => ({}));
      const url =
        data && typeof data === "object" && typeof (data as { url?: unknown }).url === "string"
          ? (data as { url: string }).url
          : "";
      if (!url) throw new Error("content-composer-01: upload response missing `url`.");
      return { url };
    };
  }
  return undefined;
}

function fileNameFor(meta: ExportMetadata): string {
  const mime = meta.mimeType ?? "";
  const ext = mime.includes("video")
    ? "mp4"
    : mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : "jpg";
  return `hero.${ext}`;
}
