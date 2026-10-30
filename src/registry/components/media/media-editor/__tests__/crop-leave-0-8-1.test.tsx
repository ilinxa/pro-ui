/**
 * media-editor 0.8.1 - leaving the crop tool (platform note 2026-10-30).
 * `state.crop` is a pending frame: it exists only while the crop tool shows it.
 * Apply burns it into the photo; every other way out discards it, so an export
 * can never trim to a rectangle nobody can see.
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { useMediaEditorState } from "../hooks/use-media-editor-state";
import { resolveEditorLabels } from "../lib/normalize-labels";
import { renderPhoto } from "../lib/export-blob";
import type { EditAction, EditTool, MediaEditorHandle, MediaEditorState } from "../types";

const h = vi.hoisted(() => ({
  props: null as null | Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  // One object, like a real Konva stage: "settled" compares the stage by identity.
  stage: { width: () => 400, height: () => 300, x: () => 0, y: () => 0, scaleX: () => 1, scaleY: () => 1, scale: () => {}, position: () => {}, batchDraw: () => {}, findOne: () => undefined },
}));

vi.mock("../parts/lazy-editor-canvas", () => ({
  default: function StubCanvas(props: Record<string, unknown>) {
    h.props = props;
    const onStageReady = props.onStageReady as ((s: unknown) => void) | undefined;
    React.useEffect(() => {
      onStageReady?.(h.stage);
    }, [onStageReady]);
    return null;
  },
}));

vi.mock("../lib/export-blob", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/export-blob")>();
  return { ...actual, renderPhoto: vi.fn() };
});

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
const VIDEO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "video/mp4" });
const STAGE = { width: 400, height: 300 };
const FULL = { x: 0, y: 0, width: 400, height: 300 };
const FRAME = { x: 40, y: 30, width: 320, height: 240 };

let urlCounter = 0;
beforeEach(() => {
  urlCounter = 0;
  URL.createObjectURL = () => `blob:u${++urlCounter}`;
  URL.revokeObjectURL = () => {};
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.mocked(renderPhoto).mockReset();
  vi.mocked(renderPhoto).mockImplementation(async (o) => ({
    blob: new Blob(["x"], { type: o.mimeType }),
    width: Math.round(o.rect.width),
    height: Math.round(o.rect.height),
  }));
  h.props = null;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const chip = (tool: EditTool) => document.querySelector<HTMLElement>(`[data-tool="${tool}"]`)!;
type Props = Partial<React.ComponentProps<typeof MediaEditor>>;
const baseProps: Props = {
  presentation: "inline",
  enabledModes: ["photo", "video"],
  mediaSources: ["upload"],
  initialSource: { kind: "blob", blob: PHOTO, mode: "photo" },
};

async function mountPhoto(props: Props = {}) {
  const ref = React.createRef<MediaEditorHandle>();
  const actions: EditAction[] = [];
  const view = render(
    <MediaEditor ref={ref} {...baseProps} onEditAction={(a) => actions.push(a)} {...props} />,
  );
  await screen.findByLabelText(ENGLISH.backToCapture);
  await vi.waitFor(() => expect(h.props).not.toBeNull());
  // The lazy stub reports its stage from an effect, which on a file's first
  // mount can land after a paint; a real canvas always paints onto its stage.
  await vi.waitFor(async () => {
    await paint();
    expect(ref.current!.isSettled()).toBe(true);
  });
  return { ref, actions, view };
}
async function paint() {
  await act(async () => {
    h.props!.onStageSize(STAGE);
    h.props!.onMediaRect(FULL);
    h.props!.onImagePainted(h.props!.imageUrl, { width: 800, height: 600 });
    await new Promise((r) => setTimeout(r, 0));
  });
}
/** Open Crop and let the canvas lay out its frame (the stub has no auto-init). */
function openCrop() {
  fireEvent.click(chip("crop"));
  act(() => h.props!.onCropChange(FRAME));
}
function stubImageEncoding(opts: { imageFails?: boolean; blob?: Blob | null } = {}) {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin = "";
    naturalWidth = 400;
    naturalHeight = 300;
    set src(_v: string) {
      queueMicrotask(() => (opts.imageFails ? this.onerror?.() : this.onload?.()));
    }
  }
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage() {}, clearRect() {} } as never);
  const blob = opts.blob === undefined ? new Blob(["c"], { type: "image/jpeg" }) : opts.blob;
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => cb(blob));
}
/** Encoding that waits for `finish()`: the window in which Apply is in flight. */
function stubHeldEncoding() {
  stubImageEncoding();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => {
    void gate.then(() => cb(new Blob(["c"], { type: "image/jpeg" })));
  });
  return {
    finish: () =>
      act(async () => {
        release();
        await new Promise((r) => setTimeout(r, 0));
      }),
  };
}
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const applyButton = () => screen.getByRole("button", { name: ENGLISH.apply });
const cancelButton = () => screen.getByRole("button", { name: ENGLISH.cancel });
const lastExportRect = () => vi.mocked(renderPhoto).mock.calls.at(-1)![0].rect;
const crops = (a: EditAction[]) => a.filter((x) => x.kind === "crop-set");

