import { useCallback, useState } from "react";
import type { PredefinedKey } from "../types";

/**
 * Transient UI state: what's currently being edited.
 *
 * Lives outside the reducer so undo/redo (v0.4) won't replay edit-mode
 * focus. Each card / field / block owns its own input state internally
 * via local useState; this hook just flags WHICH thing is in edit mode.
 */

export type EditMode =
  | { kind: "field-value"; cardId: string; key: string }
  | { kind: "field-key"; cardId: string; key: string }
  | { kind: "card-title"; cardId: string }
  | { kind: "predefined"; cardId: string; key: PredefinedKey }
  | { kind: "field-add"; cardId: string }
  | { kind: "predefined-add"; cardId: string };

export function useEditMode() {
  const [mode, setMode] = useState<EditMode | null>(null);

  const clear = useCallback(() => setMode(null), []);

  const isEditing = useCallback(
    (target: EditMode): boolean => {
      if (!mode) return false;
      if (mode.kind !== target.kind) return false;
      if (mode.cardId !== target.cardId) return false;
      if ("key" in mode && "key" in target && mode.key !== target.key)
        return false;
      return true;
    },
    [mode],
  );

  return { mode, setMode, clear, isEditing };
}
