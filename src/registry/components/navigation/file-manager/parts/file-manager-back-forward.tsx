"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerBackForward() {
  const { actions, state, labels } = useFileManager();
  const canBack = state.historyBackIds.length > 0;
  const canForward = state.historyForwardIds.length > 0;
  // F-cross-13: no `asChild` — Base UI triggers reject it; triggers ARE the buttons, styled via buttonVariants.
  const triggerClass = cn(
    buttonVariants({ variant: "ghost", size: "icon" }),
    "size-7",
  );
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={triggerClass}
          disabled={!canBack}
          onClick={() => actions.navigateBack()}
          aria-label={labels.back}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>{labels.back}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={triggerClass}
          disabled={!canForward}
          onClick={() => actions.navigateForward()}
          aria-label={labels.forward}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>{labels.forward}</TooltipContent>
      </Tooltip>
    </div>
  );
}
