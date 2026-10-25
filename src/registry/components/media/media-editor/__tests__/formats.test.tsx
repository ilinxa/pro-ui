/**
 * media-editor 0.5.0 (ME4) - intake accept list, video output allow-list, pass-through
 * metadata, and which tool chips a video draft shows.
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { resolveEditorLabels } from "../lib/normalize-labels";
import { selectRecorderMime } from "../lib/mime-fallback";
import { acceptAttribute, matchesAccept, validateGalleryFile } from "../lib/validate-media-file";
import { EditorCamera } from "../features/capture/parts/editor-camera";
import { MediaCaptureExtensionContext } from "../hooks/use-capture-extension";
import type { MediaEditorHandle, ValidationError } from "../types";

// The konva canvas needs a real <canvas>; these tests are about the editor chrome.
vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));

const ENGLISH = resolveEditorLabels(undefined);

let originalCreate: typeof URL.createObjectURL;
let originalRevoke: typeof URL.revokeObjectURL;
beforeEach(() => {
  originalCreate = URL.createObjectURL;
  originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:media-editor-test";
  URL.revokeObjectURL = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A `MediaRecorder` whose `isTypeSupported` answers from a fixed list (or no MediaRecorder at all). */
function stubRecorder(supported: string[] | null) {
  if (supported === null) {
    vi.stubGlobal("MediaRecorder", undefined);
    return;
  }
  vi.stubGlobal("MediaRecorder", { isTypeSupported: (t: string) => supported.includes(t) });
}

const ALL_CHAIN = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
];

const pick = (input: HTMLInputElement, file: File) =>
  fireEvent.change(input, { target: { files: [file] } });
const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
const stageOf = () => document.querySelector('[data-slot="media-editor"]')!.getAttribute("data-stage");
const modeButtons = () =>
  Array.from(document.querySelectorAll<HTMLElement>("button[data-mode]")).map((b) => b.dataset.mode);
const toolChips = () => document.querySelectorAll("[data-tool]").length;

describe("selectRecorderMime(allowed)", () => {
  it("returns the first allowed type the browser supports, in allow-list order", () => {
    stubRecorder(["video/webm", "video/mp4;codecs=avc1.42E01E,mp4a.40.2"]);
    expect(selectRecorderMime(["video/webm", "video/mp4"])).toBe("video/webm");
    expect(selectRecorderMime(["video/mp4", "video/webm"])).toBe(
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2", // base type "video/mp4" allows the codec variant
    );
  });

  it("matches an exact string with parameters as written", () => {
    stubRecorder(["video/mp4;codecs=avc1"]);
    expect(selectRecorderMime(["video/mp4;codecs=avc1"])).toBe("video/mp4;codecs=avc1");
    // a parameterised entry is exact: it does not widen to other variants
    expect(selectRecorderMime(["video/mp4;codecs=hevc"])).toBeNull();
  });

  it("returns null when nothing allowed is supported, or there is no MediaRecorder", () => {
    stubRecorder(["video/webm"]);
    expect(selectRecorderMime(["video/mp4"])).toBeNull();
    stubRecorder(null);
    expect(selectRecorderMime(["video/mp4"])).toBeNull();
    expect(selectRecorderMime()).toBeNull();
  });

  it("with no argument walks the built-in chain: WebM VP9, VP8, WebM, then MP4", () => {
    stubRecorder(ALL_CHAIN);
    expect(selectRecorderMime()).toBe("video/webm;codecs=vp9,opus");
    stubRecorder(ALL_CHAIN.slice(1));
    expect(selectRecorderMime()).toBe("video/webm;codecs=vp8,opus");
    stubRecorder(ALL_CHAIN.slice(3));
    expect(selectRecorderMime()).toBe("video/mp4;codecs=avc1.42E01E,mp4a.40.2");
    stubRecorder(["video/mp4"]);
    expect(selectRecorderMime()).toBe("video/mp4");
  });
});

