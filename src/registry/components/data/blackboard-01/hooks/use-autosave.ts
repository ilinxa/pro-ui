import { useEffect, useRef } from "react";
import type { NoteDraft } from "../types";

/**
 * Debounced draft autosave. Fires `onDraftChange` `delayMs` after the draft stops
 * changing — "auto-save" = no data loss + no mandatory Save click, NOT a per-keystroke
 * post. Skips the very first run (mount) so an empty initial draft doesn't fire.
 */
export function useAutosave(
  draft: NoteDraft,
  onDraftChange: ((draft: NoteDraft) => void) | undefined,
  delayMs: number,
): void {
  const cbRef = useRef(onDraftChange);
  useEffect(() => {
    cbRef.current = onDraftChange;
  });

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!cbRef.current) return;
    const id = setTimeout(() => cbRef.current?.(draft), delayMs);
    return () => clearTimeout(id);
  }, [draft, delayMs]);
}
