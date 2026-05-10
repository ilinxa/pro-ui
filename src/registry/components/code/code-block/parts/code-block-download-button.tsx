"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCodeBlock } from "../hooks/use-code-block-context";

export interface CodeBlockDownloadButtonProps {
  className?: string;
}

export function CodeBlockDownloadButton({ className }: CodeBlockDownloadButtonProps) {
  const { download, labels } = useCodeBlock();

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn("size-7 text-muted-foreground hover:text-foreground", className)}
      onClick={download}
      aria-label={labels.download}
      title={labels.download}
    >
      <Download className="size-3.5" aria-hidden="true" />
    </Button>
  );
}
