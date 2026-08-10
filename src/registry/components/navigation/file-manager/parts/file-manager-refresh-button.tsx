"use client";

import { RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerRefreshButton() {
  const { actions, state, labels, showRefresh } = useFileManager();
  if (!showRefresh) return null;
  // F-cross-13: no `asChild` — Base UI triggers reject it; the trigger IS the button, styled via buttonVariants.
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7")}
        onClick={() => actions.refresh(state.currentFolderId)}
        aria-label={labels.refresh}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{labels.refresh}</TooltipContent>
    </Tooltip>
  );
}
