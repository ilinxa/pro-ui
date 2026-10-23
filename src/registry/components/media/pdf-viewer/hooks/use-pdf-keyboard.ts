"use client";

import type { PdfActions, PdfStatus } from "../types";
import { useGlobalKeydown } from "./use-global-keydown";

interface UsePdfKeyboardArgs {
  containerRef: { current: HTMLElement | null };
  rootRef: { current: HTMLElement | null };
  actions: PdfActions;
  status: PdfStatus;
  allowDownload: boolean;
  allowPrint: boolean;
}

/**
 * Wires keyboard shortcuts on the viewer root: PgUp/PgDn for page nav,
 * Cmd/Ctrl ± for zoom, Cmd/Ctrl + 0 for reset, Cmd/Ctrl + P for print,
 * Cmd/Ctrl + S for download. One window listener (`useGlobalKeydown`) that acts only
 * when the event comes from inside the viewer's root.
 */
export function usePdfKeyboard(args: UsePdfKeyboardArgs): void {
  const { rootRef, actions, status, allowDownload, allowPrint } = args;

  // useGlobalKeydown already skips typing targets (the page-number input, any select or
  // contentEditable), IME composition and already-handled events.
  useGlobalKeydown(
    (e) => {
      const root = rootRef.current;
      if (!root) return;
      const target = e.target as Node | null;
      if (target && !(root === target || root.contains(target))) return;

      const meta = e.ctrlKey || e.metaKey;

      if (meta && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        actions.zoomIn();
        return;
      }
      if (meta && e.key === "-") {
        e.preventDefault();
        actions.zoomOut();
        return;
      }
      if (meta && e.key === "0") {
        e.preventDefault();
        actions.resetZoom();
        return;
      }
      if (meta && (e.key === "p" || e.key === "P")) {
        if (!allowPrint) return;
        e.preventDefault();
        actions.print();
        return;
      }
      if (meta && (e.key === "s" || e.key === "S")) {
        if (!allowDownload) return;
        e.preventDefault();
        actions.download();
        return;
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        actions.goToNextPage();
        return;
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        actions.goToPrevPage();
        return;
      }
      if (e.key === "Home" && !meta) {
        // bare Home — scroll to first page
        if (target instanceof HTMLElement && target.tagName === "INPUT") return;
        e.preventDefault();
        actions.goToPage(1);
        return;
      }
      if (e.key === "End" && !meta) {
        if (target instanceof HTMLElement && target.tagName === "INPUT") return;
        e.preventDefault();
        actions.goToPage(Number.MAX_SAFE_INTEGER);
        return;
      }
    },
    { enabled: status === "ready" },
  );
}
