"use client";

import { FolderPlus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "../hooks/use-media-library";

/** Tier B — title + search + New folder + Upload. */
export function MediaLibraryToolbar({ className }: { className?: string }) {
  const {
    labels,
    can,
    triggerUpload,
    startCreateFolder,
    searchQuery,
    setSearchQuery,
  } = useMediaLibrary();

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {labels.title}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className="h-9 w-44 pl-8 sm:w-64"
          />
        </div>
        {can.createFolder ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={startCreateFolder}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
            {labels.newFolderButton}
          </Button>
        ) : null}
        {can.upload ? (
          <Button type="button" size="sm" className="h-9" onClick={triggerUpload}>
            <Upload className="size-4" aria-hidden="true" />
            {labels.uploadButton}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
