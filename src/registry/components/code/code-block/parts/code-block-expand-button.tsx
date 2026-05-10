"use client";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCodeBlock } from "../hooks/use-code-block-context";

export interface CodeBlockExpandButtonProps {
  className?: string;
}

export function CodeBlockExpandButton({ className }: CodeBlockExpandButtonProps) {
  const { setModalOpen, labels } = useCodeBlock();

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn("size-7 text-muted-foreground hover:text-foreground", className)}
      onClick={() => setModalOpen(true)}
      aria-label={labels.expand}
      title={labels.expand}
    >
      <Maximize2 className="size-3.5" aria-hidden="true" />
    </Button>
  );
}
