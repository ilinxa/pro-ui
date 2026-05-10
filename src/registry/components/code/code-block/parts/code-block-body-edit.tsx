"use client";
import { useEffect } from "react";
import type { Extension } from "@codemirror/state";
import { cn } from "@/lib/utils";
import { useCodeMirror } from "../hooks/use-code-mirror";
import { CODEMIRROR_THEME_CSS } from "../lib/codemirror-theme";

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
  }) => void;
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
}: CodeBlockBodyEditProps) {
  const { containerRef, focus, getValue } = useCodeMirror({
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
    registerImperative?.({ focus, getValue });
  }, [registerImperative, focus, getValue]);

  const heightStyle =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : undefined;

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
