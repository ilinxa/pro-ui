"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { FlatField } from "../types";
import { formatValue } from "../lib/format-value";

/**
 * Paints the first N flat-field entries from a rich-card tree as a definition
 * list. Type-aware styling: numbers right-aligned (tabular), booleans + dates
 * narrow, strings fluid.
 */
function FlatFieldStripImpl({ fields }: { fields: FlatField[] }) {
  if (fields.length === 0) return null;
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-0.5 px-3 py-2 text-xs">
      {fields.map((field) => (
        <div key={field.key} className="contents">
          <dt className="truncate font-medium text-muted-foreground">{field.key}</dt>
          <dd
            className={cn(
              "truncate",
              field.type === "number" && "text-right font-mono tabular-nums",
              field.type === "boolean" && "text-center",
              field.type === "date" && "font-mono",
            )}
          >
            {formatValue(field.value, field.type)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const FlatFieldStrip = memo(FlatFieldStripImpl);