describe("the platform's repro: another tool chip while Crop is open", () => {
  it("discards the frame: getState, the canvas and both export regions agree on the whole photo", async () => {
    const m = await mountPhoto();
    openCrop();
    expect(m.ref.current!.getState().crop).toEqual(FRAME);

    fireEvent.click(chip("text"));
    await flush();

    expect(m.ref.current!.getState().crop).toBeNull();
    expect(h.props!.cropRect).toBeNull();
    expect(h.props!.cropActive).toBe(false);

    await act(async () => {
      await m.ref.current!.exportImage({ region: "stage" });
    });
    expect(lastExportRect()).toEqual(FULL);
    await act(async () => {
      await m.ref.current!.exportImage({ region: "media" });
    });
    expect(lastExportRect()).toEqual(FULL);
  });

  it.each(["draw", "stickers", "filters", "adjust"] as const)("%s discards it too", async (tool) => {
    const m = await mountPhoto();
    openCrop();
    fireEvent.click(chip(tool));
    await flush();
    expect(m.ref.current!.getState().crop).toBeNull();
  });

  it("the Crop chip itself keeps the frame (it does not leave the tool)", async () => {
    const m = await mountPhoto();
    openCrop();
    fireEvent.click(chip("crop"));
    await flush();
    expect(m.ref.current!.getState().crop).toEqual(FRAME);
  });

  it("the frame is already gone when the host hears tool-close", async () => {
    const seen: (MediaEditorState["crop"] | "unset")[] = [];
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor
        ref={ref}
        {...baseProps}
        onEditAction={(a) => {
          if (a.kind === "tool-close" && a.tool === "crop") seen.push(ref.current!.getState().crop);
        }}
      />,
    );
    await screen.findByLabelText(ENGLISH.backToCapture);
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    openCrop();
    fireEvent.click(chip("filters"));
    await flush();
    expect(seen).toEqual([null]);
  });

  it("is not a modification and emits no crop-set", async () => {
    const m = await mountPhoto();
    openCrop();
    fireEvent.click(chip("filters"));
    await flush();
    expect(m.ref.current!.isModified()).toBe(false);
    expect(crops(m.actions)).toHaveLength(0);
  });

  it("re-opening Crop starts from a fresh frame", async () => {
    await mountPhoto();
    openCrop();
    fireEvent.click(chip("filters"));
    await flush();
    fireEvent.click(chip("crop"));
    expect(h.props!.cropActive).toBe(true);
    expect(h.props!.cropRect).toBeNull();
  });
});

