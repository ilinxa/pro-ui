import type { ElementType, MouseEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NormalizedItem } from "../types";

const chipClass =
  "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * One chip in the cloud. A native `<button>` (toggle) by default, or — when `href` is given — the
 * `linkComponent` element type (default `<a>`) with `aria-current="page"` on the active chip. A `<Badge>`
 * inside carries the visual.
 */
export function CategoryChip({
  item,
  isActive,
  countLabel,
  onClick,
  href,
  linkComponent,
}: {
  item: NormalizedItem;
  isActive: boolean;
  countLabel: string;
  onClick: () => void;
  href?: string;
  linkComponent?: ElementType;
}) {
  const badge = (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn("cursor-pointer", isActive ? "" : "hover:bg-secondary/80")}
    >
      {item.label}
      {countLabel}
    </Badge>
  );

  if (typeof href === "string") {
    const Link: ElementType = linkComponent ?? "a";
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        onClick={(event: MouseEvent) => {
          // Ctrl / Cmd / Shift / Alt open the link elsewhere: the current page does not change.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          onClick();
        }}
        className={chipClass}
      >
        {badge}
      </Link>
    );
  }

  return (
    <button type="button" aria-pressed={isActive} onClick={onClick} className={chipClass}>
      {badge}
    </button>
  );
}
