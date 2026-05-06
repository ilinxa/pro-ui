"use client";

import { Lock } from "lucide-react";
import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { NodeRecord } from "../types";

// Wraps every consumer renderer's output. Owns:
// - Selection ring (via data-selected attribute, styled with Tailwind ring-*)
// - Lock chip (when node.locked is true)
// - Focus-visible outline for keyboard navigation
//
// Consumer renderers focus on content + handles; the shell handles chrome.
function NodeShellImpl({
  isSelected,
  isLocked,
  className,
  children,
}: {
  isSelected: boolean;
  isLocked: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-selected={isSelected}
      data-locked={isLocked}
      tabIndex={0}
      className={cn(
        "relative outline-none",
        "data-[selected=true]:[&>*]:ring-2 data-[selected=true]:[&>*]:ring-ring",
        "focus-visible:[&>*]:ring-2 focus-visible:[&>*]:ring-ring/60",
        className,
      )}
    >
      {children}
      {isLocked ? (
        <span
          aria-label="Locked"
          title="Locked"
          className={cn(
            "absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center",
            "rounded-full border border-border bg-card text-muted-foreground shadow-sm",
          )}
        >
          <Lock aria-hidden className="h-3 w-3" />
        </span>
      ) : null}
    </div>
  );
}

export const NodeShell = memo(NodeShellImpl);

// Helper: did the xyflow node arrive with locked: true?
// (NodeRecord.locked maps to xyflow draggable: false on the way out; the
// adapter passes the flag explicitly.)
export type NodeShellOf = (n: NodeRecord) => { isLocked: boolean };
