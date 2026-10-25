"use client";

import { Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaEditorResolvedLabels } from "../../../types";

export type PermissionPromptVariant =
  | "idle"
  | "pending"
  | "denied"
  | "no-camera"
  | "error";

export interface CameraPermissionPromptProps {
  variant: PermissionPromptVariant;
  labels: MediaEditorResolvedLabels;
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
          "flex flex-col items-center justify-center gap-3 text-center text-media-overlay-foreground/80 px-6",
          className,
        )}
      >
        <Camera className="size-8 animate-pulse" />
        <p className="text-sm">{labels.permissionRequesting}</p>
      </div>
    );
  }

  if (variant === "idle") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 text-center text-media-overlay-foreground px-6 max-w-sm mx-auto",
          className,
        )}
      >
        <Camera className="size-8" />
        <div className="space-y-1.5">
          <p className="text-base font-medium">{labels.permissionIdleTitle}</p>
          <p className="text-sm text-media-overlay-foreground/80 leading-relaxed">
            {labels.permissionIdleBody}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Button
            onClick={onRetry}
            variant="secondary"
            className="bg-media-overlay-foreground text-black hover:bg-media-overlay-foreground/90"
          >
            {labels.permissionEnable}
          </Button>
          <Button
            onClick={onUsePicker}
            variant="ghost"
            className="text-media-overlay-foreground hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground"
          >
            {labels.permissionUsePicker}
          </Button>
        </div>
      </div>
    );
  }

  const title =
    variant === "no-camera"
      ? labels.permissionNoCameraTitle
      : variant === "error"
        ? labels.permissionErrorTitle
        : labels.permissionDeniedTitle;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center text-media-overlay-foreground px-6 max-w-sm mx-auto",
        className,
      )}
    >
      <AlertTriangle className="size-8 text-warning" />
      <div className="space-y-1.5">
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm text-media-overlay-foreground/80 leading-relaxed">
          {labels.permissionDeniedBody}
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Button
          onClick={onRetry}
          variant="secondary"
          className="bg-media-overlay-foreground text-black hover:bg-media-overlay-foreground/90"
        >
          {labels.permissionRetry}
        </Button>
        <Button
          onClick={onUsePicker}
          variant="ghost"
          className="text-media-overlay-foreground hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground"
        >
          {labels.permissionUsePicker}
        </Button>
      </div>
    </div>
  );
}
