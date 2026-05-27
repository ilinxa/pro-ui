"use client";

import { memo, useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EngagementLikerProfile } from "../types";

export interface ShareMenuProps {
  /** Pre-loaded recent / suggested users for sharing. */
  users: EngagementLikerProfile[];
  /** Optional async search — called on every input change with the trimmed query.
   * If omitted, the panel filters `users` locally by name/username. */
  onSearch?: (query: string) => Promise<EngagementLikerProfile[]>;
  /** Fired when the user selects someone to share with. */
  onShareTo: (user: EngagementLikerProfile) => void;
  /** Heading label. Default "Share with…". */
  heading?: string;
  /** Search input placeholder. Default "Search people…". */
  searchPlaceholder?: string;
  /** Empty state when search has no results. Default "No matches." */
  emptyLabel?: string;
  /** Hide-button label (kasder's "Gizle"). */
  onClose?: () => void;
  /** Hide-button label text. Default "Hide". */
  closeLabel?: string;
  className?: string;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

function ShareMenuInner({
  users,
  onSearch,
  onShareTo,
  heading = "Share with…",
  searchPlaceholder = "Search people…",
  emptyLabel = "No matches.",
  onClose,
  closeLabel = "Hide",
  className,
}: ShareMenuProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EngagementLikerProfile[] | null>(
    null,
  );

  const visibleUsers = useMemo<EngagementLikerProfile[]>(() => {
    if (searchResults !== null) return searchResults;
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.username ? u.username.toLowerCase().includes(q) : false),
    );
  }, [searchResults, query, users]);

  const handleQueryChange = async (next: string) => {
    setQuery(next);
    if (!onSearch) {
      setSearchResults(null);
      return;
    }
    if (!next.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await onSearch(next);
    setSearchResults(results);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{heading}</span>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-xs"
          >
            {closeLabel}
          </Button>
        ) : null}
      </div>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => {
            void handleQueryChange(e.target.value);
          }}
          placeholder={searchPlaceholder}
          className="h-9 pl-8"
        />
      </div>
      <ul className="-mx-1 max-h-64 overflow-y-auto" role="list">
        {visibleUsers.length === 0 ? (
          <li
            className="px-3 py-6 text-center text-xs text-muted-foreground"
            role="status"
          >
            {emptyLabel}
          </li>
        ) : (
          visibleUsers.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onShareTo(user)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt="" />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {user.name}
                  </div>
                  {user.username ? (
                    <div className="truncate text-xs text-muted-foreground">
                      @{user.username}
                    </div>
                  ) : null}
                </div>
                <Send
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export const ShareMenu = memo(ShareMenuInner);
ShareMenu.displayName = "ShareMenu";
