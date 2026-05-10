"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Discriminator for clipboard semantics. `'cut'` items are visually marked
 * (50% opacity) and removed from their source on paste. `'copy'` items are
 * left in place; pasting clones them. `null` = clipboard is empty.
 */
export type FileClipboardKind = "cut" | "copy";

export interface FileClipboard {
  kind: FileClipboardKind | null;
  ids: string[];
}

export const EMPTY_CLIPBOARD: FileClipboard = { kind: null, ids: [] };

interface FileClipboardContextValue {
  clipboard: FileClipboard;
  setClipboard: (next: FileClipboard) => void;
  cut: (ids: string[]) => void;
  copy: (ids: string[]) => void;
  clearClipboard: () => void;
  /** Sentinel — `true` when wrapped in `<FileClipboardProvider>`. */
  __hasProvider: boolean;
}

const DEFAULT_CONTEXT: FileClipboardContextValue = {
  clipboard: EMPTY_CLIPBOARD,
  setClipboard: () => {
    /* no-op default */
  },
  cut: () => {
    /* no-op default */
  },
  copy: () => {
    /* no-op default */
  },
  clearClipboard: () => {
    /* no-op default */
  },
  __hasProvider: false,
};

const FileClipboardContext =
  createContext<FileClipboardContextValue>(DEFAULT_CONTEXT);

export interface FileClipboardProviderProps {
  children: ReactNode;
  /** Optional initial clipboard state. */
  initialClipboard?: FileClipboard;
}

/**
 * Wrap multiple `<FileManager>` / `<FileTree>` instances under this provider
 * to sync their cut / copy / paste state. A user copying in one component
 * pastes in another. Without the provider, each component keeps its own
 * internal clipboard.
 */
export function FileClipboardProvider(props: FileClipboardProviderProps) {
  const { children, initialClipboard = EMPTY_CLIPBOARD } = props;
  const [clipboard, setClipboardRaw] =
    useState<FileClipboard>(initialClipboard);

  const setClipboard = useCallback((next: FileClipboard) => {
    setClipboardRaw(next);
  }, []);

  const cut = useCallback((ids: string[]) => {
    setClipboardRaw({ kind: "cut", ids });
  }, []);

  const copy = useCallback((ids: string[]) => {
    setClipboardRaw({ kind: "copy", ids });
  }, []);

  const clearClipboard = useCallback(() => {
    setClipboardRaw(EMPTY_CLIPBOARD);
  }, []);

  const value = useMemo<FileClipboardContextValue>(
    () => ({
      clipboard,
      setClipboard,
      cut,
      copy,
      clearClipboard,
      __hasProvider: true,
    }),
    [clipboard, setClipboard, cut, copy, clearClipboard],
  );

  return (
    <FileClipboardContext.Provider value={value}>
      {children}
    </FileClipboardContext.Provider>
  );
}

/**
 * Read / write the shared clipboard. Always returns a usable object;
 * `__hasProvider === false` indicates the consumer is not wrapped, in which
 * case writes are no-ops. Components that internalize a fallback clipboard
 * (e.g., `<FileManager>` without a provider AND without controlled
 * `clipboard` props) use `__hasProvider` to detect this case.
 */
export function useFileClipboard(): FileClipboardContextValue {
  return useContext(FileClipboardContext);
}
