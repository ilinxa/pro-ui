"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { StoryComposer01Labels } from "../types";

export interface DiscardConfirmDialogProps {
  open: boolean;
  labels: Required<StoryComposer01Labels>;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Q-P10a guard — confirms before discarding unsaved edits.
 *
 * Mounted unconditionally; the parent owns `open`. Consumers opt out
 * entirely via `confirmOnDiscard: false`.
 */
export function DiscardConfirmDialog({
  open,
  labels,
  onCancel,
  onConfirm,
}: DiscardConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.discardConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {labels.discardConfirmBody}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {labels.discardCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {labels.discardConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
