"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmitActionsProps {
  submitLabel: string;
  cancelLabel: string;
  pending: boolean;
  showSpinner: boolean;
  onCancel: () => void;
  canCancel: boolean;
  formId?: string;
}

export function SubmitActions({
  submitLabel,
  cancelLabel,
  pending,
  showSpinner,
  onCancel,
  canCancel,
  formId,
}: SubmitActionsProps) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={!canCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        form={formId}
        aria-disabled={pending || undefined}
        disabled={pending}
      >
        {showSpinner ? (
          <Loader2
            aria-hidden="true"
            className="size-4 animate-spin"
          />
        ) : null}
        {submitLabel}
      </Button>
    </div>
  );
}
