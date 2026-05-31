"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMediaCapture,
  validateGalleryFile,
  type CapturedPhoto,
} from "../hooks/use-media-capture";
import { useCameraPermissions } from "../hooks/use-camera-permissions";
import { CameraPermissionPrompt } from "./camera-permission-prompt";
import { ShutterButton } from "./shutter-button";
import type {
  ComposerMode,
  StoryComposer01Labels,
  ValidationError,
} from "../types";

export interface ComposerCameraProps {
  /** Composer is open + we should hold a live camera stream. */
  enabled: boolean;
  /** Drives mirror behavior, default facing, and the shutter aria-label. */
  mode: ComposerMode;
  defaultFacing?: "user" | "environment";
  recordAudio?: boolean;
  maxFileSizeMb?: number;
  labels: Required<StoryComposer01Labels>;
  onPhoto: (photo: CapturedPhoto) => void;
  /** Loads an image / video file picked from the gallery into the editor. */
  onGalleryFile: (file: File) => void;
  onValidationError?: (error: ValidationError) => void;
  /** Fires when permission is denied so the host can show its own help. */
  onPermissionDenied?: () => void;
}

export function ComposerCamera({
  enabled,
  mode,
  defaultFacing,
  recordAudio = true,
  maxFileSizeMb = 50,
  labels,
  onPhoto,
  onGalleryFile,
  onValidationError,
  onPermissionDenied,
}: ComposerCameraProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const perms = useCameraPermissions();
  const capture = useMediaCapture({
    enabled,
    defaultFacing,
    recordAudio,
  });

  // Surface permission-denied to the consumer once.
  const deniedFiredRef = useRef(false);
  useEffect(() => {
    if (capture.status === "denied" && !deniedFiredRef.current) {
      deniedFiredRef.current = true;
      onPermissionDenied?.();
    } else if (capture.status !== "denied") {
      deniedFiredRef.current = false;
    }
  }, [capture.status, onPermissionDenied]);

  // Front-camera preview is mirrored to match user expectation; rear is not.
  const mirrored = capture.facing === "user";

  const handleShutter = async () => {
    if (busy || capture.status !== "ready") return;
    setBusy(true);
    try {
      const photo = await capture.takePhoto();
      onPhoto(photo);
    } catch {
      // Could surface as ValidationError but for now silently fail; C5 logs.
    } finally {
      setBusy(false);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file twice re-fires
    if (!file) return;
    const err = validateGalleryFile(file, maxFileSizeMb);
    if (err) {
      onValidationError?.(err);
      return;
    }
    onGalleryFile(file);
  };

  // ─── Permission UI ────────────────────────────────────────────────────
  const permissionVariant: null | "pending" | "denied" | "no-camera" | "error" =
    capture.status === "acquiring"
      ? "pending"
      : capture.status === "denied"
        ? "denied"
        : capture.status === "no-camera"
          ? "no-camera"
          : capture.status === "error"
            ? "error"
            : null;

  // Auto-retry on permission change (Q-P8a) — when the watcher flips to
  // "granted" but our capture is still in "denied", silently re-acquire.
  useEffect(() => {
    if (perms.state === "granted" && capture.status === "denied") {
      void capture.acquire();
    }
  }, [perms.state, capture]);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Live preview — black fallback shows when no stream */}
      <video
        ref={capture.videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "absolute inset-0 w-full h-full object-cover bg-black",
          mirrored && "scale-x-[-1]",
          permissionVariant !== null && "opacity-0",
        )}
      />

      {/* Permission overlay (denied / pending / no-camera / error) */}
      {permissionVariant !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <CameraPermissionPrompt
            variant={permissionVariant}
            labels={labels}
            onRetry={() => void capture.acquire()}
            onUsePicker={handleGalleryClick}
          />
        </div>
      )}

      {/* Bottom control row — gallery / shutter / switch-camera */}
      <div
        className={cn(
          "absolute left-0 right-0 z-20 flex items-center justify-between px-6",
          "bottom-[max(1.25rem,env(safe-area-inset-bottom))]",
        )}
      >
        {/* Gallery picker */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGalleryClick}
          aria-label={labels.galleryPicker}
          className="size-11 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 hover:text-white"
        >
          <ImageIcon className="size-5" />
        </Button>

        {/* Shutter — disabled until camera ready or in text-only mode */}
        <ShutterButton
          onPress={handleShutter}
          disabled={
            busy ||
            capture.status !== "ready" ||
            mode === "text" /* text-only mode has no shutter */
          }
          ariaLabel={
            mode === "video" ? labels.shutterVideoStart : labels.shutterPhoto
          }
        />

        {/* Switch camera (only when ≥2 devices) */}
        {capture.canSwitchCamera ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void capture.switchCamera()}
            aria-label={labels.switchCamera}
            className="size-11 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 hover:text-white"
          >
            <SwitchCamera className="size-5" />
          </Button>
        ) : (
          <div className="size-11" aria-hidden />
        )}
      </div>

      {/* Hidden file input for gallery pick */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
