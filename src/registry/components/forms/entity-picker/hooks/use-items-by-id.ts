"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EntityLike } from "../types";

export function useItemsById<T extends EntityLike>(
  items: ReadonlyArray<T>,
): Map<string, T> {
  const map = useMemo(() => {
    const out = new Map<string, T>();
    for (const item of items) {
      if (out.has(item.id)) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[entity-picker] duplicate id "${item.id}" in items; later occurrences are ignored.`,
          );
        }
        continue;
      }
      out.set(item.id, item);
    }
    return out;
  }, [items]);

  // Runs after EVERY render (no deps): a render with the same `items` resets the count, so
  // only an array that changes on consecutive renders warns — not a host that swaps `items`
  // when a server search returns (renders in between keep the same array).
  const stabilityRef = useRef({ last: items, count: 0, warned: false });
  useEffect(() => {
    const tracker = stabilityRef.current;
    if (tracker.last === items) {
      tracker.count = 0;
      return;
    }
    tracker.last = items;
    tracker.count++;
    if (
      tracker.count > 5 &&
      !tracker.warned &&
      process.env.NODE_ENV !== "production"
    ) {
      tracker.warned = true;
      console.warn(
        "[entity-picker] `items` prop is changing every render. " +
          "Wrap with `useMemo` or hoist to module scope to avoid re-derivation.",
      );
    }
  });

  return map;
}
