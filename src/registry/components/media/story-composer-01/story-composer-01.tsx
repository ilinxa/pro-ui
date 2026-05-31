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
import { VideoTrimBar } from "./parts/video-trim-bar";
import { useStoryComposerState } from "./hooks/use-story-composer-state";
import {
  type CapturedPhoto,
  type CapturedVideo,
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
  durationMs?: number;
  mimeType: string;
}

interface TrimRange {
  startSec: number;
  endSec: number;
  durationSec: number;
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
  const [trim, setTrim] = useState<TrimRange | null>(null);

  // Set draft + revoke prior object URL.
  const acceptDraft = useCallback((next: DraftMedia | null) => {
    setDraft((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return next;
    });
    if (!next || next.kind !== "video") setTrim(null);
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

  const handleVideo = useCallback(
    (video: CapturedVideo) => {
      const url = URL.createObjectURL(video.blob);
      acceptDraft({
        source: "camera",
        kind: "video",
        blob: video.blob,
        url,
        durationMs: video.durationMs,
        mimeType: video.mimeType,
      });
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
        startRecording: async () => {
          await captureRef.current?.startRecording();
        },
        stopRecording: async () => {
          const video = await captureRef.current?.stopRecording();
          if (video) handleVideo(video);
        },
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
    [acceptDraft, handlePhoto, handleVideo, onClose, state],
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
          maxVideoDurationSec={30}
          labels={labels}
          onPhoto={handlePhoto}
          onVideo={handleVideo}
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
        <div className="flex-1 relative bg-black flex flex-col">
          <div className="flex-1 relative">
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
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  // Initialize trim range when metadata first arrives.
                  if (
                    !trim &&
                    Number.isFinite(v.duration) &&
                    v.duration > 0
                  ) {
                    setTrim({
                      startSec: 0,
                      endSec: v.duration,
                      durationSec: v.duration,
                    });
                  }
                }}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
          {/* Trim bar — video only */}
          {draft.kind === "video" && trim ? (
            <div
              className="shrink-0 px-4 pt-3"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <VideoTrimBar
                videoUrl={draft.url}
                startSec={trim.startSec}
                endSec={trim.endSec}
                durationSec={trim.durationSec}
                labels={labels}
                onChange={(next) =>
                  setTrim((prev) => (prev ? { ...prev, ...next } : prev))
                }
              />
            </div>
          ) : (
            <div className="text-center text-xs text-white/60 pb-3">
              Editor lands C6 · {draft.source} · {draft.kind}
            </div>
          )}
        </div>
      ) : null}
    </ComposerShell>
  );
});
