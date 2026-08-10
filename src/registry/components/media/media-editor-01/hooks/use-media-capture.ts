"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  containerFor,
  selectRecorderMime,
} from "../lib/mime-fallback";
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

export interface CapturedVideo {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

export interface UseMediaCaptureOptions {
  /** Enabled while the composer is open; releasing flips back to "idle". */
  enabled: boolean;
  /** Initial camera facing. Auto-detected from UA touch capability if undefined. */
  defaultFacing?: FacingMode;
  /**
   * Request an audio track alongside the video. Default false.
   *
   * **Critical:** only set true when the consumer actually needs audio
   * (i.e. video-mode recording). Photo / text capture should always pass
   * false — requesting mic permission for photo capture is the leading
   * cause of the v0.1.3 flicker-loop: if the user grants camera but
   * denies mic, getUserMedia({audio:true}) rejects, status becomes
   * "denied", the auto-retry effect re-fires, repeat.
   */
  requestAudio?: boolean;
  /** Hard cap on a single recording in seconds. Default 30. */
  maxVideoDurationSec?: number;
  /**
   * When true (default), automatically call `acquire()` on mount and when
   * `enabled` flips on. Set to false to require an explicit user gesture
   * (e.g. a "Tap to enable camera" button) before the camera starts —
   * recommended when the user hasn't previously granted permission, since
   * browser permission prompts are jarring without a triggering interaction.
   */
  autoAcquire?: boolean;
}

export interface UseMediaCaptureResult {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CaptureStatus;
  facing: FacingMode;
  error: Error | null;
  /** True when ≥2 video input devices are enumerated (controls switch-camera visibility). */
  canSwitchCamera: boolean;
  /** Currently active MediaStream (null until "ready"). Used by MediaRecorder. */
  stream: MediaStream | null;
  /** Re-acquire the camera (after permission grant or facing change). */
  acquire: () => Promise<void>;
  /** Stop tracks + release the stream. */
  release: () => void;
  /**
   * Snap a still frame from the current video preview.
   *
   * When `aspectRatio` is provided, the captured frame is center-cropped to
   * match — mirroring the CSS `object-cover` crop the user saw in the
   * preview. Pass the dialog/viewport aspect (e.g. `9/16`) to keep
   * what-you-see-is-what-you-get parity; pass `null`/omit to capture the
   * full native frame.
   */
  takePhoto: (opts?: { aspectRatio?: number | null }) => Promise<CapturedPhoto>;
  /** Flip facingMode and re-acquire. */
  switchCamera: () => Promise<void>;
  // ─── Video recording ──────────────────────────────────────────────────
  isRecording: boolean;
  /** Elapsed recording time in ms (updates ~10×/s). */
  recordingMs: number;
  /** Selected MIME type — null if MediaRecorder is unsupported. */
  recorderMime: string | null;
  /** Begin recording. Throws if no stream or no supported codec. */
  startRecording: () => Promise<void>;
  /** Stop recording and return the assembled blob + duration. */
  stopRecording: () => Promise<CapturedVideo>;
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
  const {
    enabled,
    defaultFacing,
    requestAudio = false,
    maxVideoDurationSec = 30,
    autoAcquire = true,
  } = options;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [facing, setFacing] = useState<FacingMode>(
    defaultFacing ?? (isTouchUA() ? "environment" : "user"),
  );
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  // ─── Recording state ────────────────────────────────────────────────
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartedAtRef = useRef<number>(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopResolverRef = useRef<{
    resolve: (v: CapturedVideo) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  // Recorder MIME probed once on the first client render via useState's lazy
  // initializer (SSR yields null; selectRecorderMime is a deterministic
  // capability check). Replaces the old write-a-ref-during-render init,
  // which the React Compiler forbids.
  const [recorderMime] = useState<string | null>(() =>
    typeof window === "undefined" ? null : selectRecorderMime(),
  );

  // Acquire epoch — a monotonically increasing token claimed per acquire().
  // getUserMedia can resolve long after release()/unmount/a competing acquire
  // (permission prompt open, slow device): a resolve under a stale epoch must
  // stop its tracks and bail instead of orphaning a live camera stream (LED
  // stays on) or clobbering the newer acquire's stream. (Review 5.11.)
  const acquireEpochRef = useRef(0);

  const release = useCallback(() => {
    // Invalidate any in-flight acquire before stopping the current stream.
    acquireEpochRef.current += 1;
    const s = streamRef.current;
    if (s) {
      for (const track of s.getTracks()) track.stop();
      streamRef.current = null;
    }
    setStream(null);
    setStatus("idle");
  }, []);

  // Shared acquire pipeline. `nextFacing` is explicit so switchCamera doesn't
  // depend on the (stale-closure-prone) `facing` state committing first.
  const acquireWith = useCallback(
    async (nextFacing: FacingMode) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("no-camera");
        setError(new Error("MediaDevices.getUserMedia is not supported"));
        return;
      }
      // Release any prior stream before re-acquiring (switch-camera flow,
      // photo↔video mode flip), then claim a fresh epoch.
      release();
      const epoch = ++acquireEpochRef.current;
      setStatus("acquiring");
      setError(null);
      try {
        const next = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: nextFacing } },
          audio: requestAudio,
        });
        if (epoch !== acquireEpochRef.current) {
          // Superseded (released / re-acquired / unmounted) while the prompt
          // or device was pending — don't adopt, don't leak.
          for (const track of next.getTracks()) track.stop();
          return;
        }
        streamRef.current = next;
        setStream(next);
        setStatus("ready");