describe("acceptMediaTypes", () => {
  it("matchesAccept: exact types, wildcards, parameters ignored, case-insensitive", () => {
    expect(matchesAccept("image/jpeg", ["image/jpeg"])).toBe(true);
    expect(matchesAccept("image/png", ["image/jpeg"])).toBe(false);
    expect(matchesAccept("video/webm;codecs=vp9", ["video/*"])).toBe(true);
    expect(matchesAccept("VIDEO/MP4", ["video/mp4"])).toBe(true);
    expect(matchesAccept("", ["image/*"])).toBe(false);
    expect(matchesAccept("image/gif", undefined)).toBe(true); // default image/* + video/*
    expect(acceptAttribute(undefined)).toBe("image/*,video/*");
    expect(acceptAttribute(["image/jpeg", "video/mp4"])).toBe("image/jpeg,video/mp4");
  });

  it("the base file input carries the list, the default is unchanged", () => {
    render(<MediaEditor presentation="inline" mediaSources={["upload"]} />);
    expect(fileInput().getAttribute("accept")).toBe("image/*,video/*");
    cleanup();
    render(
      <MediaEditor
        presentation="inline"
        mediaSources={["upload"]}
        acceptMediaTypes={["image/jpeg", "video/mp4"]}
      />,
    );
    expect(fileInput().getAttribute("accept")).toBe("image/jpeg,video/mp4");
  });

  it("rejects a file outside the list with unsupported-type, accepts one inside it", () => {
    const onValidationError = vi.fn<(e: ValidationError) => void>();
    render(
      <MediaEditor
        presentation="inline"
        mediaSources={["upload"]}
        acceptMediaTypes={["image/jpeg", "video/mp4"]}
        onValidationError={onValidationError}
      />,
    );
    pick(fileInput(), new File(["x"], "a.webm", { type: "video/webm" }));
    expect(onValidationError).toHaveBeenCalledTimes(1);
    expect(onValidationError.mock.calls[0]![0].kind).toBe("unsupported-type");
    expect(onValidationError.mock.calls[0]![0].message).toBe(
      ENGLISH.fileUnsupportedType("video/webm"),
    );
    expect(stageOf()).toBe("capture");
    pick(fileInput(), new File(["x"], "a.png", { type: "image/png" }));
    expect(onValidationError).toHaveBeenCalledTimes(2); // png is not in the list either
    pick(fileInput(), new File(["x"], "a.jpg", { type: "image/jpeg" }));
    expect(onValidationError).toHaveBeenCalledTimes(2);
    expect(stageOf()).toBe("edit");
  });

  it("the default list still accepts any image or video and rejects other types", () => {
    expect(validateGalleryFile(new File(["x"], "a.webm", { type: "video/webm" }), 50)).toBeNull();
    expect(validateGalleryFile(new File(["x"], "a.gif", { type: "image/gif" }), 50)).toBeNull();
    expect(validateGalleryFile(new File(["x"], "a.pdf", { type: "application/pdf" }), 50)?.kind).toBe(
      "unsupported-type",
    );
    // a custom list cannot widen the editor beyond images and videos
    expect(
      validateGalleryFile(new File(["x"], "a.pdf", { type: "application/pdf" }), 50, {
        acceptMediaTypes: ["application/pdf"],
      })?.kind,
    ).toBe("unsupported-type");
  });

  it("the capture slice's gallery input and validator use the same list", () => {
    const onValidationError = vi.fn<(e: ValidationError) => void>();
    const onGalleryFile = vi.fn();
    render(
      <EditorCamera
        enabled={false}
        mode="photo"
        labels={ENGLISH}
        acceptMediaTypes={["image/jpeg", "video/mp4"]}
        onPhoto={() => {}}
        onVideo={() => {}}
        onGalleryFile={onGalleryFile}
        onValidationError={onValidationError}
      />,
    );
    expect(fileInput().getAttribute("accept")).toBe("image/jpeg,video/mp4");
    pick(fileInput(), new File(["x"], "a.webm", { type: "video/webm" }));
    expect(onValidationError).toHaveBeenCalledTimes(1);
    expect(onValidationError.mock.calls[0]![0].kind).toBe("unsupported-type");
    expect(onGalleryFile).not.toHaveBeenCalled();
    pick(fileInput(), new File(["x"], "a.mp4", { type: "video/mp4" }));
    expect(onGalleryFile).toHaveBeenCalledTimes(1);
  });

  it("the capture slice defaults to image/*,video/*", () => {
    render(
      <EditorCamera
        enabled={false}
        mode="photo"
        labels={ENGLISH}
        onPhoto={() => {}}
        onVideo={() => {}}
        onGalleryFile={() => {}}
      />,
    );
    expect(fileInput().getAttribute("accept")).toBe("image/*,video/*");
  });
});

