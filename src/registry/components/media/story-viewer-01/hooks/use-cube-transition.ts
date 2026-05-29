"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * v0.4.0 — Instagram-canonical 3D cube transition controller.
 * v0.4.1 — Extended with `dragging` mode for finger-following swipe.
 *
 * Modes:
 *   - "auto" — click / auto-advance / keyboard / programmatic. Mounts ONE
 *     leaving face. Cube animates `0 → ∓90deg` over `durationMs`, then idles.
 *   - "dragging" — user drag in progress. Mounts BOTH prev + next ghost
 *     faces. Angle is driven directly by pointer events via the
 *     `--story-cube-angle` CSS var (no React render per frame).
 *   - "releasing" — drag released. Angle animates from its current value to
 *     the target (`-90` commit-next / `+90` commit-prev / `0` snap-back) over
 *     `durationMs`. After completion, the supplied `onComplete` callback
 *     fires and state returns to idle.
 *
 * Angle is ALWAYS driven via DOM CSS variable mutated through the rotator
 * ref — never React state. That avoids cascading-render warnings AND
 * skips re-renders per animation frame.
 */
export type CubeDirection = "next" | "prev";

export interface CubeFaceSnapshot {
  storyId: string;
  itemId: string;
  itemIndex: number;
  progress: number;
}

export type CubeTransitionState =
  | { phase: "idle" }
  | {
      // Auto-triggered (click / auto-advance / keyboard / programmatic).
      // ONE ghost face: the leaving story. Cube animates 0 → ∓90deg.
      phase: "auto";
      direction: CubeDirection;
      leaving: CubeFaceSnapshot;
    }
  | {
      // User is actively dragging. BOTH prev + next ghosts mounted (drag
      // could go either way). Angle = pointer-driven.
      phase: "dragging";
      prev: CubeFaceSnapshot | null;
      next: CubeFaceSnapshot | null;
    }
  | {
      // User released; angle is animating to its commit/snapback target.
      // Same dual-ghost mount as dragging until the animation completes.
      phase: "releasing";
      prev: CubeFaceSnapshot | null;
      next: CubeFaceSnapshot | null;
    };

export interface UseCubeTransitionResult {
  state: CubeTransitionState;
  /** Callback ref — attach to the cube rotator element. */
  setRotatorRef: (el: HTMLDivElement | null) => void;

  /**
   * Auto-animate path. Called when a story-level cursor change is
   * detected. Renders the cube with a single ghost, sweeps the rotator
   * from `0 → ∓90deg`, then returns to idle.
   */
  startAuto: (args: {
    direction: CubeDirection;
    leaving: CubeFaceSnapshot;
  }) => void;

  /**
   * Begin a drag gesture. Mounts the cube with BOTH prev + next ghosts
   * (whichever exist). Angle starts at 0 and is driven by `setDragAngle`.
   */
  beginDrag: (args: {
    prev: CubeFaceSnapshot | null;
    next: CubeFaceSnapshot | null;
  }) => void;

  /**
   * Drive the cube angle during drag. Mutates `--story-cube-angle`
   * directly on the rotator — does NOT trigger a React render.
   */
  setDragAngle: (deg: number) => void;

  /**
   * Release a drag. Animates the cube from its current angle to the
   * target. `onComplete` fires once the timer elapses (use it to commit
   * a cursor change if `target` is ±90, or do nothing on snap-back).
   * The cube returns to idle automatically.
   */
  releaseDrag: (args: {
    targetDeg: number;
    onComplete?: () => void;
  }) => void;

  /** Snap the cube to idle immediately (no animation). Used on viewer close. */
  forceIdle: () => void;
}

