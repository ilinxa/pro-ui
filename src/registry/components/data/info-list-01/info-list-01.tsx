"use client";

import { memo, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_INFO_LIST_LABELS,
  type InfoList01Labels,
  type InfoList01Props,
} from "./types";
import { InfoRow } from "./parts/info-row";

function InfoList01Inner({
  items,
  variant = "comfortable",
  separated,
  framed = true,
  heading,
  headingAs = "h3",
  linkComponent = "a",
  renderItem,
  labels: labelsProp,
  emptyState,
  className,
  headingClassName,
  itemClassName,
}: InfoList01Props) {
  const headingId = useId();
  const HeadingTag = headingAs;

  const labels = useMemo<Required<InfoList01Labels>>(
    () => ({ ...DEFAULT_INFO_LIST_LABELS, ...labelsProp }),
    [labelsProp],
  );

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
              <li key={item.id}>{renderItem(item)}</li>
            ) : (
              <InfoRow
                key={item.id}
                item={item}
                variant={variant}
                separated={separatedResolved && idx > 0}
                linkComponent={linkComponent}
                itemClassName={itemClassName}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

const InfoList01 = memo(InfoList01Inner);
InfoList01.displayName = "InfoList01";

export { InfoList01 };
export default InfoList01;
