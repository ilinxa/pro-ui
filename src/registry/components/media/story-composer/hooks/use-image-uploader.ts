"use client";

import { useCallback, useRef, useState } from "react";
import {
  DEFAULT_STORY_COMPOSER_LABELS,
  type PublishFields,
  type PublishMetadata,
  type PublishResult,
  type ResolvedStoryComposerLabels,
  type Uploader,
} from "../types";

export type UploadStatus =
  | "idle"
  | "uploading"
  | "done"
  | "error"
  | "cancelled";

/** The label keys the uploader's own error messages come from. */
export type UploaderMessages = Pick<
  ResolvedStoryComposerLabels,
  | "uploadErrorNoDestination"
  | "uploadErrorHttp"
  | "uploadErrorNetwork"
  | "uploadErrorBadResponse"
  | "uploadCancelled"
>;

export interface UseImageUploaderOptions {
  /** Server endpoint for default POST FormData upload (Q-P6a). */
  uploadUrl?: string;
  /** Extra FormData fields appended to every request. */
  uploadFields?: Record<string, string>;
  /** Custom uploader — wins over uploadUrl when both are set. */
  uploader?: Uploader;
  /** Localized error messages (the component passes its resolved labels). Default: English. */
  messages?: UploaderMessages;
}

export interface UseImageUploaderResult {
  status: UploadStatus;
  /** 0..1 — determinate when XMLHttpRequest reports lengthComputable. */
  progress: number;
  error: Error | null;
  upload: (
    blob: Blob,
    metadata: PublishMetadata,
    fields?: PublishFields,
  ) => Promise<PublishResult>;
  cancel: () => void;
  reset: () => void;
}

/**
 * Default POST FormData uploader (Q-P6a) + escape hatch for signed-URL flows.
 *
 * XMLHttpRequest, not fetch — fetch lacks upload-progress events in browsers,
 * which the publishing overlay needs for a determinate progress bar.
 *
 * Publish fields (caption + host fields) are appended to the FormData next to
 * `uploadFields`: strings as-is, everything else `JSON.stringify`-ed. A custom
 * `uploader` receives them as its third argument instead.
 */
export function useImageUploader(
  options: UseImageUploaderOptions,
): UseImageUploaderResult {
  const { uploadUrl, uploadFields, uploader } = options;
  const messages = options.messages ?? DEFAULT_STORY_COMPOSER_LABELS;
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const warnedKeysRef = useRef(new Set<string>());

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
    async (
      blob: Blob,
      metadata: PublishMetadata,
      fields: PublishFields = {},
    ): Promise<PublishResult> => {
      setStatus("uploading");
      setProgress(0);
      setError(null);

      // Custom uploader path (S3 pre-signed PUT / Cloudinary / Mux).
      if (uploader) {
        try {
          const result = await uploader(blob, metadata, fields);
          setStatus("done");
          setProgress(1);
          return result;
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          setStatus("error");
          setError(e);
          throw e;
        }
      }

      // Default POST FormData path.
      if (!uploadUrl) {
        const e = new Error(messages.uploadErrorNoDestination);
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
              // Always the localized message; the parser's own error is the cause.
              const e = new Error(messages.uploadErrorBadResponse, {
                cause: parseErr,
              });
              setStatus("error");
              setError(e);
              reject(e);
            }
          } else {
            const e = new Error(messages.uploadErrorHttp(xhr.status));
            setStatus("error");
            setError(e);
            reject(e);
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          const e = new Error(messages.uploadErrorNetwork);
          setStatus("error");
          setError(e);
          reject(e);
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          // status already set to "cancelled" by cancel(). Reject so awaiting
          // callers don't hang forever — DOMException/AbortError mirrors the
          // fetch abort contract, so callers can filter it from real errors.
          reject(new DOMException(messages.uploadCancelled, "AbortError"));
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
        // Publish fields (caption + host fields): strings as-is (an empty
        // caption IS sent), the rest JSON; null / undefined are skipped (never
        // the literal "null"). A key that would overwrite the file, the metadata
        // or an `uploadFields` entry is skipped with a one-time dev warning.
        for (const [k, v] of Object.entries(fields)) {
          if (v === undefined || v === null) continue;
          if (k === "file" || k === "metadata" || (uploadFields && k in uploadFields)) {
            if (process.env.NODE_ENV !== "production" && !warnedKeysRef.current.has(k)) {
              warnedKeysRef.current.add(k);
              console.warn(
                `story-composer: publish field "${k}" collides with a reserved upload field (file / metadata / uploadFields) and was not sent.`,
              );
            }
            continue;
          }
          form.append(k, typeof v === "string" ? v : JSON.stringify(v));
        }
        xhr.send(form);
      });
    },
    [uploadFields, uploadUrl, uploader, messages],
  );

  return { status, progress, error, upload, cancel, reset };
}
