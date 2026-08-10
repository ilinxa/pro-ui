"use client";

import { ArrowUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerUpButton() {
  const { actions, state, labels } = useFileManager();
  const atRoot = state.currentFolderId === null;
  // F-cross-13: no `asChild` — Base UI triggers reject it; the trigger IS the button, styled via buttonVariants.
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7")}
        disabled={atRoot}
        onClick={() => actions.navigateUp()}
        aria-label={labels.up}
      >
        <ArrowUp className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{labels.up}</TooltipContent>
    </Tooltip>
  );
}
