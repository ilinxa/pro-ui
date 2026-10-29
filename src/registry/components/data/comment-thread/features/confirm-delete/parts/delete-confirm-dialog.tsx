"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { CommentDeleteDialogProps, CommentDeleteRequest } from "../../../types";

/**
 * The delete confirmation: an alert dialog that is open while `request` is not `null`.
 * Cancel and Escape keep the comment (`onResolve(false)`), Delete removes it (`onResolve(true)`);
 * each request is answered once.
 */
function CommentDeleteConfirmDialogInner({ request, labels, onResolve }: CommentDeleteDialogProps) {
  // The text stays through the close animation, after `request` is already `null`.
  const [shown, setShown] = useState<CommentDeleteRequest | null>(request);
  if (request && request !== shown) setShown(request);

  // The request usually comes from a menu item: the menu closes and hands focus back to its
  // trigger in the same tick, which would take focus from a dialog opened right then. Open a
  // tick later.
  const [armed, setArmed] = useState<CommentDeleteRequest | null>(null);
  useEffect(() => {
    if (!request) return;
    const timer = setTimeout(() => setArmed(request), 0);
    return () => clearTimeout(timer);
  }, [request]);

  const answered = useRef<CommentDeleteRequest | null>(null);
  const resolve = (confirmed: boolean) => {
    if (!request || answered.current === request) return;
    answered.current = request;
    onResolve(confirmed);
  };

  return (
    <AlertDialog
      open={request !== null && armed === request}
      // Escape (and any dismissal that is not a button) arrives here; the buttons answer first.
      onOpenChange={(next) => {
        if (!next) resolve(false);
      }}
    >
      {/* data-keyboard-ignore: a host with window-level arrow-key handling (story-viewer) stands down. */}
      <AlertDialogContent data-keyboard-ignore="">
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {shown ? labels.deleteBody(shown.hasReplies) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolve(false)}>{labels.deleteCancel}</AlertDialogCancel>
          {/* A plain shadcn Button: some styles' AlertDialogAction wraps a default Button with asChild,
              whose classes win over a passed className (unreadable in dark mode). The dialog is
              controlled, so the button needs no built-in close. */}
          <Button type="button" variant="destructive" onClick={() => resolve(true)}>
            {labels.deleteConfirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const CommentDeleteConfirmDialog = memo(CommentDeleteConfirmDialogInner);
CommentDeleteConfirmDialog.displayName = "CommentDeleteConfirmDialog";
