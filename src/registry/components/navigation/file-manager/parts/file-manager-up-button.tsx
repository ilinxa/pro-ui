"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerUpButton() {
  const { actions, state, labels } = useFileManager();
  const atRoot = state.currentFolderId === null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={atRoot}
          onClick={() => actions.navigateUp()}
          aria-label={labels.up}
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{labels.up}</TooltipContent>
    </Tooltip>
  );
}
