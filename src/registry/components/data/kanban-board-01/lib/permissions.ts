import type { KanbanData } from "../types";
import { findColumn, findItem } from "./data";

export type CanDropArgs = {
  data: KanbanData;
  itemId: string;
  fromColumnId: string;
  toColumnId: string;
  fromSwimlaneId?: string;
  toSwimlaneId?: string;
  readOnly: boolean;
};

export function canDrop(args: CanDropArgs): boolean {
  if (args.readOnly) return false;

  const found = findItem(args.data, args.itemId);
  if (!found) return false;
  if (found.item.locked) return false;

  const fromCol = findColumn(args.data, args.fromColumnId)?.column;
  const toCol = findColumn(args.data, args.toColumnId)?.column;
  if (!fromCol || !toCol) return false;

  const sameColumn = args.fromColumnId === args.toColumnId;

  if (sameColumn) {
    if (toCol.allowReorder === false) return false;
  } else {
    if (fromCol.allowOutgoing === false) return false;
    if (toCol.allowIncoming === false) return false;
  }

  if (toCol.acceptsRendererIds && !toCol.acceptsRendererIds.includes(found.item.rendererId)) {
    return false;
  }

  return true;
}
