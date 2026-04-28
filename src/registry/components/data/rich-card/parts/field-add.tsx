import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatFieldValue } from "../types";
import type { FlatFieldType } from "../lib/infer-type";
import type { ValidationResult } from "../lib/validate-edit";
import { InlineError } from "./inline-error";

const ADDABLE_TYPES: FlatFieldType[] = [
  "string",
  "number",
  "boolean",
  "date",
];

function defaultValueFor(type: FlatFieldType): FlatFieldValue {
  switch (type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "date":
      return new Date().toISOString().slice(0, 10);
    case "null":
      return null;
    case "string":
    default:
      return "";
  }
}

/**
 * Inline form for adding a flat field. Replaces the "+ field" button
 * location while open. Press Enter to add, Escape to cancel.
 */
export function FieldAddForm({
  validateAll,
  onCommit,
  onCancel,
}: {
  validateAll: (
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => ValidationResult;
  onCommit: (
    key: string,
    value: FlatFieldValue,
    type: FlatFieldType,
  ) => void;
  onCancel: () => void;
}) {
  const [key, setKey] = useState("");
  const [type, setType] = useState<FlatFieldType>("string");
  const [value, setValue] = useState<FlatFieldValue>(defaultValueFor("string"));
  const keyRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    keyRef.current?.focus();
  }, []);

  const validation = validateAll(key, value, type);

  const submit = () => {
    if (validation.ok) {
      onCommit(key, value, type);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="space-y-1.5 rounded-md border border-dashed border-border/70 bg-muted/30 p-2"
      onKeyDown={handleKeyDown}
    >
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          key
        </span>
        <input
          ref={keyRef}
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="field name"
          className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="New field key"
        />
        <select
          value={type}
          onChange={(e) => {
            const t = e.target.value as FlatFieldType;
            setType(t);
            setValue(defaultValueFor(t));
          }}
          className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="New field type"
        >
          {ADDABLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          value
        </span>
        <ValueInputForType type={type} value={value} onChange={setValue} />
      </div>

      <div className="flex items-center justify-between gap-2">
        {!validation.ok && key.length > 0 ? (
          <InlineError errors={validation.errors} />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cancel add field"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!validation.ok}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-mono text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Check className="size-3" aria-hidden="true" />
            add
          </button>
        </div>
      </div>
    </div>
  );
}

function ValueInputForType({
  type,
  value,
  onChange,
}: {
  type: FlatFieldType;
  value: FlatFieldValue;
  onChange: (v: FlatFieldValue) => void;
}) {
  const baseClass =
    "rounded-sm border border-border bg-background px-1.5 py-0.5 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  switch (type) {
    case "boolean":
      return (
        <label className="inline-flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 rounded-sm"
          />
          <span className="font-mono text-[11px] text-muted-foreground">
            {value === true ? "true" : "false"}
          </span>
        </label>
      );
    case "number":
      return (
        <input
          type="number"
          value={typeof value === "number" ? String(value) : ""}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className={cn(baseClass, "w-32 text-right font-mono tabular-nums")}
          aria-label="New field number value"
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={typeof value === "string" ? value.slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(baseClass, "min-w-32")}
          aria-label="New field date value"
        />
      );
    case "null":
      return null;
    case "string":
    default:
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="value"
          className={cn(baseClass, "min-w-32")}
          aria-label="New field string value"
        />
      );
  }
}

/**
 * Lightweight "+ field" button that triggers FieldAddForm.
 */
export function FieldAddButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Plus className="size-3" aria-hidden="true" />
      field
    </button>
  );
}
