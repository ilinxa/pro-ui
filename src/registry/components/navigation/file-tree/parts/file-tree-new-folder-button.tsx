"use client";

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className}
          onClick={() => actions.triggerCreate(resolveParent(), "folder")}
          aria-label={labels.newFolder}
        >
          <FolderPlus className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{labels.newFolder}</TooltipContent>
    </Tooltip>
  );
}
