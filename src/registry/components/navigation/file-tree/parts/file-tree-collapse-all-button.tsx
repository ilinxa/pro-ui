"use client";

import { ChevronsDownUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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

  // F-cross-13: no `asChild` — Base UI triggers reject it; the trigger IS the button, styled via buttonVariants.
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
        onClick={() => actions.collapseAll()}
        aria-label={labels.collapseAll}
      >
        <ChevronsDownUp className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{labels.collapseAll}</TooltipContent>
    </Tooltip>
  );
}
