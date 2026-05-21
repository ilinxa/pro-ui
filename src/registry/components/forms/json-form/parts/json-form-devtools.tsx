"use client";

import { Suspense, lazy } from "react";

/**
 * v0.1.7 — JsonFormDevtools loader stub. The ~250 LOC panel body lives in
 * `./json-form-devtools-body.tsx` and is fetched via `React.lazy()` only
 * when the component actually renders. In prod (or when the consumer-side
 * import is itself wrapped behind `process.env.NODE_ENV !== "production"`),
 * the body chunk is never fetched.
 *
 * **This is NOT a bundler tree-shake** — the loader stub itself still
 * ships in prod chunks unless the consumer-side import is conditional. For
 * true chunk-level elimination, wrap the usage:
 *
 * ```tsx
 * {process.env.NODE_ENV !== "production" && <JsonFormDevtools />}
 * ```
 *
 * Override the auto-disable via the `force` prop for prod-debug builds.
 */

const LazyBody = lazy(() => import("./json-form-devtools-body"));

export interface JsonFormDevtoolsProps {
  /**
   * Render inline (as a block child) instead of as a floating panel
   * anchored to the bottom-right viewport corner. Inline mode is always
   * visible; floating mode shows a pill-shaped toggle until opened.
   */
  inline?: boolean;
  /**
   * Force-enable in production builds. By default the component returns
   * `null` (no-op) when `process.env.NODE_ENV === "production"`.
   */
  force?: boolean;
  /**
   * Keyboard shortcut to toggle the floating panel open/closed. Ignored in
   * inline mode. Format: `"Ctrl+Shift+J"` (case-insensitive modifiers).
   * Default: `"Ctrl+Shift+J"`.
   */
  shortcut?: string;
  className?: string;
}

export function JsonFormDevtools({
  inline = false,
  force = false,
  shortcut = "Ctrl+Shift+J",
  className,
}: JsonFormDevtoolsProps) {
  if (process.env.NODE_ENV === "production" && !force) return null;

  return (
    <Suspense fallback={null}>
      <LazyBody inline={inline} shortcut={shortcut} className={className} />
    </Suspense>
  );
}

export default JsonFormDevtools;
