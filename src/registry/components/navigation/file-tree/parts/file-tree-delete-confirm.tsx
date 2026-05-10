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
import type { FsNode, FileTreeLabels } from "../types";

interface FileTreeDeleteConfirmProps {
  open: boolean;
  ids: string[];
  nodes: FsNode[];
  labels: FileTreeLabels;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FileTreeDeleteConfirm(props: FileTreeDeleteConfirmProps) {
  const { open, ids, nodes, labels, onConfirm, onCancel } = props;
  const count = ids.length;
  const first = nodes[0]?.name ?? "";
  const title =
    count === 1
      ? `Delete "${first}"?`
      : labels.deleteConfirmTitle.replace("items", `${count} items`);
  const description =
    count === 1
      ? labels.deleteConfirmDescription
      : `Delete "${first}" and ${count - 1} other${count - 1 > 1 ? "s" : ""}? ${labels.deleteConfirmDescription}`;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {labels.deleteConfirmCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40"
          >
            {labels.deleteConfirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
