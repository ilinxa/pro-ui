"use client";

import { memo, useCallback, useId, useMemo, useState } from "react";
import type { FocusEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  defaultExpandableTextLabels,
  type ExpandableTextLabels,
  type ExpandableTextProps,
} from "./types";
import { useLineClampDetect } from "./hooks/use-line-clamp-detect";

/** Nothing React would render (`null`, `false`, `""`, empty arrays…). */
const isEmptyNode = (node: ReactNode): boolean =>
  node === null ||
  node === undefined ||
  typeof node === "boolean" ||
  node === "" ||
  (Array.isArray(node) && node.every(isEmptyNode));

const UNCLAMP_WITHOUT_TOGGLE =
  "print:overflow-visible! print:max-h-none! print:[-webkit-line-clamp:unset]! [@media(scripting:none)]:overflow-visible! [@media(scripting:none)]:max-h-none! [@media(scripting:none)]:[-webkit-line-clamp:unset]!";

/** Merge `labels` over the defaults — an `undefined` key never erases a default (C2). */
function resolveLabels(labels: ExpandableTextLabels | undefined): Required<ExpandableTextLabels> {
  return {
    showMore: labels?.showMore ?? defaultExpandableTextLabels.showMore,
    showLess: labels?.showLess ?? defaultExpandableTextLabels.showLess,
  };
}

function ExpandableTextInner({
  content,
  children,
  measureKey,
  maxLines = 3,
  dir = "auto",
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  labels: labelsProp,
  renderToggle,
  className,
  contentClassName,
  toggleClassName,
}: ExpandableTextProps) {
  const labels = useMemo(() => resolveLabels(labelsProp), [labelsProp]);

  const isControlled = expandedProp !== undefined;
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = isControlled ? expandedProp : expandedState;

  const setExpanded = useCallback(
    (next: boolean) => {
      if (!isControlled) setExpandedState(next);
      onExpandedChange?.(next);
    },
    [isControlled, onExpandedChange],
  );

  const rich = !isEmptyNode(children);
  // Re-measure on a new `content` or `measureKey`; rich children are also watched for DOM changes.
  const measureTrigger = useMemo(() => [content, measureKey], [content, measureKey]);
  const { ref, isTruncated, isMeasured } = useLineClampDetect({
    maxLines,
    content: measureTrigger,
    observeMutations: rich,
  });
  const contentId = useId();

  // Clamped from the first paint (the server cannot measure) — no full-text flash and layout
  // shift on hydration. After measuring, text that fits is unclamped (nothing to clip).
  const isClamped = !expanded && (isTruncated || !isMeasured);
  const showToggle = isTruncated;

  // Keyboard focus moving onto a link BELOW the clamp would land on hidden content: expand instead
  // (controlled: ask the parent). A link on a visible line, or a mouse click, does not expand.
  const handleFocus = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      if (expanded || !isTruncated) return;
      const target = e.target as Element;
      let keyboard = false;
      try {
        keyboard = target.matches(":focus-visible");
      } catch {
        // `:focus-visible` unsupported — treat as pointer focus.
      }
      if (!keyboard) return;
      const box = e.currentTarget;
      // Browsers scroll the clipped box to reveal the focused element BEFORE `focus` fires, so a
      // scrolled box is the signal; the geometry check covers engines that do not scroll it.
      const hidden =
        box.scrollTop > 0 || target.getBoundingClientRect().bottom > box.getBoundingClientRect().bottom + 1;
      if (!hidden) return;
      box.scrollTop = 0;
      setExpanded(true);
    },
    [expanded, isTruncated, setExpanded],
  );

  if (!rich && !content) return null;

  const Content = rich ? "div" : "p";

  return (
    <div className={cn(className)}>
      <Content
        ref={ref}
        id={contentId}
        dir={dir}
        onFocus={handleFocus}
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
          // Printing, or a browser without scripting (no toggle can run): show everything.
          UNCLAMP_WITHOUT_TOGGLE,
          contentClassName,
        )}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: isClamped ? maxLines : "unset",
          // `-webkit-line-clamp` does not hold for block children (two <p> clamp at ~4.6 lines):
          // bound rich content by its line height too. Inline children keep the ellipsis.
          maxHeight: isClamped && rich ? `${maxLines}lh` : undefined,
          overflow: isClamped ? "hidden" : "visible",
        }}
      >
        {rich ? children : content}
      </Content>
      {showToggle &&
        (renderToggle ? (
          renderToggle({ isExpanded: expanded, setExpanded })
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={contentId}
            className={cn(
              "mt-1 rounded-sm text-sm font-medium text-muted-foreground motion-safe:transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              toggleClassName,
            )}
          >
            {expanded ? labels.showLess : labels.showMore}
          </button>
        ))}
    </div>
  );
}

const ExpandableText = memo(ExpandableTextInner);
ExpandableText.displayName = "ExpandableText";

export { ExpandableText };
export default ExpandableText;
