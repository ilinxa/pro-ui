import { cn } from "@/lib/utils";
import type { ImageValue } from "../types";

export function PredefinedImage({
  value,
  className,
}: {
  value: ImageValue;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-md border border-border/70 bg-muted/30",
        className,
      )}
    >
      <img
        src={value.src}
        alt={value.alt ?? ""}
        className="block h-auto w-full max-w-full object-cover"
        loading="lazy"
      />
      {value.alt ? (
        <figcaption className="border-t border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
          {value.alt}
        </figcaption>
      ) : null}
    </figure>
  );
}
