"use client";

import { memo, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  defaultPeopleGridLabels,
  type PeopleGridColumns,
  type PeopleGridLabels,
  type PeopleGridProps,
} from "./types";
import { PersonCard } from "./parts/person-card";

const COLUMNS_MAP: Record<PeopleGridColumns, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
};

const CARD_HEADING_BELOW = { h2: "h3", h3: "h4", h4: "h5" } as const;

function PeopleGridInner({
  items,
  heading,
  headingAs = "h2",
  cardHeadingAs,
  locale,
  columns = 3,
  avatarSize = "lg",
  alignment = "center",
  linkComponent = "a",
  renderItem,
  renderActions,
  renderBadge,
  labels: labelsProp,
  emptyState,
  className,
  headingClassName,
  gridClassName,
  itemClassName,
}: PeopleGridProps) {
  const headingId = useId();
  const HeadingTag = headingAs;

  // `?? "h3"`: an untyped `headingAs` outside h2–h4 (CMS data) still renders, as it did in 0.2.0.
  const cardHeading = cardHeadingAs ?? CARD_HEADING_BELOW[headingAs] ?? "h3";

  // An `undefined` key keeps its default (spread would let it erase the default).
  const emptyTextProp = labelsProp?.emptyText;
  const labels = useMemo<Required<PeopleGridLabels>>(
    () => ({ emptyText: emptyTextProp ?? defaultPeopleGridLabels.emptyText }),
    [emptyTextProp],
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
            className="text-sm text-muted-foreground"
          >
            {labels.emptyText}
          </p>
        )
      ) : (
        <ul
          role="list"
          className={cn("grid gap-6", COLUMNS_MAP[columns], gridClassName)}
        >
          {items.map((item) =>
            renderItem ? (
              <li key={item.id}>{renderItem(item)}</li>
            ) : (
              <PersonCard
                key={item.id}
                item={item}
                avatarSize={avatarSize}
                alignment={alignment}
                linkComponent={linkComponent}
                itemClassName={itemClassName}
                headingAs={cardHeading}
                locale={locale}
                renderActions={renderActions}
                renderBadge={renderBadge}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

const PeopleGrid = memo(PeopleGridInner);
PeopleGrid.displayName = "PeopleGrid";

export { PeopleGrid };
export default PeopleGrid;
