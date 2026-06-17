"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { BlackboardRootProps } from "../types";
import { BlackboardContext } from "../hooks/use-blackboard";
import { useBlackboardController } from "../hooks/use-blackboard-state";
// Side-effect: registers the bundled handwriting @font-face rules + exposes the
// default --bb-font-* declarations. Importing here loads fonts on any board mount.
import { FONT_VAR_DECLARATIONS } from "../blackboard-fonts";

/**
 * Headless provider. Owns all state + handlers + the imperative handle (via
 * `useBlackboardController`) and injects the `--bb-font-*` CSS vars on its wrapper
 * so descendants resolve the handwriting families without touching app-global CSS.
 * Renders `children` only — no board chrome (that's `BlackboardSurface` + parts).
 */
export function BlackboardRoot(props: BlackboardRootProps) {
  const ctx = useBlackboardController(props);
  const { className, style, children } = props;

  const fontVars = FONT_VAR_DECLARATIONS as Record<`--${string}`, string>;
  const mergedStyle = { ...fontVars, ...style } as CSSProperties;

  return (
    <BlackboardContext.Provider value={ctx}>
      <div data-slot="blackboard" className={cn("flex min-h-0 flex-col", className)} style={mergedStyle}>
        {children}
      </div>
    </BlackboardContext.Provider>
  );
}
