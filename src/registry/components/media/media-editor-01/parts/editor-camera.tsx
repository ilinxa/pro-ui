"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMediaCapture,
  validateGalleryFile,
  useCameraPermissions,
  type CapturedPhoto,
  type CapturedVideo,
} from "../../media-editor-01";
import { CameraPermissionPrompt } from "./camera-permission-prompt";
import { ShutterButton } from "./shutter-button";
import type {
  ComposerMode,
  StoryComposer01Labels,
  ValidationError,
} from "../types";

export interface EditorCameraProps {
  /** Composer is open + we should hold a live camera stream. */
  enabled: boolean;
  /** Drives mirror behavior, default facing, and the shutter aria-label. */
  mode: ComposerMode;
  defaultFacing?: "user" | "environment";
  recordAudio?: boolean;
  maxFileSizeMb?: number;
  maxVideoDurationSec?: number;
  /**
   * Numeric aspect-ratio (width/height) of the visible preview region. When
   * provided, the captured photo is center-cropped to match — mirroring the
   * preview's CSS `object-cover` crop. Pass `null` for free (no crop).
   */
  captureAspectRatio?: number | null;
  /**
   * When true, force auto-acquire of the camera on mount even if browser
   * permission isn't pre-granted — used after an explicit user gesture (e.g.
   * the "Connect to camera" entry button or a mode-tab click) so the
   * subsequent permission prompt fires in the same gesture-credited tick.
   * Default behavior auto-acquires only when `perms.state === "granted"`.
   */
  autoAcquireOverride?: boolean;
  labels: Required<StoryComposer01Labels>;
  onPhoto: (photo: CapturedPhoto) => void;
  onVideo: (video: CapturedVideo) => void;
  /** Loads an image / video file picked from the gallery into the editor. */
  onGalleryFile: (file: File) => void;
  onValidationError?: (error: ValidationError) => void;
  /** Fires when permission is denied so the host can show its own help. */
  onPermissionDenied?: () => void;
  /**
   * Replaces the built-in denied-permission UI. Receives `retry` (re-request
   * the camera) + `usePicker` (open the gallery file picker). Only substitutes
   * the `denied` state — the pending / no-camera / error states keep the
   * built-in prompt.
   */
  renderPermissionDenied?: (ctx: {
    retry: () => void;
    usePicker: () => void;
  }) => React.ReactNode;
}

