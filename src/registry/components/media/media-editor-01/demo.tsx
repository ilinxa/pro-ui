"use client";

import * as React from "react";
import { MediaEditor01 } from "./media-editor-01";
import type {
  AspectRatio,
  ComposerMode,
  EditTool,
  MediaEditor01Handle,
  MediaSource,
} from "./types";

/**
 * media-editor-01 demo (C8 skeleton).
 *
 * Three tabs:
 *   - Inline (default) — bare layout in parent.
 *   - Dialog — wrapped in shadcn dialog with size derived from aspect.
 *   - Capability dials — all 4 gating dials with live toggles.
 *
 * Real 5-tab demo (Defaults / News-hero / Chat / Edit-only / Dark) lands in C12.
 */
type Tab = "inline" | "dialog" | "dials";

export default function MediaEditor01Demo() {
  const [tab, setTab] = React.useState<Tab>("inline");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-md border border-border bg-muted/30 p-1 self-start">
        {(["inline", "dialog", "dials"] satisfies Tab[]).map((t) => (
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
              : "Capability dials"}
          </button>
        ))}
      </div>

      {tab === "inline" ? (
        <InlineDemo />
      ) : tab === "dialog" ? (
        <DialogDemo />
      ) : (
        <DialsDemo />
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