export function useCubeTransition(durationMs = 400): UseCubeTransitionResult {
  const [state, setState] = useState<CubeTransitionState>({ phase: "idle" });
  const rotatorRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  // Pending onComplete for `releaseDrag` — fires when its timer elapses.
  const completeRef = useRef<(() => void) | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────
  const writeAngle = useCallback((value: string | null) => {
    const el = rotatorRef.current;
    if (!el) return;
    if (value == null) {
      el.style.removeProperty("--story-cube-angle");
    } else {
      el.style.setProperty("--story-cube-angle", value);
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ─── Auto-mode driver ──────────────────────────────────────────────────
  // When state enters "auto", run the 0 → ∓90 sweep then return to idle.
  useEffect(() => {
    if (state.phase !== "auto") return;
    const el = rotatorRef.current;
    if (!el) {
      // Rotator hasn't mounted yet — fall back to a timer to drop back to
      // idle so we don't leak the auto phase.
      const fallback = setTimeout(() => setState({ phase: "idle" }), durationMs);
      return () => clearTimeout(fallback);
    }
    // Frame 1: pin at 0deg.
    writeAngle("0deg");
    // Force commit so the next write actually animates.
    void el.offsetWidth;
    // Frame 2: commit target. CSS transition runs.
    rafRef.current = requestAnimationFrame(() => {
      writeAngle(state.direction === "next" ? "-90deg" : "90deg");
    });
    timerRef.current = setTimeout(() => {
      setState({ phase: "idle" });
    }, durationMs);
    return () => {
      clearTimers();
      writeAngle(null);
    };
  }, [state, durationMs, writeAngle, clearTimers]);

  // ─── Releasing-mode driver ─────────────────────────────────────────────
  // When state enters "releasing", the angle has already been written by
  // `releaseDrag` (so the CSS transition picks up between the current and
  // target angles). We only need the timer for the onComplete + idle.
  useEffect(() => {
    if (state.phase !== "releasing") return;
    timerRef.current = setTimeout(() => {
      const cb = completeRef.current;
      completeRef.current = null;
      cb?.();
      setState({ phase: "idle" });
    }, durationMs);
    return () => {
      clearTimers();
      writeAngle(null);
    };
  }, [state, durationMs, writeAngle, clearTimers]);

  // ─── Public API ────────────────────────────────────────────────────────
  const setRotatorRef = useCallback((el: HTMLDivElement | null) => {
    rotatorRef.current = el;
  }, []);

  const startAuto = useCallback<UseCubeTransitionResult["startAuto"]>(
    (args) => {
      setState({ phase: "auto", direction: args.direction, leaving: args.leaving });
    },
    [],
  );

  const beginDrag = useCallback<UseCubeTransitionResult["beginDrag"]>((args) => {
    setState({ phase: "dragging", prev: args.prev, next: args.next });
    // Pin angle to 0 initially. Pointer events drive subsequent updates.
    // Hold a microtask so the rotator ref is wired in the upcoming render.
    queueMicrotask(() => writeAngle("0deg"));
  }, [writeAngle]);

  const setDragAngle = useCallback<UseCubeTransitionResult["setDragAngle"]>(
    (deg) => {
      writeAngle(`${deg}deg`);
    },
    [writeAngle],
  );

  const releaseDrag = useCallback<UseCubeTransitionResult["releaseDrag"]>(
    (args) => {
      completeRef.current = args.onComplete ?? null;
      // Commit target angle immediately — the rotator already has its CSS
      // transition wired, so the browser animates from the current
      // pointer-driven angle to the target.
      writeAngle(`${args.targetDeg}deg`);
      // Move state to releasing — keeps the cube structure mounted while
      // the CSS transition completes; the effect above schedules the
      // idle reset + onComplete.
      setState((prev) =>
        prev.phase === "dragging"
          ? { phase: "releasing", prev: prev.prev, next: prev.next }
          : prev,
      );
    },
    [writeAngle],
  );

  const forceIdle = useCallback(() => {
    completeRef.current = null;
    clearTimers();
    writeAngle(null);
    // Bail if already idle — avoids a needless re-render that can chain
    // through effects depending on the returned `cube` object.
    setState((prev) => (prev.phase === "idle" ? prev : { phase: "idle" }));
  }, [clearTimers, writeAngle]);

  return {
    state,
    setRotatorRef,
    startAuto,
    beginDrag,
    setDragAngle,
    releaseDrag,
    forceIdle,
  };
}
