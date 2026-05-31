"use client";

import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ComposerShell } from "./parts/composer-shell";
import { ModeTogglePill } from "./parts/mode-toggle-pill";
import { useStoryComposerState } from "./hooks/use-story-composer-state";
import {
  DEFAULT_STORY_COMPOSER_LABELS,
  type StoryComposer01Handle,
  type StoryComposer01Labels,
  type StoryComposer01Props,
} from "./types";

export const StoryComposer01 = forwardRef<
  StoryComposer01Handle,
  StoryComposer01Props
>(function StoryComposer01(
  {
    isOpen,
    onClose,
    defaultMode = "photo",
    hideModes,
    presentation = "auto",
    editorBackground = "#000",
    labels: labelOverrides,
  },
  ref,
) {
  const labels = useMemo<Required<StoryComposer01Labels>>(
    () => ({ ...DEFAULT_STORY_COMPOSER_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  const state = useStoryComposerState({ defaultMode, hideModes });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) onClose();
    },
    [onClose],
  );

  useImperativeHandle(
    ref,
    () => {
      const notReady = () =>
        Promise.reject(new Error("story-composer-01: feature lands later"));
      const noop = () => {
        throw new Error("story-composer-01: feature lands later");
      };
      return {
        open: () => {
          /* host owns isOpen; no-op for now */
        },
        close: () => onClose(),
        reset: () => state.reset(),
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
            new Error("story-composer-01: feature lands later"),
          ),
      };
    },
    [onClose, state],
  );

  return (
    <ComposerShell
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      presentation={presentation}
      background={editorBackground}
      ariaLabel={labels.composerLabel}
    >
      {/* Top bar — close button (publish bar replaces this in C12) */}
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 z-10 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={labels.close}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </Button>
        <ModeTogglePill
          mode={state.mode}
          visibleModes={state.visibleModes}
          labels={labels}
          onModeChange={state.setMode}
        />
        {/* Right slot reserved for publish CTA / capture toggles in later commits */}
        <div className="size-9" aria-hidden />
      </div>

      {/* Capture surface placeholder — replaced by composer-camera in C4 */}
      <div className="flex-1 flex items-center justify-center text-white/40 text-xs">
        {state.stage === "capture"
          ? `Capture surface · mode=${state.mode}`
          : `Editor surface · stage=${state.stage}`}
      </div>

      {/* Bottom toolbar placeholder — replaced in C6 + C7+ */}
      <div className="h-[max(4.5rem,env(safe-area-inset-bottom))] shrink-0" />
    </ComposerShell>
  );
});
