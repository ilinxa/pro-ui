"use client";

import { memo, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SCHEDULE_LIST_LABELS,
  type ScheduleListLabels,
  type ScheduleListProps,
} from "./types";
import { ScheduleRow } from "./parts/schedule-row";

function ScheduleListInner({
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
}: ScheduleListProps) {
  const headingId = useId();
  const HeadingTag = headingAs;

  const labels = useMemo<Required<ScheduleListLabels>>(
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

const ScheduleList = memo(ScheduleListInner);
ScheduleList.displayName = "ScheduleList";

export { ScheduleList };
export default ScheduleList;
