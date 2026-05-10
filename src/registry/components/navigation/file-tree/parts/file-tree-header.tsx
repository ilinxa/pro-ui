"use client";

import { cn } from "@/lib/utils";
import { useFileTree } from "../hooks/use-file-tree-context";
import { FileTreeNewFileButton } from "./file-tree-new-file-button";
import { FileTreeNewFolderButton } from "./file-tree-new-folder-button";
import { FileTreeRefreshButton } from "./file-tree-refresh-button";
import { FileTreeCollapseAllButton } from "./file-tree-collapse-all-button";

export interface FileTreeHeaderProps {
  className?: string;
}

export function FileTreeHeader(props: FileTreeHeaderProps) {
  const { className } = props;
  const { title, labels, totalCount } = useFileTree();
  const headerTitle = title ?? labels.title;

  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 border-b border-border/60 bg-card/40 pl-3 pr-1",
        className,
      )}
    >
      <h2 className="flex min-w-0 items-baseline gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="truncate text-foreground/90">{headerTitle}</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">
          {totalCount}
        </span>
      </h2>
      <div className="ml-auto flex items-center gap-0.5">
        <FileTreeNewFileButton className="size-7" />
        <FileTreeNewFolderButton className="size-7" />
        <FileTreeRefreshButton className="size-7" />
        <FileTreeCollapseAllButton className="size-7" />
      </div>
    </div>
  );
}
