"use client";

import { Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoryComposer01Labels } from "../types";

export type PermissionPromptVariant =
  | "pending"
  | "denied"
  | "no-camera"
  | "error";

export interface CameraPermissionPromptProps {
  variant: PermissionPromptVariant;
  labels: Required<StoryComposer01Labels>;
  onRetry: () => void;
  onUsePicker: () => void;
  className?: string;
}

export function CameraPermissionPrompt({
  variant,
  labels,
  onRetry,
  onUsePicker,
  className,
}: CameraPermissionPromptProps) {
  if (variant === "pending") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 text-center text-white/70 px-6",
          className,
        )}
      >
        <Camera className="size-8 animate-pulse" />
        <p className="text-sm">{labels.permissionRequesting}</p>
      </div>
    );
  }

  const title =
    variant === "no-camera"
      ? "No camera available"
      : variant === "error"
        ? "Camera unavailable"
        : labels.permissionDeniedTitle;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center text-white px-6 max-w-sm mx-auto",
        className,
      )}
    >
      <AlertTriangle className="size-8 text-amber-400" />
      <div className="space-y-1.5">
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm text-white/70 leading-relaxed">
          {labels.permissionDeniedBody}
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Button
          onClick={onRetry}
          variant="secondary"
          className="bg-white text-black hover:bg-white/90"
        >
          {labels.permissionRetry}
        </Button>
        <Button
          onClick={onUsePicker}
          variant="ghost"
          className="text-white hover:bg-white/10 hover:text-white"
        >
          {labels.permissionUsePicker}
        </Button>
      </div>
    </div>
  );
}
