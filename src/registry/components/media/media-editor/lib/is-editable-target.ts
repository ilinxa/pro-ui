/**
 * True when a keyboard event's target is somewhere the user is typing or that owns its
 * keys (consumer contract C9 / R8): a text-entry `<input>`, `<textarea>`, `<select>`,
 * contentEditable, `[role="textbox"]`, a widget that owns the arrow keys (`slider`,
 * `spinbutton`, `combobox`, `listbox`), or anything inside `[data-keyboard-ignore]`.
 * Window-level shortcuts must stand down for these.
 *
 * Copy into a component's `lib/` — registry items stay self-contained. Canonical copy:
 * `src/registry/components/_template/_snippets/` (tests next to it).
 */
const NON_TEXT_INPUTS = new Set(["checkbox", "radio", "button", "submit", "reset", "image", "file", "color"]);

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  const el = target as HTMLElement;
  if (el.tagName === "INPUT") return !NON_TEXT_INPUTS.has((el as HTMLInputElement).type);
  if (el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true;
  if (el.isContentEditable) return true;
  return (
    el.closest(
      '[contenteditable=""], [contenteditable="true"], [role="textbox"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="listbox"], [data-keyboard-ignore]',
    ) !== null
  );
}
