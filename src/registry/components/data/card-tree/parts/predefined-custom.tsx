"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomKeyContext, CustomPredefinedKey } from "../types";
import type { CardTreeCustomEntry } from "../lib/parse";
import { InlineError } from "./inline-error";

/**
 * Render + edit surface for host-registered custom predefined-keys (v0.6).
 * Mirrors the structure of the built-in blocks (predefined-quote.tsx,
 * predefined-codearea.tsx): a dumb, prop-driven view component + an editor
 * that either delegates to the host's `edit` or falls back to a JSON
 * textarea (guide §7.1, plan-v0.3 §9 L881/L846).
 *
 * Host code (`render` / `edit` / `defaultValue`) is untrusted: it may throw
 * synchronously (call-site try/catch) or during its own render (error
 * boundary). Either path degrades to a generic JSON `<pre>` fallback rather
 * than blanking the tree (I-neg).
 */

function safeStringify(value: unknown): string {
  try {
    const out = JSON.stringify(value, null, 2);
    return out ?? String(value);
  } catch {
    return String(value);
  }
}

function GenericJsonFallback({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-md border border-destructive/40 bg-destructive/5",
        className,
      )}
    >
      <figcaption className="flex items-center gap-1.5 border-b border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-destructive">
        <TriangleAlert className="size-3" aria-hidden="true" />
        custom renderer error
      </figcaption>
      <pre className="overflow-x-auto px-2.5 py-2 font-mono text-[12px] leading-relaxed text-foreground/80">
        {safeStringify(value)}
      </pre>
    </figure>
  );
}

/**
 * Catches throws raised during the host node's own render pass.
 *
 * Exported because EVERY surface that renders host-supplied ReactNode needs it,
 * not just this one — `registration.icon` is rendered by the add-menu and is
 * equally hostile. A try/catch cannot substitute here: the throw happens inside
 * React's render of the returned element, not at the call site.
 */
export class HostRenderBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Swallow — degrading to the generic JSON fallback is the recovery.
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/* ───────── view ───────── */

export function PredefinedCustom({
  entry,
  registration,
  ctx,
}: {
  entry: CardTreeCustomEntry;
  registration: CustomPredefinedKey | undefined;
  ctx: CustomKeyContext;
}) {
  const fallback = (
    <GenericJsonFallback value={entry.value} className={ctx.className} />
  );

  if (!registration) return fallback;

  let node: ReactNode;
  try {
    node = registration.render(entry.value, ctx);
  } catch {
    return fallback;
  }

  return <HostRenderBoundary fallback={fallback}>{node}</HostRenderBoundary>;
}

/* ───────── edit: JSON-textarea fallback (guide §7.1) ───────── */

// Mirrors predefined-edit.tsx's `inputBase` (the table/JSON-fallback precedent) —
// kept file-local like its sibling rather than sharing an export.
const inputBase =
  "rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function CustomJsonFallbackEdit({
  entry,
  onCommit,
  onCancel,
}: {
  entry: CardTreeCustomEntry;
  onCommit: (next: CardTreeCustomEntry) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(() => safeStringify(entry.value));
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  let parsed: unknown;
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    parseError = e instanceof Error ? e.message : "invalid JSON";
  }

  return (
    <div
      className="space-y-1.5 rounded-md border border-dashed border-primary/40 bg-muted/40 p-2"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        custom block &quot;{entry.key}&quot; · no `edit` registered · JSON fallback
      </p>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className={cn(inputBase, "block w-full resize-y font-mono text-[12px]")}
        aria-label={`Edit ${entry.key} (JSON)`}
        spellCheck={false}
      />
      <div className="flex items-center justify-between gap-2 pt-1">
        {parseError ? (
          <InlineError errors={[{ code: "json-parse", message: parseError }]} />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cancel edit"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!parseError) {
                onCommit({ key: entry.key, custom: true, value: parsed });
              }
            }}
            disabled={!!parseError}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-mono text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Check className="size-3" aria-hidden="true" />
            save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── edit: dispatcher ───────── */

export function PredefinedCustomEdit({
  entry,
  registration,
  onCommit,
  onCancel,
}: {
  entry: CardTreeCustomEntry;
  registration: CustomPredefinedKey | undefined;
  onCommit: (next: CardTreeCustomEntry) => void;
  onCancel: () => void;
}) {
  const fallback = (
    <CustomJsonFallbackEdit entry={entry} onCommit={onCommit} onCancel={onCancel} />
  );

  if (!registration?.edit) return fallback;

  // Host `edit` runs here. It may throw synchronously (caught below) or
  // throw during its own render (caught by the boundary, which then swaps
  // in the same JSON fallback so editing is never a dead end).
  let node: ReactNode;
  try {
    node = registration.edit(
      entry.value,
      (next) => onCommit({ key: entry.key, custom: true, value: next }),
      onCancel,
    );
  } catch {
    return fallback;
  }

  return <HostRenderBoundary fallback={fallback}>{node}</HostRenderBoundary>;
}
