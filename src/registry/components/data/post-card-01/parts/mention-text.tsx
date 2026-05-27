"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PostMention } from "../types";

export interface MentionTextProps {
  /** Plain text body (typically `post.content`). */
  content: string;
  /** Mention ranges in UTF-16 code units (end-exclusive). */
  mentions?: PostMention[];
  /** Click handler for highlighted mention spans. When omitted, mentions render as disabled buttons. */
  onMentionClick?: (mentionId: string) => void;
  /** Class for the outer wrapping `<span>`. */
  className?: string;
  /** Class applied to each highlighted mention span. Defaults paired with text-primary + hover underline. */
  mentionClassName?: string;
}

/**
 * Sealed RSC-compatible content renderer that highlights `@mention` spans
 * inside a plain text body. Sub-exported from `post-card-01/index.ts` per
 * Q-EB pattern for host-side opt-in via the `renderContent` slot:
 *
 * ```tsx
 * <PostCard01
 *   post={post}
 *   renderContent={(p) => (
 *     <MentionText
 *       content={p.content}
 *       mentions={p.mentions}
 *       onMentionClick={(id) => router.push(`/users/${id}`)}
 *     />
 *   )}
 * />
 * ```
 *
 * Why opt-in (per F-Plan-7 closure): the default `renderContent` is
 * `<ExpandableText01 content={post.content}>`, which takes `content: string`
 * and can't accept the JSX-span tree this component emits. Hosts wanting
 * inline highlighting trade away the "read more" clamping; this is a
 * deliberate v0.2.0 design choice. v0.3+ may bridge by extending
 * ExpandableText01 to accept ReactNode children.
 *
 * Invalid ranges (negative start, end beyond content length, start ≥ end)
 * are filtered out silently — the corresponding text renders as plain.
 */
export function MentionText({
  content,
  mentions,
  onMentionClick,
  className,
  mentionClassName,
}: MentionTextProps) {
  if (!mentions || mentions.length === 0) {
    return <span className={className}>{content}</span>;
  }
  const sorted = mentions
    .filter(
      (m) =>
        m.range[0] >= 0 &&
        m.range[1] <= content.length &&
        m.range[0] < m.range[1],
    )
    .slice()
    .sort((a, b) => a.range[0] - b.range[0]);

  if (sorted.length === 0) {
    return <span className={className}>{content}</span>;
  }

  const parts: ReactNode[] = [];
  let pos = 0;
  for (let i = 0; i < sorted.length; i++) {
    const mention = sorted[i];
    const [start, end] = mention.range;
    if (start < pos) {
      // Overlapping ranges — skip the overlapping mention to avoid garbled output.
      continue;
    }
    if (start > pos) {
      parts.push(
        <Fragment key={`text-${i}`}>{content.slice(pos, start)}</Fragment>,
      );
    }
    parts.push(
      <button
        key={`mention-${mention.id}-${i}`}
        type="button"
        onClick={
          onMentionClick ? () => onMentionClick(mention.id) : undefined
        }
        disabled={!onMentionClick}
        className={cn(
          "font-medium text-primary",
          onMentionClick &&
            "hover:underline focus:underline focus:outline-none",
          !onMentionClick && "cursor-default",
          mentionClassName,
        )}
      >
        {content.slice(start, end)}
      </button>,
    );
    pos = end;
  }
  if (pos < content.length) {
    parts.push(<Fragment key="text-tail">{content.slice(pos)}</Fragment>);
  }
  return <span className={className}>{parts}</span>;
}

MentionText.displayName = "MentionText";
