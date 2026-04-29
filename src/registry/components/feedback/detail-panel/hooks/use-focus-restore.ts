"use client";

import { useEffect, useRef } from "react";
import type { DetailPanelMode } from "../types";

interface UseFocusRestoreArgs {
  mode: DetailPanelMode;
  rootRef: React.RefObject<HTMLDivElement | null>;
  bodyRef: React.RefObject<HTMLDivElement | null>;
}

const FOCUSABLE =
  'input, textarea, select, button, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function useFocusRestore({
  mode,
  rootRef,
  bodyRef,
}: UseFocusRestoreArgs): {
  captureTrigger: () => void;
} {
  const triggerIdRef = useRef<string | null>(null);
  const lastModeRef = useRef<DetailPanelMode>(mode);

  const captureTrigger = () => {
    if (typeof document === "undefined") return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.id) {
      triggerIdRef.current = active.id;
    } else {
      triggerIdRef.current = null;
    }
  };

  useEffect(() => {
    const previous = lastModeRef.current;
    lastModeRef.current = mode;
    if (previous === mode) return;

    if (mode === "edit") {
      const body = bodyRef.current;
      if (!body) return;
      const focusable = body.querySelector<HTMLElement>(FOCUSABLE);
      (focusable ?? body).focus();
      return;
    }
    if (mode === "read" && previous === "edit") {
      const id = triggerIdRef.current;
      if (id && typeof document !== "undefined") {
        const target = document.getElementById(id);
        if (target instanceof HTMLElement) {
          target.focus();
          triggerIdRef.current = null;
          return;
        }
      }
      const root = rootRef.current;
      root?.focus();
    }
  }, [mode, bodyRef, rootRef]);

  return { captureTrigger };
}
