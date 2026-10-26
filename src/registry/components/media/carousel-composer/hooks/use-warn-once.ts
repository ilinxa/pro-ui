"use client";

import { useCallback, useState } from "react";

/**
 * A development-only `console.warn` that fires once per key per instance. Call it from
 * effects or handlers, never during render. A no-op in production.
 */
export function useWarnOnce(): (key: string, message: string) => void {
  const [seen] = useState(() => new Set<string>());
  return useCallback(
    (key: string, message: string) => {
      if (process.env.NODE_ENV === "production" || seen.has(key)) return;
      seen.add(key);
      console.warn(message);
    },
    [seen],
  );
}
