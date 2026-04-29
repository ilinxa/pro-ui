"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EntityLike, KindMeta } from "../types";

interface ChipProps<T extends EntityLike> {
  entity: T;
  kindMeta: KindMeta | undefined;
  showKind: boolean;
  onRemove: () => void;
  disabled?: boolean;
}

export function Chip<T extends EntityLike>({
  entity,
  kindMeta,
  showKind,
  onRemove,
  disabled,
}: ChipProps<T>) {
  return (
    <Badge
      variant="secondary"
      className="gap-1 pr-0.5 text-xs"
    >
      {showKind && entity.kind ? (
        <span
          className={cn(
            "font-mono text-[10px] uppercase opacity-70",
            kindMeta?.color ? "text-[var(--kind-color)]" : undefined,
          )}
          style={
            kindMeta?.color
              ? ({ "--kind-color": kindMeta.color } as React.CSSProperties)
              : undefined
          }
        >
          {kindMeta?.label ?? entity.kind}
        </span>
      ) : null}
      <span className="truncate">{entity.label}</span>
      <button
        type="button"
        aria-label={`Remove ${entity.label}`}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onKeyDown={(e) => {
          // Stop Enter/Space from bubbling to the parent trigger which would toggle the popover.
          if (e.key === "Enter" || e.key === " ") e.stopPropagation();
        }}
        className="ml-0.5 rounded-sm p-0.5 hover:bg-foreground/10 disabled:opacity-50"
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </Badge>
  );
}
