"use client";

import { useEffect, useRef } from "react";
import { isEditableTarget } from "../lib/is-editable-target";

export interface UseGlobalKeydownOptions {
  /** Attach only while true. Default `true`. */
  enabled?: boolean;
  /** Listen in the capture phase. Default `false`. */
  capture?: boolean;
}

/**
 * The one way a registry component listens for keys on `window` (consumer contract C9 /
 * R8). The handler is skipped for events typed into an editable target (see
 * `isEditableTarget`), events another handler already `preventDefault`-ed, and IME
 * composition (`isComposing`, or the legacy keyCode 229).
 *
 * `validate-contract` fails any other `window` / `document` keydown listener in shipped
 * files unless it carries `// keydown-ok: <reason>`.
 *
 * Local copy of the canonical `_template/_snippets/use-global-keydown.ts`.
 */
export function useGlobalKeydown(
  handler: (event: KeyboardEvent) => void,
  { enabled = true, capture = false }: UseGlobalKeydownOptions = {},
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      // The real origin: inside an open shadow root `event.target` is retargeted to the host.
      const origin = (typeof event.composedPath === "function" && event.composedPath()[0]) || event.target;
      if (isEditableTarget(origin)) return;
      handlerRef.current(event);
    };
    window.addEventListener("keydown", onKeyDown, capture);
    return () => window.removeEventListener("keydown", onKeyDown, capture);
  }, [enabled, capture]);
}
