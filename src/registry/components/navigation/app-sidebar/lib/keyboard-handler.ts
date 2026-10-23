import type { KeyboardEvent } from "react";
import type { SidebarKeyboardEntry } from "./flatten-entries";

export interface SidebarKeyboardContext {
  flat: ReadonlyArray<SidebarKeyboardEntry>;
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  toggleSection: (sectionId: string) => void;
  isSectionCollapsed: (sectionId: string) => boolean;
  /** v0.5.0 (AS8) — in RTL the expand / collapse arrows swap. Default "ltr". */
  dir?: "ltr" | "rtl";
}

/**
 * v0.5.0 (C9) — keys typed into a form control (a search box in `topSlot`, an
 * inline editor in a custom row) belong to that control, never to the roving
 * focus. Roles that own their arrow keys count too.
 */
export function ownsArrowKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const popup = target.getAttribute("aria-haspopup");
  if (popup && popup !== "false") return true;
  return target.closest('[role="menu"], [role="menubar"]') !== null;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  const role = target.getAttribute("role");
  return (
    role === "textbox" ||
    role === "combobox" ||
    role === "listbox" ||
    role === "slider" ||
    role === "spinbutton" ||
    role === "searchbox"
  );
}

/**
 * Arrow/Home/End/Enter/Esc dispatch over the flattened keyboard sequence.
 *
 * Behaviors (plan §17.2 + L37):
 *  - ArrowDown / ArrowUp — move focus across the sequence (wraps at edges).
 *  - Home / End — jump to first / last entry.
 *  - ArrowRight on a collapsed section header → expand (ArrowLeft in RTL).
 *  - ArrowLeft on an expanded section header → collapse (ArrowRight in RTL).
 *  - Events from editable targets are ignored (C9).
 *  - Enter / Space — left to native button/link click on the focused row.
 *
 * The handler only updates the reducer's focusedItemId; the host effect in
 * `<AppSidebar>` programmatically focuses the matching DOM node on each
 * change so screen reader + keyboard user expectations line up.
 */
export function handleSidebarKeydown(
  event: KeyboardEvent,
  ctx: SidebarKeyboardContext,
): void {
  const { flat, focusedId, setFocusedId, toggleSection, isSectionCollapsed } = ctx;
  if (flat.length === 0) return;
  if (isEditableTarget(event.target)) return;
  // v0.5.0 (U4) — React bubbles events through portals: keys pressed in a
  // portalled menu (the footer user menu, a topSlot dropdown) reach this
  // handler although their target is outside the sidebar's DOM. Menus and
  // their triggers own their arrow keys.
  const host = event.currentTarget as unknown as Node | null;
  if (host && event.target instanceof Node && !host.contains(event.target)) return;
  if (ownsArrowKeys(event.target)) return;
  const rtl = ctx.dir === "rtl";
  const expandKey = rtl ? "ArrowLeft" : "ArrowRight";
  const collapseKey = rtl ? "ArrowRight" : "ArrowLeft";

  const currentIdx = focusedId ? flat.findIndex((e) => e.id === focusedId) : -1;

  switch (event.key) {
    case "ArrowDown": {
      event.preventDefault();
      const next =
        currentIdx >= 0 && currentIdx + 1 < flat.length
          ? flat[currentIdx + 1]
          : flat[0];
      setFocusedId(next.id);
      return;
    }
    case "ArrowUp": {
      event.preventDefault();
      const prev =
        currentIdx > 0 ? flat[currentIdx - 1] : flat[flat.length - 1];
      setFocusedId(prev.id);
      return;
    }
    case "Home": {
      event.preventDefault();
      setFocusedId(flat[0].id);
      return;
    }
    case "End": {
      event.preventDefault();
      setFocusedId(flat[flat.length - 1].id);
      return;
    }
    case "ArrowRight":
    case "ArrowLeft": {
      if (currentIdx < 0) return;
      const current = flat[currentIdx];
      if (current.kind !== "section-header") return;
      const collapsed = isSectionCollapsed(current.id);
      if (
        (event.key === expandKey && collapsed) ||
        (event.key === collapseKey && !collapsed)
      ) {
        event.preventDefault();
        toggleSection(current.id);
      }
      return;
    }
  }
}
