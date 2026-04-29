"use client";

import type {
  DetailPanelActionsProps,
  DetailPanelActionsRenderFn,
} from "../types";
import { useDetailPanel } from "./detail-panel-context";
import { cn } from "@/lib/utils";

function isRenderFn(
  children: DetailPanelActionsProps["children"],
): children is DetailPanelActionsRenderFn {
  return typeof children === "function";
}

export function DetailPanelActions({
  children,
  position = "footer",
  className,
}: DetailPanelActionsProps) {
  const { mode, setMode, canEdit } = useDetailPanel();
  const content = isRenderFn(children)
    ? children({ mode, setMode, canEdit })
    : children;

  const isFooter = position === "footer";

  return (
    <div
      role="toolbar"
      className={cn(
        "z-10 flex items-center justify-end gap-2 bg-background",
        isFooter
          ? "sticky bottom-0 border-t border-border px-4 py-3"
          : "ml-auto",
        className,
      )}
    >
      {content}
    </div>
  );
}
