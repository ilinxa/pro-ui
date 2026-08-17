"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Error boundary around host-supplied block render code.
 *
 * A `customPredefinedKeys[].render` function is untrusted consumer code, and
 * a throw inside it happens during React's render pass — a call-site
 * `try/catch` cannot see it. Without a boundary, one bad host renderer blanks
 * the entire flow canvas, not just its own node.
 *
 * Deliberately local rather than importing card-tree's `HostRenderBoundary`:
 * that lives in `parts/predefined-custom.tsx`, a 228-line module that also
 * pulls the custom-block editors, `InlineError` and lucide icons. A canvas
 * node needs ~30 lines of it, and card-tree-node holds a tight artifact
 * budget. The contract is identical — degrade to `fallback`, never blank.
 */
export class HostBlockBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[card-tree-node] A custom block's render() threw; showing the summary instead.",
        error,
        info.componentStack,
      );
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
