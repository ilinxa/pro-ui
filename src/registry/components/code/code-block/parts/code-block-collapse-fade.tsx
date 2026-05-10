"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCodeBlock } from "../hooks/use-code-block-context";

interface CodeBlockCollapseFadeProps {
  hiddenLineCount: number;
  className?: string;
}

export function CodeBlockCollapseFade({
  hiddenLineCount,
  className,
}: CodeBlockCollapseFadeProps) {
  const { expanded, setExpanded, labels } = useCodeBlock();

  if (expanded) {
    return (
      <div className={cn("flex justify-center border-t border-border/60 py-2", className)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(false)}
        >
          <ChevronUp className="size-3.5" aria-hidden="true" />
          {labels.showLess}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center",
        "bg-gradient-to-t from-card via-card/85 to-transparent",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="pointer-events-auto mb-2 h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(true)}
      >
        <ChevronDown className="size-3.5" aria-hidden="true" />
        {`${labels.showMore} (${hiddenLineCount} more lines)`}
      </Button>
    </div>
  );
}
