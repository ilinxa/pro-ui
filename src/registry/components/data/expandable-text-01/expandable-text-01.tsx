"use client";

import { memo, useCallback, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_EXPANDABLE_TEXT_LABELS,
  type ExpandableText01Labels,
  type ExpandableText01Props,
} from "./types";
import { useLineClampDetect } from "./hooks/use-line-clamp-detect";

function ExpandableText01Inner({
  content,
  maxLines = 3,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  labels: labelsProp,
  renderToggle,
  className,
  contentClassName,
  toggleClassName,
}: ExpandableText01Props) {
  const labels = useMemo<Required<ExpandableText01Labels>>(
    () => ({ ...DEFAULT_EXPANDABLE_TEXT_LABELS, ...labelsProp }),
    [labelsProp],
  );

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

  const { ref, isTruncated } = useLineClampDetect({ maxLines, content });
  const contentId = useId();

  const isClamped = !expanded && isTruncated;
  const showToggle = isTruncated;

  if (!content) return null;

  return (
    <div className={cn(className)}>
      <p
        ref={ref}
        id={contentId}
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
          contentClassName,
        )}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: isClamped ? maxLines : "unset",
          overflow: isClamped ? "hidden" : "visible",
        }}
      >
        {content}
      </p>
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
              "mt-1 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              toggleClassName,
            )}
          >
            {expanded ? labels.showLess : labels.showMore}
          </button>
        ))}
    </div>
  );
}

const ExpandableText01 = memo(ExpandableText01Inner);
ExpandableText01.displayName = "ExpandableText01";

export { ExpandableText01 };
export default ExpandableText01;
