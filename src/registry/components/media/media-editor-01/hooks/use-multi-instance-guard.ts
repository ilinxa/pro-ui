"use client";

import { useEffect } from "react";

/**
 * Multi-instance guard — fires a dev-only `console.warn` when 2+
 * capture-enabled `MediaEditor01` instances mount simultaneously
 * (Q-P5 lock = `b`).
 *
 * Rationale: each instance owns its own `Konva.Stage` — fine, no
 * conflict. But `getUserMedia` against the same physical camera with
 * multiple live streams degrades quickly (most browsers serialize
 * constraints to the first opener, perf cliffs hit fast). The dev-warn
 * catches the layout-builder footgun without blocking valid two-camera
 * UIs the consumer knows what they're doing about.
 *
 * Edit-only instances (no capture mode enabled) bypass the counter
 * unconditionally — per description §1 they have no camera contention
 * to worry about. The caller decides whether to engage the guard via
 * the `enabled` arg.
 *
 * The counter is module-scoped (not React state) so multiple instances
 * across the tree observe the same value. Reset semantics are
 * mount-increment / unmount-decrement; HMR drift is acceptable for a
 * dev-only diagnostic.
 */

let captureInstanceCount = 0;
let warnedAt = -1;

export function useMultiInstanceGuard(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    if (process.env.NODE_ENV === "production") return;
    captureInstanceCount += 1;
    if (captureInstanceCount >= 2 && warnedAt !== captureInstanceCount) {
      warnedAt = captureInstanceCount;
      console.warn(
        `media-editor-01: ${captureInstanceCount} capture-enabled instances mounted simultaneously. ` +
          "Multiple live camera previews tend to degrade quickly — consider " +
          "`presentation=\"dialog\"` (one-at-a-time UX) or restricting secondary instances to edit-only " +
          "(`enabledModes` without `photo`/`video`).",
      );
    }
    return () => {
      captureInstanceCount = Math.max(0, captureInstanceCount - 1);
      if (captureInstanceCount < 2) {
        warnedAt = -1;
      }
    };
  }, [enabled]);
}

/**
 * Test-only — reset the module-scoped counter. Not exported via the
 * barrel; used by vitest if it ever lands.
 */
export function __resetMultiInstanceGuard(): void {
  captureInstanceCount = 0;
  warnedAt = -1;
}
