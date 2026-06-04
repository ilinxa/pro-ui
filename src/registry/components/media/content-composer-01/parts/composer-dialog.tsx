"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ComposerDialogProps {
  open: boolean;
  /** forwarded to shadcn Dialog; the root routes close through the discard guard (C11) */
  onOpenChange: (open: boolean) => void;
  title: string;
  /** REQUIRED — Radix/Base-UI a11y needs a Title AND a Description on DialogContent
   *  (the story-composer-01 v0.1.2 lesson; missing one logs a console warning). */
  description: string;
  children: ReactNode;
  className?: string;
}

/**
 * presentation="dialog" wrapper. shadcn Dialog already traps focus + handles
 * Escape; we widen the default `sm:max-w-sm` cap for the multi-step composer
 * surface. Uses only the stable Dialog/DialogContent/DialogTitle/DialogDescription
 * API (no `asChild`/anchor) so it stays clear of the F-cross-13 divergence class.
 */
export function ComposerDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ComposerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] gap-4 overflow-y-auto sm:max-w-2xl",
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