describe("videoOutput.mimeTypes with nothing recordable", () => {
  // Recording is only reachable with the camera source AND a capture extension wired.
  const capture = {
    Provider: ({ children }: { children: React.ReactNode }) => (
      <MediaCaptureExtensionContext.Provider value={{ CameraSurface: () => null }}>
        {children}
      </MediaCaptureExtensionContext.Provider>
    ),
  };
  const renderEditor = (props: Partial<React.ComponentProps<typeof MediaEditor>> = {}) =>
    render(
      <MediaEditor
        presentation="inline"
        mediaSources={["camera", "upload"]}
        capture={capture}
        videoOutput={{ mimeTypes: ["video/mp4"] }}
        {...props}
      />,
    );

  it("hides the video mode and tells the host once", () => {
    stubRecorder(["video/webm"]); // mp4 is not recordable here
    const onValidationError = vi.fn<(e: ValidationError) => void>();
    const { rerender } = renderEditor({ onValidationError });
    expect(modeButtons()).toEqual(["photo", "text"]);
    expect(onValidationError).toHaveBeenCalledTimes(1);
    expect(onValidationError.mock.calls[0]![0]).toEqual({
      kind: "unsupported-codec",
      message: ENGLISH.videoCodecUnavailable,
    });
    // re-rendering with fresh array / labels identities does not fire again
    for (let i = 0; i < 2; i++) {
      rerender(
        <MediaEditor
          presentation="inline"
          mediaSources={["camera", "upload"]}
          capture={capture}
          videoOutput={{ mimeTypes: ["video/mp4"] }}
          labels={{}}
          onValidationError={onValidationError}
        />,
      );
    }
    expect(onValidationError).toHaveBeenCalledTimes(1);
  });

  it("keeps the video mode and stays silent when an allowed type is recordable", () => {
    stubRecorder(["video/mp4;codecs=avc1.42E01E,mp4a.40.2"]);
    const onValidationError = vi.fn();
    renderEditor({ onValidationError });
    expect(modeButtons()).toEqual(["photo", "video", "text"]);
    expect(onValidationError).not.toHaveBeenCalled();
  });

  it("upload-only config keeps video and never reports an error (no recorder is reachable)", () => {
    stubRecorder(["video/webm"]); // mp4 is not recordable, but nothing records
    const onValidationError = vi.fn();
    renderEditor({ onValidationError, mediaSources: ["upload"], capture: undefined });
    expect(modeButtons()).toEqual(["photo", "video", "text"]);
    expect(onValidationError).not.toHaveBeenCalled();
    cleanup();
    // camera requested but no capture extension wired: still no recorder, still silent
    renderEditor({ onValidationError, capture: undefined });
    expect(modeButtons()).toEqual(["photo", "video", "text"]);
    expect(onValidationError).not.toHaveBeenCalled();
  });

  it("presentation=auto resolves from the declared modes, not the filtered ones", () => {
    stubRecorder(["video/webm"]);
    renderEditor({ presentation: "auto", enabledModes: ["video"], isOpen: true, onClose: () => {} });
    // the only declared mode is hidden, yet the presentation is still the dialog a server render chose
    expect(document.querySelector('[data-slot="media-editor"]')!.getAttribute("data-presentation")).toBe("dialog");
  });

  it("does not warn when the host never enabled video", () => {
    stubRecorder(["video/webm"]);
    const onValidationError = vi.fn();
    renderEditor({ onValidationError, enabledModes: ["photo", "text"] });
    expect(onValidationError).not.toHaveBeenCalled();
  });

  it("the image path still works, and a video FILE still loads", () => {
    stubRecorder(["video/webm"]);
    // the camera surface stub hands a picked file to the editor, as the real one does
    const galleryCapture = {
      Provider: ({ children }: { children: React.ReactNode }) => (
        <MediaCaptureExtensionContext.Provider
          value={{
            CameraSurface: ((p: { onGalleryFile: (f: File) => void }) => (
              <>
                <button data-testid="pick-img" onClick={() => p.onGalleryFile(new File(["x"], "a.jpg", { type: "image/jpeg" }))} />
                <button data-testid="pick-vid" onClick={() => p.onGalleryFile(new File(["x"], "a.mp4", { type: "video/mp4" }))} />
              </>
            )) as never,
          }}
        >
          {children}
        </MediaCaptureExtensionContext.Provider>
      ),
    };
    renderEditor({ onValidationError: () => {}, capture: galleryCapture, defaultMode: "photo" });
    fireEvent.click(screen.getByTestId("pick-img"));
    expect(stageOf()).toBe("edit");
    cleanup();
    renderEditor({ onValidationError: () => {}, capture: galleryCapture, defaultMode: "photo" });
    fireEvent.click(screen.getByTestId("pick-vid"));
    expect(stageOf()).toBe("edit");
    expect(document.querySelector('[data-slot="media-editor"]')!.getAttribute("data-mode")).toBe("video");
  });

  it("a re-encode rejects with the label instead of producing another format", async () => {
    stubRecorder(["video/webm"]);
    const ref = React.createRef<MediaEditorHandle>();
    renderEditor({
      ref,
      onValidationError: () => {},
      initialSource: { kind: "blob", blob: new Blob(["v"], { type: "video/mp4" }), mode: "video" },
    });
    await screen.findByLabelText(ENGLISH.backToCapture);
    act(() => ref.current!.addSticker({ id: "s", name: "s", content: "x" } as never));
    await expect(ref.current!.export()).rejects.toThrow(ENGLISH.videoCodecUnavailable);
  });
});

