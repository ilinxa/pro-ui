import type { CSSProperties, ReactNode } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import type { BlackboardNote, HandwritingFont, InkColor } from "../types";
import { resolveInk, strokeForWidth, weightForWidth } from "../lib/palette";
import { MentionText } from "./mention-text";

export interface HandwrittenNoteProps {
  note: BlackboardNote;
  palette: InkColor[];
  fonts: HandwritingFont[];
  /** Show the faint inline author label on hover/focus. */
  showAuthor?: boolean;
  /** Emphasise a note that @mentions the viewer. */
  isMentioned?: boolean;
  mentionYouLabel?: string;
  /** Affordance slot (pin / delete buttons), rendered top-right on hover. */
  actions?: ReactNode;
  className?: string;
}

/**
 * A single chalk-written note — pure, context-free. Renders the text in the
 * author's ink color, chalk width, and handwriting font, with a soft chalk-dust
 * shadow and a faint inline author label that fades in on hover/focus.
 */
export function HandwrittenNote({
  note,
  palette,
  fonts,
  showAuthor = true,
  isMentioned = false,
  mentionYouLabel = "@you",
  actions,
  className,
}: HandwrittenNoteProps) {
  const ink = resolveInk(note.style.color, palette);
  const font = fonts.find((f) => f.key === note.style.font) ?? fonts[0];
  const hasWeights = font?.hasWeights ?? false;
  const stroke = hasWeights ? 0 : strokeForWidth(note.style.width);

  const inkStyle: CSSProperties = {
    color: ink,
    fontFamily: font ? `var(${font.cssVar})` : "cursive",
    fontWeight: hasWeights ? weightForWidth(note.style.width) : 400,
    WebkitTextStrokeWidth: stroke > 0 ? `${stroke}px` : undefined,
    WebkitTextStrokeColor: stroke > 0 ? ink : undefined,
    textShadow: "0 0.5px 0.6px rgba(255,255,255,0.07)",
  };

  const time = (() => {
    try {
      return formatDistanceToNowStrict(new Date(note.createdAt), { addSuffix: false });
    } catch {
      return "";
    }
  })();

  return (
    <div
      className={cn(
        "group/note relative flex flex-col gap-0.5 rounded-md px-2 py-1.5 transition-colors",
        "focus-within:bg-white/5 hover:bg-white/5",
        note.pending && "opacity-60",
        className,
      )}
      tabIndex={0}
      data-pending={note.pending ? "" : undefined}
      data-failed={note.failed ? "" : undefined}
    >
      {actions ? (
        <div className="absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-md bg-black/30 p-0.5 opacity-0 backdrop-blur-sm transition-opacity group-focus-within/note:opacity-100 group-hover/note:opacity-100">
          {actions}
        </div>
      ) : null}

      <p
        className="text-[1.35rem] leading-snug wrap-break-word text-pretty"
        style={inkStyle}
      >
        <MentionText
          text={note.text}
          mentions={note.mentions}
          mentionClassName="opacity-90"
        />
      </p>

      <div className="flex min-h-3.5 items-center gap-1.5 text-[0.7rem] text-white/35">
        {isMentioned ? (
          <span
            className="rounded-full px-1 font-medium"
            style={{ color: "oklch(0.66 0.19 22)", fontFamily: font ? `var(${font.cssVar})` : "cursive" }}
          >
            {mentionYouLabel}
          </span>
        ) : null}
        {showAuthor ? (
          <span
            className="inline-flex items-center gap-1 opacity-0 transition-opacity duration-200 group-focus-within/note:opacity-100 group-hover/note:opacity-100"
            title={`${note.author.name} · ${new Date(note.createdAt).toLocaleString()}`}
            suppressHydrationWarning
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ backgroundColor: note.author.inkColor ?? ink }}
              aria-hidden
            />
            <span className="font-medium text-white/55">{note.author.name}</span>
            {time ? <span aria-hidden>· {time}</span> : null}
          </span>
        ) : null}
        {note.failed ? <span className="text-[oklch(0.66_0.19_22)]">· failed</span> : null}
      </div>
    </div>
  );
}
