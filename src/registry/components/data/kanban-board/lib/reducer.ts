import type { KanbanAction, KanbanData } from "../types";
import {
  addColumn,
  addItem,
  deleteColumn,
  deleteItem,
  moveItem,
  reorderColumn,
  setColumnColor,
  toggleCollapse,
  updateColumn,
  updateItem,
} from "./data";

export function kanbanReducer(state: KanbanData, action: KanbanAction): KanbanData {
  switch (action.type) {
    case "move-item":
      return moveItem(state, action.itemId, action.toColumnId, action.toIndex, action.toSwimlaneId);
    case "reorder-column":
      return reorderColumn(state, action.columnId, action.toIndex);
    case "create-item":
      return addItem(state, action.columnId, action.item, action.index);
    case "update-item":
      return updateItem(state, action.item);
    case "delete-item":
      return deleteItem(state, action.itemId);
    case "create-column":
      return addColumn(state, action.column, action.index);
    case "update-column":
      return updateColumn(state, action.column);
    case "delete-column":
      return deleteColumn(state, action.columnId);
    case "toggle-collapse":
      return toggleCollapse(state, action.columnId);
    case "set-color":
      return setColumnColor(state, action.columnId, action.color);
    case "replace":
      return action.data;
  }
}
