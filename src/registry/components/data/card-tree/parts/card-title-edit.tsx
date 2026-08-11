import { useEffect, useRef, useState } from "react";
import type { ValidationResult } from "../lib/validate-edit";
import { InlineError } from "./inline-error";

/**
 * Inline editor for a card's parentKey (its visible title).
 * Replaces the <h3> while in edit mode.
 */
export function CardTitleEdit({
  initialTitle,
  validate,
  onCommit,
  onCancel,
  onCancelTentative,
  isTentative,
}: {
  initialTitle: string;
  validate: (newTitle: string) => ValidationResult;
  onCommit: (newTitle: string) => void;
  /** Called on Escape when the card is "real" (not tentative). */
  onCancel: () => void;
  /** Called on Escape when the card was just-added and should be removed. */
  onCancelTentative: () => void;
  isTentative: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const validation = validate(title);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const submit = () => {
    if (validation.ok && title !== initialTitle) onCommit(title);
    else if (title === initialTitle && !isTentative) onCancel();
  };

  const cancel = () => {
    if (isTentative) onCancelTentative();
    else onCancel();
  };

  return (
    <span className="inline-flex flex-1 flex-wrap items-center gap-1">
      <input
        ref={ref}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        className="min-w-0 flex-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Edit card title"
      />
      {!validation.ok ? <InlineError errors={validation.errors} /> : null}
    </span>
  );
}
