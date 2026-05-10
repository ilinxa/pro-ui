"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className}
          onClick={() => actions.refresh(nodeId)}
          aria-label={labels.refresh}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{labels.refresh}</TooltipContent>
    </Tooltip>
  );
}
