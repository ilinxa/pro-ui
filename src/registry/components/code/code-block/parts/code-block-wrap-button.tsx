"use client";
import { WrapText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCodeBlock } from "../hooks/use-code-block-context";

export interface CodeBlockWrapButtonProps {
  className?: string;
}

export function CodeBlockWrapButton({ className }: CodeBlockWrapButtonProps) {
  const { wrap, setWrap, labels } = useCodeBlock();
  const isWrapped = wrap === "wrap";

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn(
        "size-7 text-muted-foreground hover:text-foreground",
        isWrapped && "text-foreground",
        className,
      )}
      onClick={() => setWrap(isWrapped ? "scroll" : "wrap")}
      aria-label={labels.wrap}
      aria-pressed={isWrapped}
      title={labels.wrap}
    >
      <WrapText className="size-3.5" aria-hidden="true" />
    </Button>
  );
}
