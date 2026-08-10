"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PermissionTooltipProps {
  reason: string;
  children: ReactNode;
  tooltipId?: string;
  className?: string;
}

export function PermissionTooltip({
  reason,
  children,
  tooltipId,
  className,
}: PermissionTooltipProps) {
  // No delayDuration — Radix-only prop; Base UI's TooltipProvider rejects it (F-cross-13).
  // No `asChild` either — the trigger IS the wrapper (a natively-focusable
  // <button> in both backends; children must stay non-interactive display content).
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-describedby={tooltipId}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm text-start outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {children}
          <Lock
            aria-hidden="true"
            className="size-3 text-muted-foreground/70"
          />
        </TooltipTrigger>
        <TooltipContent id={tooltipId} side="top" align="start">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
