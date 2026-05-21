"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useJsonFormContext } from "../json-form-context";
import { useConditional } from "../hooks/use-conditional";
import { flattenRhfErrorsToList } from "../lib/flatten-errors";
import { isValueField } from "../lib/validate-schema";
import type { FieldDefinition } from "../types";

/**
 * v0.1.7 — body of the JsonFormDevtools panel. Lives in its own module so
 * the parent `<JsonFormDevtools>` can lazy-load it via `React.lazy()` — the
 * ~250 LOC body chunk only loads when the panel actually renders, while the
 * tiny loader stub ships in the parent module.
 *
 * This module is rendered exclusively from the dynamic-import boundary and
 * is NOT exported from `index.ts`. Consumers reach it only via
 * `<JsonFormDevtools>`.
 */

export interface JsonFormDevtoolsBodyProps {
  inline: boolean;
  shortcut: string;
  className?: string;
}

type Tab = "schema" | "values" | "conditionals" | "errors";

export default function JsonFormDevtoolsBody({
  inline,
  shortcut,
  className,
}: JsonFormDevtoolsBodyProps) {
  const ctx = useJsonFormContext();
  const [open, setOpen] = useState(inline);
  const [tab, setTab] = useState<Tab>("schema");

  // Keyboard shortcut listener (skipped in inline mode — the panel is
  // always rendered then).
  useEffect(() => {
    if (inline) return;
    const handler = (e: KeyboardEvent) => {
      if (matchesShortcut(e, shortcut)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inline, shortcut]);

  const wrapperClass = inline
    ? cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        className,
      )
    : cn(
        "fixed bottom-4 right-4 z-[9999] flex w-96 max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-border bg-card text-card-foreground shadow-xl",
        className,
      );

  if (!inline && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground shadow-md hover:bg-muted"
        aria-label="Open JsonForm devtools panel"
      >
        <span className="size-2 rounded-full bg-primary" />
        json-form devtools
      </button>
    );
  }

  return (
    <div className={wrapperClass} data-jsonform-devtools>
      {!inline ? (
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            json-form devtools
          </span>
          <div className="flex items-center gap-1">
            <span className="hidden text-[10px] text-muted-foreground/70 sm:inline">
              {shortcut}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close devtools panel"
              className="rounded p-1 hover:bg-muted"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        </header>
      ) : null}

      <nav className="flex items-center gap-1 border-b border-border px-2 py-1 text-xs">
        {(["schema", "values", "conditionals", "errors"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="max-h-[400px] min-h-[160px] flex-1 overflow-y-auto p-3 text-xs">
        {tab === "schema" ? <SchemaTab /> : null}
        {tab === "values" ? <ValuesTab /> : null}
        {tab === "conditionals" ? <ConditionalsTab /> : null}
        {tab === "errors" ? <ErrorsTab /> : null}
      </div>

      <footer className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        <span data-jsonform-devtools-form-id>{ctx.formId}</span>
        <span>v0.1.7</span>
      </footer>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function SchemaTab() {
  const ctx = useJsonFormContext();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRightIcon className="size-3" />
        ) : (
          <ChevronDownIcon className="size-3" />
        )}
        FormSchema ({ctx.schema.fields.length} fields)
      </button>
      {!collapsed ? (
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-foreground">
          {JSON.stringify(ctx.schema, prettyReplacer, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function ValuesTab() {
  const ctx = useJsonFormContext();
  // Devtools-only subscription — paying the full-bag watch cost is OK here
  // because devtools panels are excluded from normal render paths.
  const values = useWatch({ control: ctx.rhf.control }) ?? {};

  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-foreground">
      {JSON.stringify(values, prettyReplacer, 2)}
    </pre>
  );
}

function ConditionalsTab() {
  const ctx = useJsonFormContext();

  const conditionalFields = useMemo(
    () =>
      ctx.schema.fields.filter(
        (f) =>
          isValueField(f) && (f.visibleWhen || f.enabledWhen || f.requiredWhen),
      ),
    [ctx.schema.fields],
  );

  if (conditionalFields.length === 0) {
    return (
      <p className="italic text-muted-foreground">
        No conditional fields in this schema.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="py-1 pr-2 font-medium">Field</th>
          <th className="py-1 pr-2 font-medium">visible</th>
          <th className="py-1 pr-2 font-medium">enabled</th>
          <th className="py-1 pr-2 font-medium">required</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {conditionalFields.map((f) => (
          <ConditionalRow key={f.name} field={f} />
        ))}
      </tbody>
    </table>
  );
}

function ConditionalRow({ field }: { field: FieldDefinition }) {
  // useConditional handles the narrow-deps subscription internally; the
  // devtools row re-renders only when this field's evaluated state flips.
  const { visible, enabled, required } = useConditional(field);

  return (
    <tr>
      <td className="py-1 pr-2 font-mono text-foreground">{field.name}</td>
      <td className="py-1 pr-2">{visible ? "✓" : "✗"}</td>
      <td className="py-1 pr-2">{enabled ? "✓" : "✗"}</td>
      <td className="py-1 pr-2">{required ? "✓" : "✗"}</td>
    </tr>
  );
}

function ErrorsTab() {
  const ctx = useJsonFormContext();
  const { errors } = useFormState({ control: ctx.rhf.control });
  const flat = flattenRhfErrorsToList(errors as Record<string, unknown>);

  if (flat.length === 0) {
    return (
      <p className="italic text-muted-foreground">No errors. Form is valid.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {flat.map(({ name, message }) => (
        <li
          key={name}
          className="flex items-baseline gap-2 rounded border border-destructive/30 bg-destructive/5 p-1.5"
        >
          <span className="font-mono text-foreground">{name}</span>
          <span className="text-destructive">{message}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * JSON.stringify replacer that turns function values into a placeholder
 * (raw schemas often hold validate / compute / visibleWhen callbacks).
 */
function prettyReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "function") return "[Function]";
  if (value instanceof Map) return Object.fromEntries(value);
  if (value instanceof Set) return Array.from(value);
  return value;
}

/**
 * Matches a KeyboardEvent against a shortcut string like "Ctrl+Shift+J".
 * Modifiers are case-insensitive; the final key compares against
 * `event.key` (case-insensitive too).
 */
function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split("+").map((p) => p.trim().toLowerCase());
  const target = parts.pop();
  if (!target) return false;
  if (parts.includes("ctrl") !== e.ctrlKey) return false;
  if (parts.includes("shift") !== e.shiftKey) return false;
  if (parts.includes("alt") !== e.altKey) return false;
  if (parts.includes("meta") !== e.metaKey) return false;
  return e.key.toLowerCase() === target;
}
