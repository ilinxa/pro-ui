import { useCallback, useEffect, useRef, useState } from "react";
import type { DetailPanelMode } from "../types";

interface UseModeArgs {
  controlledMode: DetailPanelMode | undefined;
  onModeChange: ((mode: DetailPanelMode) => void) | undefined;
  selectionKey: string;
}

interface UseModeResult {
  mode: DetailPanelMode;
  setMode: (next: DetailPanelMode) => void;
  isLocked: boolean;
}

interface ModeSnapshot {
  mode: DetailPanelMode;
  key: string;
}

export function useDetailPanelMode({
  controlledMode,
  onModeChange,
  selectionKey,
}: UseModeArgs): UseModeResult {
  const isControlled = controlledMode !== undefined;
  const isLocked = isControlled && !onModeChange;

  // Uncontrolled-only state. Derived `mode` returns "read" when the snapshot's
  // key doesn't match the current selectionKey — this is how the auto-reset
  // contract is honored without a setState-in-effect.
  const [snapshot, setSnapshot] = useState<ModeSnapshot>({
    mode: "read",
    key: selectionKey,
  });

  const warnedLockedMountRef = useRef(false);
  useEffect(() => {
    if (!isLocked) return;
    if (warnedLockedMountRef.current) return;
    warnedLockedMountRef.current = true;
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[detail-panel] `mode` is supplied without `onModeChange`. " +
          "The panel cannot honor the auto-reset contract for selection changes. " +
          "Pass `onModeChange` to enable the controlled configuration, or omit `mode` to use uncontrolled.",
      );
    }
  }, [isLocked]);

  // Controlled-mode auto-reset: notify host of the mode change to "read" on
  // selection change (host owns state — this is a callback, not a setState).
  const lastReportedKeyRef = useRef(selectionKey);
  useEffect(() => {
    if (!isControlled || isLocked) return;
    if (lastReportedKeyRef.current === selectionKey) return;
    lastReportedKeyRef.current = selectionKey;
    if (controlledMode !== "read" && onModeChange) {
      onModeChange("read");
    }
  }, [selectionKey, isControlled, isLocked, controlledMode, onModeChange]);

  const lastWarnedLockedKeyRef = useRef(selectionKey);
  useEffect(() => {
    if (!isLocked) return;
    if (lastWarnedLockedKeyRef.current === selectionKey) return;
    lastWarnedLockedKeyRef.current = selectionKey;
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[detail-panel] selection changed but the panel is in locked mode " +
          "(no `onModeChange`); auto-reset to `\"read\"` cannot fire.",
      );
    }
  }, [selectionKey, isLocked]);

  const setMode = useCallback(
    (next: DetailPanelMode) => {
      if (isLocked) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[detail-panel] setMode called in locked mode; pass `onModeChange` to enable mode toggling.",
          );
        }
        return;
      }
      if (isControlled) {
        onModeChange?.(next);
        return;
      }
      // Snapshot the current selectionKey alongside the mode so the
      // derived-mode logic resets cleanly on subsequent selection changes.
      setSnapshot({ mode: next, key: selectionKey });
    },
    [isLocked, isControlled, onModeChange, selectionKey],
  );

  let mode: DetailPanelMode;
  if (isControlled) {
    mode = controlledMode as DetailPanelMode;
  } else if (snapshot.key === selectionKey) {
    mode = snapshot.mode;
  } else {
    mode = "read";
  }

  return { mode, setMode, isLocked };
}
