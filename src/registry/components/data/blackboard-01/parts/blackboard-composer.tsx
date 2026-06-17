"use client";

import { useBlackboard } from "../hooks/use-blackboard";
import { NoteComposer } from "./note-composer";

export interface BlackboardComposerProps {
  className?: string;
}

/**
 * Context-wired composer. In `double-click` mode it renders only while open (revealed
 * by double-clicking the board), auto-focuses on reveal, and offers a ✕ / Escape to
 * dismiss. In `always` mode it stays docked. Reads draft + writing state from context.
 */
export function BlackboardComposer({ className }: BlackboardComposerProps) {
  const ctx = useBlackboard();
  const doubleClick = ctx.composerMode === "double-click";
  if (doubleClick && !ctx.composerOpen) return null;

  return (
    <NoteComposer
      draft={ctx.draft}
      onChangeText={ctx.setDraftText}
      onChangeStyle={ctx.setDraftStyle}
      onPost={ctx.post}
      palette={ctx.palette}
      fonts={ctx.fonts}
      widths={ctx.widths}
      members={ctx.members}
      allowFreeColor={ctx.allowFreeColor}
      canWrite={ctx.canWrite}
      posting={ctx.posting}
      autoFocus={doubleClick}
      onClose={doubleClick ? ctx.closeComposer : undefined}
      labels={ctx.labels}
      textareaRef={ctx.composerRef}
      renderWriteDenied={ctx.renderWriteDenied}
      className={className}
    />
  );
}
