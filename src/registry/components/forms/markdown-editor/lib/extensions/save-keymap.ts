import type { KeyBinding } from "@codemirror/view";
import type { RefObject } from "react";

// Cmd/Ctrl+S → onSave (description §8.5 #4 + §8.5 #5).
// preventDefault is gated on whether onSave is supplied:
//   - onSaveRef.current set → run returns true; CM6 marks transaction handled and prevents browser default.
//   - onSaveRef.current undefined → run returns false; browser's native save dialog fires (no surprise).
// Payload is the CURRENT CM6 doc, NOT the React `value` prop (avoids stale-by-React-batching).
export function saveKeymap(
  onSaveRef: RefObject<((value: string) => void) | undefined>,
): KeyBinding[] {
  return [
    {
      key: "Mod-s",
      preventDefault: false,
      run: (view) => {
        const onSave = onSaveRef.current;
        if (!onSave) return false;
        onSave(view.state.doc.toString());
        return true;
      },
    },
  ];
}
