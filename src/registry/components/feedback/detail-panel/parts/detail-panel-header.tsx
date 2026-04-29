"use client";

import type { DetailPanelHeaderProps } from "../types";
import { useDetailPanel } from "./detail-panel-context";
import { cn } from "@/lib/utils";

export function DetailPanelHeader({
  children,
  sticky = true,
  className,
}: DetailPanelHeaderProps) {
  // Verify Provider context exists; throws standard "must be inside <DetailPanel>" if not.
  useDetailPanel();
  return (
    <div
      className={cn(
        "z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3",
        sticky ? "sticky top-0" : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}
