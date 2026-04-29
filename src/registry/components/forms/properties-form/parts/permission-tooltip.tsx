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
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-describedby={tooltipId}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            {children}
            <Lock
              aria-hidden="true"
              className="size-3 text-muted-foreground/70"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent id={tooltipId} side="top" align="start">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
