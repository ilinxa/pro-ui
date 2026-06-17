import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import type { BlackboardMember } from "../types";
import {
  detectActiveMention,
  filterMembers,
  insertMention,
  type ActiveMention,
} from "../lib/mentions";

interface UseMentionsOpts {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  members: BlackboardMember[];
  setText: (text: string) => void;
}

interface UseMentionsApi {
  active: ActiveMention | null;
  candidates: BlackboardMember[];
  highlight: number;
  setHighlight: (i: number) => void;
  /** Recompute the active mention from the caret (call on input / click / keyup). */
  refresh: () => void;
  choose: (member: BlackboardMember) => void;
  close: () => void;
  /** Returns true if the keydown was consumed (open + nav keys). */
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => boolean;
}

/**
 * Wires `@`-mention detection to a controlled textarea. The picker is anchored to
 * the composer (NOT a Popover primitive / PopoverAnchor — Base UI lacks it, per
 * F-cross-13). Keyboard: ↑/↓ to move, Enter/Tab to choose, Esc to dismiss.
 */
export function useMentions({
  textareaRef,
  text,
  members,
  setText,
}: UseMentionsOpts): UseMentionsApi {
  const [active, setActive] = useState<ActiveMention | null>(null);
  const [highlight, setHighlight] = useState(0);
  const pendingCaret = useRef<number | null>(null);

  const enabled = members.length > 0;

  const candidates = useMemo(
    () => (active && enabled ? filterMembers(members, active.query) : []),
    [active, enabled, members],
  );

  const close = useCallback(() => setActive(null), []);

  const refresh = useCallback(() => {
    if (!enabled) return;
    const el = textareaRef.current;
    if (!el) return;
    const next = detectActiveMention(el.value, el.selectionStart ?? el.value.length);
    setActive(next);
    setHighlight(0);
  }, [enabled, textareaRef]);

  const choose = useCallback(
    (member: BlackboardMember) => {
      if (!active) return;
      const { text: nextText, caret } = insertMention(text, active, member);
      pendingCaret.current = caret;
      setText(nextText);
      setActive(null);
    },
    [active, text, setText],
  );

  // Restore the caret after a controlled-value insert lands in the DOM.
  useEffect(() => {
    if (pendingCaret.current == null) return;
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  }, [text, textareaRef]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!active || candidates.length === 0) return false;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % candidates.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + candidates.length) % candidates.length);
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choose(candidates[highlight]);
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return true;
      }
      return false;
    },
    [active, candidates, highlight, choose, close],
  );

  return { active, candidates, highlight, setHighlight, refresh, choose, close, onKeyDown };
}