describe("pass-through export metadata", () => {
  async function exportMimeType(blob: Blob, videoOutput?: { mimeTypes?: string[] }) {
    stubRecorder(ALL_CHAIN);
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor
        ref={ref}
        presentation="inline"
        mediaSources={["upload"]}
        videoOutput={videoOutput}
        initialSource={{ kind: "blob", blob, mode: "video" }}
      />,
    );
    await screen.findByLabelText(ENGLISH.backToCapture);
    const out = await ref.current!.export();
    return { out, blob };
  }

  it("reports the blob's own type, returns the original blob", async () => {
    const { out, blob } = await exportMimeType(new Blob(["v"], { type: "video/mp4" }), {
      mimeTypes: ["video/webm"],
    });
    expect(out.blob).toBe(blob);
    expect(out.metadata.mimeType).toBe("video/mp4");
  });

  it("a typeless blob reports the first allowed output type", async () => {
    const { out } = await exportMimeType(new Blob(["v"]), { mimeTypes: ["video/mp4", "video/webm"] });
    expect(out.metadata.mimeType).toBe("video/mp4");
  });

  it("a typeless blob with no allow-list keeps the old video/webm default", async () => {
    const { out } = await exportMimeType(new Blob(["v"]));
    expect(out.metadata.mimeType).toBe("video/webm");
  });
});

describe("tool chips follow the draft kind", () => {
  it("an image draft shows every enabled tool, a video draft shows none", () => {
    render(<MediaEditor presentation="inline" mediaSources={["upload"]} />);
    pick(fileInput(), new File(["x"], "a.jpg", { type: "image/jpeg" }));
    expect(stageOf()).toBe("edit");
    expect(toolChips()).toBe(6);
    cleanup();

    render(<MediaEditor presentation="inline" mediaSources={["upload"]} />);
    pick(fileInput(), new File(["x"], "a.mp4", { type: "video/mp4" }));
    expect(stageOf()).toBe("edit");
    expect(toolChips()).toBe(0);
  });

  it("a video initialSource shows no chips either", async () => {
    render(
      <MediaEditor
        presentation="inline"
        mediaSources={["upload"]}
        initialSource={{ kind: "blob", blob: new Blob(["v"], { type: "video/mp4" }), mode: "video" }}
      />,
    );
    await screen.findByLabelText(ENGLISH.backToCapture);
    expect(toolChips()).toBe(0);
  });
});

describe("the allow-list reaches the recorders", () => {
  it("compositeVideo rejects when none of the allowed types is recordable", async () => {
    stubRecorder(["video/webm"]);
    const { compositeVideo } = await import("../lib/composite-video");
    await expect(
      compositeVideo({
        sourceBlob: new Blob(["v"]),
        outputWidth: 10,
        outputHeight: 10,
        renderFrame: () => {},
        allowedMimeTypes: ["video/mp4"],
      }),
    ).rejects.toThrow(/None of the allowed video formats \(video\/mp4\)/);
  });

  it("useMediaCapture probes the allow-list, and the built-in chain without one", async () => {
    const { renderHook } = await import("@testing-library/react");
    const { useMediaCapture } = await import("../features/capture/hooks/use-media-capture");
    stubRecorder(ALL_CHAIN);
    const withList = renderHook(() =>
      useMediaCapture({ enabled: false, videoMimeTypes: ["video/mp4", "video/webm"] }),
    );
    expect(withList.result.current.recorderMime).toBe("video/mp4"); // first allowed, as supported
    const noList = renderHook(() => useMediaCapture({ enabled: false }));
    expect(noList.result.current.recorderMime).toBe("video/webm;codecs=vp9,opus");
    stubRecorder(["video/webm"]);
    const none = renderHook(() => useMediaCapture({ enabled: false, videoMimeTypes: ["video/mp4"] }));
    expect(none.result.current.recorderMime).toBeNull();
  });

  it("the editor hands the camera surface the accept list and the allow-list", () => {
    stubRecorder(ALL_CHAIN);
    let seen: Record<string, unknown> | null = null;
    const Probe = (p: Record<string, unknown>) => {
      seen = p;
      return null;
    };
    const capture = {
      Provider: ({ children }: { children: React.ReactNode }) => (
        <MediaCaptureExtensionContext.Provider value={{ CameraSurface: Probe as never }}>
          {children}
        </MediaCaptureExtensionContext.Provider>
      ),
    };
    render(
      <MediaEditor
        presentation="inline"
        capture={capture}
        acceptMediaTypes={["image/jpeg"]}
        videoOutput={{ mimeTypes: ["video/webm"] }}
      />,
    );
    fireEvent.click(document.querySelector('button[data-mode="photo"]')!);
    expect(seen).not.toBeNull();
    expect(seen!.acceptMediaTypes).toEqual(["image/jpeg"]);
    expect(seen!.videoMimeTypes).toEqual(["video/webm"]);
  });
});
