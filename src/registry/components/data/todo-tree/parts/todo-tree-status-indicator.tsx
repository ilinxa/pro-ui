"use client";

import type { TodoStatusOption } from "../../todo-rich-card/types";
import { cn } from "@/lib/utils";

export interface TodoTreeStatusIndicatorProps {
  variant: "dot" | "strip" | "none";
  statusOption?: TodoStatusOption;
  className?: string;
}

/**
 * Status badge. Three layouts:
 *  - "dot"   — 8px coloured circle, fits inline with the name row.
 *  - "strip" — full-height left-edge bar; absolute-positioned by the row.
 *  - "none"  — renders nothing.
 *
 * Colour comes from the matched statusOption's `variant` field via the
 * shadcn token palette. When no option matches, falls back to a muted grey
 * so the indicator still emits visual presence (dropping the indicator on a
 * fallback case would silently shift row spacing).
 */
export function TodoTreeStatusIndicator({
  variant,
  statusOption,
  className,
}: TodoTreeStatusIndicatorProps) {
  if (variant === "none") return null;
  const palette = paletteFor(statusOption?.variant);
  if (variant === "strip") {
    return (
      <span
        aria-hidden
        data-status={statusOption?.value ?? "unknown"}
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l",
          palette.strip,
          className,
        )}
      />
    );
  }
  // variant === "dot"
  return (
    <span
      aria-hidden
      data-status={statusOption?.value ?? "unknown"}
      title={statusOption?.label}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        palette.dot,
        className,
      )}
    />
  );
}

function paletteFor(
  variant: TodoStatusOption["variant"] | undefined,
): { dot: string; strip: string } {
  switch (variant) {
    case "default":
      return { dot: "bg-primary", strip: "bg-primary" };
    case "secondary":
      return { dot: "bg-secondary-foreground/60", strip: "bg-secondary-foreground/60" };
    case "destructive":
      return { dot: "bg-destructive", strip: "bg-destructive" };
    case "outline":
      return {
        dot: "border border-border bg-background",
        strip: "bg-border",
      };
    default:
      return {
        dot: "bg-muted-foreground/40",
        strip: "bg-muted-foreground/40",
      };
  }
}
