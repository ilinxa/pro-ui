"use client";

import { memo, useMemo, useRef, useState } from "react";
import { Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EngagementLikerProfile } from "../types";
import { resolveLocale } from "../lib/format-count";

/** Every user-facing string of `ShareMenu`. Override per key via `labels`. */
export interface ShareMenuLabels {
  heading: string;
  searchPlaceholder: string;
  /** Accessible name of the search input. */
  searchLabel: string;
  empty: string;
  close: string;
}

export const defaultShareMenuLabels: ShareMenuLabels = {
  heading: "Share with…",
  searchPlaceholder: "Search people…",
  searchLabel: "Search people",
  empty: "No matches.",
  close: "Hide",
};

export interface ShareMenuProps {
  /** Pre-loaded recent / suggested users for sharing. */
  users: EngagementLikerProfile[];
  /** Optional async search — called on every input change with the query. The latest request
   * wins; a rejection falls back to filtering `users` locally. If omitted, the panel filters
   * `users` locally by name/username. */
  onSearch?: (query: string) => Promise<EngagementLikerProfile[]>;
  /** Fired when the user selects someone to share with. */
  onShareTo: (user: EngagementLikerProfile) => void;
  /** Override any user-facing string. An `undefined` value keeps the default. */
  labels?: Partial<ShareMenuLabels>;
  /** BCP-47 locale for case folding and initials. Default "en". */
  locale?: string;
  /** @deprecated Use `labels.heading`. */
  heading?: string;
  /** @deprecated Use `labels.searchPlaceholder`. */
  searchPlaceholder?: string;
  /** @deprecated Use `labels.empty`. */
  emptyLabel?: string;
  /** When provided, renders a Hide button next to the heading. */
  onClose?: () => void;
  /** @deprecated Use `labels.close`. */
  closeLabel?: string;
  className?: string;
}

function initials(name: string, locale: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toLocaleUpperCase(locale) ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

function ShareMenuInner({
  users,
  onSearch,
  onShareTo,
  labels: labelsProp,
  locale: localeProp = "en",
  heading,
  searchPlaceholder,
  emptyLabel,
  onClose,
  closeLabel,
  className,
}: ShareMenuProps) {
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EngagementLikerProfile[] | null>(
    null,
  );
  const requestSeq = useRef(0);

  const labels = useMemo<ShareMenuLabels>(() => {
    const merged: ShareMenuLabels = {
      ...defaultShareMenuLabels,
      heading: heading ?? defaultShareMenuLabels.heading,
      searchPlaceholder: searchPlaceholder ?? defaultShareMenuLabels.searchPlaceholder,
      empty: emptyLabel ?? defaultShareMenuLabels.empty,
      close: closeLabel ?? defaultShareMenuLabels.close,
    };
    if (labelsProp) {
      for (const key of Object.keys(labelsProp) as (keyof ShareMenuLabels)[]) {
        const value = labelsProp[key];
        if (value !== undefined) merged[key] = value;
      }
    }
    return merged;
  }, [labelsProp, heading, searchPlaceholder, emptyLabel, closeLabel]);

  const visibleUsers = useMemo<EngagementLikerProfile[]>(() => {
    if (searchResults !== null) return searchResults;
    const q = query.trim().toLocaleLowerCase(locale);
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLocaleLowerCase(locale).includes(q) ||
        (u.username ? u.username.toLocaleLowerCase(locale).includes(q) : false),
    );
  }, [searchResults, query, users, locale]);

  const handleQueryChange = async (next: string) => {
    setQuery(next);
    const seq = ++requestSeq.current;
    if (!onSearch || !next.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await onSearch(next);
      if (seq !== requestSeq.current) return;
      setSearchResults(results);
    } catch {
      // Only the latest request may fall back; an older failure is irrelevant.
      if (seq === requestSeq.current) setSearchResults(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{labels.heading}</span>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-xs"
          >
            {labels.close}
          </Button>
        ) : null}
      </div>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => {
            void handleQueryChange(e.target.value);
          }}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchLabel}
          className="h-9 ps-8"
        />
      </div>
      {visibleUsers.length === 0 ? (
        <div
          className="px-3 py-6 text-center text-xs text-muted-foreground"
          role="status"
        >
          {labels.empty}
        </div>
      ) : (
        <ul className="-mx-1 max-h-64 overflow-y-auto" role="list">
          {visibleUsers.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onShareTo(user)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start motion-safe:transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt="" />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {initials(user.name, locale)}
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
          ))}
        </ul>
      )}
    </div>
  );
}

export const ShareMenu = memo(ShareMenuInner);
ShareMenu.displayName = "ShareMenu";
