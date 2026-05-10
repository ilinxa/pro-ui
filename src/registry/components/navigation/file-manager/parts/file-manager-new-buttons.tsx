"use client";

import { FilePlus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerNewButtons() {
  const { actions, showNewFile, showNewFolder, labels } = useFileManager();
  if (!showNewFile && !showNewFolder) return null;
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {showNewFile ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => actions.triggerCreate("file")}
              aria-label={labels.newFile}
            >
              <FilePlus className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels.newFile}</TooltipContent>
        </Tooltip>
      ) : null}
      {showNewFolder ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => actions.triggerCreate("folder")}
              aria-label={labels.newFolder}
            >
              <FolderPlus className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels.newFolder}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
