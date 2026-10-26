"use client";

import { Loader2 } from "lucide-react";

export function LoadingRow({ text }: { text: string }) {
  return (
    <div
      role="status"
      data-slot="entity-picker-loading"
      className="flex items-center justify-center gap-2 px-2 py-3 text-xs text-muted-foreground"
    >
      <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
      {text}
    </div>
  );
}

export function ErrorRow({
  message,
  retryText,
  onRetry,
}: {
  message: string;
  retryText: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      data-slot="entity-picker-error"
      className="flex flex-col items-center gap-2 px-2 py-3 text-center text-xs text-destructive"
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {retryText}
        </button>
      ) : null}
    </div>
  );
}
