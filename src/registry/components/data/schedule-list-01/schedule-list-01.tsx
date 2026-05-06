"use client";

import { memo, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SCHEDULE_LIST_LABELS,
  type ScheduleList01Labels,
  type ScheduleList01Props,
} from "./types";
import { ScheduleRow } from "./parts/schedule-row";

function ScheduleList01Inner({
  items,
  heading,
  headingAs = "h2",
  framed = true,
  linkComponent = "a",
  labels: labelsProp,
  renderItem,
  renderTime,
  emptyState,
  className,
  headingClassName,
  itemClassName,
}: ScheduleList01Props) {
  const headingId = useId();
  const HeadingTag = headingAs;

  const labels = useMemo<Required<ScheduleList01Labels>>(
    () => ({ ...DEFAULT_SCHEDULE_LIST_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const isEmpty = items.length === 0;

  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      className={cn("space-y-6", className)}
    >
      {heading && (
        <HeadingTag
          id={headingId}
          className={cn(
            "text-2xl font-bold text-foreground",
            headingClassName,
          )}
        >
          {heading}
        </HeadingTag>
      )}

      {isEmpty ? (
        emptyState ?? (
          <p
            role="status"
            className="text-sm text-muted-foreground py-4"
          >
            {labels.emptyText}
          </p>
        )
      ) : (
        <ol
          role="list"
          className={cn(framed ? "space-y-4" : "space-y-2")}
        >
          {items.map((item) =>
            renderItem ? (
              <li key={item.id}>{renderItem(item)}</li>
            ) : (
              <ScheduleRow
                key={item.id}
                item={item}
                framed={framed}
                timeSeparator={labels.timeRangeSeparator}
                renderTime={renderTime}
                linkComponent={linkComponent}
                itemClassName={itemClassName}
              />
            ),
          )}
        </ol>
      )}
    </section>
  );
}

const ScheduleList01 = memo(ScheduleList01Inner);
ScheduleList01.displayName = "ScheduleList01";

export { ScheduleList01 };
export default ScheduleList01;
