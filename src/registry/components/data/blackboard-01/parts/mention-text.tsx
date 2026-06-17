import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Mention } from "../types";

export interface MentionTextProps {
  text: string;
  mentions?: Mention[];
  className?: string;
  /** Extra classes for the mention tokens. */
  mentionClassName?: string;
}

/**
 * Renders note text with `@mention` tokens styled. Pure + context-free.
 * Offset-anchored (uses `mention.start`/`length`), tolerant of overlaps and
 * out-of-range offsets.
 */
export function MentionText({ text, mentions, className, mentionClassName }: MentionTextProps) {
  if (!mentions || mentions.length === 0) {
    return <span className={className}>{text}</span>;
  }
  const sorted = [...mentions].sort((a, b) => a.start - b.start);
  const out: ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((m, i) => {
    if (m.start < cursor || m.start > text.length) return; // overlap / out-of-range guard
    if (m.start > cursor) out.push(<span key={`t${i}`}>{text.slice(cursor, m.start)}</span>);
    const end = Math.min(m.start + m.length, text.length);
    out.push(
      <span
        key={`m${i}`}
        data-mention=""
        className={cn("font-semibold underline decoration-dotted underline-offset-2", mentionClassName)}
      >
        {text.slice(m.start, end)}
      </span>,
    );
    cursor = end;
  });
  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
  return <span className={className}>{out}</span>;
}
