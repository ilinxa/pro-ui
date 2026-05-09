"use client";

import { memo, useId, useMemo, type ReactNode } from "react";
import { Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PROGRESS_TIMELINE_LABELS,
  type ProgressTimeline01Props,
  type TimelineLabelText,
  type TimelineState,
} from "./types";
import { deriveTimelineState } from "./lib/timeline-state";

function resolveLabel(
  text: TimelineLabelText | undefined,
  state: TimelineState,
): ReactNode {
  if (text == null) return null;
  return typeof text === "function" ? text(state) : text;
}

function ProgressTimeline01Inner({
  start,
  end,
  now,
  value,
  statusOverride,
  heading,
  headingAs = "h3",
  headingIcon: HeadingIconProp,
  framed = true,
  marker = "dot",
  labels: labelsProp,
  renderCenterLabel,
  className,
  headingClassName,
  barClassName,
  markerClassName,
  captionsClassName,
}: ProgressTimeline01Props) {
  const headingId = useId();
  const HeadingTag = headingAs;
  const HeadingIcon =
    HeadingIconProp === undefined ? Timer : HeadingIconProp;

  const labels = useMemo<typeof DEFAULT_PROGRESS_TIMELINE_LABELS>(
    () => ({ ...DEFAULT_PROGRESS_TIMELINE_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const state = useMemo(
    () => deriveTimelineState(start, end, now),
    [start, end, now],
  );

  const effectivePercent = value ?? state.percent;
  const effectiveStatus = statusOverride ?? state.status;

  const centerLabel: ReactNode = renderCenterLabel
    ? renderCenterLabel(state)
    : effectiveStatus === "before"
      ? resolveLabel(labels.beforeText, state)
      : effectiveStatus === "after"
        ? resolveLabel(labels.afterText, state)
        : resolveLabel(labels.activeText, state);

  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      className={cn(
        framed && "bg-card rounded-2xl p-6 border border-border/50",
        className,
      )}
    >
      {heading && (
        <HeadingTag
          id={headingId}
          className={cn(
            "text-lg font-semibold text-foreground mb-4 flex items-center gap-2",
            headingClassName,
          )}
        >
          {HeadingIcon ? (
            <HeadingIcon
              aria-hidden="true"
              className="w-5 h-5 text-primary"
            />
          ) : null}
          {heading}
        </HeadingTag>
      )}

      <div className="space-y-4">
        <div className={cn("relative", barClassName)}>
          <Progress
            value={effectivePercent}
            className={cn(
              "h-4 rounded-full",
              effectiveStatus === "before" &&
                "**:data-[slot=progress-indicator]:bg-muted-foreground/30",
              effectiveStatus === "after" &&
                "**:data-[slot=progress-indicator]:bg-muted-foreground/40",
            )}
            aria-label={labels.ariaLabel}
          />
          {marker === "dot" && (
            <div
              aria-hidden="true"
              className="absolute top-0 h-4 flex items-center justify-center pointer-events-none"
              style={{
                left: `${effectivePercent}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-4 border-background shadow-lg",
                  effectiveStatus === "active"
                    ? "bg-primary"
                    : effectiveStatus === "after"
                      ? "bg-foreground"
                      : "bg-muted-foreground",
                  markerClassName,
                )}
              />
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex justify-between text-sm",
            captionsClassName,
          )}
        >
          <span className="text-muted-foreground">{labels.startLabel}</span>
          <span className="text-foreground font-medium">{centerLabel}</span>
          <span className="text-muted-foreground">{labels.endLabel}</span>
        </div>
      </div>
    </section>
  );
}

const ProgressTimeline01 = memo(ProgressTimeline01Inner);
ProgressTimeline01.displayName = "ProgressTimeline01";

export { ProgressTimeline01 };
export default ProgressTimeline01;
