import { cn } from "@/lib/utils";
import type { ForceGraphProps } from "./types";

export function ForceGraph({ title, description, className }: ForceGraphProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-6 text-card-foreground",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-foreground">{title}</span>
        {description ? (
          <span className="text-sm text-muted-foreground">{description}</span>
        ) : null}
      </div>
    </div>
  );
}
