"use client";

import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react";
import { SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  Blackboard01Labels,
  BlackboardMember,
  HandwritingFont,
  InkColor,
  NoteDraft,
  NoteStyle,
  NoteWidth,
} from "../types";
import { resolveInk } from "../lib/palette";
import { useMentions } from "../hooks/use-mentions";
import { InkColorPicker } from "./ink-color-picker";
import { ChalkWidthPicker } from "./chalk-width-picker";
import { HandwritingFontPicker } from "./handwriting-font-picker";
import { MentionPicker } from "./mention-picker";

export interface NoteComposerProps {
  draft: NoteDraft;
  onChangeText: (text: string) => void;
  onChangeStyle: (patch: Partial<NoteStyle>) => void;
  onPost: () => void;
  palette: InkColor[];
  fonts: HandwritingFont[];
  widths: NoteWidth[];
  members?: BlackboardMember[];
  allowFreeColor?: boolean;
  canWrite?: boolean;
  posting?: boolean;
  /** Focus the textarea on mount (used when revealed by double-click). */
  autoFocus?: boolean;
  /** When provided, renders a dismiss (✕) control and closes on Escape. */
  onClose?: () => void;
  labels?: Partial<Blackboard01Labels>;
  /** Ref to the underlying textarea (so the board can focus it). */
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  renderWriteDenied?: () => ReactNode;
  className?: string;
}

/**
 * The composer — a borderless chalk-line textarea (previewed in the chosen ink +
 * handwriting font), three understated writing pickers, an `@`-mention picker, and
 * Post. Minimal by design: no tray fill, no dividers, just a hairline. Dumb +
 * context-free; the board wires it via `BlackboardComposer`.
 */
export function NoteComposer({
  draft,
  onChangeText,
  onChangeStyle,
  onPost,
  palette,
  fonts,
  widths,
  members = [],
  allowFreeColor = false,
  canWrite = true,
  posting = false,
  autoFocus = false,
  onClose,
  labels,
  textareaRef,
  renderWriteDenied,
  className,
}: NoteComposerProps) {
  const internalRef = textareaRef ?? { current: null };
  const mentions = useMentions({
    textareaRef: internalRef,
    text: draft.text,
    members,
    setText: onChangeText,
  });

  if (!canWrite) {
    return (
      <div className={cn("border-t border-white/10 px-3 py-3 text-sm text-white/50", className)}>
        {renderWriteDenied ? renderWriteDenied() : "You don't have permission to write here."}
      </div>
    );
  }

  const ink = resolveInk(draft.style.color, palette);
  const font = fonts.find((f) => f.key === draft.style.font) ?? fonts[0];
  const previewStyle: CSSProperties = {
    color: ink,
    fontFamily: font ? `var(${font.cssVar})` : "cursive",
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentions.onKeyDown(e)) return; // mention nav consumed it
    if (e.key === "Escape" && onClose) {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onPost();
    }
  };

  const canPost = draft.text.trim().length > 0 && !posting;

  return (
    <div className={cn("relative border-t border-white/10 px-3 pb-2.5 pt-2", className)}>
      {mentions.active && mentions.candidates.length > 0 ? (
        <div className="absolute bottom-full left-3 z-20 mb-1">
          <MentionPicker
            members={mentions.candidates}
            highlight={mentions.highlight}
            onHighlight={mentions.setHighlight}
            onSelect={mentions.choose}
          />
        </div>
      ) : null}

      <Textarea
        ref={internalRef}
        autoFocus={autoFocus}
        value={draft.text}
        onChange={(e) => onChangeText(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={mentions.refresh}
        onClick={mentions.refresh}
        onBlur={() => setTimeout(mentions.close, 100)}
        rows={2}
        placeholder={labels?.composerPlaceholder ?? "Write a note…"}
        aria-label={labels?.composerPlaceholder ?? "Write a note"}
        className="min-h-11 resize-none rounded-none border-0 border-b border-white/10 bg-transparent px-1 text-xl leading-snug placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-0"
        style={previewStyle}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <InkColorPicker
            palette={palette}
            value={draft.style.color}
            onChange={(color) => onChangeStyle({ color })}
            allowFreeColor={allowFreeColor}
            label={labels?.colorLabel}
          />
          <ChalkWidthPicker
            widths={widths}
            value={draft.style.width}
            onChange={(width) => onChangeStyle({ width })}
            label={labels?.widthLabel}
          />
          <HandwritingFontPicker
            fonts={fonts}
            value={draft.style.font}
            onChange={(font) => onChangeStyle({ font })}
            label={labels?.fontLabel}
          />
        </div>

        <div className="flex items-center gap-1">
          {onClose ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={labels?.closeComposer ?? "Close"}
              onClick={onClose}
              className="text-white/55 hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden />
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={onPost}
            disabled={!canPost}
            aria-label={labels?.post ?? "Post"}
          >
            <SendHorizontal aria-hidden />
            {labels?.post ?? "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}
