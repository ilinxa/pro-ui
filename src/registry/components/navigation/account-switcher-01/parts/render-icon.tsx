import { createElement, isValidElement, type ComponentType, type ReactNode } from "react";

type IconLike = ReactNode | ComponentType<{ className?: string }>;

/**
 * Render an icon prop that accepts either an already-rendered ReactNode
 * (JSX) OR a ComponentType (lucide-react icon, custom component, forwardRef
 * object). Handles all three shapes:
 *
 *   1. JSX element  → return as-is
 *   2. function     → call with { className }
 *   3. forwardRef / memo / exotic component (object with $$typeof) →
 *      use createElement so lucide-react v0.475+ forwardRef icons work
 *      (mirrors the rich-sidebar Icon helper fix from 52e5f33).
 *   4. primitive (string/number) → wrap as-is
 *   5. null / undefined → null
 */
export function renderIcon(icon: IconLike | undefined, className?: string): ReactNode {
  if (icon === null || icon === undefined) return null;

  // Already a rendered element
  if (isValidElement(icon)) return icon;

  // Function component
  if (typeof icon === "function") {
    return createElement(icon as ComponentType<{ className?: string }>, { className });
  }

  // forwardRef / memo / exotic (object with $$typeof) — lucide-react v0.475+
  if (typeof icon === "object" && icon !== null && "$$typeof" in icon) {
    return createElement(icon as unknown as ComponentType<{ className?: string }>, { className });
  }

  // Primitive (string / number) — render directly
  return icon as ReactNode;
}
