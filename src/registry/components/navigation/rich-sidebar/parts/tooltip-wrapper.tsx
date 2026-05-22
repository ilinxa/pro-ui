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
 * F-cross-13 defensive Tooltip wrapper (L19 + R7).
 *
 * Producer ships Radix-based primitive (delayDuration); consumer-installed
 * shadcn 4.6+ may ship Base UI primitive (delay). Pass BOTH prop names —
 * the unused one is silently ignored by the underlying implementation.
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
    <TooltipProvider
      delayDuration={delay}
      // @ts-expect-error — Base UI primitives use `delay` prop name; Radix uses
      // `delayDuration`. Pass both defensively per F-cross-13 (memory:
      // project_shadcn_primitive_radix_baseui_divergence). The unused prop is
      // ignored at runtime.
      delay={delay}
    >
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="z-50">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
