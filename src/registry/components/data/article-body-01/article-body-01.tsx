"use client";

import { useCallback, useEffect, useRef } from "react";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { cn } from "@/lib/utils";
import { articleBodyPlugins } from "./plugins/editor-kit";
import { EditorToolbar } from "./parts/editor-toolbar";
import { FloatingToolbar } from "./parts/floating-toolbar";
import {
  ARTICLE_BODY_DEFAULT_PLACEHOLDER,
  ARTICLE_BODY_EMPTY_VALUE,
  type ArticleBodyEditorProps,
  type ArticleBodyValue,
} from "./types";

const SAVE_KEY_DESCRIPTOR =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform)
    ? "Cmd+S"
    : "Ctrl+S";

export function ArticleBodyEditor(props: ArticleBodyEditorProps) {
  const {
    value: controlledValue,
    defaultValue,
    onChange,
    onSave,
    readOnly = false,
    placeholder = ARTICLE_BODY_DEFAULT_PLACEHOLDER,
    onImageUpload,
    className,
    toolbarClassName,
    contentClassName,
    containerClassName,
    hideToolbar = false,
    autoFocus = false,
  } = props;

  const initialValue =
    controlledValue ?? defaultValue ?? ARTICLE_BODY_EMPTY_VALUE;

  const editor = usePlateEditor({
    plugins: articleBodyPlugins,
    value: initialValue,
    autoSelect: autoFocus ? "end" : undefined,
  });

  // v0.2.2 — echo-guarded sync, now content-keyed. When `controlledValue`
  // prop changes by REFERENCE only (e.g., RHF-controlled forms emit a fresh
  // reference on every state change even when content is identical), the
  // previous ref-equality check would fire `editor.tf.setValue` on every
  // render. That re-applies the editor's current content as a "new" value,
  // which resets Slate's selection — the user's cursor disappears
  // immediately after every click, and typing can't land because each
  // keystroke is followed by a setValue that wipes selection. Worse, on
  // RHF + React 19, the rapid setValue → onChange → setState cascade
  // tripped React error #185 (Maximum update depth exceeded). The fix is
  // to gate the sync on the content key (cheap stringify of the Plate
  // tree) — fire setValue only when the content actually differs from
  // what the editor last emitted or accepted, regardless of how many fresh
  // references the consumer pipes through `value`.
  const lastSyncedKeyRef = useRef<string>(serializeValueKey(initialValue));
  useEffect(() => {
    if (!controlledValue) return;
    const nextKey = serializeValueKey(controlledValue);
    if (nextKey === lastSyncedKeyRef.current) return;
    editor.tf.setValue(controlledValue);
    lastSyncedKeyRef.current = nextKey;
  }, [controlledValue, editor]);

  const handleChange = useCallback(
    ({ value }: { value: ArticleBodyValue }) => {
      lastSyncedKeyRef.current = serializeValueKey(value);
      onChange?.(value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && onSave) {
        e.preventDefault();
        const current = editor.children as ArticleBodyValue;
        Promise.resolve(onSave(current)).catch((err) => {
          console.error("onSave failed", err);
        });
      }
    },
    [editor, onSave]
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
    >
      <Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
        {!hideToolbar && !readOnly ? (
          <EditorToolbar
            className={toolbarClassName}
            onImageUpload={onImageUpload}
          />
        ) : null}

        <div
          className={cn(
            "max-h-150 overflow-y-auto px-6 py-4",
            containerClassName
          )}
        >
          <PlateContent
            placeholder={placeholder}
            className={cn(
              "min-h-50 focus:outline-none",
              "prose prose-sm dark:prose-invert max-w-none",
              "[&_:where(p,h1,h2,h3,h4)]:my-0",
              contentClassName
            )}
            onKeyDown={handleKeyDown}
            spellCheck
          />
        </div>

        {!readOnly ? <FloatingToolbar /> : null}

        {!readOnly && onSave ? (
          <div className="border-t border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              {SAVE_KEY_DESCRIPTOR}
            </kbd>{" "}
            to save
          </div>
        ) : null}
      </Plate>
    </div>
  );
}

/**
 * v0.2.2 — content key for the echo-guarded controlled-value sync.
 * Stringify is adequate for Plate JSON (no functions, no cycles) and
 * cheap relative to a keystroke's frame budget for documents that fit on
 * one screen. Returns a random hash on circular-ref edge cases so the
 * effect still fires (defensive — we'd rather over-sync than skip a real
 * external update). */
function serializeValueKey(value: ArticleBodyValue): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(Math.random());
  }
}

// Re-exports for cross-procomp consumers (e.g. json-form's `richtext` field
// renderer). Imports targeting `./types` from another procomp's shipped
// source get rewritten by shadcn 4.6.0 to `./types` of the CURRENT slug
// (F-S1 cross-procomp `/types` bug), so cross-procomp imports must come from
// this component file instead — its path the rewriter handles correctly.
export { ARTICLE_BODY_EMPTY_VALUE, type ArticleBodyValue } from "./types";
