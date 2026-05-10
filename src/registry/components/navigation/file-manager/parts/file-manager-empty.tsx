"use client";

import { FilePlus, FolderPlus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerEmpty() {
  const { actions, showNewFile, showNewFolder, labels } = useFileManager();
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center text-sm text-muted-foreground"
      role="status"
    >
      <Inbox aria-hidden="true" className="size-8 opacity-60" />
      <p>{labels.emptyTitle}</p>
      {(showNewFile || showNewFolder) && (
        <div className="flex gap-2">
          {showNewFile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => actions.triggerCreate("file")}
            >
              <FilePlus className="size-3.5" aria-hidden="true" />
              {labels.newFile}
            </Button>
          ) : null}
          {showNewFolder ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => actions.triggerCreate("folder")}
            >
              <FolderPlus className="size-3.5" aria-hidden="true" />
              {labels.newFolder}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
