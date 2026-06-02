"use client";

import * as React from "react";
import { MediaEditor01 } from "./media-editor-01";
import type {
  AspectRatio,
  MediaEditor01Handle,
} from "./types";

/**
 * media-editor-01 demo (C7 skeleton).
 *
 * Two tabs:
 *   - Inline (default) — bare layout in parent.
 *   - Dialog — wrapped in shadcn dialog with size derived from aspect.
 *
 * Real 5-tab demo (Defaults / News-hero / Chat / Edit-only / Dark) lands in C12.
 */
export default function MediaEditor01Demo() {
  const [tab, setTab] = React.useState<"inline" | "dialog">("inline");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-md border border-border bg-muted/30 p-1 self-start">
        {(["inline", "dialog"] as const).map((t) => (
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
            {t === "inline" ? "Inline" : "Dialog"}
          </button>
        ))}
      </div>

      {tab === "inline" ? <InlineDemo /> : <DialogDemo />}
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
