import { useId } from "react";

/**
 * Accessible name = the action's label + its visible count ("Like 12"), so the visible count is
 * part of the name (WCAG 2.5.3) and a withheld count is never in it (C6). `aria-labelledby`
 * joins the two ids with a space; the label renders as visually-hidden text.
 */
export function useActionName(hasCount: boolean) {
  const id = useId();
  const labelId = `${id}-label`;
  const countId = `${id}-count`;
  return {
    labelId,
    countId,
    labelledBy: hasCount ? `${labelId} ${countId}` : labelId,
  };
}

/** Disabled actions stay focusable (`aria-disabled`) and look inert. */
export const DISABLED_ACTION_CLASS =
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50";
