"use client";

import { memo, useEffect, useId, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  defaultInfoListLabels,
  type InfoListLabels,
  type InfoListProps,
} from "./types";
import { InfoRow } from "./parts/info-row";

/** Would React render something? (`cond && <X />` with `cond` false is not content.) */
const isShown = (value: unknown) => value != null && value !== false && value !== "";

function InfoListInner({
  items,
  variant = "comfortable",
  separated,
  framed = true,
  heading,
  headingAs = "h3",
  linkComponent = "a",
  wrap = false,
  renderItem,
  labels: labelsProp,
  emptyState,
  className,
  headingClassName,
  itemClassName,
}: InfoListProps) {
  const headingId = useId();
  const HeadingTag = headingAs;

  const labels = useMemo<Required<InfoListLabels>>(
    () => ({
      // `undefined` must not erase the default.
      emptyText: labelsProp?.emptyText ?? defaultInfoListLabels.emptyText,
    }),
    [labelsProp?.emptyText],
  );

  // Dev-only, once per mount: compact rows are single-line, so `secondary` / `action` are ignored.
  const warnedRef = useRef(false);
  const dropsRichFields =
    process.env.NODE_ENV !== "production" &&
    variant === "compact" &&
    !renderItem &&
    items.some((item) => isShown(item.secondary) || isShown(item.action));
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      dropsRichFields &&
      !warnedRef.current
    ) {
      warnedRef.current = true;
      console.warn(
        '[info-list] the "compact" variant ignores `secondary` and `action`. Use variant="comfortable" or `renderItem` to show them.',
      );
    }
  }, [dropsRichFields]);

  const isEmpty = items.length === 0;

  // Auto-default per variant: comfortable=true, compact=false
  const separatedResolved =
    separated ?? (variant === "comfortable" ? true : false);

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
            "text-lg font-semibold text-foreground mb-4",
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
            className="text-sm text-muted-foreground"
          >
            {labels.emptyText}
          </p>
        )
      ) : (
        <ul
          role="list"
          className={cn(
            variant === "comfortable" ? "space-y-4" : "space-y-3",
          )}
        >
          {items.map((item, idx) =>
            renderItem ? (
              <li
                key={item.id}
                className={
                  cn(
                  // renderItem rows separate only on an explicit `separated`.
                  separated === true &&
                    idx > 0 &&
                    (variant === "comfortable"
                      ? "pt-4 border-t border-border/50"
                      : "pt-3 border-t border-border/50"),
                  itemClassName,
                  ) || undefined
                }
              >
                {renderItem(item)}
              </li>
            ) : (
              <InfoRow
                key={item.id}
                item={item}
                variant={variant}
                separated={separatedResolved && idx > 0}
                linkComponent={linkComponent}
                wrap={wrap}
                itemClassName={itemClassName}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

const InfoList = memo(InfoListInner);
InfoList.displayName = "InfoList";

export { InfoList };
export default InfoList;
