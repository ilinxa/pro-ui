import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterBarCategoryItem } from "../types";

/**
 * Pill-row of category chips. The first chip is the "All" sentinel —
 * clicking it sets value to null (clears the category filter).
 *
 * Active chip uses Button `variant="default"` (filled lime), inactive uses
 * `variant="outline"`. Each chip is a real button with `aria-pressed`.
 */
export function ChipRow({
  items,
  value,
  onChange,
  allLabel,
  ariaLabel,
  className,
}: {
  items: FilterBarCategoryItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  allLabel: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap justify-center gap-2", className)}
    >
      <Button
        variant={value === null ? "default" : "outline"}
        size="sm"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className="rounded-full"
      >
        {allLabel}
      </Button>
      {items.map((item) => (
        <Button
          key={item.value}
          variant={value === item.value ? "default" : "outline"}
          size="sm"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
          className="rounded-full"
        >
          {item.label ?? item.value}
        </Button>
      ))}
    </div>
  );
}
