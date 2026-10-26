import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

export type InlinePanel = "none" | "likes" | "comments" | "share";

/**
 * Focus for the inline panels. The control that opened a panel gets focus back when the panel
 * closes while focus was inside it (or had fallen to <body>); if that control is gone, the card's
 * `<article>` (a `tabIndex=-1` target) does. Closing from elsewhere never moves focus.
 */
export function usePanelFocus(active: InlinePanel, setActive: Dispatch<SetStateAction<InlinePanel>>) {
  const panelEl = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const restore = useRef<{ fallback: HTMLElement | null } | null>(null);
  const current = useRef(active);
  useEffect(() => {
    current.current = active;
  });

  const open = useCallback(
    (next: Exclude<InlinePanel, "none">) => {
      const el = document.activeElement;
      opener.current = el instanceof HTMLElement && el !== document.body ? el : null;
      setActive(next);
    },
    [setActive],
  );
  const close = useCallback(() => {
    const el = document.activeElement;
    const panel = panelEl.current;
    if (panel && (panel.contains(el) || el === document.body || el === null)) {
      restore.current = { fallback: panel.closest<HTMLElement>("article") };
    }
    setActive("none");
  }, [setActive]);
  const toggle = useCallback(
    (kind: Exclude<InlinePanel, "none">) => {
      if (current.current === kind) close();
      else open(kind);
    },
    [open, close],
  );
  useEffect(() => {
    const pending = restore.current;
    if (!pending || active !== "none") return;
    restore.current = null;
    const from = opener.current;
    (from && from.isConnected ? from : pending.fallback)?.focus();
  }, [active]);

  /** Ref callback for the element that wraps the open panel. */
  const panelRef = useCallback((el: HTMLDivElement | null) => {
    panelEl.current = el;
  }, []);

  return { open, close, toggle, panelRef };
}
