"use client";

import { useState } from "react";
import { Copy, Edit3, Lock, Trash2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FlatFieldValue } from "../types";
import type { FlatFieldType } from "../lib/infer-type";

/**
 * Floating toolbar visible when ≥2 cards are selected. Shows count + bulk actions.
 */
export function BulkToolbar({
  count,
  levelMin,
  levelMax,
  totalFields,
  lockedCount,
  onDelete,
  onDuplicate,
  onClear,
  onBulkSetField,
  onToggleLock,
  className,
}: {
  count: number;
  levelMin: number;
  levelMax: number;
  totalFields: number;
  lockedCount: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onClear: () => void;
  onBulkSetField: (key: string, value: FlatFieldValue, type: FlatFieldType) => void;
  onToggleLock: () => void;
  className?: string;
}) {
  if (count < 2) return null;
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        "sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md",
        className,
      )}
    >
      <span className="font-mono text-xs text-foreground/80">
        <strong>{count}</strong> cards selected
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        · L{levelMin}–L{levelMax} · {totalFields} fields{lockedCount > 0 ? ` · ${lockedCount} locked` : ""}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <BulkSetFieldPopover onCommit={onBulkSetField} />
        <button
          type="button"
          onClick={onToggleLock}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Toggle lock on selected cards"
        >
          <Lock className="size-3" aria-hidden="true" />
          toggle lock
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Copy className="size-3" aria-hidden="true" />
          duplicate
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 font-mono text-[11px] text-destructive transition-colors hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="size-3" aria-hidden="true" />
          delete
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function BulkSetFieldPopover({
  onCommit,
}: {
  onCommit: (key: string, value: FlatFieldValue, type: FlatFieldType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [type, setType] = useState<FlatFieldType>("string");
  const [value, setValue] = useState<string>("");

  const submit = () => {
    if (!key.trim()) return;
    let parsedValue: FlatFieldValue;
    switch (type) {
      case "number":
        parsedValue = Number(value) || 0;
        break;
      case "boolean":
        parsedValue = value === "true";
        break;
      case "null":
        parsedValue = null;
        break;
      case "string":
      case "date":
      default:
        parsedValue = value;
    }
    onCommit(key, parsedValue, type);
    setKey("");
    setValue("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Bulk set field across selection"
      >
        <Edit3 className="size-3" aria-hidden="true" />
        set field
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-72 p-3 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Set field on all selected
        </p>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="key"
          className="block w-full rounded-sm border border-border bg-background px-2 py-1 font-mono text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FlatFieldType)}
          className="block w-full rounded-sm border border-border bg-background px-2 py-1 font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="date">date</option>
        </select>
        <input
          type={type === "boolean" ? "text" : type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === "boolean" ? "true / false" : "value"}
          className="block w-full rounded-sm border border-border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!key.trim()}
          className="block w-full rounded-md bg-primary px-2 py-1 font-mono text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          apply to selected
        </button>
      </PopoverContent>
    </Popover>
  );
}
