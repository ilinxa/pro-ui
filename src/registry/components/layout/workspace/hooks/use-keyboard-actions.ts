"use client";

import { useCallback } from "react";
import type { Action } from "../lib/reducer";
import type { LeafRect } from "../lib/geometry";
import { rectsShareFullEdge } from "../lib/geometry";
import type { SplitOrientation } from "../types";

const KEYBOARD_RESIZE_STEP = 0.04;

type ResizeDirection = "left" | "right" | "up" | "down";

export function useKeyboardActions(opts: {
  leaves: LeafRect[];
  focusedAreaId: string | null;
  cap: number;
  dispatch: React.Dispatch<Action>;
  makeAreaId: () => string;
}) {
  const { leaves, focusedAreaId, cap, dispatch, makeAreaId } = opts;

  const focusedLeaf = focusedAreaId
    ? (leaves.find((l) => l.areaId === focusedAreaId) ?? null)
    : null;
  const focusedCanSplit = focusedLeaf !== null && focusedLeaf.depth < cap;

  const splitFocused = useCallback(
    (orientation: SplitOrientation) => {
      if (!focusedLeaf) return;
      if (focusedLeaf.depth >= cap) return;
      dispatch({
        type: "split",
        areaId: focusedLeaf.areaId,
        orientation,
        newAreaId: makeAreaId(),
      });
    },
    [focusedLeaf, cap, dispatch, makeAreaId],
  );

  const findNeighbor = useCallback(
    (areaId: string, direction: ResizeDirection): LeafRect | null => {
      const origin = leaves.find((l) => l.areaId === areaId);
      if (!origin) return null;
      const candidates = leaves.filter((l) => l.areaId !== areaId);
      switch (direction) {
        case "right":
          return (
            candidates.find(
              (l) =>
                Math.abs(l.x - (origin.x + origin.width)) < 0.5 &&
                rectsShareFullEdge(origin, l) === "vertical",
            ) ?? null
          );
        case "left":
          return (
            candidates.find(
              (l) =>
                Math.abs(origin.x - (l.x + l.width)) < 0.5 &&
                rectsShareFullEdge(origin, l) === "vertical",
            ) ?? null
          );
        case "down":
          return (
            candidates.find(
              (l) =>
                Math.abs(l.y - (origin.y + origin.height)) < 0.5 &&
                rectsShareFullEdge(origin, l) === "horizontal",
            ) ?? null
          );
        case "up":
          return (
            candidates.find(
              (l) =>
                Math.abs(origin.y - (l.y + l.height)) < 0.5 &&
                rectsShareFullEdge(origin, l) === "horizontal",
            ) ?? null
          );
      }
    },
    [leaves],
  );

  const mergeWithNeighbor = useCallback(
    (direction: ResizeDirection) => {
      if (!focusedAreaId) return;
      const neighbor = findNeighbor(focusedAreaId, direction);
      if (!neighbor) return;
      dispatch({
        type: "merge",
        survivorId: focusedAreaId,
        absorbedId: neighbor.areaId,
      });
    },
    [focusedAreaId, findNeighbor, dispatch],
  );

  const swapToComponent = useCallback(
    (componentId: string) => {
      if (!focusedAreaId) return;
      dispatch({ type: "swap", areaId: focusedAreaId, componentId });
    },
    [focusedAreaId, dispatch],
  );

  return {
    splitFocused,
    mergeWithNeighbor,
    swapToComponent,
    findNeighbor,
    canSplit: focusedCanSplit,
    KEYBOARD_RESIZE_STEP,
  };
}
