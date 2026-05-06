"use client";

import { useId, type ElementType } from "react";
import { cn } from "@/lib/utils";
import type {
  PeopleGrid01Alignment,
  PeopleGrid01AvatarSize,
  PeopleGridItem,
} from "../types";
import { getInitials } from "../lib/get-initials";

interface PersonCardProps {
  item: PeopleGridItem;
  avatarSize: PeopleGrid01AvatarSize;
  alignment: PeopleGrid01Alignment;
  linkComponent: ElementType;
  itemClassName?: string;
}

const AVATAR_SIZE_MAP: Record<
  PeopleGrid01AvatarSize,
  { wrapper: string; initials: string }
> = {
  sm: { wrapper: "w-12 h-12", initials: "text-sm" },
  md: { wrapper: "w-16 h-16", initials: "text-base" },
  lg: { wrapper: "w-24 h-24", initials: "text-2xl" },
};

export function PersonCard({
  item,
  avatarSize,
  alignment,
  linkComponent: LinkComponent,
  itemClassName,
}: PersonCardProps) {
  const nameId = useId();
  const isLinked = item.href != null && item.href.length > 0;
  const sizeClasses = AVATAR_SIZE_MAP[avatarSize];

  return (
    <li
      className={cn(
        "relative group",
        alignment === "center" ? "text-center" : "text-start",
        itemClassName,
      )}
    >
      <div
        className={cn(
          "rounded-full overflow-hidden border-4 border-primary/20 mb-3",
          sizeClasses.wrapper,
          alignment === "center" ? "mx-auto" : "",
        )}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.imageAlt ?? item.name}
            loading="lazy"
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
            {getInitials(item.name)}
          </div>
        )}
      </div>

      <h4
        id={nameId}
        className="font-semibold text-foreground motion-safe:group-hover:text-primary transition-colors"
      >
        {item.name}
      </h4>
      {item.title && (
        <p className="text-sm text-muted-foreground">{item.title}</p>
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
