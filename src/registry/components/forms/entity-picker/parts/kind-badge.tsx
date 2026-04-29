"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KindMeta } from "../types";

interface KindBadgeProps {
  kindKey: string;
  meta: KindMeta | undefined;
  className?: string;
}

export function KindBadge({ kindKey, meta, className }: KindBadgeProps) {
  const display = meta?.label ?? kindKey;
  const style = meta?.color
    ? ({ "--kind-color": meta.color } as React.CSSProperties)
    : undefined;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.12em]",
        meta?.color
          ? "bg-[var(--kind-color)]/15 text-[var(--kind-color)]"
          : "text-muted-foreground",
        className,
      )}
      style={style}
    >
      {display}
    </Badge>
  );
}
