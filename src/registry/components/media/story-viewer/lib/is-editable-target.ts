/**
 * True when a keyboard event's target is somewhere the user is typing (or
 * otherwise owns the keys): input / textarea / select, contentEditable,
 * `[role="textbox"]`, widgets that own the arrow keys (`slider`, `spinbutton`,
 * `combobox`, `listbox`), or anything inside a `[data-keyboard-ignore]` subtree.
 * Window-level shortcuts must stand down for these.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  const el = target as HTMLElement;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return (
    el.closest(
      '[contenteditable=""], [contenteditable="true"], [role="textbox"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="listbox"], [data-keyboard-ignore]',
    ) !== null
  );
}

/** True for focusable activators that own Space/Enter themselves. */
export function isActivatableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  return (
    (target as HTMLElement).closest(
      'button, a[href], [role="button"], [role="link"], [role="menuitem"], summary',
    ) !== null
  );
}
