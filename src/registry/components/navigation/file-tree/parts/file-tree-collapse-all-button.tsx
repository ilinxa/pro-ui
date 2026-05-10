"use client";

import { ChevronsDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileTree } from "../hooks/use-file-tree-context";

export interface FileTreeCollapseAllButtonProps {
  className?: string;
}

export function FileTreeCollapseAllButton(
  props: FileTreeCollapseAllButtonProps,
) {
  const { className } = props;
  const { actions, showCollapseAll, labels } = useFileTree();
  if (!showCollapseAll) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className}
          onClick={() => actions.collapseAll()}
          aria-label={labels.collapseAll}
        >
          <ChevronsDownUp className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{labels.collapseAll}</TooltipContent>
    </Tooltip>
  );
}
