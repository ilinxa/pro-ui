"use client";

import { forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import type {
  StoryComposer01Handle,
  StoryComposer01Props,
} from "./types";

/**
 * Story composer — C2 placeholder.
 * Shell + state + tools land in C3 onwards per docs/procomps/story-composer-01-procomp/story-composer-01-procomp-plan.md.
 */
export const StoryComposer01 = forwardRef<
  StoryComposer01Handle,
  StoryComposer01Props
>(function StoryComposer01(
  { isOpen, onClose, presentation = "auto" },
  ref,
) {
  useImperativeHandle(ref, () => {
    const notReady = () =>
      Promise.reject(new Error("story-composer-01: not yet implemented (C2)"));
    const noop = () => {
      throw new Error("story-composer-01: not yet implemented (C2)");
    };
    return {
      open: noop,
      close: noop,
      reset: noop,
      switchCamera: notReady,
      takePhoto: notReady,
      startRecording: notReady,
      stopRecording: notReady,
      importFromGallery: noop,
      addText: noop,
      addSticker: noop,
      setAdjustments: noop,
      applyFilter: noop,
      publish: notReady,
      exportBlob: () =>
        Promise.reject(
          new Error("story-composer-01: not yet implemented (C2)"),
        ),
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4",
        presentation === "modal" && "md:p-8",
      )}
      role="dialog"
      aria-label="Story composer (under construction)"
      onClick={onClose}
    >
      <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
        <p className="text-sm text-muted-foreground">
          story-composer-01 — C2 scaffold. Editor lands in C3.
        </p>
      </div>
    </div>
  );
});
