"use client";

import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileTree } from "../hooks/use-file-tree-context";

export interface FileTreeNewFileButtonProps {
  /** Optional explicit parent id (defaults to focused folder, then root). */
  parentId?: string | null;
  className?: string;
}

export function FileTreeNewFileButton(props: FileTreeNewFileButtonProps) {
  const { parentId, className } = props;
  const { actions, showNewFile, state, labels, rows } = useFileTree();
  if (!showNewFile) return null;

  const resolveParent = (): string | null => {
    if (parentId !== undefined) return parentId;
    // Prefer focused folder; otherwise focused file's parent; otherwise root.
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
          onClick={() => actions.triggerCreate(resolveParent(), "file")}
          aria-label={labels.newFile}
        >
          <FilePlus className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{labels.newFile}</TooltipContent>
    </Tooltip>
  );
}
