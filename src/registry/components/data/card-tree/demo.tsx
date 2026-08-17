"use client";

import { useMemo, useRef, useState } from "react";
import {
  Blocks,
  Copy,
  Eye,
  Gauge,
  Move,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CardTree } from "./card-tree";
import { CardTreeSearchBar } from "./parts/search-bar";
import { CardTreeUndoToolbar } from "./parts/undo-toolbar";
import type {
  CardTreeHandle,
  CardTreeJsonNode,
  CardTreeValidators,
  CustomPredefinedKey,
  SearchMatch,
  SearchResult,
  ValidationFailedEvent,
} from "./types";
import { RICH_DEMO } from "./dummy-data";

/**
 * v0.6 custom predefined-keys — the surface that was declared and documented
 * since v0.3 but stayed completely inert until v0.6 (see card-tree-loop.md
 * F1/F7). Two registrations exercise both editor paths:
 *
 *   - `metric`  — object-valued, ships a real `edit` implementation, so the
 *                 custom-editor path is demonstrated end to end.
 *   - `body`    — ARRAY-valued (Plate Value / editor.js-shaped blocks). This
 *                 is the case that was structurally impossible pre-v0.6:
 *                 custom keys match on name before the value is inspected,
 *                 so an array can be registered even though ordinary
 *                 children still reject arrays (Q-P4, unchanged). `edit` is
 *                 intentionally omitted, so this one demonstrates the
 *                 documented JSON-textarea fallback.
 */

type MetricValue = { value: number; unit: string };

function isMetricValue(v: unknown): v is MetricValue {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).value === "number" &&
    typeof (v as Record<string, unknown>).unit === "string"
  );
}

function MetricBlock({ value, className }: { value: MetricValue; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1.5",
        className,
      )}
    >
      <span className="font-mono text-base font-semibold text-foreground">
        {value.value}
      </span>
      <span className="font-mono text-xs text-muted-foreground">{value.unit}</span>
    </div>
  );
}

function MetricEditor({
  value,
  onSave,
  onCancel,
}: {
  value: MetricValue;
  onSave: (next: MetricValue) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="number"
        value={draft.value}
        onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) }))}
        className="w-20 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input
        type="text"
        value={draft.unit}
        onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
        className="w-24 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="button"
        onClick={() => onSave(draft)}
        className="rounded-md border border-primary bg-primary px-2 py-1 font-mono text-[11px] text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        cancel
      </button>
    </div>
  );
}

const metricKey: CustomPredefinedKey = {
  key: "metric",
  description: "A KPI value with unit — custom editor",
  category: "stats",
  icon: <Gauge className="size-3.5" aria-hidden="true" />,
  defaultValue: () => ({ value: 0, unit: "pages" }),
  validate: (v) =>
    isMetricValue(v)
      ? { ok: true }
      : {
          ok: false,
          errors: [
            {
              code: "shape-mismatch",
              message: "metric must be { value: number, unit: string }",
            },
          ],
        },
  render: (value, ctx) =>
    isMetricValue(value) ? (
      <MetricBlock value={value} className={ctx.className} />
    ) : (
      <span className="font-mono text-xs text-destructive">invalid metric</span>
    ),
  edit: (value, onSave, onCancel) => (
    <MetricEditor
      value={isMetricValue(value) ? value : { value: 0, unit: "" }}
      onSave={onSave}
      onCancel={onCancel}
    />
  ),
};

type RichBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string };

function isRichBlocks(v: unknown): v is RichBlock[] {
  return (
    Array.isArray(v) &&
    v.every(
      (b) =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as Record<string, unknown>).type === "string" &&
        typeof (b as Record<string, unknown>).text === "string",
    )
  );
}

function RichBlocksView({ blocks, className }: { blocks: RichBlock[]; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-1.5 rounded-md border border-border bg-muted/20 px-3 py-2",
        className,
      )}
    >
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          <p
            key={i}
            className={cn(
              "font-semibold text-foreground",
              block.level === 1 ? "text-base" : block.level === 2 ? "text-sm" : "text-xs",
            )}
          >
            {block.text}
          </p>
        ) : (
          <p key={i} className="text-sm text-muted-foreground">
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}

