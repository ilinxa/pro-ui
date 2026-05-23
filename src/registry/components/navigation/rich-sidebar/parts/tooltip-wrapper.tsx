"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  disabled?: boolean;
  delay?: number;
}

/**
 * Tooltip wrapper for collapsed-sidebar row labels.
 *
 * v0.3.0 (C4, F11): the F-cross-13 dual-prop shim is GONE. As of 2026-05-23
 * audit, `@/components/ui/tooltip` ships a Radix-based primitive
 * (imports `Tooltip` from `radix-ui` umbrella package) — `TooltipProvider`
 * accepts `delayDuration` only. If a future shadcn version migrates this
 * primitive to Base UI (which uses `delay`), restore the dual-prop shim
 * with a `@ts-expect-error` comment AND cite the new tooltip.tsx import
 * path as concrete evidence.
 *
 * When `disabled` is true (e.g., expanded sidebar mode), children render
 * without the Tooltip wrapper at all — saves Provider mount cost.
 */
export function TooltipWrapper({
  content,
  children,
  side = "right",
  disabled,
  delay = 300,
}: TooltipWrapperProps) {
  if (disabled) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="z-50">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
