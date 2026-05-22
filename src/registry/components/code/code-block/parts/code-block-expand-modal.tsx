"use client";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CodeBlockExpandModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title?: string;
  children: ReactNode;
}

export function CodeBlockExpandModal({
  open,
  onOpenChange,
  title,
  children,
}: CodeBlockExpandModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(95vw,1200px)] gap-0 p-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle className="text-sm font-medium">
            {title ?? "Code"}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
