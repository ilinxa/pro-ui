import { cn } from "@/lib/utils";
import type { QuoteValue } from "../types";

export function PredefinedQuote({
  value,
  className,
}: {
  value: QuoteValue;
  className?: string;
}) {
  return (
    <blockquote
      className={cn(
        "rounded-sm border-s-2 border-primary/70 bg-muted/30 ps-3 pe-2.5 py-1.5 text-[13.5px] italic leading-relaxed text-foreground/90",
        className,
      )}
    >
      {value}
    </blockquote>
  );
}
