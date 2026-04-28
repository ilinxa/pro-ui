import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatFieldValue } from "../types";
import type { FlatFieldType } from "../lib/infer-type";
import type { ValidationResult } from "../lib/validate-edit";
import { InlineError } from "./inline-error";

/* ───────── value editor (type-aware) ───────── */

export function FieldValueEdit({
  initialValue,
  type,
  validate,
  onCommit,
  onCancel,
}: {
  initialValue: FlatFieldValue;
  type: FlatFieldType;
  validate: (value: FlatFieldValue) => ValidationResult;
  onCommit: (value: FlatFieldValue) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<FlatFieldValue>(initialValue);
  const validation = validate(value);

  const submit = () => {
    if (validation.ok) onCommit(value);
  };

  const handleKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && type !== "boolean") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <span
      className="inline-flex flex-wrap items-center gap-1"
      onKeyDown={handleKey}
    >
      <ValueInput
        type={type}
        value={value}
        onChange={(v) => {
          setValue(v);
          // For booleans, commit immediately on toggle (Q-P9).
          if (type === "boolean" && validation.ok) {
            onCommit(v);
          }
        }}
        onBlur={() => {
          // Don't commit on blur from boolean — already committed on toggle.
          if (type === "boolean") return;
          submit();
        }}
      />
      {type !== "boolean" ? (
        <span className="inline-flex items-center gap-0.5">
          <button
            type="button"
            onClick={submit}
            disabled={!validation.ok}
            aria-label="Save"
            className="inline-flex size-5 items-center justify-center rounded text-primary transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Check className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ) : null}
      {!validation.ok ? <InlineError errors={validation.errors} /> : null}
    </span>
  );
}

function ValueInput({
  type,
  value,
  onChange,
  onBlur,
}: {
  type: FlatFieldType;
  value: FlatFieldValue;
  onChange: (v: FlatFieldValue) => void;
  onBlur: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    if (ref.current && typeof ref.current.select === "function") {
      try {
        ref.current.select();
      } catch {
        /* some input types don't support select() */
      }
    }
  }, []);

  const baseClass =
    "rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  switch (type) {
    case "boolean":
      return (
        <input
          ref={ref}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          className="size-4 rounded-sm border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Edit boolean value"
        />
      );
    case "number":
      return (
        <input
          ref={ref}
          type="number"
          value={value === null || typeof value !== "number" ? "" : String(value)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(0);
              return;
            }
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          onBlur={onBlur}
          className={cn(baseClass, "w-24 text-right font-mono tabular-nums")}
          aria-label="Edit number value"
        />
      );
    case "date": {
      const isoString = typeof value === "string" ? value : "";
      const hasTime = /T\d{2}:\d{2}/.test(isoString);
      const inputType = hasTime ? "datetime-local" : "date";
      // datetime-local doesn't accept Z-suffix; strip for display
      const inputValue = hasTime
        ? isoString.replace(/Z$/, "").slice(0, 16)
        : isoString.slice(0, 10);
      return (
        <input
          ref={ref}
          type={inputType}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(baseClass, "min-w-32")}
          aria-label="Edit date value"
        />
      );
    }
    case "null":
      return (
        <span className="text-muted-foreground italic">
          (read-only — null fields cannot be edited)
        </span>
      );
    case "string":
    default:
      return (
        <input
          ref={ref}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(baseClass, "min-w-32")}
          aria-label="Edit string value"
        />
      );
  }
}

/* ───────── key editor (rename) ───────── */

export function FieldKeyEdit({
  initialKey,
  validate,
  onCommit,
  onCancel,
}: {
  initialKey: string;
  validate: (newKey: string) => ValidationResult;
  onCommit: (newKey: string) => void;
  onCancel: () => void;
}) {
  const [key, setKey] = useState(initialKey);
  const validation = validate(key);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const submit = () => {
    if (validation.ok && key !== initialKey) onCommit(key);
    else if (key === initialKey) onCancel();
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <input
        ref={ref}
        type="text"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Rename field key"
      />
      {!validation.ok ? <InlineError errors={validation.errors} /> : null}
    </span>
  );
}
