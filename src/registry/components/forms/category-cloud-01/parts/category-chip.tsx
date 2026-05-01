import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NormalizedItem } from "../types";

/**
 * One chip in the cloud. Native `<button>` for keyboard semantics +
 * `<Badge>` inside for visual.
 */
export function CategoryChip({
  item,
  isActive,
  countLabel,
  onClick,
}: {
  item: NormalizedItem;
  isActive: boolean;
  countLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Badge
        variant={isActive ? "default" : "secondary"}
        className={cn("cursor-pointer", isActive ? "" : "hover:bg-secondary/80")}
      >
        {item.label}
        {countLabel}
      </Badge>
    </button>
  );
}
