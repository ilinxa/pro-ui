"use client";

import {
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";

const DRAG_DISTANCE_THRESHOLD = 6; // px before drag activates

/**
 * Configures @dnd-kit sensors with a small drag-distance threshold so that
 * single-clicks (used for entering edit mode) don't accidentally trigger drag.
 */
export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_DISTANCE_THRESHOLD },
    }),
    useSensor(KeyboardSensor),
  );
}

/**
 * Default collision detection: closest-center against all draggable rectangles.
 * Refinement (between-siblings vs into-card) happens at the drop-event handler.
 */
export const collisionStrategy: CollisionDetection = closestCenter;
