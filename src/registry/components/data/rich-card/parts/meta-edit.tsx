"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatFieldValue, MetaRenderer } from "../types";
import type { ValidationResult } from "../lib/validate-edit";
import { InlineError } from "./inline-error";

/**
 * Inline meta editor used inside the popover (and inline-strip when desired).
 * Renders meta entries with edit/remove affordances + an "+ meta" button.
 */
export function MetaEditList({
  meta,
  cardId,
  metaRenderers,
  onEdit,
  onAdd,
  onRemove,
  validateAdd,
  validateEdit,
  className,
}: {
  meta: Record<string, FlatFieldValue> | undefined;
  cardId: string;
  metaRenderers?: Record<string, MetaRenderer>;
  onEdit: (key: string, value: FlatFieldValue) => void;
  onAdd: (key: string, value: FlatFieldValue) => void;
  onRemove: (key: string) => void;
  validateAdd: (key: string, value: FlatFieldValue) => ValidationResult;
  validateEdit: (key: string, value: FlatFieldValue) => ValidationResult;
  className?: string;
}) {
  const entries = meta ? Object.entries(meta) : [];
  const [adding, setAdding] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Meta
        </p>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Add meta entry"
          >
            <Plus className="size-2.5" aria-hidden="true" />
            add
          </button>
        ) : null}
      </div>

      <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] gap-x-2 gap-y-1 text-sm">
        {entries.map(([k, v]) => (
          <MetaRow
            key={k}
            metaKey={k}
            value={v}
            cardId={cardId}
            isEditing={editingKey === k}
            metaRenderers={metaRenderers}
            onEnterEdit={() => setEditingKey(k)}
            onCommitEdit={(newValue) => {
              onEdit(k, newValue);
              setEditingKey(null);
            }}
            onCancelEdit={() => setEditingKey(null)}
            onRemove={() => onRemove(k)}
            validate={(newValue) => validateEdit(k, newValue)}
          />
        ))}
      </dl>

      {adding ? (
        <MetaAddRow
          validate={validateAdd}
          onCommit={(k, v) => {
            onAdd(k, v);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}

function MetaRow({
  metaKey,
  value,
  cardId,
  isEditing,
  metaRenderers,
  onEnterEdit,
  onCommitEdit,
  onCancelEdit,
  onRemove,
  validate,
}: {
  metaKey: string;
  value: FlatFieldValue;
  cardId: string;
  isEditing: boolean;
  metaRenderers?: Record<string, MetaRenderer>;
  onEnterEdit: () => void;
  onCommitEdit: (newValue: FlatFieldValue) => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  validate: (newValue: FlatFieldValue) => ValidationResult;
}) {
  const renderer = metaRenderers?.[metaKey];
  return (
    <div className="contents">
      <dt className="truncate font-mono text-[11px] text-muted-foreground">
        {metaKey}
      </dt>
      <dd className="min-w-0">
        {isEditing ? (
          <MetaValueInput
            initial={value}
            validate={validate}
            onCommit={onCommitEdit}
            onCancel={onCancelEdit}
          />
        ) : renderer ? (
          renderer(value, { cardId, metaKey })
        ) : (
          <button
            type="button"
            onClick={onEnterEdit}
            className="cursor-text rounded-sm px-1 -mx-1 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {value === null ? "—" : String(value)}
          </button>
        )}
      </dd>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove meta ${metaKey}`}
        className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </div>
  );
}

function MetaValueInput({
  initial,
  validate,
  onCommit,
  onCancel,
}: {
  initial: FlatFieldValue;
  validate: (v: FlatFieldValue) => ValidationResult;
  onCommit: (v: FlatFieldValue) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial === null ? "" : String(initial));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const value = parseValue(initial, text);
  const validation = validate(value);

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <input
        ref={ref}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (validation.ok) onCommit(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (validation.ok) onCommit(value);
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Edit meta value"
      />
      {!validation.ok ? <InlineError errors={validation.errors} /> : null}
    </span>
  );
}

function parseValue(initial: FlatFieldValue, text: string): FlatFieldValue {
  // Preserve type of original
  if (typeof initial === "number") {
    const n = Number(text);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof initial === "boolean") {
    return text === "true";
  }
  if (initial === null) {
    return text === "" ? null : text;
  }
  return text;
}

function MetaAddRow({
  validate,
  onCommit,
  onCancel,
}: {
  validate: (key: string, value: FlatFieldValue) => ValidationResult;
  onCommit: (key: string, value: FlatFieldValue) => void;
  onCancel: () => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const validation = validate(key, value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="space-y-1 rounded-sm border border-dashed border-border/70 p-1.5">
      <div className="flex gap-1">
        <input
          ref={ref}
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="key"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="value"
          onKeyDown={(e) => {
            if (e.key === "Enter" && validation.ok) {
              e.preventDefault();
              onCommit(key, value);
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          className="flex-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {!validation.ok && key.length > 0 ? (
        <InlineError errors={validation.errors} />
      ) : null}
    </div>
  );
}
