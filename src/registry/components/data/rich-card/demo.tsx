"use client";

import { useMemo, useRef, useState } from "react";
import {
  Copy,
  Eye,
  Move,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichCard } from "./rich-card";
import { RichCardSearchBar } from "./parts/search-bar";
import { RichCardUndoToolbar } from "./parts/undo-toolbar";
import type {
  RichCardHandle,
  RichCardJsonNode,
  RichCardValidators,
  SearchMatch,
  SearchResult,
  ValidationFailedEvent,
} from "./types";
import { RICH_DEMO } from "./dummy-data";

const STRICT_VALIDATORS: RichCardValidators = {
  fieldEdit: (event) => {
    if (event.key === "priority" && typeof event.newValue === "number") {
      if (event.newValue < 1 || event.newValue > 5) {
        return {
          ok: false,
          errors: [
            {
              code: "host-priority-out-of-range",
              message: "Priority must be 1–5.",
            },
          ],
        };
      }
    }
    return { ok: true };
  },
  cardRemove: (event) => {
    if (event.removed.__rcmeta?.locked === true) {
      return {
        ok: false,
        errors: [
          {
            code: "host-locked-removal",
            message: "Cannot remove locked cards.",
          },
        ],
      };
    }
    return { ok: true };
  },
};

export default function RichCardDemo() {
  const ref = useRef<RichCardHandle>(null);
  const initialJson = useMemo(() => JSON.stringify(RICH_DEMO, null, 2), []);
  const [liveJson, setLiveJson] = useState<string>(initialJson);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(true);
  const [editable, setEditable] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [validatorsEnabled, setValidatorsEnabled] = useState(false);
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const handleChange = (tree: RichCardJsonNode) => {
    setLiveJson(JSON.stringify(tree, null, 2));
    setDirty(ref.current?.isDirty() ?? false);
    setCanUndo(ref.current?.canUndo() ?? false);
    setCanRedo(ref.current?.canRedo() ?? false);
  };

  const handleValidationFailed = (event: ValidationFailedEvent) => {
    const message = event.errors.map((e) => e.message).join(" · ");
    setValidationToast(`${event.layer}: ${message}`);
    setTimeout(() => setValidationToast(null), 3000);
  };

  const handleUndoOrRedo = () => {
    setDirty(ref.current?.isDirty() ?? false);
    setLiveJson(JSON.stringify(ref.current?.getTree() ?? RICH_DEMO, null, 2));
    setCanUndo(ref.current?.canUndo() ?? false);
    setCanRedo(ref.current?.canRedo() ?? false);
  };

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted-foreground">
          v0.3 demo: structural management on top of v0.2&apos;s editor. Toggle
          edit mode to enable inline editing, drag-drop reordering, multi-select
          (shift-click range, cmd/ctrl-click toggle), and the bulk toolbar (≥2
          selected). Use the search bar to find content in collapsed subtrees,
          virtualized off-screen cards, and meta entries.
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
            {editable ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            {editable ? "editing" : "view"}
          </button>
          {editable ? (
            <button
              type="button"
              onClick={() => setDndEnabled((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                dndEnabled
                  ? "border-border bg-muted/40 text-foreground hover:bg-muted"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-pressed={dndEnabled}
            >
              <Move className="size-3.5" aria-hidden="true" />
              dnd {dndEnabled ? "on" : "off"}
            </button>
          ) : null}
          {editable ? (
            <button
              type="button"
              onClick={() => setValidatorsEnabled((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                validatorsEnabled
                  ? "border-border bg-muted/40 text-foreground hover:bg-muted"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-pressed={validatorsEnabled}
              title="Toggle host validators (priority must be 1–5; locked cards cannot be removed)"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              validators {validatorsEnabled ? "on" : "off"}
            </button>
          ) : null}
          {editable ? (
            <RichCardUndoToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={() => {
                ref.current?.undo();
                handleUndoOrRedo();
              }}
              onRedo={() => {
                ref.current?.redo();
                handleUndoOrRedo();
              }}
            />
          ) : null}
          {dirty ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
              dirty
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={showJson}
          >
            {showJson ? <PanelRightClose className="size-3.5" /> : <PanelRightOpen className="size-3.5" />}
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <RichCardSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          matchCount={searchResult?.matches.length ?? 0}
          activeIndex={searchResult?.activeIndex ?? null}
          onNext={() => ref.current?.findNext()}
          onPrevious={() => ref.current?.findPrevious()}
          onClear={() => {
            setSearchQuery("");
            ref.current?.clearSearch();
          }}
        />
        {selectedIds.length > 0 ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {selectedIds.length} selected
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-4 transition-[grid-template-columns] duration-200 ease-out",
          showJson
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]"
            : "grid-cols-1",
        )}
      >
        <section className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Preview
            </h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              v0.3 · 6 levels · all features
            </span>
          </div>
          <RichCard
            ref={ref}
            aria-label="Thesis outline"
            defaultValue={RICH_DEMO}
            metaPresentation="popover"
            editable={editable}
            dndScopes={dndEnabled ? { sameLevel: true, crossLevel: true } : { sameLevel: false, crossLevel: false }}
            search={{ query: searchQuery }}
            validators={validatorsEnabled ? STRICT_VALIDATORS : undefined}
            onValidationFailed={handleValidationFailed}
            onSearchResults={setSearchResult}
            onChange={handleChange}
            onSelectionChange={setSelectedIds}
          />
          {validationToast ? (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <strong>Validator rejected:</strong> {validationToast}
            </div>
          ) : null}
        </section>

        {showJson ? (
          <aside className="min-w-0 space-y-2 lg:sticky lg:top-4 lg:self-start">
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

// Keep the type import alive for editor hover-info
void ({} as SearchMatch);
