"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Action } from "../lib/reducer";
import { inferDragOrientation, pointInRect } from "../lib/geometry";
import type { LeafRect } from "../lib/geometry";
import type { SplitOrientation } from "../types";

export type CornerDragState = {
  originAreaId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  intent:
    | { kind: "none" }
    | {
        kind: "split";
        orientation: SplitOrientation;
        position: { x: number; y: number };
      }
    | { kind: "merge"; targetAreaId: string };
};

const DRAG_THRESHOLD_PX = 4;

let inertLogged = false;

export function useCornerGesture(opts: {
  rootRef: React.RefObject<HTMLElement | null>;
  leaves: LeafRect[];
  cap: number;
  breakpoint: string;
  dispatch: React.Dispatch<Action>;
  makeAreaId: () => string;
}) {
  const { rootRef, leaves, cap, breakpoint, dispatch, makeAreaId } = opts;
  const [dragState, setDragState] = useState<CornerDragState | null>(null);
  const dragRef = useRef<CornerDragState | null>(null);
  const leavesRef = useRef(leaves);
  useEffect(() => {
    leavesRef.current = leaves;
  }, [leaves]);

  const beginCornerDrag = useCallback(
    (areaId: string, clientX: number, clientY: number, pointerId: number) => {
      const root = rootRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const localX = clientX - rootRect.left;
      const localY = clientY - rootRect.top;
      const initial: CornerDragState = {
        originAreaId: areaId,
        startX: localX,
        startY: localY,
        currentX: localX,
        currentY: localY,
        intent: { kind: "none" },
      };
      dragRef.current = initial;
      setDragState(initial);
      try {
        root.setPointerCapture(pointerId);
      } catch {
        // ignore — some browsers throw if pointer is not active
      }
    },
    [rootRef],
  );

  useEffect(() => {
    if (!dragState) return;
    const root = rootRef.current;
    if (!root) return;

    const computeIntent = (
      origin: LeafRect,
      currentX: number,
      currentY: number,
      startX: number,
      startY: number,
    ): CornerDragState["intent"] => {
      const dx = currentX - startX;
      const dy = currentY - startY;
      const distance = Math.hypot(dx, dy);
      if (distance < DRAG_THRESHOLD_PX) return { kind: "none" };

      if (pointInRect(currentX, currentY, origin)) {
        // SPLIT intent — gated by per-leaf depth. Splitting a leaf at depth N
        // produces children at depth N+1, so the cap rule is `origin.depth < cap`.
        if (origin.depth >= cap) {
          if (!inertLogged) {
            console.debug(
              `[workspace] split inert: leaf at depth ${origin.depth} would exceed cap ${cap} for breakpoint "${breakpoint}"`,
            );
            inertLogged = true;
          }
          return { kind: "none" };
        }
        const orientation = inferDragOrientation(
          startX,
          startY,
          currentX,
          currentY,
        );
        const position =
          orientation === "vertical"
            ? { x: currentX, y: origin.y }
            : { x: origin.x, y: currentY };
        return { kind: "split", orientation, position };
      }

      const target = leavesRef.current.find(
        (l) => l.areaId !== origin.areaId && pointInRect(currentX, currentY, l),
      );
      if (target) {
        return { kind: "merge", targetAreaId: target.areaId };
      }
      return { kind: "none" };
    };

    const handleMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const rootRect = root.getBoundingClientRect();
      const localX = e.clientX - rootRect.left;
      const localY = e.clientY - rootRect.top;
      const origin = leavesRef.current.find(
        (l) => l.areaId === current.originAreaId,
      );
      if (!origin) return;
      const intent = computeIntent(
        origin,
        localX,
        localY,
        current.startX,
        current.startY,
      );
      const next: CornerDragState = {
        ...current,
        currentX: localX,
        currentY: localY,
        intent,
      };
      dragRef.current = next;
      setDragState(next);
    };

    const handleUp = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) {
        setDragState(null);
        return;
      }
      const intent = current.intent;
      if (intent.kind === "split") {
        dispatch({
          type: "split",
          areaId: current.originAreaId,
          orientation: intent.orientation,
          newAreaId: makeAreaId(),
        });
      } else if (intent.kind === "merge") {
        dispatch({
          type: "merge",
          survivorId: current.originAreaId,
          absorbedId: intent.targetAreaId,
        });
      }
      try {
        root.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = null;
      setDragState(null);
    };

    const handleCancel = () => {
      dragRef.current = null;
      setDragState(null);
    };

    root.addEventListener("pointermove", handleMove);
    root.addEventListener("pointerup", handleUp);
    root.addEventListener("pointercancel", handleCancel);
    window.addEventListener("blur", handleCancel);
    return () => {
      root.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerup", handleUp);
      root.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("blur", handleCancel);
    };
  }, [dragState, rootRef, dispatch, makeAreaId, cap, breakpoint]);

  return { dragState, beginCornerDrag };
}
