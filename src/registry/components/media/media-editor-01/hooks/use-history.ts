"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Command {
  do: () => void;
  undo: () => void;
  label?: string;
}

export interface UseHistoryOptions {
  /** Hard cap on undo depth. Oldest entries FIFO-evicted past this. Default 50. */
  capacity?: number;
  /** When true, Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z bind to undo/redo. */
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
  const [, force] = useState(0);
  const tick = useCallback(() => force((n) => (n + 1) | 0), []);

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

  // Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z keyboard shortcuts.
  useEffect(() => {
    if (!bindKeyboard || typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() !== "z") return;
      // Don't hijack while typing in an input/textarea.
      const tgt = e.target as HTMLElement | null;
      if (
        tgt?.tagName === "INPUT" ||
        tgt?.tagName === "TEXTAREA" ||
        tgt?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindKeyboard, undo, redo]);

  return {
    execute,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
  };
}
