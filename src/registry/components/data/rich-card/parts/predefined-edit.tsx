import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CodeAreaValue,
  FlatFieldValue,
  ImageValue,
  ListValue,
  QuoteValue,
  TableValue,
} from "../types";
import type { RichCardPredefinedEntry } from "../lib/parse";
import {
  validatePredefinedShape,
  type ValidationResult,
} from "../lib/validate-edit";
import { InlineError } from "./inline-error";

/* ───────── shared editor frame ───────── */

function EditorFrame({
  children,
  validation,
  onSave,
  onCancel,
}: {
  children: React.ReactNode;
  validation: ValidationResult;
  onSave: () => void;
  onCancel: () => void;
}) {
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
      {children}
      <div className="flex items-center justify-between gap-2 pt-1">
        {!validation.ok ? (
          <InlineError errors={validation.errors} />
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
            onClick={onSave}
            disabled={!validation.ok}
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

const inputBase =
  "rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* ───────── codearea ───────── */

function CodeAreaEdit({
  initial,
  onSave,
  onCancel,
}: {
  initial: CodeAreaValue;
  onSave: (v: CodeAreaValue) => void;
  onCancel: () => void;
}) {
  const [format, setFormat] = useState(initial.format);
  const [content, setContent] = useState(initial.content);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const value: CodeAreaValue = { format, content };
  const validation = validatePredefinedShape("codearea", value);
  return (
    <EditorFrame
      validation={validation}
      onSave={() => validation.ok && onSave(value)}
      onCancel={onCancel}
    >
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          format
        </span>
        <input
          type="text"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className={cn(inputBase, "w-32 font-mono text-[12px]")}
          aria-label="Code format"
        />
      </div>
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className={cn(
          inputBase,
          "block w-full resize-y font-mono text-[12.5px] leading-relaxed",
        )}
        aria-label="Code content"
      />
    </EditorFrame>
  );
}

/* ───────── image ───────── */

function ImageEdit({
  initial,
  onSave,
  onCancel,
}: {
  initial: ImageValue;
  onSave: (v: ImageValue) => void;
  onCancel: () => void;
}) {
  const [src, setSrc] = useState(initial.src);
  const [alt, setAlt] = useState(initial.alt ?? "");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const value: ImageValue = { src, ...(alt ? { alt } : {}) };
  const validation = validatePredefinedShape("image", value);
  return (
    <EditorFrame
      validation={validation}
      onSave={() => validation.ok && onSave(value)}
      onCancel={onCancel}
    >
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          src
        </span>
        <input
          ref={ref}
          type="url"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          placeholder="https://..."
          className={cn(inputBase, "w-full")}
          aria-label="Image src"
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          alt
        </span>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="description"
          className={cn(inputBase, "w-full")}
          aria-label="Image alt text"
        />
      </div>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="max-h-32 w-auto rounded-sm border border-border/70"
        />
      ) : null}
    </EditorFrame>
  );
}

/* ───────── quote ───────── */

function QuoteEdit({
  initial,
  onSave,
  onCancel,
}: {
  initial: QuoteValue;
  onSave: (v: QuoteValue) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const validation = validatePredefinedShape("quote", value);
  return (
    <EditorFrame
      validation={validation}
      onSave={() => validation.ok && onSave(value)}
      onCancel={onCancel}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className={cn(
          inputBase,
          "block w-full resize-y text-sm italic leading-relaxed",
        )}
        aria-label="Quote text"
      />
    </EditorFrame>
  );
}

/* ───────── list (one item per line) ───────── */

function ListEdit({
  initial,
  onSave,
  onCancel,
}: {
  initial: ListValue;
  onSave: (v: ListValue) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(
    initial.map((v) => stringifyScalar(v)).join("\n"),
  );
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const value: ListValue = text
    .split("\n")
    .filter((line, i, a) => line.length > 0 || i < a.length - 1)
    .map((line) => parseScalar(line));
  const validation = validatePredefinedShape("list", value);
  return (
    <EditorFrame
      validation={validation}
      onSave={() => validation.ok && onSave(value)}
      onCancel={onCancel}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        one item per line · empty lines dropped · `true` / `false` / `null` /
        numbers inferred
      </p>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className={cn(inputBase, "block w-full resize-y font-mono text-[12px]")}
        aria-label="List items"
      />
    </EditorFrame>
  );
}

function stringifyScalar(v: FlatFieldValue): string {
  if (v === null) return "null";
  return String(v);
}

function parseScalar(line: string): FlatFieldValue {
  const trimmed = line.trim();
  if (trimmed === "") return "";
  if (trimmed === "null") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return line;
}

/* ───────── table (JSON-textarea fallback per Q-P4) ───────── */

function TableEdit({
  initial,
  onSave,
  onCancel,
}: {
  initial: TableValue;
  onSave: (v: TableValue) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  let parsed: TableValue | null = null;
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(text) as TableValue;
  } catch (e) {
    parseError = e instanceof Error ? e.message : "invalid JSON";
  }

  const validation: ValidationResult = parsed
    ? validatePredefinedShape("table", parsed)
    : {
        ok: false,
        errors: [{ code: "json-parse", message: parseError ?? "invalid JSON" }],
      };

  return (
    <EditorFrame
      validation={validation}
      onSave={() => validation.ok && parsed && onSave(parsed)}
      onCancel={onCancel}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        table edit (JSON · cell-editor in v0.3)
      </p>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className={cn(inputBase, "block w-full resize-y font-mono text-[12px]")}
        aria-label="Table JSON"
        spellCheck={false}
      />
    </EditorFrame>
  );
}

/* ───────── dispatcher ───────── */

export function PredefinedEdit({
  entry,
  onCommit,
  onCancel,
}: {
  entry: RichCardPredefinedEntry;
  onCommit: (next: RichCardPredefinedEntry) => void;
  onCancel: () => void;
}) {
  switch (entry.key) {
    case "codearea":
      return (
        <CodeAreaEdit
          initial={entry.value}
          onSave={(v) => onCommit({ key: "codearea", value: v })}
          onCancel={onCancel}
        />
      );
    case "image":
      return (
        <ImageEdit
          initial={entry.value}
          onSave={(v) => onCommit({ key: "image", value: v })}
          onCancel={onCancel}
        />
      );
    case "quote":
      return (
        <QuoteEdit
          initial={entry.value}
          onSave={(v) => onCommit({ key: "quote", value: v })}
          onCancel={onCancel}
        />
      );
    case "list":
      return (
        <ListEdit
          initial={entry.value}
          onSave={(v) => onCommit({ key: "list", value: v })}
          onCancel={onCancel}
        />
      );
    case "table":
      return (
        <TableEdit
          initial={entry.value}
          onSave={(v) => onCommit({ key: "table", value: v })}
          onCancel={onCancel}
        />
      );
  }
}

