"use client";

import { FolderPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileTree } from "../hooks/use-file-tree-context";

export interface FileTreeNewFolderButtonProps {
  /** Optional explicit parent id (defaults to focused folder, then root). */
  parentId?: string | null;
  className?: string;
}

export function FileTreeNewFolderButton(props: FileTreeNewFolderButtonProps) {
  const { parentId, className } = props;
  const { actions, showNewFolder, state, labels, rows } = useFileTree();
  if (!showNewFolder) return null;

  const resolveParent = (): string | null => {
    if (parentId !== undefined) return parentId;
    if (state.focusedId) {
      const focused = rows.find((r) => r.node.id === state.focusedId);
      if (focused) {
        return focused.node.type === "folder"
          ? focused.node.id
          : (focused.node.parentId ?? null);
      }
    }
    return null;
  };

  // F-cross-13: no `asChild` — Base UI triggers reject it; the trigger IS the button, styled via buttonVariants.
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
        onClick={() => actions.triggerCreate(resolveParent(), "folder")}
        aria-label={labels.newFolder}
      >
        <FolderPlus className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{labels.newFolder}</TooltipContent>
    </Tooltip>
  );
}