describe("the other ways out of the tool", () => {
  it("Cancel discards (regression)", async () => {
    const m = await mountPhoto();
    openCrop();
    fireEvent.click(cancelButton());
    await flush();
    expect(m.ref.current!.getState().crop).toBeNull();
  });

  it("Apply burns the frame in and clears it (regression)", async () => {
    const m = await mountPhoto();
    stubImageEncoding();
    openCrop();
    fireEvent.click(applyButton());
    await vi.waitFor(() => expect(crops(m.actions)).toHaveLength(1));
    expect(m.ref.current!.getState().crop).toBeNull();
    expect(h.props!.cropActive).toBe(false);
  });

  it("an Apply whose image fails to load leaves no hidden frame", async () => {
    const m = await mountPhoto();
    stubImageEncoding({ imageFails: true });
    openCrop();
    fireEvent.click(applyButton());
    await vi.waitFor(() => expect(h.props!.cropActive).toBe(false));
    expect(m.ref.current!.getState().crop).toBeNull();
    expect(crops(m.actions)).toHaveLength(0);
  });

  it("an Apply whose encode returns nothing leaves no hidden frame", async () => {
    const m = await mountPhoto();
    stubImageEncoding({ blob: null });
    openCrop();
    fireEvent.click(applyButton());
    await vi.waitFor(() => expect(h.props!.cropActive).toBe(false));
    expect(m.ref.current!.getState().crop).toBeNull();
  });

  it("an Apply with a frame outside the photo leaves no hidden frame", async () => {
    const m = await mountPhoto();
    stubImageEncoding();
    fireEvent.click(chip("crop"));
    act(() => h.props!.onCropChange({ x: 500, y: 500, width: 50, height: 50 }));
    fireEvent.click(applyButton());
    await vi.waitFor(() => expect(h.props!.cropActive).toBe(false));
    expect(m.ref.current!.getState().crop).toBeNull();
  });
});

describe("while Apply is encoding", () => {
  it("Cancel wins: the photo is not replaced afterwards", async () => {
    const m = await mountPhoto();
    const held = stubHeldEncoding();
    openCrop();
    const before = h.props!.imageUrl;
    fireEvent.click(applyButton());
    await flush();
    fireEvent.click(cancelButton());
    await held.finish();
    expect(crops(m.actions)).toHaveLength(0);
    expect(h.props!.imageUrl).toBe(before);
    expect(m.ref.current!.isModified()).toBe(false);
    expect(m.ref.current!.isSettled()).toBe(true);
  });

  it("after a Cancel the chips work at once, and the stale Apply stays out of the way", async () => {
    const m = await mountPhoto();
    const held = stubHeldEncoding();
    openCrop();
    const before = h.props!.imageUrl;
    fireEvent.click(applyButton());
    await flush();
    fireEvent.click(cancelButton());
    await flush();
    fireEvent.click(chip("filters"));
    await flush();
    expect(m.actions.some((a) => a.kind === "tool-open" && a.tool === "filters")).toBe(true);
    await held.finish();
    expect(crops(m.actions)).toHaveLength(0);
    expect(h.props!.imageUrl).toBe(before);
    // The stale Apply must not have closed the tool the user moved on to.
    expect(m.actions.some((a) => a.kind === "tool-close" && a.tool === "filters")).toBe(false);
  });

  it("a tool chip is ignored: Apply lands and closes the tool", async () => {
    const m = await mountPhoto();
    const held = stubHeldEncoding();
    openCrop();
    fireEvent.click(applyButton());
    await flush();
    fireEvent.click(chip("filters"));
    await flush();
    expect(h.props!.cropActive).toBe(true);
    await held.finish();
    expect(crops(m.actions)).toHaveLength(1);
    expect(h.props!.cropActive).toBe(false);
    expect(document.querySelector('[data-tool="filters"]')).not.toBeNull();
    expect(m.actions.some((a) => a.kind === "tool-open" && a.tool === "filters")).toBe(false);
  });
});

