"use client";
import { useCallback, useRef, useState } from "react";

interface UseCopyToClipboardResult {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  failed: boolean;
}

/**
 * Clipboard write with legacy `document.execCommand('copy')` fallback for
 * browsers without the async Clipboard API. Returns transient `copied` /
 * `failed` flags that auto-clear after `revertMs` for icon-swap UX.
 */
export function useCopyToClipboard(revertMs = 1500): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
      timeoutRef.current = null;
    }, revertMs);
  }, [revertMs]);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      let ok = false;
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!ok && typeof document !== "undefined") {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          ta.setAttribute("readonly", "");
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch {
          ok = false;
        }
      }
      if (ok) {
        setCopied(true);
        setFailed(false);
      } else {
        setCopied(false);
        setFailed(true);
      }
      reset();
      return ok;
    },
    [reset],
  );

  return { copy, copied, failed };
}
