"use client";

import { memo, useId, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type {
  PeopleGridAlignment,
  PeopleGridAvatarSize,
  PeopleGridItem,
} from "../types";
import { getInitials } from "../lib/get-initials";

interface PersonCardProps {
  item: PeopleGridItem;
  avatarSize: PeopleGridAvatarSize;
  alignment: PeopleGridAlignment;
  linkComponent: ElementType;
  /** Heading level of the person's name. */
  headingAs: "h3" | "h4" | "h5" | "h6";
  locale?: string;
  renderActions?: (item: PeopleGridItem) => ReactNode;
  renderBadge?: (item: PeopleGridItem) => ReactNode;
  itemClassName?: string;
}

const AVATAR_SIZE_MAP: Record<
  PeopleGridAvatarSize,
  { wrapper: string; initials: string }
> = {
  sm: { wrapper: "w-12 h-12", initials: "text-sm" },
  md: { wrapper: "w-16 h-16", initials: "text-base" },
  lg: { wrapper: "w-24 h-24", initials: "text-2xl" },
};

function PersonCardInner({
  item,
  avatarSize,
  alignment,
  linkComponent: LinkComponent,
  headingAs: Heading,
  locale,
  renderActions,
  renderBadge,
  itemClassName,
}: PersonCardProps) {
  const nameId = useId();
  const isLinked = item.href != null && item.href.length > 0;
  const sizeClasses = AVATAR_SIZE_MAP[avatarSize];
  const badge = renderBadge?.(item);
  const actions = renderActions?.(item);
  const centered = alignment === "center";

  return (
    <li
      className={cn(
        "relative group",
        centered ? "text-center" : "text-start",
        itemClassName,
      )}
    >
      <div
        className={cn(
          "rounded-full overflow-hidden border-4 border-primary/20 mb-3",
          sizeClasses.wrapper,
          centered ? "mx-auto" : "",
        )}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.imageAlt ?? ""}
            width={item.imageWidth}
            height={item.imageHeight}
            srcSet={item.imageSrcSet}
            sizes={item.imageSizes}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className={cn(
              "w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold",
              sizeClasses.initials,
            )}
          >
            {getInitials(item.name, locale)}
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-x-1.5",
          centered ? "justify-center" : "justify-start",
        )}
      >
        <Heading
          id={nameId}
          className="font-semibold text-foreground motion-safe:group-hover:text-primary transition-colors"
        >
          {item.name}
        </Heading>
        {badge != null && badge !== false && (
          <span className="relative z-10 inline-flex items-center">{badge}</span>
        )}
      </div>
      {item.title && (
        <p className="text-sm text-muted-foreground">{item.title}</p>
      )}

      {actions != null && actions !== false && (
        <div
          className={cn(
            "relative z-10 mt-3 flex flex-wrap gap-2",
            centered ? "justify-center" : "justify-start",
          )}
        >
          {actions}
        </div>
      )}

      {isLinked && (
        <LinkComponent
          href={item.href}
          aria-labelledby={nameId}
          className="absolute inset-0 z-0 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      )}
    </li>
  );
}

export const PersonCard = memo(PersonCardInner);
PersonCard.displayName = "PersonCard";
