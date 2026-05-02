"use client";

import { useCallback, useEffect, useRef } from "react";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { cn } from "@/lib/utils";
import { articleBodyPlugins } from "./plugins/editor-kit";
import { EditorToolbar } from "./parts/editor-toolbar";
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

  // Echo-guarded sync: when controlledValue prop changes from the outside,
  // mirror it into the editor without re-emitting onChange. Stored in a ref
  // (not state) — React Compiler-aware lint rejects setState in effect bodies,
  // and we don't want to trigger a re-render on this anyway.
  const lastSyncedValueRef = useRef<ArticleBodyValue>(initialValue);
  useEffect(() => {
    if (controlledValue && controlledValue !== lastSyncedValueRef.current) {
      editor.tf.setValue(controlledValue);
      lastSyncedValueRef.current = controlledValue;
    }
  }, [controlledValue, editor]);

  const handleChange = useCallback(
    ({ value }: { value: ArticleBodyValue }) => {
      lastSyncedValueRef.current = value;
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
