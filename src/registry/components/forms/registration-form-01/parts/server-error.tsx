"use client";

import { AlertCircle } from "lucide-react";

export interface ServerErrorProps {
  message: string;
}

/**
 * `role="alert"` banner above the form for server-side errors (controlled
 * `errorMessage` prop). Returns null when no message — the caller checks
 * before mounting.
 */
export function ServerError({ message }: ServerErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