export function EditorCamera({
  enabled,
  mode,
  defaultFacing,
  recordAudio = true,
  maxFileSizeMb = 50,
  maxVideoDurationSec = 30,
  captureAspectRatio,
  autoAcquireOverride,
  labels,
  onPhoto,
  onVideo,
  onGalleryFile,
  onValidationError,
  onPermissionDenied,
  renderPermissionDenied,
}: EditorCameraProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const perms = useCameraPermissions();
  // Only request mic permission for video mode — requesting audio in photo
  // mode caused the v0.1.3 flicker loop (user might have mic denied while
  // camera is granted; getUserMedia rejects → status flips → auto-retry).
  const requestAudio = mode === "video" && recordAudio;
  // Auto-acquire only if the browser has already granted camera permission;
  // otherwise wait for an explicit user gesture (the "Enable camera" button
  // on the idle prompt). Avoids surprising users with a permission prompt
  // the moment they open the composer.
  const capture = useMediaCapture({
    enabled,
    defaultFacing,
    requestAudio,
    maxVideoDurationSec,
    autoAcquire: autoAcquireOverride || perms.state === "granted",
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

  const handleShutterPhoto = async () => {
    if (busy || capture.status !== "ready") return;
    setBusy(true);
    try {
      const photo = await capture.takePhoto({
        aspectRatio: captureAspectRatio ?? null,
      });
      onPhoto(photo);
    } catch {
      /* swallow — could surface as ValidationError later */
    } finally {
      setBusy(false);
    }
  };

  const handleVideoStart = async () => {
    if (busy || capture.status !== "ready") return;
    try {
      await capture.startRecording();
    } catch (err) {
      onValidationError?.({
        kind: "unsupported-codec",
        message:
          (err as Error)?.message ?? "Video recording is not supported here",
      });
    }
  };

  const handleVideoStop = async () => {
    if (!capture.isRecording) return;
    setBusy(true);
    try {
      const video = await capture.stopRecording();
      onVideo(video);
    } catch {
      /* swallow */
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
  const permissionVariant:
    | null
    | "idle"
    | "pending"
    | "denied"
    | "no-camera"
    | "error" =
    capture.status === "acquiring"
      ? "pending"
      : capture.status === "denied"
        ? "denied"
        : capture.status === "no-camera"
          ? "no-camera"
          : capture.status === "error"
            ? "error"
            : capture.status === "idle"
              ? "idle"
              : null;

  // Auto-retry on permission change (Q-P8a) — when the watcher flips to
  // "granted" but our capture is still in "denied", silently re-acquire.
  //
  // BOUNDED — fires AT MOST ONCE per granted-state transition. Without this
  // bound, a stable denial (e.g. mic denied while photo mode requests it)
  // makes acquire() → fail → status="denied" → effect re-fires → infinite
  // loop. Resets when status becomes "ready" so a future denial can retry.
  // Also gates on .status to avoid dep'ing on the whole capture object
  // (which is a fresh ref every render).
  const autoRetryAttemptedRef = useRef(false);
  useEffect(() => {
    if (perms.state === "granted") {
      if (capture.status === "denied" && !autoRetryAttemptedRef.current) {
        autoRetryAttemptedRef.current = true;
        void capture.acquire();
      } else if (capture.status === "ready") {
        autoRetryAttemptedRef.current = false;
      }
    } else {
      autoRetryAttemptedRef.current = false;
    }
  }, [perms.state, capture.status, capture.acquire]);

  // Resolve the permission-overlay body once. The consumer's
  // renderPermissionDenied slot replaces the built-in prompt for the `denied`
  // state only; pending / no-camera / error keep the built-in prompt.
  let permissionOverlay: React.ReactNode = null;
  if (permissionVariant === "denied" && renderPermissionDenied) {
    // `usePicker` reads fileInputRef only when the CONSUMER invokes it from an
    // event handler — never during this render — so the ref-during-render rule
    // is a false positive here (same deferred-invocation contract as the
    // CameraPermissionPrompt `onUsePicker` prop below, which isn't flagged).
    // eslint-disable-next-line react-hooks/refs
    permissionOverlay = renderPermissionDenied({
      retry: () => void capture.acquire(),
      usePicker: handleGalleryClick,
    });
  } else if (permissionVariant !== null) {
    permissionOverlay = (
      <CameraPermissionPrompt
        variant={permissionVariant}
        labels={labels}
        onRetry={() => void capture.acquire()}
        onUsePicker={handleGalleryClick}
      />
    );
  }

  return (
    <div className="@container relative flex-1 flex flex-col overflow-hidden">
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

      {/* Permission overlay (denied / pending / no-camera / error). Body
          resolved above — the renderPermissionDenied slot can replace the
          denied state. */}
      {permissionOverlay !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {permissionOverlay}
        </div>
      )}

      {/* Recording indicator — red dot + mm:ss top-center */}
      {capture.isRecording && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-white"
        >
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono tabular-nums">
            {formatRecordingTime(capture.recordingMs)}
          </span>
          <span className="sr-only">{labels.recordingLabel}</span>
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
          className="size-[clamp(2rem,9cqw,2.5rem)] rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 hover:text-white"
        >
          <ImageIcon className="size-[55%]" />
        </Button>

        {/* Shutter — photo: tap | video: long-press hold OR tap-to-toggle */}
        <ShutterButton
          mode={mode === "video" ? "video" : "photo"}
          // Sized to the camera width (container query) — not the viewport — so
          // it stays proportional in the dialog / chat embeds instead of
          // ballooning when the browser window is wide.
          className="size-[clamp(2.75rem,15cqw,3.5rem)]"
          onPress={handleShutterPhoto}
          onStart={handleVideoStart}
          onStop={handleVideoStop}
          isRecording={capture.isRecording}
          recordProgress={
            capture.isRecording
              ? Math.min(
                  1,
                  capture.recordingMs / (maxVideoDurationSec * 1000),
                )
              : 0
          }
          disabled={
            busy ||
            capture.status !== "ready" ||
            mode === "text"
          }
          ariaLabel={
            mode === "video"
              ? capture.isRecording
                ? labels.shutterVideoStop
                : labels.shutterVideoStart
              : labels.shutterPhoto
          }
        />

        {/* Switch camera (only when ≥2 devices) */}
        {capture.canSwitchCamera ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void capture.switchCamera()}
            aria-label={labels.switchCamera}
            className="size-[clamp(2rem,9cqw,2.5rem)] rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 hover:text-white"
          >
            <SwitchCamera className="size-[55%]" />
          </Button>
        ) : (
          <div className="size-[clamp(2rem,9cqw,2.5rem)]" aria-hidden />
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

function formatRecordingTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
