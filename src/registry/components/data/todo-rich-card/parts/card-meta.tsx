"use client";

import { Badge } from "@/components/ui/badge";
import { useCardContext } from "../hooks/use-card-context";
import type { TodoItem } from "../types";

/**
 * Display-only meta row — priority badge + label chips (v0.3). Reads the item's
 * `priority` / `labels` and their display metadata from context
 * (`priorityOptions` / `labelOptions`). Renders nothing when the item has
 * neither, so cards without these fields are visually unchanged.
 *
 * Colors are applied to border + text only (never a filled background) via
 * inline `style`, so any CSS color string works and an option without a `color`
 * falls back to the themeable `outline` Badge variant. Painting only the
 * dynamic color inline (not the surface) sidesteps the B6 trap where an inline
 * background would beat consumer / theme classes.
 */
export function CardMeta({ item }: { item: TodoItem }) {
  const ctx = useCardContext();
  const priority = item.priority;
  const labels = item.labels ?? [];
  if (!priority && labels.length === 0) return null;

  const priorityOpt = priority
    ? ctx.priorityOptions?.find((o) => o.value === priority)
    : undefined;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {priority ? (
        <Badge
          variant="outline"
          className="font-medium"
          style={
            priorityOpt?.color
              ? { borderColor: priorityOpt.color, color: priorityOpt.color }
              : undefined
          }
          role="status"
        >
          {priorityOpt?.label ?? priority}
        </Badge>
      ) : null}
      {labels.map((key) => {
        const opt = ctx.labelOptions?.find((o) => o.value === key);
        return (
          <Badge
            key={key}
            variant="outline"
            className="font-normal"
            style={opt?.color ? { borderColor: opt.color, color: opt.color } : undefined}
          >
            {opt?.label ?? key}
          </Badge>
        );
      })}
    </div>
  );
}
