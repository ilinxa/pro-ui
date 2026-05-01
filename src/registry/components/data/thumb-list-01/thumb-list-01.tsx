import { memo } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThumbRow } from "./parts/thumb-row";
import { ThumbListEmpty } from "./parts/empty-state";
import { THUMB_LIST_DEFAULT_LABELS, type ThumbList01Props } from "./types";

function ThumbList01Inner(props: ThumbList01Props) {
  const {
    items,
    framed = true,
    headingAs: HeadingTag = "h3",
    headerIcon = BookOpen,
    linkComponent = "a",
    renderMeta,
    emptyState,
    labels,
    className,
    headerClassName,
    itemClassName,
    imageClassName,
    titleClassName,
    metaClassName,
  } = props;

  const resolvedLabels = { ...THUMB_LIST_DEFAULT_LABELS, ...labels };
  const HeaderIcon = headerIcon;
  const isEmpty = items.length === 0;

  return (
    <section
      className={cn(
        framed && "bg-card rounded-2xl p-6 border border-border/50",
        className
      )}
    >
      <HeadingTag
        className={cn(
          "text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2",
          headerClassName
        )}
      >
        {HeaderIcon ? (
          <HeaderIcon className="w-5 h-5 text-primary" aria-hidden="true" />
        ) : null}
        {resolvedLabels.heading}
      </HeadingTag>

      {isEmpty ? (
        <ThumbListEmpty
          custom={emptyState}
          message={resolvedLabels.emptyText}
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <ThumbRow
              key={item.id}
              item={item}
              linkComponent={linkComponent}
              renderMeta={renderMeta}
              itemClassName={itemClassName}
              imageClassName={imageClassName}
              titleClassName={titleClassName}
              metaClassName={metaClassName}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export const ThumbList01 = memo(ThumbList01Inner);
ThumbList01.displayName = "ThumbList01";
