"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { OpenForAnyoneToggleProps } from "../types";

/**
 * À-la-carte sub-part — the "open for anyone" on/off control. A `Switch` reads
 * as a *setting*, which is exactly what "open for anyone" is. The label is a
 * **friendly invite, never a warning** (D9): signal-lime accent when on, never a
 * red/alert treatment — releasing a task into "open for anyone" reads as
 * generosity. Capability-gated: no `onOpenChange` (or `readOnly`) → the switch
 * is non-interactive (display-only), no dead affordance.
 */
export function OpenForAnyoneToggle({
  open,
  onOpenChange,
  label = "Open for anyone",
  readOnly = false,
  density = "comfortable",
  className,
}: OpenForAnyoneToggleProps) {
  const id = React.useId();
  const interactive = !readOnly && typeof onOpenChange === "function";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        id={id}
        checked={open}
        onCheckedChange={interactive ? onOpenChange : undefined}
        disabled={!interactive}
        size={density === "compact" ? "sm" : "default"}
        aria-label={label}
      />
      <label
        htmlFor={id}
        className={cn(
          "flex select-none items-center gap-1",
          density === "compact" ? "text-xs" : "text-sm",
          open ? "font-medium text-foreground" : "text-muted-foreground",
          interactive && "cursor-pointer",
        )}
      >
        <span aria-hidden>🙌</span> {label}
      </label>
    </div>
  );
}
