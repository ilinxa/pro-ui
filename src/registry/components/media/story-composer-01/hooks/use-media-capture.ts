"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ValidationError } from "../types";

export type CaptureStatus =
  | "idle"
  | "acquiring"
  | "ready"
  | "denied"
  | "no-camera"
  | "error";

export type FacingMode = "user" | "environment";

export interface CapturedPhoto {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
}

export interface UseMediaCaptureOptions {
  /** Enabled while the composer is open; releasing flips back to "idle". */
  enabled: boolean;
  /** Initial camera facing. Auto-detected from UA touch capability if undefined. */
  defaultFacing?: FacingMode;
  /** Capture audio (used by video mode in C5). C4 ignores this for photo. */
  recordAudio?: boolean;
}

export interface UseMediaCaptureResult {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CaptureStatus;
  facing: FacingMode;
  error: Error | null;
  /** True when ≥2 video input devices are enumerated (controls switch-camera visibility). */
  canSwitchCamera: boolean;
  /** Currently active MediaStream (null until "ready"). Exposed for C5 MediaRecorder wiring. */
  stream: MediaStream | null;
  /** Re-acquire the camera (after permission grant or facing change). */
  acquire: () => Promise<void>;
  /** Stop tracks + release the stream. */
  release: () => void;
  /** Snap a still frame from the current video preview. */
  takePhoto: () => Promise<CapturedPhoto>;
  /** Flip facingMode and re-acquire. */
  switchCamera: () => Promise<void>;
}

function isTouchUA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
  );
}

/**
 * getUserMedia + photo-capture lifecycle.
 *
 * C4 surface: acquire / release / takePhoto / switchCamera.
 * C5 will extend with startRecording / stopRecording.
 */
export function useMediaCapture(
  options: UseMediaCaptureOptions,
): UseMediaCaptureResult {
  const { enabled, defaultFacing, recordAudio = true } = options;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [facing, setFacing] = useState<FacingMode>(
    defaultFacing ?? (isTouchUA() ? "environment" : "user"),
  );
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  const release = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      for (const track of s.getTracks()) track.stop();
      streamRef.current = null;
    }
    setStream(null);
    setStatus("idle");
  }, []);

  const acquire = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("no-camera");
      setError(new Error("MediaDevices.getUserMedia is not supported"));
      return;
    }
    setStatus("acquiring");
    setError(null);
    // Release any prior stream before re-acquiring (switch-camera flow).
    release();
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: recordAudio,
      });
      streamRef.current = next;
      setStream(next);
      setStatus("ready");

      // Enumerate devices to decide if switch-camera should be offered.
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCanSwitchCamera(
          devices.filter((d) => d.kind === "videoinput").length >= 2,
        );
      } catch {
        setCanSwitchCamera(false);
      }
    } catch (err) {
      const e = err as DOMException;
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        setStatus("denied");
      } else if (e?.name === "NotFoundError") {
        setStatus("no-camera");
      } else {
        setStatus("error");
      }
      setError(err as Error);
    }
  }, [facing, recordAudio, release]);

  // Auto-acquire on mount when enabled; release on unmount / disable.
  useEffect(() => {
    if (!enabled) {
      release();
      return;
    }
    void acquire();
    return release;
    // We don't add `acquire` to deps directly because it changes when facing
    // flips; the explicit switchCamera path handles re-acquisition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, release]);

  // Attach the stream to <video>. The <video> tag will be null on first render
  // (rendered in composer-camera), so this fires whenever stream becomes ready.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream) {
      v.srcObject = stream;
      v.play().catch(() => {
        /* autoplay may be blocked; ignore — user gesture will unblock */
      });
    } else {
      v.srcObject = null;
    }
  }, [stream]);

  const switchCamera = useCallback(async () => {
    const next: FacingMode = facing === "user" ? "environment" : "user";
    setFacing(next);
    // acquire() will re-fire via the effect above? No — facing change updates
    // state but the enabled-only effect won't re-run. So we call directly.
    // But acquire reads from `facing` via closure — by the time React commits
    // the new facing, our closure is stale. Use functional update + manual re-call.
    // Simpler: stop now, then defer to a microtask so React commits state, then re-acquire.
    release();
    // The effect that depends on `acquire`/`facing` won't help; do it explicitly.
    queueMicrotask(() => {
      // facing is now next via setState — but acquire's closure binds old facing.
      // To stay correct, re-derive the constraint here rather than calling acquire().
      void (async () => {
        try {
          setStatus("acquiring");
          const s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: next } },
            audio: recordAudio,
          });
          streamRef.current = s;
          setStream(s);
          setStatus("ready");
        } catch (err) {
          const e = err as DOMException;
          setStatus(
            e?.name === "NotAllowedError" || e?.name === "SecurityError"
              ? "denied"
              : e?.name === "NotFoundError"
                ? "no-camera"
                : "error",
          );
          setError(err as Error);
        }
      })();
    });
  }, [facing, recordAudio, release]);

  const takePhoto = useCallback(async (): Promise<CapturedPhoto> => {
    const v = videoRef.current;
    if (!v || !streamRef.current) {
      throw new Error("Camera not ready");
    }
    const width = v.videoWidth;
    const height = v.videoHeight;
    if (width === 0 || height === 0) {
      throw new Error("Video has no frame yet");
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.drawImage(v, 0, 0, width, height);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/jpeg",
        0.92,
      );
    });
    return { blob, width, height, mimeType: "image/jpeg" };
  }, []);

  return {
    videoRef,
    status,
    facing,
    error,
    canSwitchCamera,
    stream,
    acquire,
    release,
    takePhoto,
    switchCamera,
  };
}

// ─── Validation helpers (used by gallery picker) ────────────────────────

export function validateGalleryFile(
  file: File,
  maxFileSizeMb: number,
): ValidationError | null {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return {
      kind: "unsupported-type",
      message: `Unsupported file type: ${file.type || "unknown"}`,
      file,
    };
  }
  const bytes = file.size;
  const maxBytes = maxFileSizeMb * 1024 * 1024;
  if (bytes > maxBytes) {
    return {
      kind: "file-too-large",
      message: `File is ${(bytes / 1024 / 1024).toFixed(1)} MB — maximum is ${maxFileSizeMb} MB`,
      file,
    };
  }
  return null;
}
