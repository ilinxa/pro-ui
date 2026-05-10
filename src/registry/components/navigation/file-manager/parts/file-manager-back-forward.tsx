"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerBackForward() {
  const { actions, state, labels } = useFileManager();
  const canBack = state.historyBackIds.length > 0;
  const canForward = state.historyForwardIds.length > 0;
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!canBack}
            onClick={() => actions.navigateBack()}
            aria-label={labels.back}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{labels.back}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!canForward}
            onClick={() => actions.navigateForward()}
            aria-label={labels.forward}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{labels.forward}</TooltipContent>
      </Tooltip>
    </div>
  );
}
