"use client";

import { useCallback, useState } from "react";
import {
  EMPTY_CLIPBOARD,
  useFileClipboard,
  type FileClipboard,
} from "../../_shared/file-clipboard";
import type { FileManagerClipboardChangeArgs } from "../types";

interface UseClipboardArgs {
  /** Controlled clipboard (consumer manages state). */
  controlledClipboard?: FileClipboard;
  /** Initial value for uncontrolled mode. */
  defaultClipboard?: FileClipboard;
  onClipboardChange?: (args: FileManagerClipboardChangeArgs) => void;
}

export interface UseClipboardResult {
  clipboard: FileClipboard;
  cut: (ids: string[]) => void;
  copy: (ids: string[]) => void;
  clearClipboard: () => void;
  setClipboard: (next: FileClipboard) => void;
}

/**
 * Resolves clipboard state across three modes:
 *  1. Controlled (`controlledClipboard` prop given) — consumer drives.
 *  2. Provider (`<FileClipboardProvider>` up the tree) — synced across
 *     instances inside the provider.
 *  3. Internal — local `useState`.
 *
 * Mode is decided in priority order: controlled > provider > internal.
 */
export function useClipboard(args: UseClipboardArgs): UseClipboardResult {
  const { controlledClipboard, defaultClipboard, onClipboardChange } = args;

  const provider = useFileClipboard();
  const hasProvider = provider.__hasProvider;

  const [internalClipboard, setInternalClipboard] = useState<FileClipboard>(
    () => defaultClipboard ?? EMPTY_CLIPBOARD,
  );

  // Resolve current clipboard
  let clipboard: FileClipboard;
  if (controlledClipboard) {
    clipboard = controlledClipboard;
  } else if (hasProvider) {
    clipboard = provider.clipboard;
  } else {
    clipboard = internalClipboard;
  }

  const setClipboard = useCallback(
    (next: FileClipboard) => {
      if (!controlledClipboard) {
        if (hasProvider) provider.setClipboard(next);
        else setInternalClipboard(next);
      }
      onClipboardChange?.({ clipboard: next });
    },
    [controlledClipboard, hasProvider, provider, onClipboardChange],
  );

  const cut = useCallback(
    (ids: string[]) => {
      setClipboard({ kind: "cut", ids });
    },
    [setClipboard],
  );

  const copy = useCallback(
    (ids: string[]) => {
      setClipboard({ kind: "copy", ids });
    },
    [setClipboard],
  );

  const clearClipboard = useCallback(() => {
    setClipboard(EMPTY_CLIPBOARD);
  }, [setClipboard]);

  return {
    clipboard,
    cut,
    copy,
    clearClipboard,
    setClipboard,
  };
}
