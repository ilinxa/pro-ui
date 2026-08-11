"use client";

import * as React from "react";

/**
 * Keep a ref in sync with the latest `value`, assigned inside a `useEffect`
 * (never during render — not a `setState`, so it stays StrictMode-safe).
 * Read `.current` from event handlers, timers, or other effects so a fresh
 * inline callback/prop (a new identity every render) never has to be a
 * dependency of — and never re-subscribes — an observer/listener/timer keyed
 * on other, more stable deps.
 *
 * Extracted 2026-08-11 (P3.5 / D-04) from ~15 independent copies of this
 * exact idiom across the pack's headless `Root` providers and telemetry
 * hooks (`const xRef = useRef(x); useEffect(() => { xRef.current = x; })`,
 * with or without an explicit `[x]` dependency array — both variants
 * converge to the same steady-state ref value, so a single shared
 * implementation running every render is a strict, behavior-preserving
 * superset of both).
 */
export function useLatestRef<T>(value: T): React.RefObject<T> {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref;
}
