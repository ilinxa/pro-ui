// initial-source-loader — InitialSource intake + validation (C9).
//
// Pure helpers (no React). Resolves `InitialSource` → either a loaded
// payload (object URL + derived mode + blob) or a `SourceError` per
// description §5 validation rules:
//
//   - For `kind: "file"`, mode is derived from `File.type` prefix.
//   - For `kind: "url"`, `fetch()` is attempted; CORS / network failures
//     surface as `kind: "cors"` or `kind: "fetch-failed"`.
//   - For `kind: "blob"`, mode is the consumer-supplied value.
//   - In all paths, the resolved mode MUST be a member of `enabledModes`.
//     Mismatch → `kind: "mode-not-enabled"`.
//   - Empty / blank blobs → `kind: "invalid-blob"`.
//
// The orchestrator owns objectURL lifetime — the loader returns the URL
// and the caller is expected to revoke it on unmount / source change.

import type { ComposerMode, InitialSource, SourceError } from "../types";

export type LoadedInitialSource = {
  mode: "photo" | "video";
  blob: Blob;
  objectUrl: string;
};

export type LoadInitialSourceResult =
  | { ok: true; loaded: LoadedInitialSource }
  | { ok: false; error: SourceError };

/**
 * Derive mode from a `File.type` MIME prefix. Returns `null` for anything
 * other than `image/*` or `video/*` (consumer should treat as unsupported).
 */
export function inferModeFromFile(
  file: File,
): "photo" | "video" | null {
  const type = file.type ?? "";
  if (type.startsWith("image/")) return "photo";
  if (type.startsWith("video/")) return "video";
  return null;
}

/**
 * Resolve `InitialSource` to either a loaded payload or a `SourceError`.
 *
 * The returned object URL is allocated via `URL.createObjectURL` — caller
 * MUST revoke it (typically on unmount / next source change) to avoid
 * leaking blob references.
 *
 * `enabledModes` gates the resolved mode. If the consumer disabled the
 * mode required by the source, returns `mode-not-enabled` without
 * fetching (URL path) — so we don't waste a request on a source we
 * can't display anyway.
 */
export async function loadInitialSource(
  source: InitialSource,
  enabledModes: readonly ComposerMode[],
): Promise<LoadInitialSourceResult> {
  // Step 1 — resolve { mode, blob }. file/blob paths are sync; url path fetches.
  let mode: "photo" | "video";
  let blob: Blob;

  if (source.kind === "file") {
    const inferred = inferModeFromFile(source.file);
    if (inferred === null) {
      return {
        ok: false,
        error: {
          kind: "unsupported-file-type",
          fileType: source.file.type ?? "",
          file: source.file,
        },
      };
    }
    mode = inferred;
    blob = source.file;
  } else if (source.kind === "blob") {
    mode = source.mode;
    blob = source.blob;
  } else {
    // kind === "url"
    mode = source.mode;
    // Pre-check enabledModes before paying the network cost.
    // Empty enabledModes signals the edit-only path (initialSource without
    // capture); the mode gate only applies when the consumer has explicitly
    // enabled at least one capture mode.
    if (enabledModes.length > 0 && !enabledModes.includes(mode)) {
      return {
        ok: false,
        error: {
          kind: "mode-not-enabled",
          attempted: mode,
          enabled: [...enabledModes],
        },
      };
    }
    try {
      const res = await fetch(source.url, { mode: "cors" });
      if (!res.ok) {
        return {
          ok: false,
          error: {
            kind: "fetch-failed",
            url: source.url,
            underlying: new Error(`HTTP ${res.status} ${res.statusText}`),
          },
        };
      }
      blob = await res.blob();
    } catch (err) {
      // CORS rejection surfaces as TypeError per spec; non-CORS network
      // failures usually do too. The distinction matters for the consumer's
      // recovery path (pre-fetch + blob vs. retry url), so we attempt to
      // disambiguate via the error name + message.
      const underlying = err instanceof Error ? err : new Error(String(err));
      const looksLikeCors =
        underlying.name === "TypeError" &&
        /cors|cross.origin|failed to fetch|networkerror/i.test(
          underlying.message,
        );
      return {
        ok: false,
        error: looksLikeCors
          ? { kind: "cors", url: source.url, underlying }
          : { kind: "fetch-failed", url: source.url, underlying },
      };
    }
  }

  // Step 2 — validate against enabledModes (file/blob paths only; url path
  // pre-checked above to avoid a wasted fetch). Empty enabledModes = edit-only
  // path, same exemption as the url pre-check.
  if (enabledModes.length > 0 && !enabledModes.includes(mode)) {
    return {
      ok: false,
      error: {
        kind: "mode-not-enabled",
        attempted: mode,
        enabled: [...enabledModes],
      },
    };
  }

  // Step 3 — sanity-check the blob isn't empty.
  if (blob.size === 0) {
    return {
      ok: false,
      error: {
        kind: "invalid-blob",
        reason: "Blob is empty (size: 0).",
      },
    };
  }

  // Step 4 — allocate the object URL. Caller owns revocation.
  const objectUrl = URL.createObjectURL(blob);
  return { ok: true, loaded: { mode, blob, objectUrl } };
}
