"use client";

import { RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileTree } from "../hooks/use-file-tree-context";

export interface FileTreeRefreshButtonProps {
  /** Refresh scope. `null` = whole tree (default); pass an id to refresh a single folder. */
  nodeId?: string | null;
  className?: string;
}

export function FileTreeRefreshButton(props: FileTreeRefreshButtonProps) {
  const { nodeId = null, className } = props;
  const { actions, showRefresh, labels } = useFileTree();
  if (!showRefresh) return null;

  // F-cross-13: no `asChild` — Base UI triggers reject it; the trigger IS the button, styled via buttonVariants.
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
        onClick={() => actions.refresh(nodeId)}
        aria-label={labels.refresh}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{labels.refresh}</TooltipContent>
    </Tooltip>
  );
}
