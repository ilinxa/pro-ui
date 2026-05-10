"use client";
import { cn } from "@/lib/utils";

export interface CodeBlockTrafficLightsProps {
  className?: string;
}

/**
 * macOS-style traffic-light decoration (three muted circles).
 * Purely presentational — no behaviour. Opt-in via the `showTrafficLights`
 * prop on `<CodeBlock>`, or compose manually inside `renderHeader`.
 */
export function CodeBlockTrafficLights({ className }: CodeBlockTrafficLightsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center gap-1.5", className)}
    >
      <span className="block size-3 rounded-full bg-[oklch(0.78_0.16_25)] opacity-70" />
      <span className="block size-3 rounded-full bg-[oklch(0.84_0.15_85)] opacity-70" />
      <span className="block size-3 rounded-full bg-[oklch(0.78_0.16_145)] opacity-70" />
    </div>
  );
}
