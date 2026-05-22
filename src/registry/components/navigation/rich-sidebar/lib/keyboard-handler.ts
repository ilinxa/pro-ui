import type { KeyboardEvent } from "react";
import type { SidebarKeyboardEntry } from "./flatten-entries";

export interface SidebarKeyboardContext {
  flat: ReadonlyArray<SidebarKeyboardEntry>;
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  toggleSection: (sectionId: string) => void;
  isSectionCollapsed: (sectionId: string) => boolean;
}

/**
 * Arrow/Home/End/Enter/Esc dispatch over the flattened keyboard sequence.
 *
 * Behaviors (plan §17.2 + L37):
 *  - ArrowDown / ArrowUp — move focus across the sequence (wraps at edges).
 *  - Home / End — jump to first / last entry.
 *  - ArrowRight on a collapsed section header → expand.
 *  - ArrowLeft on an expanded section header → collapse.
 *  - Enter / Space — left to native button/link click on the focused row.
 *
 * The handler only updates the reducer's focusedItemId; the host effect in
 * `<RichSidebar>` programmatically focuses the matching DOM node on each
 * change so screen reader + keyboard user expectations line up.
 */
export function handleSidebarKeydown(
  event: KeyboardEvent,
  ctx: SidebarKeyboardContext,
): void {
  const { flat, focusedId, setFocusedId, toggleSection, isSectionCollapsed } = ctx;
  if (flat.length === 0) return;

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
    case "ArrowRight": {
      if (currentIdx < 0) return;
      const current = flat[currentIdx];
      if (current.kind === "section-header" && isSectionCollapsed(current.id)) {
        event.preventDefault();
        toggleSection(current.id);
      }
      return;
    }
    case "ArrowLeft": {
      if (currentIdx < 0) return;
      const current = flat[currentIdx];
      if (current.kind === "section-header" && !isSectionCollapsed(current.id)) {
        event.preventDefault();
        toggleSection(current.id);
      }
      return;
    }
  }
}