describe("loadState", () => {
  const withFrame = (s: MediaEditorState): MediaEditorState => ({ ...s, crop: FRAME });

  it("drops a snapshot's frame when the crop tool is closed (nothing could show it)", async () => {
    const m = await mountPhoto();
    const url = h.props!.imageUrl;
    act(() => m.ref.current!.loadState(withFrame(m.ref.current!.getState())));
    await flush();
    expect(m.ref.current!.getState().crop).toBeNull();
    expect(h.props!.imageUrl).toBe(url);
    await paint();
    await act(async () => {
      await m.ref.current!.exportImage();
    });
    expect(lastExportRect()).toEqual(FULL);
  });

  it("keeps the frame while the crop tool is open (story-composer's mode round trip)", async () => {
    const m = await mountPhoto();
    openCrop();
    act(() => m.ref.current!.loadState(m.ref.current!.getState(), { keepModified: true }));
    await flush();
    expect(m.ref.current!.getState().crop).toEqual(FRAME);
  });
});

describe("Back from a tool reached through Crop", () => {
  it("Filters -> Crop -> Adjust -> Back restores the entry state with no frame", async () => {
    const m = await mountPhoto();
    fireEvent.click(chip("filters"));
    await flush();
    openCrop();
    fireEvent.click(chip("adjust"));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: ENGLISH.back }));
    await flush();
    expect(m.ref.current!.getState().crop).toBeNull();
    expect(h.props!.cropActive).toBe(false);
  });
});

describe("a new source while Crop is open", () => {
  const swap = (m: Awaited<ReturnType<typeof mountPhoto>>, source: NonNullable<Props["initialSource"]>) =>
    m.view.rerender(
      <MediaEditor ref={m.ref} {...baseProps} initialSource={source} onEditAction={(a) => m.actions.push(a)} />,
    );

  it("closes the tool and drops the old photo's frame", async () => {
    const m = await mountPhoto();
    openCrop();
    swap(m, { kind: "blob", blob: new Blob([new Uint8Array([9])], { type: "image/png" }), mode: "photo" });
    await vi.waitFor(() => expect(h.props!.cropRect).toBeNull());
    expect(h.props!.cropActive).toBe(false);
    expect(m.actions.at(-1)).toMatchObject({ kind: "tool-close", tool: "crop" });
  });

  it("closes the tool on a video too: no frame, and the canvas is not asked for one", async () => {
    const m = await mountPhoto();
    openCrop();
    swap(m, { kind: "blob", blob: VIDEO, mode: "video" });
    await vi.waitFor(() => expect(m.ref.current!.getState().mode).toBe("video"));
    await flush();
    expect(m.ref.current!.getState().crop).toBeNull();
    expect(h.props!.cropActive).toBe(false);
    expect(m.actions.some((a) => a.kind === "tool-close" && a.tool === "crop")).toBe(true);
  });
});

describe("what must keep working", () => {
  it("an export while Crop is open trims to the frame on screen (documented)", async () => {
    const m = await mountPhoto();
    openCrop();
    await act(async () => {
      await m.ref.current!.exportImage();
    });
    expect(lastExportRect()).toEqual(FRAME);
  });
});

describe("useMediaEditorState", () => {
  it("setActiveTool away from crop clears the frame in the same update", () => {
    const { result } = renderHook(() => useMediaEditorState());
    act(() => result.current.setActiveTool("crop"));
    act(() => result.current.setCrop(FRAME));
    act(() => result.current.setActiveTool("draw"));
    expect(result.current.activeTool).toBe("draw");
    expect(result.current.state.crop).toBeNull();
  });

  it("closing a tool with no frame set does not touch the snapshot", () => {
    const { result } = renderHook(() => useMediaEditorState());
    const before = result.current.state;
    act(() => result.current.setActiveTool(null));
    expect(result.current.state).toBe(before);
  });
});
