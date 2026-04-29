import { EMPTY_SELECTION_KEY } from "../lib/selection-key";

interface SelectionAnnouncerProps {
  selectionKey: string;
}

export function SelectionAnnouncer({ selectionKey }: SelectionAnnouncerProps) {
  if (selectionKey === EMPTY_SELECTION_KEY) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    );
  }
  return (
    <div
      key={selectionKey}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      Selection changed
    </div>
  );
}