const bodyBlocksKey: CustomPredefinedKey = {
  key: "body",
  description:
    "Array-valued rich content (Plate Value / editor.js-shaped blocks) — no custom editor, falls back to the JSON-textarea",
  category: "content",
  icon: <Blocks className="size-3.5" aria-hidden="true" />,
  defaultValue: () => [{ type: "paragraph", text: "" }] satisfies RichBlock[],
  validate: (v) =>
    isRichBlocks(v)
      ? { ok: true }
      : {
          ok: false,
          errors: [
            {
              code: "shape-mismatch",
              message: "body must be an array of { type, text } blocks",
            },
          ],
        },
  render: (value, ctx) =>
    isRichBlocks(value) ? (
      <RichBlocksView blocks={value} className={ctx.className} />
    ) : (
      <span className="font-mono text-xs text-destructive">invalid body</span>
    ),
  searchableText: (value) => (isRichBlocks(value) ? value.map((b) => b.text) : []),
  // `edit` intentionally omitted — demonstrates the documented JSON-textarea fallback.
};

const CUSTOM_PREDEFINED_KEYS: CustomPredefinedKey[] = [metricKey, bodyBlocksKey];

/**
 * RICH_DEMO plus one card exercising the two registrations above. Kept local
 * to demo.tsx (not folded into dummy-data.ts) so the fixtures item ships the
 * v0.1-v0.4 baseline tree unchanged.
 */
const DEMO_TREE: CardTreeJsonNode = {
  ...RICH_DEMO,
  impact: {
    __rcid: "ch4",
    __rcorder: 3,
    __rcmeta: { drafted: "2026-04-10" },
    pages: 3,

    metric: { value: 94, unit: "% task success" },

    body: [
      { type: "heading", level: 2, text: "Why array-valued blocks matter" },
      {
        type: "paragraph",
        text: "Plate Value and editor.js documents are arrays of blocks. Through v0.5.0, classifyKey routed any array to the child-card branch and parse rejected it outright — a registered array-shaped key had no way to reach the renderer. v0.6.0 matches custom keys by name before the value is inspected, so this block renders.",
      },
    ] satisfies RichBlock[],
  },
};

const STRICT_VALIDATORS: CardTreeValidators = {
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

export default function CardTreeDemo() {
  const ref = useRef<CardTreeHandle>(null);
  const initialJson = useMemo(() => JSON.stringify(DEMO_TREE, null, 2), []);
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

  const handleChange = (tree: CardTreeJsonNode) => {
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
    setLiveJson(JSON.stringify(ref.current?.getTree() ?? DEMO_TREE, null, 2));
    setCanUndo(ref.current?.canUndo() ?? false);
    setCanRedo(ref.current?.canRedo() ?? false);
  };

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted-foreground">
          v0.6 demo: validators + per-commit undo/redo on v0.3&apos;s structural
          management foundation, plus the &quot;Impact&quot; card&apos;s{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">metric</code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">body</code>{" "}
          fields, rendered via two <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">customPredefinedKeys</code>{" "}
          registrations — <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">body</code>{" "}
          is array-valued, the case v0.5.0 could never register. Toggle edit
          mode to enable inline editing, drag-drop reordering, multi-select
          (shift-click range, cmd/ctrl-click toggle), the bulk toolbar (≥2
          selected), and the undo toolbar (Cmd+Z / Cmd+Shift+Z / Cmd+Y). Use
          the search bar to find content in collapsed subtrees and meta
          entries.
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
            <CardTreeUndoToolbar
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
        <CardTreeSearchBar
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
              v0.6 · 6 levels · all features + custom keys
            </span>
          </div>
          <CardTree
            ref={ref}
            aria-label="Thesis outline"
            defaultValue={DEMO_TREE}
            metaPresentation="popover"
            editable={editable}
            dndScopes={dndEnabled ? { sameLevel: true, crossLevel: true } : { sameLevel: false, crossLevel: false }}
            search={{ query: searchQuery }}
            customPredefinedKeys={CUSTOM_PREDEFINED_KEYS}
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
