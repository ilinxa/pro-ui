"use client";

import { useMemo, useRef, useState } from "react";
import {
  Copy,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichCard } from "./rich-card";
import type { RichCardHandle, RichCardJsonNode } from "./types";
import { RICH_DEMO } from "./dummy-data";

export default function RichCardDemo() {
  const ref = useRef<RichCardHandle>(null);
  const initialJson = useMemo(() => JSON.stringify(RICH_DEMO, null, 2), []);
  const [liveJson, setLiveJson] = useState<string>(initialJson);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(true);
  const [editable, setEditable] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleChange = (tree: RichCardJsonNode) => {
    setLiveJson(JSON.stringify(tree, null, 2));
    setDirty(ref.current?.isDirty() ?? false);
  };

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Six-level demo exercising every feature: all five field types
          (string · number · boolean · date · null), all five predefined keys
          (codearea · image · table · quote · list), per-card meta in popover
          mode, auto-canonicalization, and (in v0.2) full inline editing — toggle
          edit mode below.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditable((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              editable
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-pressed={editable}
          >
            {editable ? (
              <Pencil className="size-3.5" aria-hidden="true" />
            ) : (
              <Eye className="size-3.5" aria-hidden="true" />
            )}
            {editable ? "editing" : "view"}
          </button>
          {dirty ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400"
              title="Unsaved changes since last load"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-amber-500"
              />
              dirty
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={showJson}
            aria-controls="rcc-demo-json"
          >
            {showJson ? (
              <PanelRightClose className="size-3.5" aria-hidden="true" />
            ) : (
              <PanelRightOpen className="size-3.5" aria-hidden="true" />
            )}
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "grid gap-4 transition-[grid-template-columns] duration-200 ease-out",
          showJson
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]"
            : "grid-cols-1",
        )}
      >
        {/* Preview pane */}
        <section className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Preview
            </h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {selectedId ? `selected: ${selectedId.slice(0, 12)}…` : "no selection"}
            </span>
          </div>
          <RichCard
            ref={ref}
            aria-label="Thesis outline"
            defaultValue={RICH_DEMO}
            metaPresentation="popover"
            editable={editable}
            onChange={handleChange}
            onSelectionChange={setSelectedId}
          />
        </section>

        {/* JSON pane */}
        {showJson ? (
          <aside
            id="rcc-demo-json"
            className="min-w-0 space-y-2 lg:sticky lg:top-4 lg:self-start"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {dirty ? "Live JSON (unsaved)" : "Input JSON"}
              </h3>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      ref.current?.getValue() ?? liveJson,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    // ignore
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Copy canonical JSON"
              >
                <Copy className="size-3" aria-hidden="true" />
                {copied ? "copied" : "copy canonical"}
              </button>
            </div>
            <pre className="max-h-[80vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs font-mono leading-relaxed">
              {liveJson}
            </pre>
            {dirty ? (
              <button
                type="button"
                onClick={() => {
                  ref.current?.markClean();
                  setDirty(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                mark clean
              </button>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
