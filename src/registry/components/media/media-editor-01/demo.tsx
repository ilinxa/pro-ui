"use client";

import * as React from "react";
import { MediaEditor01 } from "./media-editor-01";
import type { MediaEditor01Handle } from "./types";

/**
 * media-editor-01 demo (C6 skeleton).
 *
 * Real 5-tab demo (Defaults / News-hero / Chat / Edit-only / Dark) lands in C12.
 * For now, a single mount that exercises the ref-handle wiring.
 */
export default function MediaEditor01Demo() {
  const editorRef = React.useRef<MediaEditor01Handle>(null);

  return (
    <div className="flex flex-col gap-4">
      <MediaEditor01 ref={editorRef} aspect="free" presentation="inline" />

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 hover:bg-muted"
          onClick={() => {
            editorRef.current?.applyFilter("clarendon");
          }}
        >
          Apply Clarendon filter (state-only)
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