        // Enumerate devices to decide if switch-camera should be offered.
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (epoch === acquireEpochRef.current) {
            setCanSwitchCamera(
              devices.filter((d) => d.kind === "videoinput").length >= 2,
            );
          }
        } catch {
          if (epoch === acquireEpochRef.current) setCanSwitchCamera(false);
        }
      } catch (err) {
        if (epoch !== acquireEpochRef.current) return; // stale failure — a newer acquire owns the status
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
    },
    [requestAudio, release],
  );

  const acquire = useCallback(() => acquireWith(facing), [acquireWith, facing]);

  // Auto-acquire on mount when enabled AND autoAcquire is allowed; release
  // on unmount / disable. When autoAcquire is false the consumer is expected
  // to call `acquire()` in response to an explicit user gesture (avoids
  // jarring permission prompts on first paint).
  useEffect(() => {
    if (!enabled) {
      // External-system sync (camera hardware): release() stops the live
      // MediaStream tracks and mirrors the result into state. The epoch
      // invalidation + track teardown + state reset must stay one atomic
      // chokepoint — splitting the state writes out of the effect would fork
      // the acquire-cancellation logic (v0.1.4 fix).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      release();
      return;
    }
    if (autoAcquire) void acquire();
    return release;
    // We don't add `acquire` to deps directly because it changes when facing
    // flips (handled by switchCamera). But we DO depend on `requestAudio` so
    // toggling photo↔video correctly releases + re-acquires with/without an
    // audio track (without it, video mode would inherit a video-only stream
    // from a prior photo-mode acquire and record silent video).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, requestAudio, release, autoAcquire]);

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
    // acquireWith takes the target facing explicitly, so there's no
    // stale-closure microtask dance — and its epoch guard means a rapid
    // double-flip can't interleave two live streams. (Review 5.11.)
    await acquireWith(next);
  }, [facing, acquireWith]);

  // ─── Recording controls ─────────────────────────────────────────────

  const clearRecordingTimers = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const s = streamRef.current;
    if (!s) throw new Error("Camera not ready");
    // Defensive re-probe if the lazy init yielded null (matches the old
    // ref-cached behavior — selectRecorderMime is deterministic, so a null
    // here re-probes to null and throws below).
    const mime = recorderMime ?? selectRecorderMime();
    if (!mime) {
      throw new Error("This browser does not support video recording");
    }
    if (recorderRef.current) return; // already recording

    const rec = new MediaRecorder(s, { mimeType: mime });
    recorderRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    rec.onstop = () => {
      const durationMs = Date.now() - recordStartedAtRef.current;
      const blob = new Blob(chunksRef.current, { type: mime });
      const resolver = stopResolverRef.current;
      stopResolverRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];
      clearRecordingTimers();
      setIsRecording(false);
      setRecordingMs(0);
      resolver?.resolve({ blob, durationMs, mimeType: mime });
    };
    rec.onerror = (ev) => {
      const e =
        (ev as unknown as { error?: Error }).error ??
        new Error("MediaRecorder failed");
      const resolver = stopResolverRef.current;
      stopResolverRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];
      clearRecordingTimers();
      setIsRecording(false);
      setRecordingMs(0);
      resolver?.reject(e);
    };

    recordStartedAtRef.current = Date.now();
    setRecordingMs(0);
    setIsRecording(true);
    rec.start(250); // 250ms timeslice — smooth UI ticks

    // Tick recording time for UI
    tickIntervalRef.current = setInterval(() => {
      setRecordingMs(Date.now() - recordStartedAtRef.current);
    }, 100);

    // Hard cap auto-stop
    autoStopTimeoutRef.current = setTimeout(
      () => {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      },
      maxVideoDurationSec * 1000,
    );
  }, [clearRecordingTimers, maxVideoDurationSec, recorderMime]);

  const stopRecording = useCallback((): Promise<CapturedVideo> => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording") {
      return Promise.reject(new Error("Not recording"));
    }
    return new Promise<CapturedVideo>((resolve, reject) => {
      stopResolverRef.current = { resolve, reject };
      rec.stop();
    });
  }, []);

  // Cleanup any in-flight recording when stream is released / hook unmounts.
  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
      recorderRef.current = null;
      chunksRef.current = [];
      clearRecordingTimers();
    };
  }, [clearRecordingTimers]);

  const takePhoto = useCallback(
    async (opts?: { aspectRatio?: number | null }): Promise<CapturedPhoto> => {
      const v = videoRef.current;
      if (!v || !streamRef.current) {
        throw new Error("Camera not ready");
      }
      const nativeW = v.videoWidth;
      const nativeH = v.videoHeight;
      if (nativeW === 0 || nativeH === 0) {
        throw new Error("Video has no frame yet");
      }

      // Determine the source-rect to capture. With aspectRatio provided, we
      // center-crop the native frame to match — mirroring CSS object-cover:
      // scale-to-fill + center-crop. videoAspect > target → crop horizontal;
      // videoAspect < target → crop vertical; equal → no crop.
      const target =
        opts?.aspectRatio && opts.aspectRatio > 0 ? opts.aspectRatio : null;
      let sx = 0;
      let sy = 0;
      let sw = nativeW;
      let sh = nativeH;
      if (target !== null) {
        const videoAspect = nativeW / nativeH;
        if (videoAspect > target) {
          // Video is wider than target — crop horizontal sides.
          sw = nativeH * target;
          sx = (nativeW - sw) / 2;
        } else if (videoAspect < target) {
          // Video is taller than target — crop top/bottom.
          sh = nativeW / target;
          sy = (nativeH - sh) / 2;
        }
      }

      const outW = Math.round(sw);
      const outH = Math.round(sh);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D canvas context unavailable");
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
          "image/jpeg",
          0.92,
        );
      });
      return { blob, width: outW, height: outH, mimeType: "image/jpeg" };
    },
    [],
  );

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
    isRecording,
    recordingMs,
    recorderMime,
    startRecording,
    stopRecording,
  };
}

/** Suggested filename for a recorded clip — useful for the publish step. */
export function suggestedVideoFilename(mime: string): string {
  return `story-${Date.now()}.${containerFor(mime) === "unknown" ? "bin" : containerFor(mime)}`;
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
