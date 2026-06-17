"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";
import { cn } from "@/lib/utils";
import { useBlackboard } from "../hooks/use-blackboard";
import { BlackboardNoteItem } from "./blackboard-note-item";

export interface BlackboardNoteStreamProps {
  className?: string;
}

/**
 * The scrollable note stream. Owns the scroll container (the board's scroll target),
 * the top lazy-load sentinel (wired by the controller's IntersectionObserver), the
 * empty state, mark-as-seen on reaching the bottom, and a dedicated SR live region
 * that announces only genuinely-new (bottom) notes — never lazy-loaded older ones.
 */
export function BlackboardNoteStream({ className }: BlackboardNoteStreamProps) {
  // Destructure context into locals so refs are used only in `ref=` prop form
  // (the react-hooks/refs rule flags ref reads taken off a bundled context object).
  const {
    streamNotes,
    pinnedNotes,
    newestFirst,
    scrollRef,
    sentinelRef,
    loadOlderEnabled,
    hasMoreOlder,
    loadingOlder,
    labels,
    renderEmpty,
    onReachedBottom,
  } = useBlackboard();

  const displayed = useMemo(
    () => (newestFirst ? [...streamNotes].reverse() : streamNotes),
    [streamNotes, newestFirst],
  );

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) onReachedBottom();
    },
    [onReachedBottom],
  );

  // Announce only the newest (chronological) note when it changes — prepended older
  // notes change the *first* element, not the last, so they don't trigger this.
  const newest = streamNotes.length ? streamNotes[streamNotes.length - 1] : null;
  const newestId = newest?.id ?? null;
  const newestPending = newest?.pending ?? false;
  const announceText = newest ? `${newest.author.name}: ${newest.text}` : "";
  const prevNewestId = useRef<string | null>(null);
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    if (newestId && newestId !== prevNewestId.current) {
      if (prevNewestId.current !== null && !newestPending) setAnnounce(announceText);
      prevNewestId.current = newestId;
    }
  }, [newestId, newestPending, announceText]);

  const empty = streamNotes.length === 0 && pinnedNotes.length === 0;
  const showSentinel = loadOlderEnabled && hasMoreOlder;
  const sentinelLabel = loadingOlder ? labels.loadingOlder : labels.loadOlder;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      role="log"
      aria-label="Board notes"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2", className)}
    >
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      {showSentinel && !newestFirst ? (
        <div ref={sentinelRef} className="flex items-center justify-center py-1.5">
          <span className={cn("text-xs text-white/35", loadingOlder && "animate-pulse")}>
            {sentinelLabel}
          </span>
        </div>
      ) : null}

      {empty ? (
        <div
          className="flex h-full min-h-32 items-center justify-center text-center text-2xl text-white/40"
          style={{ fontFamily: "var(--bb-font-caveat)" }}
        >
          {renderEmpty ? renderEmpty() : labels.empty}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {displayed.map((note) => (
            <BlackboardNoteItem key={note.id} note={note} />
          ))}
        </div>
      )}

      {showSentinel && newestFirst ? (
        <div ref={sentinelRef} className="flex items-center justify-center py-1.5">
          <span className={cn("text-xs text-white/35", loadingOlder && "animate-pulse")}>
            {sentinelLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
