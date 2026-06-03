"use client";

import { useCallback, useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

export interface ShutterButtonProps {
  mode: "photo" | "video";
  /** Photo-mode tap. Ignored when mode="video". */
  onPress?: () => void;
  /** Video-mode start. Called for both long-press hold and tap-to-start. */
  onStart?: () => void;
  /** Video-mode stop. Called on long-press release OR tap-to-stop. */
  onStop?: () => void;
  /** Recording in-flight (drives ring fill + inner shape). */
  isRecording?: boolean;
  /** 0..1 — fraction of maxVideoDuration elapsed. Drives ring conic-gradient. */
  recordProgress?: number;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

const LONG_PRESS_THRESHOLD_MS = 250;

/**
 * Shutter behavior matrix (Instagram parity):
 *
 *   Mode photo + tap     → onPress
 *   Mode video + tap     → onStart (then a later tap → onStop)
 *   Mode video + hold    → onStart on down, onStop on up
 */
export function ShutterButton({
  mode,
  onPress,
  onStart,
  onStop,
  isRecording = false,
  recordProgress = 0,
  disabled = false,
  ariaLabel,
  className,
}: ShutterButtonProps) {
  const pressStartRef = useRef<number>(0);
  const startedThisPressRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      pressStartRef.current = Date.now();
      if (mode === "photo") {
        startedThisPressRef.current = false;
        return;
      }
      if (!isRecording) {
        startedThisPressRef.current = true;
        onStart?.();
      } else {
        startedThisPressRef.current = false;
      }
    },
    [disabled, mode, isRecording, onStart],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      const elapsed = Date.now() - pressStartRef.current;

      if (mode === "photo") {
        onPress?.();
        return;
      }

      const wasHold = elapsed >= LONG_PRESS_THRESHOLD_MS;
      if (wasHold) {
        onStop?.();
      } else if (!startedThisPressRef.current) {
        // Tap on already-recording shutter → stop (tap-to-toggle stop)
        onStop?.();
      }
      // else: tap started recording this press → leave running (tap-to-toggle start)
      startedThisPressRef.current = false;
    },
    [disabled, mode, onPress, onStop],
  );

  const handlePointerCancel = useCallback(() => {
    // Treat cancellation as a stop if we started recording.
    if (mode === "video" && isRecording && startedThisPressRef.current) {
      onStop?.();
      startedThisPressRef.current = false;
    }
  }, [mode, isRecording, onStop]);

  // Ring fill via conic-gradient when recording.
  const ringStyle =
    mode === "video" && isRecording
      ? {
          background: `conic-gradient(#ef4444 ${recordProgress * 360}deg, rgba(255,255,255,0.3) ${recordProgress * 360}deg)`,
        }
      : undefined;

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={mode === "video" ? isRecording : undefined}
      className={cn(
        // Responsive size — min 48px on narrow viewports, max 68px on wide.
        "relative grid place-items-center size-[clamp(3rem,12vw,4.25rem)] rounded-full",
        "transition-transform active:scale-95",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        className,
      )}
      style={ringStyle}
    >
      {/* Outer ring (idle white border; conic on record) */}
      {mode === "video" && isRecording ? (
        // Filled ring is the gradient on the button itself; inner stop-square sits inside
        <span className="grid place-items-center size-[80%] rounded-full bg-black/60">
          <span className="size-[36%] rounded-md bg-red-500" />
        </span>
      ) : (
        <span
          className={cn(
            "size-full rounded-full ring-4 ring-white/30 ring-offset-2 ring-offset-transparent grid place-items-center",
            "bg-white",
          )}
        >
          {mode === "video" ? (
            <span className="size-[30%] rounded-full bg-red-500" />
          ) : null}
        </span>
      )}
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}
