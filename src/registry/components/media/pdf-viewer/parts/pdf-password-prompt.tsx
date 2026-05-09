"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ResolvedPdfViewerLabels } from "../types";

interface PdfPasswordPromptProps {
  open: boolean;
  labels: ResolvedPdfViewerLabels;
  error: Error | null;
  attempts: number;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  className?: string;
}

export function PdfPasswordPrompt({
  open,
  labels,
  error,
  attempts,
  onSubmit,
  onCancel,
}: PdfPasswordPromptProps) {
  const [value, setValue] = useState("");
  const showError = attempts > 0 && error;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value) return;
    onSubmit(value);
    setValue("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>{labels.passwordTitle}</DialogTitle>
          <DialogDescription>{labels.passwordHint}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={labels.passwordPlaceholder}
            aria-invalid={!!showError}
            aria-describedby={showError ? "pdf-viewer-password-error" : undefined}
          />
          {showError ? (
            <p
              id="pdf-viewer-password-error"
              className={cn("text-xs text-destructive")}
              role="alert"
            >
              {labels.passwordError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {labels.passwordCancel}
            </Button>
            <Button type="submit" size="sm" disabled={!value}>
              {labels.passwordSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
