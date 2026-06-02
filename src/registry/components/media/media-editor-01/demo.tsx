"use client";

import * as React from "react";
import { MediaEditor01 } from "./media-editor-01";
import {
  SAMPLE_BRAND_STICKERS,
  SAMPLE_CHAT_IMAGE_URL,
  SAMPLE_CHAT_INITIAL_SOURCE,
  SAMPLE_HERO_INITIAL_SOURCE,
} from "./dummy-data";
import type {
  InitialSource,
  MediaEditor01Handle,
  SourceError,
} from "./types";

/**
 * media-editor-01 demo (C12) — five tabs covering the principal
 * consumer surfaces:
 *
 *   - Defaults   — bare editor with all default capabilities.
 *   - News-hero  — 16:9 + editorial tools, hero re-edit via initialSource.
 *   - Chat       — 9:16 dialog mode, photo/video only, full-tools.
 *   - Edit-only  — enabledModes:[] + initialSource, exercises URL / blob /
 *                  file paths + the four documented SourceError kinds.
 *   - Dark       — Defaults wrapped in a `dark` scope to spot-check the
 *                  graphite-cool dark surface.
 */
type Tab = "defaults" | "news-hero" | "chat" | "edit-only" | "dark";

const TABS: { value: Tab; label: string }[] = [
  { value: "defaults", label: "Defaults" },
  { value: "news-hero", label: "News-hero" },
  { value: "chat", label: "Chat" },
  { value: "edit-only", label: "Edit-only" },
  { value: "dark", label: "Dark" },
];

export default function MediaEditor01Demo() {
  const [tab, setTab] = React.useState<Tab>("defaults");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 self-start rounded-md border border-border bg-muted/30 p-1">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={
              "rounded-sm px-3 py-1 text-xs font-medium " +
              (tab === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "defaults" ? (
        <DefaultsDemo />
      ) : tab === "news-hero" ? (
        <NewsHeroDemo />
      ) : tab === "chat" ? (
        <ChatDemo />
      ) : tab === "edit-only" ? (
        <EditOnlyDemo />
      ) : (
        <DarkDemo />
      )}
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────

function DefaultsDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Bare <code>&lt;MediaEditor01 /&gt;</code> with no prop overrides.
        Default capabilities — all three modes, all six edit tools, both
        media sources, free aspect, inline presentation.
      </p>
      <MediaEditor01 ref={editorRef} />
      <DemoActions editorRef={editorRef} />
    </div>
  );
}

// ─── News-hero ────────────────────────────────────────────────────────

function NewsHeroDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        CMS hero re-edit: a previously-uploaded image lands in the editor at{" "}
        <code>aspect=&quot;16:9&quot;</code> with only the editorial edit tools
        (<code>text</code>, <code>filters</code>, <code>adjust</code>,
        <code>crop</code>) — no stickers, no drawing.
        <code>enabledModes</code> is empty so the capture surface is gone.
      </p>
      <MediaEditor01
        ref={editorRef}
        aspect="16:9"
        presentation="inline"
        enabledModes={[]}
        enabledTools={["text", "filters", "adjust", "crop"]}
        initialSource={SAMPLE_HERO_INITIAL_SOURCE}
        stickers={[SAMPLE_BRAND_STICKERS]}
      />
      <DemoActions editorRef={editorRef} />
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────

function ChatDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        DM-style: tap <em>Open</em> to launch a 9:16 dialog editor for
        capture + edit + send. <code>enabledModes</code> excludes{" "}
        <code>text</code> (text-mode stories don&apos;t fit chat UX); all
        six edit tools available.
      </p>
      <button
        type="button"
        className="self-start rounded-md border border-border bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        onClick={() => setIsOpen(true)}
      >
        Open editor
      </button>
      <MediaEditor01
        ref={editorRef}
        aspect="9:16"
        presentation="dialog"
        enabledModes={["photo", "video"]}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        stickers={[SAMPLE_BRAND_STICKERS]}
      />
    </div>
  );
}

// ─── Edit-only ────────────────────────────────────────────────────────
//
// Exercises the C9 initialSource intake + C10 export path. Switches between
// 4 source presets to surface the SourceError surface for the three
// documented validation failures.

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

  React.useEffect(() => {
    if (!exportPreview) return;
    return () => URL.revokeObjectURL(exportPreview.url);
  }, [exportPreview]);

  // Build a tiny PNG blob lazily (1×1 white pixel) for the "blob-photo" case.
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
    const file = new File(["not a photo"], "note.txt", { type: "text/plain" });
    return { kind: "file", file };
  }, []);

  const initialSource = React.useMemo<InitialSource>(() => {
    switch (preset) {
      case "url-photo":
        return SAMPLE_CHAT_INITIAL_SOURCE;
      case "url-mode-mismatch":
        return {
          kind: "url",
          url: SAMPLE_CHAT_IMAGE_URL,
          mode: "video",
        };
      case "blob-photo":
        return blobSource;
      case "file-unsupported":
        return fileSource;
    }
  }, [preset, blobSource, fileSource]);

  // url-mode-mismatch: enable only photo while source declares video → fires
  // mode-not-enabled. Everything else stays edit-only.
  const enabledModes = preset === "url-mode-mismatch" ? ["photo" as const] : [];

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
            <Chip
              key={value}
              active={preset === value}
              onClick={() => {
                setPreset(value);
                setLastError(null);
              }}
            >
              {label}
            </Chip>
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
        stickers={[SAMPLE_BRAND_STICKERS]}
      />

      <div className="grid gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 shrink-0 font-medium text-muted-foreground">
            Export format
          </span>
          {(["image/jpeg", "image/png", "image/webp"] as const).map((fmt) => (
            <Chip
              key={fmt}
              active={exportFormat === fmt}
              onClick={() => setExportFormat(fmt)}
            >
              {fmt.replace("image/", "")}
            </Chip>
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

// ─── Dark ─────────────────────────────────────────────────────────────

function DarkDemo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);
  return (
    <div className="dark flex flex-col gap-3 rounded-xl border border-border bg-background p-4 text-foreground">
      <p className="text-xs text-muted-foreground">
        Same as Defaults but scoped to the <code>dark</code> token surface.
        Verifies the graphite-cool dark palette from{" "}
        <code>globals.css</code> holds across the editor chrome + canvas
        placeholder + toolbar.
      </p>
      <MediaEditor01 ref={editorRef} />
      <DemoActions editorRef={editorRef} />
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────

function DemoActions({
  editorRef,
}: {
  editorRef: React.RefObject<MediaEditor01Handle | null>;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <button
        type="button"
        className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
        onClick={() => editorRef.current?.applyFilter("clarendon")}
      >
        Apply Clarendon
      </button>
      <button
        type="button"
        className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
        onClick={() => editorRef.current?.reset()}
      >
        Reset
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
  );
}

function Chip({
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

// JSON.stringify replacer that unwraps Error instances for printable output.
function replaceErrors(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  return value;
}
