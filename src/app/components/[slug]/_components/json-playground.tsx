"use client";

import { Component, useMemo, useState, type ReactNode } from "react";
import { Check, Code2, Play, TriangleAlert, WandSparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Validate the editor text into a typed value (or an error message). Pass a
 *  STABLE (module-level) function so the live validation memo doesn't re-run
 *  every render. */
export type ValidateResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

type ResultState = { label: string; payload: unknown } | null;

export interface JsonPlaygroundProps<T> {
  /** pre-loaded editor content (a working example) */
  starter: string;
  /** header label for the editor pane, e.g. "ComposerConfig · JSON" */
  editorLabel: string;
  /** parse + validate; returns the value to render on success */
  validate: (text: string) => ValidateResult<T>;
  /** render the live preview from a validated value; call `setResult` from the
   *  rendered component's callbacks to surface a payload in the result strip */
  renderPreview: (
    value: T,
    setResult: (label: string, payload: unknown) => void,
  ) => ReactNode;
  /** caption shown next to the result strip's label */
  resultHint?: string;
}

// Render-time errors (a structurally-valid but semantically-wrong config) are
// contained here instead of white-screening the docs page. Keyed remount (per
// run) resets it.
class PreviewBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-80 flex-col items-center justify-center gap-2 p-8 text-center">
          <TriangleAlert className="size-6 text-destructive" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            This rendered, then threw at runtime
          </p>
          <p className="max-w-sm font-mono text-xs text-muted-foreground">
            {this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function JsonPlayground<T>({
  starter,
  editorLabel,
  validate,
  renderPreview,
  resultHint,
}: JsonPlaygroundProps<T>) {
  const [text, setText] = useState(starter);
  const [submitted, setSubmitted] = useState<{ value: T } | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [result, setResult] = useState<ResultState>(null);

  const validation = useMemo(() => validate(text), [text, validate]);

  const run = () => {
    if (!validation.ok) return;
    setResult(null);
    setSubmitted({ value: validation.value });
    setRunKey((k) => k + 1);
  };

  const format = () => {
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2) + "\n");
    } catch {
      /* invalid JSON — the status line already says why */
    }
  };

  const lineCount = text.split("\n").length;
  // A valid edit is pending if the parsed value differs from what's rendered.
  const pending =
    submitted !== null && validation.ok && submitted.value !== validation.value;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid lg:grid-cols-2">
        {/* ── LEFT: JSON editor ──────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-xs font-medium tracking-tight text-muted-foreground">
              <Code2 className="size-3.5" aria-hidden />
              {editorLabel}
            </div>
            <ValidityPill ok={validation.ok} />
          </div>

          <textarea
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={`${editorLabel} editor`}
            className={cn(
              "h-[30rem] w-full resize-none bg-transparent px-4 py-3 font-mono text-[12.5px] leading-relaxed text-foreground outline-none",
              "[tab-size:2] selection:bg-primary/25",
            )}
          />

          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5">
            <p
              className={cn(
                "min-w-0 flex-1 truncate font-mono text-xs",
                validation.ok ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {validation.ok ? `${lineCount} lines · valid` : validation.error}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={format}>
                <WandSparkles className="size-3.5" aria-hidden />
                Format
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!validation.ok}
                onClick={run}
              >
                <Play className="size-3.5" aria-hidden />
                {pending ? "Re-run" : "Submit"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: live preview ────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col border-t border-border bg-background lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
            <span className="font-mono text-xs font-medium tracking-tight text-muted-foreground">
              Live preview
            </span>
            {pending ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
                edited — re-run to apply
              </span>
            ) : null}
          </div>

          <div className="min-h-[30rem] flex-1 overflow-auto p-5">
            {submitted ? (
              <PreviewBoundary key={runKey}>
                {renderPreview(submitted.value, (label, payload) =>
                  setResult({ label, payload }),
                )}
              </PreviewBoundary>
            ) : (
              <EmptyState />
            )}

            {result ? (
              <div className="mt-5 overflow-hidden rounded-lg border border-border">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted/40 px-3 py-1.5">
                  <Check className="size-3.5 text-primary" aria-hidden />
                  <span className="font-mono text-xs font-medium text-foreground">
                    {result.label}
                  </span>
                  {resultHint ? (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      → {resultHint}
                    </span>
                  ) : null}
                </div>
                <pre className="max-h-64 overflow-auto bg-card p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidityPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium",
        ok ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive",
      )}
    >
      {ok ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <X className="size-3" aria-hidden />
      )}
      {ok ? "valid" : "invalid"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
      <Play className="size-6 text-muted-foreground/60" aria-hidden />
      <p className="text-sm font-medium text-foreground">Nothing rendered yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Edit the JSON on the left, then press <strong>Submit</strong> to render
        the live result on the right.
      </p>
    </div>
  );
}
