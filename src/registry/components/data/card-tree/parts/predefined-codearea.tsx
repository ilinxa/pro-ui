import { cn } from "@/lib/utils";
import type { CodeAreaValue } from "../types";

export function PredefinedCodeArea({
  value,
  className,
}: {
  value: CodeAreaValue;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-md border border-border/70 bg-muted/50",
        className,
      )}
    >
      <figcaption className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{value.format || "code"}</span>
      </figcaption>
      <pre className="overflow-x-auto px-2.5 py-2 font-mono text-[12.5px] leading-relaxed">
        <code>{value.content}</code>
      </pre>
    </figure>
  );
}
