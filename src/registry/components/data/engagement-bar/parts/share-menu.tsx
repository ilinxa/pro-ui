"use client";

import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EngagementBarSize, EngagementLikerProfile } from "../types";
import { resolveLocale } from "../lib/format-count";

/** Every user-facing string of `ShareMenu`. Override per key via `labels`. */
export interface ShareMenuLabels {
  heading: string;
  searchPlaceholder: string;
  /** Accessible name of the search input. */
  searchLabel: string;
  empty: string;
  close: string;
  /** 0.8.0. Row state text while a share is in flight (`pendingIds`). Default "Sending…". */
  sending?: string;
  /** 0.8.0. Row state text for someone already shared with (`sentIds`). Default "Sent". */
  sent?: string;
  /** 0.8.0. Polite announcement when a person is added to `sentIds`. Default `` `Sent to ${name}` ``. */
  sentTo?: (name: string) => string;
}

export const defaultShareMenuLabels: Required<ShareMenuLabels> = {
  heading: "Share with…",
  searchPlaceholder: "Search people…",
  searchLabel: "Search people",
  empty: "No matches.",
  close: "Hide",
  sending: "Sending…",
  sent: "Sent",
  sentTo: (name) => `Sent to ${name}`,
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
  /** 0.8.0. Rendered above the search (e.g. "Copy link" / the system share sheet — share-bar's targets). */
  header?: ReactNode;
  /** 0.8.0. People whose share is in flight: the row shows a spinner and `labels.sending`, and is `aria-disabled` (a press does not call `onShareTo`). */
  pendingIds?: readonly string[];
  /** 0.8.0. People already shared with: the row shows a check and `labels.sent`, is `aria-disabled`, and a polite status announces `labels.sentTo(name)` once when an id is added. */
  sentIds?: readonly string[];
  /** 0.8.0. `"touch"`: the Hide button, the search input and each row are at least 44 px tall. Default `"default"`. */
  size?: EngagementBarSize;
}

function initials(name: string, locale: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      // The first code point, not the first UTF-16 unit (an emoji or supplementary letter).
      .map((p) => Array.from(p)[0]?.toLocaleUpperCase(locale) ?? "")
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
  header,
  pendingIds,
  sentIds,
  size = "default",
}: ShareMenuProps) {
  const touch = size === "touch";
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EngagementLikerProfile[] | null>(
    null,
  );
  const requestSeq = useRef(0);

  const labels = useMemo<Required<ShareMenuLabels>>(() => {
    const merged: Required<ShareMenuLabels> = {
      ...defaultShareMenuLabels,
      heading: heading ?? defaultShareMenuLabels.heading,
      searchPlaceholder: searchPlaceholder ?? defaultShareMenuLabels.searchPlaceholder,
      empty: emptyLabel ?? defaultShareMenuLabels.empty,
      close: closeLabel ?? defaultShareMenuLabels.close,
    };
    if (labelsProp) {
      for (const key of Object.keys(labelsProp) as (keyof ShareMenuLabels)[]) {
        const value = labelsProp[key];
        if (value !== undefined) (merged as unknown as Record<string, unknown>)[key] = value;
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

  const pendingSet = useMemo(() => new Set(pendingIds ?? []), [pendingIds]);
  const sentSet = useMemo(() => new Set(sentIds ?? []), [sentIds]);

  // Every profile seen so far, so a sent id can be named even after a search replaced the list.
  const known = useRef(new Map<string, EngagementLikerProfile>());
  useEffect(() => {
    for (const u of users) known.current.set(u.id, u);
    if (searchResults) for (const u of searchResults) known.current.set(u.id, u);
  }, [users, searchResults]);

  // Announce only ids ADDED after mount; the live region itself exists from mount.
  const announcedRef = useRef<Set<string>>(new Set(sentIds ?? []));
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const current = new Set(sentIds ?? []);
    const added = [...current].filter((id) => !announcedRef.current.has(id));
    // Only ids still sent count as announced, so an id removed and sent again is announced again.
    announcedRef.current = current;
    if (added.length === 0) return;
    // A person the menu never listed has no name to read: say "Sent", never the id.
    setAnnouncement(
      added
        .map((id) => {
          const name = known.current.get(id)?.name.trim();
          return name ? labels.sentTo(name) : labels.sent;
        })
        .join(". "),
    );
  }, [sentIds, labels]);

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
      {/* A live region without role="status": the empty state below already is one. */}
      <div aria-live="polite" aria-atomic="true" data-share-announcer="" className="sr-only">
        {announcement}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{labels.heading}</span>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn("h-7 px-2 text-xs", touch && "h-11 min-h-11 min-w-11")}
          >
            {labels.close}
          </Button>
        ) : null}
      </div>
      {header}
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
          className={cn("h-9 ps-8", touch && "h-11 min-h-11")}
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
          {visibleUsers.map((user) => {
            const pending = pendingSet.has(user.id);
            const sent = !pending && sentSet.has(user.id);
            const disabled = pending || sent;
            return (
              <li key={user.id}>
                <button
                  type="button"
                  // aria-disabled, not disabled: a focused row that turns disabled would drop focus to <body>.
                  aria-disabled={disabled ? "true" : undefined}
                  onClick={() => {
                    if (disabled) return;
                    onShareTo(user);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start motion-safe:transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    touch && "min-h-11",
                    disabled && "cursor-default opacity-70 hover:bg-transparent",
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                    <AvatarFallback className="text-[10px]">
                      {initials(user.name, locale)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      <bdi>{user.name}</bdi>
                    </div>
                    {user.username ? (
                      <div className="truncate text-xs text-muted-foreground">
                        <bdi dir="ltr">@{user.username}</bdi>
                      </div>
                    ) : null}
                  </div>
                  {pending || sent ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {pending ? labels.sending : labels.sent}
                    </span>
                  ) : null}
                  {pending ? (
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted-foreground motion-safe:animate-spin"
                    />
                  ) : sent ? (
                    <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Send aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const ShareMenu = memo(ShareMenuInner);
ShareMenu.displayName = "ShareMenu";
