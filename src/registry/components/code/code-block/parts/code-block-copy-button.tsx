"use client";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCodeBlock } from "../hooks/use-code-block-context";

export interface CodeBlockCopyButtonProps {
  className?: string;
}

export function CodeBlockCopyButton({ className }: CodeBlockCopyButtonProps) {
  const { copy, copied, copyFailed, labels } = useCodeBlock();

  const Icon = copyFailed ? X : copied ? Check : Copy;
  const label = copyFailed ? labels.copyFailed : copied ? labels.copied : labels.copy;

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn("size-7 text-muted-foreground hover:text-foreground", className)}
        onClick={() => void copy()}
        aria-label={label}
        title={label}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </Button>
      {/* Screen-reader-only status. role="status" with aria-live="polite" so
          the SR announces "Copied" after the icon swap. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? labels.copied : copyFailed ? labels.copyFailed : ""}
      </span>
    </>
  );
}
