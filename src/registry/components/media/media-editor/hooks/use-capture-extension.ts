"use client";

import * as React from "react";
import type { ComposerMode, StoryComposerLabels, ValidationError } from "../types";

/**
 * Capture injection seam (P3 S3 — feature-slicing, strategy b: injection
 * surface, R1 VERDICT). Base never statically imports `features/capture/**`
 * — a consumer wires camera capture in by passing `capture={mediaCapture}`
 * (MediaEditorProps.capture) from `@ilinxa/media-editor-capture`. This file
 * owns the context, the extension TYPE, and the surface-props contract the
 * base orchestrator (media-editor.tsx) mounts against — mirroring the
 * renderer-registry pattern used elsewhere in the library.
 */

// ─── Structural mirrors of the capture feature's capture-result shapes ────
// Duplicated here (NOT imported from features/capture/**) so this base file
// carries zero static dependency on the feature folder — the F-S1 inline-copy
// pattern (see cross-procomp-imports precedent). The feature's own
// `CapturedPhoto` / `CapturedVideo` (features/capture/hooks/use-media-capture.ts)
// are kept structurally identical to these so `EditorCamera` type-checks
// as a `CameraSurface` without any cast.

export interface CapturedPhotoLike {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
}

export interface CapturedVideoLike {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

/**
 * Props the base orchestrator passes to whatever camera surface answers the
 * capture extension. Mirrors `EditorCameraProps` (features/capture/parts/
 * editor-camera.tsx) field-for-field — the base mount site passes exactly
 * this shape regardless of which implementation is wired in.
 */
export interface MediaCaptureSurfaceProps {
  /** Composer is open + we should hold a live camera stream. */
  enabled: boolean;
  /** Drives mirror behavior, default facing, and the shutter aria-label. */
  mode: ComposerMode;
  defaultFacing?: "user" | "environment";
  recordAudio?: boolean;
  maxFileSizeMb?: number;
  maxVideoDurationSec?: number;
  captureAspectRatio?: number | null;
  autoAcquireOverride?: boolean;
  labels: Required<StoryComposerLabels>;
  onPhoto: (photo: CapturedPhotoLike) => void;
  onVideo: (video: CapturedVideoLike) => void;
  /** Loads an image / video file picked from the gallery into the editor. */
  onGalleryFile: (file: File) => void;
  onValidationError?: (error: ValidationError) => void;
  onPermissionDenied?: () => void;
  renderPermissionDenied?: (ctx: {
    retry: () => void;
    usePicker: () => void;
  }) => React.ReactNode;
}

export interface MediaCaptureExtensionContextValue {
  /**
   * The camera surface component to mount when the editor is in the capture
   * stage with a photo/video mode active. No further capture-state
   * accessors are exposed today — capture's own state (permissions, live
   * stream, recording) lives inside the surface component itself, so there's
   * nothing else for the orchestrator to read.
   */
  CameraSurface: React.ComponentType<MediaCaptureSurfaceProps>;
}

export const MediaCaptureExtensionContext =
  React.createContext<MediaCaptureExtensionContextValue | null>(null);

/** Orchestrator-internal read. Null when no `capture` extension is wired. */
export function useCaptureExtensionOptional(): MediaCaptureExtensionContextValue | null {
  return React.useContext(MediaCaptureExtensionContext);
}

/**
 * Public extension contract a consumer installs to enable camera capture.
 * `@ilinxa/media-editor-capture` ships `mediaCapture: MediaCaptureExtension`
 * — pass it straight through: `<MediaEditor capture={mediaCapture} />`.
 * Custom/alternative capture implementations can supply their own `Provider`
 * as long as it renders `MediaCaptureExtensionContext.Provider` with a
 * `CameraSurface` matching `MediaCaptureSurfaceProps`.
 */
export type MediaCaptureExtension = {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
};
