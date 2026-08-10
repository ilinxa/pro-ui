"use client";

import { FilePlus, FolderPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerNewButtons() {
  const { actions, showNewFile, showNewFolder, labels } = useFileManager();
  if (!showNewFile && !showNewFolder) return null;
  // F-cross-13: no `asChild` — Base UI triggers reject it; triggers ARE the buttons, styled via buttonVariants.
  const triggerClass = cn(
    buttonVariants({ variant: "ghost", size: "icon" }),
    "size-7",
  );
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {showNewFile ? (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={triggerClass}
            onClick={() => actions.triggerCreate("file")}
            aria-label={labels.newFile}
          >
            <FilePlus className="size-4" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>{labels.newFile}</TooltipContent>
        </Tooltip>
      ) : null}
      {showNewFolder ? (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={triggerClass}
            onClick={() => actions.triggerCreate("folder")}
            aria-label={labels.newFolder}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>{labels.newFolder}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
