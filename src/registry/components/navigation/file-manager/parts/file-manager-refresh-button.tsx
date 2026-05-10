"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerRefreshButton() {
  const { actions, state, labels, showRefresh } = useFileManager();
  if (!showRefresh) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => actions.refresh(state.currentFolderId)}
          aria-label={labels.refresh}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{labels.refresh}</TooltipContent>
    </Tooltip>
  );
}
