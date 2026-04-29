import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KindMeta } from "../types";

interface KindBadgeProps {
  meta: KindMeta;
  className?: string;
}

export function KindBadge({ meta, className }: KindBadgeProps) {
  // If meta.color is provided, use color-mix for the background tint and the literal
  // for text + border. Otherwise fall back to the outline variant using design tokens.
  const styled: CSSProperties = meta.color
    ? {
        color: meta.color,
        backgroundColor: `color-mix(in oklch, ${meta.color} 14%, transparent)`,
        borderColor: meta.color,
      }
    : {};

  return (
    <Badge
      variant={meta.color ? "outline" : "secondary"}
      style={styled}
      className={cn("text-[0.6875rem] font-semibold", className)}
    >
      {meta.label}
    </Badge>
  );
}
