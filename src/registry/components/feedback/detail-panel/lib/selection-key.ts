import type { DetailPanelSelection } from "../types";

export const EMPTY_SELECTION_KEY = "__empty__";

export function keyForSelection(
  selection: DetailPanelSelection | null,
): string {
  if (!selection) return EMPTY_SELECTION_KEY;
  return `${selection.type}:${selection.id}`;
}
