"use client";

import { Pin, PinOff, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBlackboard } from "../hooks/use-blackboard";
import { HandwrittenNote } from "./handwritten-note";
import type { BlackboardNote } from "../types";

export interface BlackboardNoteItemProps {
  note: BlackboardNote;
  className?: string;
}

/**
 * One note + its capability-gated affordances (retry / pin / delete). Reads context;
 * wraps the dumb `HandwrittenNote`. Affordances appear on hover/focus only.
 */
export function BlackboardNoteItem({ note, className }: BlackboardNoteItemProps) {
  const ctx = useBlackboard();
  const pinned = ctx.isPinned(note.id);

  const actions = (
    <>
      {note.failed ? (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={ctx.labels.retry}
          title={ctx.labels.retry}
          onClick={() => ctx.retryPost(note.id)}
          className="text-white/75 hover:bg-white/15 hover:text-white"
        >
          <RotateCcw aria-hidden />
        </Button>
      ) : null}
      {ctx.canPin && !note.pending && !note.failed ? (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={pinned ? ctx.labels.unpin : ctx.labels.pin}
          title={pinned ? ctx.labels.unpin : ctx.labels.pin}
          onClick={() => ctx.togglePin(note)}
          className="text-white/75 hover:bg-white/15 hover:text-white"
        >
          {pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
        </Button>
      ) : null}
      {ctx.canDelete || note.failed ? (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={ctx.labels.delete}
          title={ctx.labels.delete}
          onClick={() => ctx.deleteNote(note)}
          className="text-white/65 hover:bg-white/15 hover:text-white"
        >
          <Trash2 aria-hidden />
        </Button>
      ) : null}
    </>
  );

  const hasActions = !!(note.failed || (ctx.canPin && !note.pending) || ctx.canDelete);

  return (
    <HandwrittenNote
      note={note}
      palette={ctx.palette}
      fonts={ctx.fonts}
      showAuthor={ctx.showAuthorOnHover}
      isMentioned={ctx.mentionsCurrentUser(note)}
      mentionYouLabel={ctx.labels.mentionYou}
      actions={hasActions ? actions : undefined}
      className={className}
    />
  );
}
