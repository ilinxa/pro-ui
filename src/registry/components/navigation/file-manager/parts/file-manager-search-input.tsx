"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerSearchInput() {
  const { actions, state, labels } = useFileManager();
  return (
    <div className="relative flex w-48 shrink-0 items-center">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground"
      />
      <Input
        type="search"
        value={state.searchQuery}
        onChange={(e) => actions.setSearchQuery(e.target.value)}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchPlaceholder}
        className="h-7 pl-7 pr-7 text-xs"
      />
      {state.searchQuery ? (
        <button
          type="button"
          onClick={() => actions.setSearchQuery("")}
          aria-label="Clear search"
          className="absolute right-2 rounded-sm text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
