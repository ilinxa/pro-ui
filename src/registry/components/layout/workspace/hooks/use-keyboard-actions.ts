"use client";

import { useCallback, useEffect } from "react";
import type { Action } from "../lib/reducer";
import type { LeafRect, SplitDividerRect } from "../lib/geometry";
import { rectsShareFullEdge } from "../lib/geometry";
import { getNodeAtPath } from "../lib/tree";
import type { AreaTree, SplitOrientation } from "../types";

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

export function useResizeKeyboard(opts: {
  enabled: boolean;
  leaves: LeafRect[];
  dividers: SplitDividerRect[];
  renderedTree: AreaTree;
  focusedAreaId: string | null;
  dispatch: React.Dispatch<Action>;
}) {
  const { enabled, leaves, dividers, renderedTree, focusedAreaId, dispatch } =
    opts;

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (!focusedAreaId) return;
      if (!e.altKey || !e.shiftKey) return;
      const isHorizontal = e.key === "ArrowLeft" || e.key === "ArrowRight";
      const isVertical = e.key === "ArrowUp" || e.key === "ArrowDown";
      if (!isHorizontal && !isVertical) return;
      e.preventDefault();
      const direction =
        e.key === "ArrowRight"
          ? 1
          : e.key === "ArrowLeft"
            ? -1
            : e.key === "ArrowDown"
              ? 1
              : -1;
      const orientation = isHorizontal ? "vertical" : "horizontal";
      const focusedRect = leaves.find((l) => l.areaId === focusedAreaId);
      if (!focusedRect) return;
      const candidate = dividers.find((d) => {
        if (d.orientation !== orientation) return false;
        if (orientation === "vertical") {
          const onRight = Math.abs(focusedRect.x + focusedRect.width - d.x) < 1;
          const onLeft = Math.abs(focusedRect.x - d.x) < 1;
          return onLeft || onRight;
        } else {
          const onBottom =
            Math.abs(focusedRect.y + focusedRect.height - d.y) < 1;
          const onTop = Math.abs(focusedRect.y - d.y) < 1;
          return onTop || onBottom;
        }
      });
      if (!candidate) return;
      const node = getNodeAtPath(renderedTree, candidate.splitPath);
      if (node.kind !== "split") return;
      const next = Math.max(
        0.05,
        Math.min(0.95, node.ratio + KEYBOARD_RESIZE_STEP * direction),
      );
      dispatch({ type: "resize", splitPath: candidate.splitPath, ratio: next });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, focusedAreaId, leaves, dividers, renderedTree, dispatch]);
}
