"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockFooterProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlockFooter({ children, className }: CodeBlockFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-border/60 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
