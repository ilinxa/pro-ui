"use client";

import type { DetailPanelBodyProps } from "../types";
import { useDetailPanel } from "./detail-panel-context";
import { cn } from "@/lib/utils";

export function DetailPanelBody({
  children,
  className,
}: DetailPanelBodyProps) {
  const { bodyRef } = useDetailPanel();
  return (
    <div
      ref={bodyRef}
      tabIndex={-1}
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4 outline-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
