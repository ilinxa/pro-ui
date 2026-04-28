import type { AreaTree, SplitOrientation } from "../types";
import {
  mergeAreas,
  resizeSplit,
  splitLeaf,
  swapComponent,
} from "./tree";

export type WorkspaceState = {
  tree: AreaTree;
  focusedAreaId: string | null;
};

export type Action =
  | {
      type: "split";
      areaId: string;
      orientation: SplitOrientation;
      newAreaId: string;
    }
  | { type: "merge"; survivorId: string; absorbedId: string }
  | { type: "resize"; splitPath: number[]; ratio: number }
  | { type: "swap"; areaId: string; componentId: string }
  | { type: "focus"; areaId: string | null }
  | { type: "replace-tree"; tree: AreaTree };

export function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "split": {
      const tree = splitLeaf(
        state.tree,
        action.areaId,
        action.orientation,
        action.newAreaId,
      );
      return tree === state.tree ? state : { ...state, tree };
    }
    case "merge": {
      const tree = mergeAreas(state.tree, action.survivorId, action.absorbedId);
      if (tree === state.tree) return state;
      const focusedAreaId =
        state.focusedAreaId === action.absorbedId
          ? action.survivorId
          : state.focusedAreaId;
      return { tree, focusedAreaId };
    }
    case "resize": {
      const tree = resizeSplit(state.tree, action.splitPath, action.ratio);
      return tree === state.tree ? state : { ...state, tree };
    }
    case "swap": {
      const tree = swapComponent(state.tree, action.areaId, action.componentId);
      return tree === state.tree ? state : { ...state, tree };
    }
    case "focus": {
      if (state.focusedAreaId === action.areaId) return state;
      return { ...state, focusedAreaId: action.areaId };
    }
    case "replace-tree": {
      if (action.tree === state.tree) return state;
      return { ...state, tree: action.tree };
    }
  }
}
