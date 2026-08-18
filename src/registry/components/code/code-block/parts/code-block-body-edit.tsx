"use client";
import { useEffect } from "react";
import type { Extension } from "@codemirror/state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCodeMirror } from "../hooks/use-code-mirror";
import { CODEMIRROR_THEME_CSS } from "../lib/codemirror-theme";
import type { CodeBlockLabels } from "../types";

interface CodeBlockBodyEditProps {
  value: string;
  lang: string;
  readOnly: boolean;
  wrap: "wrap" | "scroll";
  tabSize: number;
  showLineNumbers: boolean;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  editorExtensions?: Extension[];
  maxHeight?: number | string;
  registerImperative?: (handle: {
    focus: () => void;
    getValue: () => string;
    scrollToLine: (line: number) => boolean;
  }) => void;
  /** Resolved labels (defaults merged) — needed for the init-failure branch. */
  labels: Required<CodeBlockLabels>;
  /**
   * Invoked when the user takes the "Reload as view-only" recovery after a
   * failed editor mount. Omit it and the error is still shown, just without
   * the recovery control.
   */
  onFallbackToView?: () => void;
}

export function CodeBlockBodyEdit({
  value,
  lang,
  readOnly,
  wrap,
  tabSize,
  showLineNumbers,
  onChange,
  onSave,
  editorExtensions,
  maxHeight,
  registerImperative,
  labels,
  onFallbackToView,
}: CodeBlockBodyEditProps) {
  const { containerRef, focus, getValue, scrollToLine, error } = useCodeMirror({
    value,
    lang,
    readOnly,
    wrap,
    tabSize,
    showLineNumbers,
    onChange,
    onSave,
    editorExtensions,
  });

  useEffect(() => {
    registerImperative?.({ focus, getValue, scrollToLine });
  }, [registerImperative, focus, getValue, scrollToLine]);

  const heightStyle =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : undefined;

  /*
   * v0.2.0 — the soft-failure policy always documented an inline error plus a
   * "Reload as view-only" recovery here; nothing implemented it, and a failed
   * editor mount was an unhandled rejection over a blank box. `onFallbackToView`
   * is what actually swaps the body, because `mode` is a plain prop the host
   * owns — the component must not try to mutate it.
   */
  if (error) {
    return (
      <div
        role="alert"
        data-editor="failed"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm text-muted-foreground"
      >
        <span>{labels.editorFailed}</span>
        {onFallbackToView ? (
          <Button type="button" size="sm" variant="outline" onClick={onFallbackToView}>
            {labels.reloadAsViewOnly}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CODEMIRROR_THEME_CSS }} />
      <div
        ref={containerRef}
        className={cn("code-block-editor relative min-h-32 overflow-hidden")}
        style={{ maxHeight: heightStyle }}
      />
    </>
  );
}
