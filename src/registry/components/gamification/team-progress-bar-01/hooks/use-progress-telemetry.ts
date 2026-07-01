"use client";

import * as React from "react";

import { progressBarCheckedEvent } from "../lib/event";
import type { GamificationEvent } from "../types";

/**
 * "Viewed once per mount" telemetry — fires `progress-bar.checked` the first
 * time the bar scrolls ≥ 1px into the viewport, then disconnects. Pure side
 * effect (never sets state → never re-renders). SSR-safe (observer is created
 * in an effect, never during render).
 *
 * Footguns handled:
 *  - **No `onEvent` → no observer** (pay-for-what-you-use).
 *  - **Double-emit guard** via a `hasFired` ref (covers StrictMode + re-entry).
 *  - **Stable `onEvent`** read through a ref, so an inline handler (new identity
 *    each render) does not re-subscribe the observer.
 */
export function useProgressTelemetry(args: {
  teamId: string;
  onEvent?: (event: GamificationEvent) => void;
}): React.RefObject<HTMLDivElement | null> {
  const { teamId, onEvent } = args;

  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const hasFired = React.useRef(false);
  const onEventRef = React.useRef(onEvent);

  React.useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const hasHandler = Boolean(onEvent);

  React.useEffect(() => {
    if (!hasHandler) return;
    const node = targetRef.current;
    if (!node || hasFired.current) return;

    const fire = () => {
      if (hasFired.current) return;
      hasFired.current = true;
      onEventRef.current?.(progressBarCheckedEvent(teamId));
    };

    // Old/SSR-ish environments with no IntersectionObserver: fire once on mount.
    if (typeof IntersectionObserver === "undefined") {
      fire();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            fire();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [teamId, hasHandler]);

  return targetRef;
}
