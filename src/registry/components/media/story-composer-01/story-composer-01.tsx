"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ComposerShell } from "./parts/composer-shell";
import { ModeTogglePill } from "./parts/mode-toggle-pill";
import { ComposerCamera } from "./parts/composer-camera";
import { useStoryComposerState } from "./hooks/use-story-composer-state";
import {
  type CapturedPhoto,
  type UseMediaCaptureResult,
} from "./hooks/use-media-capture";
import {
  DEFAULT_STORY_COMPOSER_LABELS,
  type StoryComposer01Handle,
  type StoryComposer01Labels,
  type StoryComposer01Props,
} from "./types";

interface DraftMedia {
  source: "camera" | "gallery";
  kind: "image" | "video";
  blob: Blob;
  /** Object URL for preview — revoked when draft is replaced or composer closes. */
  url: string;
  width?: number;
  height?: number;
  mimeType: string;
}

export const StoryComposer01 = forwardRef<
  StoryComposer01Handle,
  StoryComposer01Props
>(function StoryComposer01(
  {
    isOpen,
    onClose,
    defaultMode = "photo",
    hideModes,
    defaultFacing,
    recordAudio = true,
    maxFileSizeMb = 50,
    presentation = "auto",
    editorBackground = "#000",
    labels: labelOverrides,
    onPermissionDenied,
    onValidationError,
  },
  ref,
) {
  const labels = useMemo<Required<StoryComposer01Labels>>(
    () => ({ ...DEFAULT_STORY_COMPOSER_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  const state = useStoryComposerState({ defaultMode, hideModes });
  const captureRef = useRef<UseMediaCaptureResult | null>(null);
  const [draft, setDraft] = useState<DraftMedia | null>(null);

  // Set draft + revoke prior object URL.
  const acceptDraft = useCallback((next: DraftMedia | null) => {
    setDraft((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return next;
    });
  }, []);

  const handlePhoto = useCallback(
    (photo: CapturedPhoto) => {
      const url = URL.createObjectURL(photo.blob);
      acceptDraft({
        source: "camera",
        kind: "image",
        blob: photo.blob,
        url,
        width: photo.width,
        height: photo.height,
        mimeType: photo.mimeType,
      });
      // Transition to edit stage — actual editor surface lands C6.
      state.setStage("edit");
      state.markDirty(true);
    },
    [acceptDraft, state],
  );

  const handleGalleryFile = useCallback(
    (file: File) => {
      const kind: "image" | "video" = file.type.startsWith("video/")
        ? "video"
        : "image";
      const url = URL.createObjectURL(file);
      acceptDraft({
        source: "gallery",
        kind,
        blob: file,
        url,
        mimeType: file.type,
      });
      state.setStage("edit");
      state.markDirty(true);
    },
    [acceptDraft, state],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        acceptDraft(null);
        state.reset();
        onClose();
      }
    },
    [acceptDraft, onClose, state],
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
          /* host owns isOpen */
        },
        close: () => onClose(),
        reset: () => {
          acceptDraft(null);
          state.reset();
        },
        switchCamera: async () => {
          await captureRef.current?.switchCamera();
        },
        takePhoto: async () => {
          const photo = await captureRef.current?.takePhoto();
          if (photo) handlePhoto(photo);
        },
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
    [acceptDraft, handlePhoto, onClose, state],
  );

  const captureActive = state.stage === "capture" && state.mode !== "text";

  return (
    <ComposerShell
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      presentation={presentation}
      background={editorBackground}
      ariaLabel={labels.composerLabel}
    >
      {/* Top bar — close + mode pill + reserved publish-CTA slot */}
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 z-30 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenChange(false)}
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
        <div className="size-9" aria-hidden />
      </div>

      {/* Capture surface (camera + gallery picker) */}
      {captureActive ? (
        <ComposerCamera
          enabled={isOpen && captureActive}
          mode={state.mode}
          defaultFacing={defaultFacing}
          recordAudio={recordAudio}
          maxFileSizeMb={maxFileSizeMb}
          labels={labels}
          onPhoto={handlePhoto}
          onGalleryFile={handleGalleryFile}
          onValidationError={onValidationError}
          onPermissionDenied={onPermissionDenied}
        />
      ) : null}

      {/* Text-only mode placeholder (lands C13) */}
      {state.stage === "capture" && state.mode === "text" ? (
        <div className="flex-1 flex items-center justify-center text-white/50 text-xs">
          Text mode · capture surface lands C13
        </div>
      ) : null}

      {/* Edit-stage placeholder (real editor lands C6) */}
      {state.stage === "edit" && draft ? (
        <div className="flex-1 relative bg-black">
          {draft.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.url}
              alt="Captured story preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <video
              src={draft.url}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
          <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/60">
            Editor lands C6 · {draft.source} · {draft.kind}
          </div>
        </div>
      ) : null}
    </ComposerShell>
  );
});
