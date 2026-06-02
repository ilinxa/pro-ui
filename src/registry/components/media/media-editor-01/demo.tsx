"use client";

import * as React from "react";
import { MediaEditor01 } from "./media-editor-01";
import type {
  AspectRatio,
  ComposerMode,
  EditTool,
  InitialSource,
  MediaEditor01Handle,
  MediaSource,
  SourceError,
} from "./types";

/**
 * media-editor-01 demo (C9 skeleton).
 *
 * Four tabs:
 *   - Inline (default) — bare layout in parent.
 *   - Dialog — wrapped in shadcn dialog with size derived from aspect.
 *   - Capability dials — all 4 gating dials with live toggles.
 *   - Edit-only — enabledModes:[] + initialSource: CMS re-edit / hero-image
 *     flow. Exercises URL / blob / file paths + intentional error cases.
 *
 * Real 5-tab demo (Defaults / News-hero / Chat / Edit-only / Dark) lands in C12.
 */
type Tab = "inline" | "dialog" | "dials" | "edit-only";

export default function MediaEditor01Demo() {
  const [tab, setTab] = React.useState<Tab>("inline");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/30 p-1 self-start">
        {(["inline", "dialog", "dials", "edit-only"] satisfies Tab[]).map(
          (t) => (
            <button
              key={t}
              type="button"
              className={
                "rounded-sm px-3 py-1 text-xs font-medium " +
                (tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground")
              }
              onClick={() => setTab(t)}
            >
              {t === "inline"
                ? "Inline"
                : t === "dialog"
                ? "Dialog"
                : t === "dials"
                ? "Capability dials"
                : "Edit-only"}
            </button>
          ),
        )}
      </div>

      {tab === "inline" ? (
        <InlineDemo />
      ) : tab === "dialog" ? (
        <DialogDemo />
      ) : tab === "dials" ? (
        <DialsDemo />
      ) : (
        <EditOnlyDemo />
      )}
    </div>
  );
}

function InlineDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);

  return (
    <div className="flex flex-col gap-4">
      <MediaEditor01 ref={editorRef} aspect="free" presentation="inline" />

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
          onClick={() => editorRef.current?.applyFilter("clarendon")}
        >
          Apply Clarendon filter
        </button>
        <button
          type="button"
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
          onClick={() => editorRef.current?.reset()}
        >
          Reset state
        </button>
        <button
          type="button"
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
          onClick={() => {
            console.log("getState:", editorRef.current?.getState());
            console.log("isDirty:", editorRef.current?.getIsDirty());
          }}
        >
          Log state
        </button>
      </div>
    </div>
  );
}

function DialogDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [aspect, setAspect] = React.useState<AspectRatio>("9:16");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Aspect:</span>
        {(["9:16", "1:1", "16:9", "4:5", "free"] satisfies AspectRatio[]).map(
          (a) => (
            <button
              key={a}
              type="button"
              className={
                "rounded-md border px-2 py-1 " +
                (aspect === a
                  ? "border-foreground/40 bg-foreground/10 text-foreground"
                  : "border-border bg-muted/30 hover:bg-muted")
              }
              onClick={() => setAspect(a)}
            >
              {a}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="self-start rounded-md border border-border bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        onClick={() => setIsOpen(true)}
      >
        Open editor
      </button>

      <MediaEditor01
        ref={editorRef}
        aspect={aspect}
        presentation="dialog"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

function DialsDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);
  const [aspect, setAspect] = React.useState<AspectRatio>("free");
  const [enabledModes, setEnabledModes] = React.useState<ComposerMode[]>([
    "photo",
    "video",
    "text",
  ]);
  const [enabledTools, setEnabledTools] = React.useState<EditTool[]>([
    "text",
    "draw",
    "stickers",
    "filters",
    "adjust",
    "crop",
  ]);
  const [mediaSources, setMediaSources] = React.useState<MediaSource[]>([
    "camera",
    "upload",
  ]);

  const toggleInArray = <T extends string>(
    arr: T[],
    item: T,
    setArr: (next: T[]) => void,
  ) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
        <DialRow label="aspect">
          {(["9:16", "1:1", "16:9", "4:5", "free"] satisfies AspectRatio[]).map(
            (a) => (
              <DialChip
                key={a}
                active={aspect === a}
                onClick={() => setAspect(a)}
              >
                {a}
              </DialChip>
            ),
          )}
        </DialRow>

        <DialRow label="enabledModes">
          {(["photo", "video", "text"] satisfies ComposerMode[]).map((m) => (
            <DialChip
              key={m}
              active={enabledModes.includes(m)}
              onClick={() => toggleInArray(enabledModes, m, setEnabledModes)}
            >
              {m}
            </DialChip>
          ))}
        </DialRow>

        <DialRow label="enabledTools">
          {(
            [
              "text",
              "draw",
              "stickers",
              "filters",
              "adjust",
              "crop",
            ] satisfies EditTool[]
          ).map((t) => (
            <DialChip
              key={t}
              active={enabledTools.includes(t)}
              onClick={() => toggleInArray(enabledTools, t, setEnabledTools)}
            >
              {t}
            </DialChip>
          ))}
        </DialRow>

        <DialRow label="mediaSources">
          {(["camera", "upload"] satisfies MediaSource[]).map((s) => (
            <DialChip
              key={s}
              active={mediaSources.includes(s)}
              onClick={() => toggleInArray(mediaSources, s, setMediaSources)}
            >
              {s}
            </DialChip>
          ))}
        </DialRow>
      </div>

      <MediaEditor01
        ref={editorRef}
        aspect={aspect}
        enabledModes={enabledModes}
        enabledTools={enabledTools}
        mediaSources={mediaSources}
        presentation="inline"
      />
    </div>
  );
}

// ─── Edit-only demo (C9 — initialSource intake) ───────────────────────
//
// Demonstrates the CMS re-edit / draft-restore path: `enabledModes: []`
// kills the capture surface, `initialSource` lands directly in the edit
// canvas with the source pre-loaded. The three radio presets exercise
// the URL / blob / file paths plus three intentional error cases.

type EditOnlyPreset =
  | "url-photo"
  | "url-mode-mismatch"
  | "blob-photo"
  | "file-unsupported";

function EditOnlyDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);
  const [preset, setPreset] = React.useState<EditOnlyPreset>("url-photo");
  const [lastError, setLastError] = React.useState<SourceError | null>(null);
  const [exportPreview, setExportPreview] = React.useState<{
    url: string;
    size: number;
    mime: string;
  } | null>(null);
  const [exportProgress, setExportProgress] = React.useState<number | null>(
    null,
  );
  const [exportFormat, setExportFormat] = React.useState<
    "image/jpeg" | "image/png" | "image/webp"
  >("image/jpeg");

  // Revoke any previous preview blob URL when a new export lands.
  React.useEffect(() => {
    if (!exportPreview) return;
    return () => URL.revokeObjectURL(exportPreview.url);
  }, [exportPreview]);

  const handleExport = async () => {
    if (!editorRef.current) return;
    setExportProgress(0);
    try {
      const { blob, metadata } = await editorRef.current.exportImage({
        format: exportFormat,
        quality: 0.9,
        onProgress: setExportProgress,
      });
      const url = URL.createObjectURL(blob);
      setExportPreview({ url, size: blob.size, mime: blob.type });
      console.log("export metadata:", metadata);
    } catch (e) {
      console.error("export failed:", e);
    } finally {
      setExportProgress(null);
    }
  };

  // Build a tiny PNG blob lazily (1×1 white pixel) for the "blob-photo" case.
  // Memoized so flipping presets doesn't churn the source identity unless
  // the preset itself changed.
  const blobSource = React.useMemo<InitialSource>(() => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xff, 0xff, 0x3f,
      0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const blob = new Blob([bytes], { type: "image/png" });
    return { kind: "blob", blob, mode: "photo" };
  }, []);

  const fileSource = React.useMemo<InitialSource>(() => {
    // Intentionally an unsupported MIME (text/plain) to fire
    // SourceError { kind: "unsupported-file-type" }.
    const file = new File(["not a photo"], "note.txt", {
      type: "text/plain",
    });
    return { kind: "file", file };
  }, []);

  const initialSource = React.useMemo<InitialSource>(() => {
    switch (preset) {
      case "url-photo":
        return {
          kind: "url",
          url:
            "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=800&auto=format",
          mode: "photo",
        };
      case "url-mode-mismatch":
        return {
          kind: "url",
          url:
            "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=800&auto=format",
          mode: "video",
        };
      case "blob-photo":
        return blobSource;
      case "file-unsupported":
        return fileSource;
    }
  }, [preset, blobSource, fileSource]);

  // Edit-only path: enabledModes [] kills the capture surface entirely.
  // The `url-mode-mismatch` preset deliberately allows only photo while the
  // source declares video — fires SourceError { kind: "mode-not-enabled" }.
  const enabledModes: ComposerMode[] =
    preset === "url-mode-mismatch" ? ["photo"] : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 shrink-0 font-medium text-muted-foreground">
            initialSource
          </span>
          {(
            [
              ["url-photo", "URL · photo (happy path)"],
              ["blob-photo", "Blob · photo"],
              ["url-mode-mismatch", "URL · mode mismatch"],
              ["file-unsupported", "File · unsupported type"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPreset(value);
                setLastError(null);
              }}
              className={
                "rounded-md border px-2 py-0.5 transition-colors " +
                (preset === value
                  ? "border-foreground/40 bg-foreground/10 text-foreground"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Edit-only path:{" "}
          <code>enabledModes: {JSON.stringify(enabledModes)}</code> ·{" "}
          <code>presentation=&quot;inline&quot;</code>. Capture surface is gone;
          the editor lands directly in <code>stage: &quot;edit&quot;</code>{" "}
          with the source pre-loaded.
        </p>
        {lastError ? (
          <p className="text-[11px] text-destructive">
            onInitialSourceError fired:{" "}
            <code>{JSON.stringify(lastError, replaceErrors)}</code>
          </p>
        ) : null}
      </div>

      <MediaEditor01
        ref={editorRef}
        aspect="free"
        presentation="inline"
        enabledModes={enabledModes}
        initialSource={initialSource}
        onInitialSourceError={setLastError}
      />

      <div className="grid gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 shrink-0 font-medium text-muted-foreground">
            Export format
          </span>
          {(
            ["image/jpeg", "image/png", "image/webp"] as const
          ).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setExportFormat(fmt)}
              className={
                "rounded-md border px-2 py-0.5 transition-colors " +
                (exportFormat === fmt
                  ? "border-foreground/40 bg-foreground/10 text-foreground"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted")
              }
            >
              {fmt.replace("image/", "")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exportProgress !== null}
            className="rounded-md border border-border bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleExport}
          >
            {exportProgress === null
              ? `Export as ${exportFormat.replace("image/", "")}`
              : `Exporting… ${Math.round((exportProgress ?? 0) * 100)}%`}
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
            onClick={() => {
              console.log("getState:", editorRef.current?.getState());
              console.log("isDirty:", editorRef.current?.getIsDirty());
              console.log("mode:", editorRef.current?.getMode());
            }}
          >
            Log state
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
            onClick={() => {
              setExportPreview(null);
              editorRef.current?.reset();
            }}
          >
            Reset
          </button>
        </div>
        {exportPreview ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-muted-foreground">
              Exported{" "}
              <code>{Math.round(exportPreview.size / 1024)} KB</code> ·{" "}
              <code>{exportPreview.mime}</code>
            </p>
            <img
              src={exportPreview.url}
              alt="Export preview"
              className="max-h-48 max-w-xs rounded-md border border-border bg-card object-contain"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// JSON.stringify replacer that unwraps Error instances to a printable shape.
// Used only to render `onInitialSourceError` payloads in the demo console line.
function replaceErrors(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  return value;
}

function DialRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-28 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function DialChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md border px-2 py-0.5 transition-colors " +
        (active
          ? "border-foreground/40 bg-foreground/10 text-foreground"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted")
      }
    >
      {children}
    </button>
  );
}
