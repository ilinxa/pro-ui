"use client";

import { useCallback, useRef, useState } from "react";
import { useGlobalKeydown } from "./use-global-keydown";

export interface Command {
  do: () => void;
  undo: () => void;
  label?: string;
}

export interface UseHistoryOptions {
  /** Hard cap on undo depth. Oldest entries FIFO-evicted past this. Default 50. */
  capacity?: number;
  /** When true, Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y redo. The key is claimed (preventDefault) only when there is something to undo / redo. */
  bindKeyboard?: boolean;
}

export interface UseHistoryResult {
  /** Run a command + push it onto the undo stack. Clears redo stack. */
  execute: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Drops both stacks (e.g., when the draft is replaced). */
  reset: () => void;
}

/**
 * Generic undo/redo command stack.
 *
 * Each command's `do()` is run on execute() and again on redo(); `undo()` is
 * run on undo. The hook does NOT mediate state — callers wrap their state
 * mutations into Command pairs.
 *
 * Drawing strokes record one command per completed stroke (not per pointer
 * frame). Text/sticker add/delete/move/transform record one command per
 * terminal action.
 */
export function useHistory(
  options: UseHistoryOptions = {},
): UseHistoryResult {
  const { capacity = 50, bindKeyboard = true } = options;
  const pastRef = useRef<Command[]>([]);
  const futureRef = useRef<Command[]>([]);
  // Stack-depth flags mirrored into state by `tick()` after every mutation
  // (execute / undo / redo / reset all end with tick()), so render reads
  // state — never the refs — while the fresh object identity still forces a
  // re-render exactly like the old force-counter did.
  const [stackFlags, setStackFlags] = useState({
    canUndo: false,
    canRedo: false,
  });
  const tick = useCallback(() => {
    setStackFlags({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    });
  }, []);

  const execute = useCallback(
    (cmd: Command) => {
      cmd.do();
      pastRef.current.push(cmd);
      if (pastRef.current.length > capacity) {
        pastRef.current.shift();
      }
      futureRef.current = [];
      tick();
    },
    [capacity, tick],
  );

  const undo = useCallback(() => {
    const cmd = pastRef.current.pop();
    if (!cmd) return;
    cmd.undo();
    futureRef.current.push(cmd);
    tick();
  }, [tick]);

  const redo = useCallback(() => {
    const cmd = futureRef.current.pop();
    if (!cmd) return;
    cmd.do();
    pastRef.current.push(cmd);
    tick();
  }, [tick]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    tick();
  }, [tick]);

  // Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z keyboard shortcuts. useGlobalKeydown leaves typing
  // targets (text inputs, textarea, select, contentEditable, textbox roles), IME
  // composition and already-handled events alone — their own undo stays native.
  useGlobalKeydown(
    (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      // Ctrl/Cmd+Z = undo, Shift+Ctrl/Cmd+Z and Ctrl/Cmd+Y = redo.
      const isRedo = (key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey);
      const isUndo = key === "z" && !e.shiftKey;
      if (!isRedo && !isUndo) return;
      // Claim the key only when there is something to undo / redo. With an
      // empty stack the event is left alone, so the browser's own undo (page
      // form fields, contentEditable outside the editor) keeps working.
      if (isRedo) {
        if (futureRef.current.length === 0) return;
        e.preventDefault();
        redo();
      } else {
        if (pastRef.current.length === 0) return;
        e.preventDefault();
        undo();
      }
    },
    { enabled: bindKeyboard },
  );

  return {
    execute,
    undo,
    redo,
    canUndo: stackFlags.canUndo,
    canRedo: stackFlags.canRedo,
    reset,
  };
}
