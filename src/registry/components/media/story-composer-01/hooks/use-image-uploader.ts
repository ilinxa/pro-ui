"use client";

import { useCallback, useRef, useState } from "react";
import type {
  PublishMetadata,
  PublishResult,
  Uploader,
} from "../types";

export type UploadStatus =
  | "idle"
  | "uploading"
  | "done"
  | "error"
  | "cancelled";

export interface UseImageUploaderOptions {
  /** Server endpoint for default POST FormData upload (Q-P6a). */
  uploadUrl?: string;
  /** Extra FormData fields appended to every request. */
  uploadFields?: Record<string, string>;
  /** Custom uploader — wins over uploadUrl when both are set. */
  uploader?: Uploader;
}

export interface UseImageUploaderResult {
  status: UploadStatus;
  /** 0..1 — determinate when XMLHttpRequest reports lengthComputable. */
  progress: number;
  error: Error | null;
  upload: (blob: Blob, metadata: PublishMetadata) => Promise<PublishResult>;
  cancel: () => void;
  reset: () => void;
}

/**
 * Default POST FormData uploader (Q-P6a) + escape hatch for signed-URL flows.
 *
 * XMLHttpRequest, not fetch — fetch lacks upload-progress events in browsers,
 * which the publishing overlay needs for a determinate progress bar.
 */
export function useImageUploader(
  options: UseImageUploaderOptions,
): UseImageUploaderResult {
  const { uploadUrl, uploadFields, uploader } = options;
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setStatus("cancelled");
  }, []);

  const upload = useCallback(
    async (blob: Blob, metadata: PublishMetadata): Promise<PublishResult> => {
      setStatus("uploading");
      setProgress(0);
      setError(null);

      // Custom uploader path (S3 pre-signed PUT / Cloudinary / Mux).
      if (uploader) {
        try {
          const result = await uploader(blob, metadata);
          setStatus("done");
          setProgress(1);
          return result;
        } catch (err) {
          const e = err as Error;
          setStatus("error");
          setError(e);
          throw e;
        }
      }

      // Default POST FormData path.
      if (!uploadUrl) {
        const e = new Error(
          "story-composer-01: pass `uploadUrl` or `uploader` to publish.",
        );
        setStatus("error");
        setError(e);
        throw e;
      }

      return new Promise<PublishResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("POST", uploadUrl, true);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(ev.loaded / ev.total);
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const text = xhr.responseText;
              const parsed: PublishResult = text
                ? JSON.parse(text)
                : { url: "" };
              if (!parsed.url) {
                // Allow servers that return 200 without a body, but caller
                // probably wants the URL — leave it blank and proceed.
                parsed.url = "";
              }
              setStatus("done");
              setProgress(1);
              resolve(parsed);
            } catch (parseErr) {
              const e =
                parseErr instanceof Error
                  ? parseErr
                  : new Error("Upload response was not JSON");
              setStatus("error");
              setError(e);
              reject(e);
            }
          } else {
            const e = new Error(`Upload failed (HTTP ${xhr.status})`);
            setStatus("error");
            setError(e);
            reject(e);
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          const e = new Error("Upload network error");
          setStatus("error");
          setError(e);
          reject(e);
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          // status already set to "cancelled" by cancel()
        };

        const form = new FormData();
        const ext = blob.type.includes("webm")
          ? "webm"
          : blob.type.includes("mp4")
            ? "mp4"
            : blob.type.includes("png")
              ? "png"
              : "jpg";
        form.append(
          "file",
          blob,
          `story-${Date.now()}.${ext}`,
        );
        // Append metadata as a JSON string so backends can pick keys they want.
        form.append("metadata", JSON.stringify(metadata));
        if (uploadFields) {
          for (const [k, v] of Object.entries(uploadFields)) form.append(k, v);
        }
        xhr.send(form);
      });
    },
    [uploadFields, uploadUrl, uploader],
  );

  return { status, progress, error, upload, cancel, reset };
}
