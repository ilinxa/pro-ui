"use client";

import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBlackboard } from "../hooks/use-blackboard";
import { BlackboardNoteItem } from "./blackboard-note-item";

export interface BlackboardPinnedRowProps {
  className?: string;
}

/** Sticky pinned-notes band above the stream. Reads context; renders nothing when empty. */
export function BlackboardPinnedRow({ className }: BlackboardPinnedRowProps) {
  const ctx = useBlackboard();
  if (ctx.pinnedNotes.length === 0) return null;
  return (
    <div className={cn("shrink-0 border-b border-white/10 bg-white/3 px-2 py-1.5", className)}>
      <div className="mb-1 flex items-center gap-1 px-1 text-[0.7rem] font-medium uppercase tracking-wide text-white/40">
        <Pin className="size-3" aria-hidden />
        {ctx.labels.pinnedHeading}
      </div>
      <div className="flex flex-col gap-0.5">
        {ctx.pinnedNotes.map((note) => (
          <BlackboardNoteItem key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
