/**
 * media-editor 0.6.0 - slice B (shell, state hook, imperative handle):
 * isDirty/adjustments, text-card sync, isModified + EditActions, settled, export wiring,
 * frame remap, crop aspects, dialog, chip-row cue, focus, canvasBackground.
 *
 * The Konva canvas is a stub that records its props, so tests drive the callbacks the real
 * canvas fires (onStageSize / onMediaRect / onImagePainted / onImageError).
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { useMediaEditorState } from "../hooks/use-media-editor-state";
import { DEFAULT_TEXT_GRADIENTS } from "../lib/defaults";
import { renderPhoto } from "../lib/export-blob";
import { exportTextCardBlob } from "../lib/text-card-export";
import { resolveEditorLabels } from "../lib/normalize-labels";
import type { EditAction, MediaEditorHandle, MediaEditorState } from "../types";

const h = vi.hoisted(() => ({
  props: null as null | Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  stage: null as unknown,
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
vi.mock("../lib/text-card-export", () => ({ exportTextCardBlob: vi.fn() }));

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
const VIDEO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "video/mp4" });
const STAGE = { width: 400, height: 300 };
const FULL = { x: 0, y: 0, width: 400, height: 300 };

function fakeStage() {
  return {
    width: () => STAGE.width,
    height: () => STAGE.height,
    x: () => 0,
    y: () => 0,
    scaleX: () => 1,
    scaleY: () => 1,
    scale: () => {},
    position: () => {},
    batchDraw: () => {},
    findOne: () => undefined,
  };
}

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
  h.props = null;
  h.stage = fakeStage();
  vi.mocked(renderPhoto).mockReset();
  vi.mocked(renderPhoto).mockImplementation(async (o) => ({
    blob: new Blob(["x"], { type: o.mimeType ?? "image/png" }),
    width: o.width,
    height: o.height,
  }));
  vi.mocked(exportTextCardBlob).mockReset();
  vi.mocked(exportTextCardBlob).mockImplementation(async (o) => ({
    blob: new Blob(["t"], { type: o.mimeType ?? "image/png" }),
    width: Math.round(o.width * (o.pixelRatio ?? 2)),
    height: Math.round(o.height * (o.pixelRatio ?? 2)),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const chip = (tool: string) => document.querySelector<HTMLElement>(`[data-tool="${tool}"]`)!;
const content = (actions: EditAction[]) =>
  actions.filter((a) => !["mode-change", "tool-open", "tool-close"].includes(a.kind));

interface Mount {
  ref: React.RefObject<MediaEditorHandle | null>;
  actions: EditAction[];
}
async function mountPhoto(
  props: Partial<React.ComponentProps<typeof MediaEditor>> = {},
): Promise<Mount> {
  const ref = React.createRef<MediaEditorHandle>();
  const actions: EditAction[] = [];
  render(
    <MediaEditor
      ref={ref}
      presentation="inline"
      enabledModes={["photo"]}
      mediaSources={["upload"]}
      initialSource={{ kind: "blob", blob: PHOTO, mode: "photo" }}
      onEditAction={(a) => actions.push(a)}
      {...props}
    />,
  );
  await screen.findByLabelText(ENGLISH.backToCapture);
  await vi.waitFor(() => expect(h.props).not.toBeNull());
  return { ref, actions };
}

/** What the real canvas reports once it has measured and painted the current image. */
async function layout(
  opts: {
    stage?: { width: number; height: number };
    media?: { x: number; y: number; width: number; height: number } | null;
    natural?: { width: number; height: number };
    url?: string;
  } = {},
) {
  await act(async () => {
    h.props!.onStageSize(opts.stage ?? STAGE);
    h.props!.onMediaRect(opts.media === undefined ? FULL : opts.media);
    h.props!.onImagePainted(opts.url ?? h.props!.imageUrl, opts.natural ?? { width: 800, height: 600 });
    await new Promise((r) => setTimeout(r, 0));
  });
}
const snap = (m: Mount): MediaEditorState => m.ref.current!.getState();
const seed = (m: Mount, patch: Partial<MediaEditorState>) =>
  act(async () => {
    m.ref.current!.loadState({ ...snap(m), ...patch });
    await new Promise((r) => setTimeout(r, 0));
  });
const STICKER = (x: number, y: number) => ({ id: "s1", stickerId: "smile", x, y, rotation: 0, scale: 1 });

// ─── #2 state hook ───────────────────────────────────────────────────────

describe("state hook (#2)", () => {
  it("isDirty counts a non-neutral adjustment, and a neutral one is clean", () => {
    const { result } = renderHook(() => useMediaEditorState());
    expect(result.current.isDirty).toBe(false);
    act(() => result.current.setAdjustments({ brightness: 0.2 }));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.setAdjustments({ brightness: 0 }));
    expect(result.current.isDirty).toBe(false);
  });

  it("text mode keeps textContent / textBackground in sync with textOnly; textOnly is always filled", () => {
    const { result } = renderHook(() => useMediaEditorState());
    expect(result.current.state.textOnly).toEqual(result.current.textOnly);
    expect(result.current.state.textContent).toBeNull();
    act(() => result.current.setMode("text"));
    act(() => result.current.setTextOnly({ text: "hello", gradientId: "sunset" }));
    expect(result.current.state.textContent).toBe("hello");
    expect(result.current.state.textBackground).toEqual(
      DEFAULT_TEXT_GRADIENTS.find((g) => g.id === "sunset"),
    );
    expect(result.current.state.textOnly).toMatchObject({ text: "hello", gradientId: "sunset" });
  });

  it("uses the gradients the editor passes (renamed presets)", () => {
    const gradients = [{ id: "sunset", label: "Sonnenuntergang", background: "red" }];
    const { result } = renderHook(() => useMediaEditorState({ gradients }));
    act(() => result.current.setMode("text"));
    act(() => result.current.setTextOnly({ gradientId: "sunset" }));
    expect(result.current.state.textBackground?.label).toBe("Sonnenuntergang");
  });

  it("loadState restores textOnly when present, and leaves it alone when absent (old snapshots)", () => {
    const { result } = renderHook(() => useMediaEditorState());
    const loaded = { text: "restored", fontFamily: "serif", textColor: "#000000", gradientId: "ocean" };
    act(() => result.current.loadState({ ...result.current.state, mode: "text", textOnly: loaded }));
    expect(result.current.textOnly).toEqual(loaded);
    // A snapshot that carries neither `textOnly` nor text-card fields (here: a photo
    // snapshot) leaves the card alone. (A text-mode snapshot that DOES carry
    // textContent / textBackground now seeds the card - see shell-0-6-0-fixes R9.)
    const { textOnly: _t, ...old } = result.current.state;
    void _t;
    act(() => result.current.setTextOnly({ text: "typed after" }));
    act(() =>
      result.current.loadState({ ...old, mode: "photo", textContent: null, textBackground: null } as MediaEditorState),
    );
    expect(result.current.textOnly.text).toBe("typed after");
  });
});

// ─── #5 isModified + EditActions ─────────────────────────────────────────

describe("isModified and edit actions (#5)", () => {
  it("a loaded source is dirty but not modified; getIsDirty is unchanged", async () => {
    const m = await mountPhoto();
    expect(m.ref.current!.getIsDirty()).toBe(true);
    expect(m.ref.current!.isModified()).toBe(false);
    expect(content(m.actions)).toEqual([]);
  });

  it("text-add / text-update / text-remove", async () => {
    const m = await mountPhoto();
    await layout();
    fireEvent.click(chip("text"));
    await vi.waitFor(() => expect(h.props!.textOverlays).toHaveLength(1));
    const overlay = h.props!.textOverlays[0];
    expect(content(m.actions)).toEqual([{ kind: "text-add", overlay: expect.objectContaining({ id: overlay.id }) }]);
    expect(m.ref.current!.isModified()).toBe(true);
    act(() => h.props!.onTextChange({ ...overlay, x: overlay.x + 7, rotation: 15 }));
    expect(content(m.actions)[1]).toEqual({
      kind: "text-update",
      id: overlay.id,
      patch: { x: overlay.x + 7, rotation: 15 },
    });
    fireEvent.click(screen.getByLabelText(ENGLISH.textDelete));
    expect(content(m.actions)[2]).toEqual({ kind: "text-remove", id: overlay.id });
  });

  it("sticker-add (handle) and sticker moves set modified without an action", async () => {
    const m = await mountPhoto();
    await layout();
    act(() => m.ref.current!.addSticker({ id: "smile", src: "data:,", alt: "Smile" }));
    expect(content(m.actions)).toEqual([{ kind: "sticker-add", placed: expect.objectContaining({ stickerId: "smile" }) }]);
    const placed = h.props!.stickers[0];
    await seed(m, { stickers: [placed] }); // load clears modified
    expect(m.ref.current!.isModified()).toBe(false);
    const before = m.actions.length;
    act(() => h.props!.onStickerChange({ ...placed, x: placed.x + 5 }));
    expect(m.ref.current!.isModified()).toBe(true);
    expect(m.actions.length).toBe(before);
  });

  it("draw-stroke fires once at stroke end", async () => {
    const m = await mountPhoto();
    await layout();
    fireEvent.click(chip("draw"));
    act(() => h.props!.onDrawBegin(1, 1));
    act(() => h.props!.onDrawExtend(2, 2));
    act(() => h.props!.onDrawExtend(3, 3));
    expect(content(m.actions)).toEqual([]);
    act(() => h.props!.onDrawEnd());
    expect(content(m.actions)).toEqual([
      { kind: "draw-stroke", stroke: expect.objectContaining({ points: [1, 1, 2, 2, 3, 3] }) },
    ]);
    expect(m.ref.current!.isModified()).toBe(true);
  });

  it("filter-apply (handle)", async () => {
    const m = await mountPhoto();
    act(() => m.ref.current!.applyFilter("noir"));
    expect(content(m.actions)).toEqual([{ kind: "filter-apply", name: "noir" }]);
    expect(m.ref.current!.isModified()).toBe(true);
  });

  it("adjust-change is one trailing-debounced action per slider gesture (keyboard, no Radix commit event)", async () => {
    const m = await mountPhoto();
    fireEvent.click(chip("adjust"));
    const thumb = (await screen.findAllByRole("slider"))[0]!;
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(m.ref.current!.isModified()).toBe(true); // synchronous
    expect(content(m.actions)).toEqual([]);
    await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
    expect(content(m.actions)).toEqual([]); // still inside the debounce window
    await vi.waitFor(() => expect(content(m.actions)).toHaveLength(1), { timeout: 1000 });
    const a = content(m.actions)[0] as Extract<EditAction, { kind: "adjust-change" }>;
    expect(a.kind).toBe("adjust-change");
    expect(Object.keys(a.patch)).toEqual(["brightness"]);
    expect(a.patch.brightness).toBeCloseTo(0.15, 5);
  });

  it("crop-set on Apply carries the applied rect; loading emits nothing", async () => {
    const m = await mountPhoto();
    await layout();
    stubCropEnvironment();
    fireEvent.click(chip("crop"));
    act(() => h.props!.onCropChange({ x: 100, y: 50, width: 200, height: 150 }));
    fireEvent.click(screen.getByText(ENGLISH.apply));
    await vi.waitFor(() => expect(content(m.actions)).toHaveLength(1));
    expect(content(m.actions)[0]).toEqual({ kind: "crop-set", crop: { x: 100, y: 50, width: 200, height: 150 }, aspect: "9:16", ratio: 9 / 16 });
    expect(m.ref.current!.isModified()).toBe(true);
  });

  it("loadState and reset clear modified (reset also emits its action)", async () => {
    const m = await mountPhoto();
    act(() => m.ref.current!.applyFilter("noir"));
    expect(m.ref.current!.isModified()).toBe(true);
    await seed(m, {});
    expect(m.ref.current!.isModified()).toBe(false);
    act(() => m.ref.current!.applyFilter("noir"));
    act(() => m.ref.current!.reset());
    expect(m.ref.current!.isModified()).toBe(false);
  });

  it("loadState with keepModified keeps the flag (a mode round-trip is not a new source)", async () => {
    const m = await mountPhoto();
    act(() => m.ref.current!.applyFilter("noir"));
    act(() => m.ref.current!.loadState({ ...m.ref.current!.getState(), mode: "photo" }, { keepModified: true }));
    expect(m.ref.current!.isModified()).toBe(true);
  });

  it("EditorCtx.isModified reaches the slots", async () => {
    const seen: boolean[] = [];
    const m = await mountPhoto({ renderTopBar: (ctx) => { seen.push(ctx.isModified); return null; } });
    expect(seen.at(-1)).toBe(false);
    act(() => m.ref.current!.applyFilter("noir"));
    expect(seen.at(-1)).toBe(true);
  });

  it("text-card typing sets modified and emits no action", async () => {
    const ref = React.createRef<MediaEditorHandle>();
    const actions: EditAction[] = [];
    render(
      <MediaEditor ref={ref} presentation="inline" enabledModes={["text"]} onEditAction={(a) => actions.push(a)} />,
    );
    expect(ref.current!.isModified()).toBe(false);
    fireEvent.change(screen.getByPlaceholderText(ENGLISH.textPlaceholder), { target: { value: "hi" } });
    expect(ref.current!.isModified()).toBe(true);
    expect(content(actions)).toEqual([]);
  });

  it("the dialog discard confirm follows isModified, not isDirty", async () => {
    const onClose = vi.fn();
    const m = await mountPhoto({ presentation: "dialog", isOpen: true, onClose });
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
    // untouched initialSource: dirty, not modified -> Escape closes without a confirm
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(ENGLISH.discardConfirmTitle)).toBeNull();
    act(() => m.ref.current!.applyFilter("noir"));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await screen.findByText(ENGLISH.discardConfirmTitle);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

function stubCropEnvironment() {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin = "";
    naturalWidth = 400;
    naturalHeight = 300;
    set src(_v: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage() {} } as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => cb(new Blob(["c"], { type: "image/jpeg" })));
}

// ─── #9 settled ──────────────────────────────────────────────────────────

describe("settled (#9)", () => {
  it("is unsettled until the canvas paints the current URL, then settled", async () => {
    const m = await mountPhoto();
    expect(m.ref.current!.isSettled()).toBe(false);
    await layout();
    expect(m.ref.current!.isSettled()).toBe(true);
  });

  it("whenSettled: concurrent waiters all resolve on paint; each timeout is independent and cleaned up", async () => {
    const m = await mountPhoto();
    const a = m.ref.current!.whenSettled();
    const b = m.ref.current!.whenSettled({ timeoutMs: 5000 });
    const short = m.ref.current!.whenSettled({ timeoutMs: 20 });
    await expect(short).rejects.toThrow(/not painted within 20 ms/);
    const cleared = vi.spyOn(globalThis, "clearTimeout");
    await layout();
    await expect(a).resolves.toBeUndefined();
    await expect(b).resolves.toBeUndefined();
    // the 5 s timer of `b` (and `a`'s 10 s default) were cleared on settle, not left to fire
    expect(cleared.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("whenSettled rejects when the image fails to load", async () => {
    const m = await mountPhoto();
    const p = m.ref.current!.whenSettled();
    const caught = p.catch((e: Error) => e);
    act(() => h.props!.onImageError(h.props!.imageUrl));
    expect(((await caught) as Error).message).toMatch(/could not be loaded/);
  });

  it("exportImage waits for the swap, then renders", async () => {
    const m = await mountPhoto();
    let done = false;
    const exporting = m.ref.current!.exportImage().then((r) => { done = true; return r; });
    await flush();
    expect(done).toBe(false);
    expect(renderPhoto).not.toHaveBeenCalled();
    await layout();
    await exporting;
    expect(renderPhoto).toHaveBeenCalledTimes(1);
  });

  it("exportImage rejects with a clear error instead of exporting when the image failed", async () => {
    const m = await mountPhoto();
    const exporting = m.ref.current!.exportImage().catch((e: Error) => e);
    act(() => h.props!.onImageError(h.props!.imageUrl));
    expect(((await exporting) as Error).message).toMatch(/could not be loaded/);
    expect(renderPhoto).not.toHaveBeenCalled();
  });

  it("exportImage never exports a canvas with nothing painted (video draft: settled, but no image)", async () => {
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor
        ref={ref}
        presentation="inline"
        enabledModes={["video"]}
        mediaSources={["upload"]}
        initialSource={{ kind: "blob", blob: VIDEO, mode: "video" }}
      />,
    );
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    expect(ref.current!.isSettled()).toBe(true);
    await expect(ref.current!.exportImage()).rejects.toThrow(/no image is painted/);
    expect(renderPhoto).not.toHaveBeenCalled();
  });

  it("a crop Apply swap is unsettled until the new image paints", async () => {
    const m = await mountPhoto();
    await layout();
    stubCropEnvironment();
    fireEvent.click(chip("crop"));
    act(() => h.props!.onCropChange({ x: 100, y: 50, width: 200, height: 150 }));
    fireEvent.click(screen.getByText(ENGLISH.apply));
    await vi.waitFor(() => expect(h.props!.imageUrl).not.toBe("blob:u1"));
    expect(m.ref.current!.isSettled()).toBe(false);
    await layout({ natural: { width: 200, height: 150 } });
    expect(m.ref.current!.isSettled()).toBe(true);
  });
});

// ─── #4 / #7 export wiring ───────────────────────────────────────────────

describe("export (#4, #7)", () => {
  it("default call exports the whole stage at pixelRatio 2 (I2); metadata is the blob's pixel size", async () => {
    const m = await mountPhoto();
    await layout();
    vi.mocked(renderPhoto).mockImplementationOnce(async () => ({ blob: new Blob(["x"]), width: 777, height: 555 }));
    const { metadata } = await m.ref.current!.exportImage();
    const call = vi.mocked(renderPhoto).mock.calls[0]![0];
    expect(call.rect).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    expect(call).toMatchObject({ pixelRatio: 2, width: 800, height: 600, mimeType: "image/jpeg", quality: 0.9 });
    expect(call.backgroundColor).toBeUndefined();
    expect([metadata.width, metadata.height]).toEqual([777, 555]);
    expect(metadata.frame).toEqual({ stageWidth: 400, stageHeight: 300, media: FULL });
  });

  it("region: media exports the photo's rect at its own resolution; size opts and backgroundColor pass through", async () => {
    const m = await mountPhoto({ canvasBackground: "oklch(0.2 0 0)" });
    await layout({ media: { x: 100, y: 0, width: 200, height: 300 }, natural: { width: 600, height: 900 } });
    await m.ref.current!.exportImage({ region: "media" });
    let call = vi.mocked(renderPhoto).mock.calls[0]![0];
    expect(call.rect).toEqual({ x: 100, y: 0, width: 200, height: 300 });
    expect([call.width, call.height]).toEqual([600, 900]);
    expect(call.backgroundColor).toBe("oklch(0.2 0 0)"); // canvasBackground is the export default
    await m.ref.current!.exportImage({ region: "media", maxEdge: 300, backgroundColor: "white" });
    call = vi.mocked(renderPhoto).mock.calls[1]![0];
    expect(Math.max(call.width, call.height)).toBe(300);
    expect(call.backgroundColor).toBe("white"); // the per-call colour wins
  });

  it("text mode draws the card with exportTextCardBlob, honouring format / pixelRatio / quality", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(500);
    const ref = React.createRef<MediaEditorHandle>();
    render(<MediaEditor ref={ref} presentation="inline" enabledModes={["text"]} />);
    fireEvent.change(screen.getByPlaceholderText(ENGLISH.textPlaceholder), { target: { value: "hello" } });
    const { blob, metadata } = await ref.current!.export({ format: "image/jpeg", pixelRatio: 3, quality: 0.5 });
    const call = vi.mocked(exportTextCardBlob).mock.calls[0]![0];
    expect(call).toMatchObject({ width: 300, height: 500, pixelRatio: 3, mimeType: "image/jpeg", quality: 0.5 });
    expect(call.textOnly.text).toBe("hello");
    expect(call.background?.id).toBe("lime");
    expect(blob.type).toBe("image/jpeg");
    expect([metadata.width, metadata.height]).toEqual([900, 1500]);
    expect(metadata).toMatchObject({ mode: "text", mimeType: "image/jpeg", textOnly: { text: "hello" } });
    expect(metadata.frame).toBeUndefined();
  });

  it("handle.exportImage in text mode draws the card too (not the absent Konva stage)", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(500);
    const ref = React.createRef<MediaEditorHandle>();
    render(<MediaEditor ref={ref} presentation="inline" enabledModes={["text"]} />);
    fireEvent.change(screen.getByPlaceholderText(ENGLISH.textPlaceholder), { target: { value: "hi" } });
    const { metadata } = await ref.current!.exportImage({ maxEdge: 1000 });
    expect(vi.mocked(exportTextCardBlob)).toHaveBeenCalledTimes(1);
    expect(metadata).toMatchObject({ mode: "text", width: 600, height: 1000 });
  });

  it("text cards are capped at 16.7 million output pixels like photos", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(500);
    const ref = React.createRef<MediaEditorHandle>();
    render(<MediaEditor ref={ref} presentation="inline" enabledModes={["text"]} />);
    fireEvent.change(screen.getByPlaceholderText(ENGLISH.textPlaceholder), { target: { value: "hi" } });
    await ref.current!.export({ pixelRatio: 20 }); // 6000 × 10000 = 60 MP requested
    const call = vi.mocked(exportTextCardBlob).mock.calls[0]![0];
    expect(300 * call.pixelRatio! * 500 * call.pixelRatio!).toBeLessThanOrEqual(16_777_216);
  });

  it("canvasBackground is the canvas background", async () => {
    await mountPhoto({ canvasBackground: "oklch(0.3 0.01 250)" });
    expect(h.props!.background).toBe("oklch(0.3 0.01 250)");
  });

  it("the canvas background stays undefined (canvas default) when not set", async () => {
    await mountPhoto();
    expect(h.props!.background).toBeUndefined();
  });
});

// ─── #10 frame ───────────────────────────────────────────────────────────

describe("frame and remap (#10)", () => {
  it("getState omits frame until the canvas measured, then fills it; textOnly always present", async () => {
    const m = await mountPhoto();
    expect(snap(m).frame).toBeUndefined();
    expect(snap(m).textOnly).toBeDefined();
    await layout({ media: { x: 100, y: 0, width: 200, height: 300 } });
    expect(snap(m).frame).toEqual({ stageWidth: 400, stageHeight: 300, media: { x: 100, y: 0, width: 200, height: 300 } });
  });

  it("(a) a media-rect change maps overlays onto the same picture content; no action, not a modification", async () => {
    const m = await mountPhoto();
    await layout({ media: { x: 100, y: 0, width: 200, height: 300 } });
    await seed(m, { stickers: [STICKER(200, 150)] });
    const before = m.actions.length;
    await act(async () => {
      h.props!.onMediaRect({ x: 0, y: 0, width: 400, height: 600 });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(h.props!.stickers[0]).toMatchObject({ x: 200, y: 300, scale: 2 });
    expect(m.actions.length).toBe(before);
    expect(m.ref.current!.isModified()).toBe(false);
  });

  it("(b) crop Apply remaps overlays once the cropped image is painted", async () => {
    const m = await mountPhoto();
    await layout();
    await seed(m, { stickers: [STICKER(150, 100)] });
    stubCropEnvironment();
    fireEvent.click(chip("crop"));
    act(() => h.props!.onCropChange({ x: 100, y: 50, width: 200, height: 150 }));
    fireEvent.click(screen.getByText(ENGLISH.apply));
    await vi.waitFor(() => expect(h.props!.imageUrl).not.toBe("blob:u1"));
    expect(h.props!.stickers[0]).toMatchObject({ x: 150, y: 100 }); // not yet: the new image is not painted
    await layout({ natural: { width: 200, height: 150 } }); // 200x150 content fills the 400x300 stage: k = 2
    expect(h.props!.stickers[0]).toMatchObject({ x: 100, y: 100, scale: 2 });
    expect(h.props!.cropRect).toBeNull();
  });

  it("(c) loadState with a frame maps from it once the loaded image is painted; a pending remap is not clobbered by a layout change", async () => {
    const m = await mountPhoto();
    await layout({ stage: { width: 800, height: 600 }, media: { x: 200, y: 0, width: 400, height: 600 } });
    const saved: MediaEditorState = {
      ...snap(m),
      stickers: [STICKER(200, 150)],
      frame: { stageWidth: 400, stageHeight: 300, media: { x: 100, y: 0, width: 200, height: 300 } },
    };
    await act(async () => {
      m.ref.current!.loadState(saved, { sourceBlob: PHOTO });
      await new Promise((r) => setTimeout(r, 0));
    });
    const url = h.props!.imageUrl;
    expect(url).not.toBe("blob:u1");
    expect(h.props!.stickers[0]).toMatchObject({ x: 200, y: 150 }); // waiting for the new image
    await act(async () => {
      h.props!.onMediaRect({ x: 0, y: 0, width: 800, height: 600 }); // an unrelated layout change while pending
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(h.props!.stickers[0]).toMatchObject({ x: 200, y: 150 }); // (a) did not touch it
    await layout({ stage: { width: 800, height: 600 }, media: { x: 200, y: 0, width: 400, height: 600 }, url });
    expect(h.props!.stickers[0]).toMatchObject({ x: 400, y: 300, scale: 2 });
    expect(m.ref.current!.isModified()).toBe(false);
    expect(content(m.actions)).toEqual([]);
  });

  it("(c) a snapshot without a frame loads as before (I4)", async () => {
    const m = await mountPhoto();
    await layout({ stage: { width: 800, height: 600 }, media: { x: 200, y: 0, width: 400, height: 600 } });
    const { frame: _f, ...noFrame } = snap(m);
    void _f;
    await seed(m, { ...noFrame, stickers: [STICKER(200, 150)], frame: undefined });
    expect(h.props!.stickers[0]).toMatchObject({ x: 200, y: 150, scale: 1 });
  });
});

// ─── #1 crop aspects ─────────────────────────────────────────────────────

describe("crop aspects (#1)", () => {
  it("offers original / W:H / free chips and drives the canvas ratio from the painted photo", async () => {
    await mountPhoto({
      cropAspects: ["original", "3:2", "free"],
      labels: { crop: { original: "Orijinal", free: "Serbest" } },
    });
    await layout({ natural: { width: 800, height: 400 } });
    fireEvent.click(chip("crop"));
    const chips = await screen.findAllByText(/^(Orijinal|3:2|Serbest)$/);
    expect(chips.map((c) => c.textContent)).toEqual(["Orijinal", "3:2", "Serbest"]);
    fireEvent.click(screen.getByText("Orijinal"));
    expect(h.props!.cropAspectRatio).toBe(2);
    fireEvent.click(screen.getByText("3:2"));
    expect(h.props!.cropAspectRatio).toBeCloseTo(1.5, 6);
    fireEvent.click(screen.getByText("Serbest"));
    expect(h.props!.cropAspectRatio).toBeNull();
  });
});

// ─── #3 dialog ───────────────────────────────────────────────────────────

describe("dialog (#3)", () => {
  it("pins the grid tracks, lets the root shrink, and merges dialogClassName last", async () => {
    render(
      <MediaEditor presentation="dialog" isOpen onClose={() => {}} mediaSources={["upload"]} dialogClassName="my-dialog" />,
    );
    const dialog = await screen.findByRole("dialog");
    const classes = dialog.className.split(/\s+/);
    expect(classes).toContain("grid-cols-[minmax(0,1fr)]");
    expect(classes).toContain("grid-rows-[minmax(0,1fr)]");
    expect(classes.at(-1)).toBe("my-dialog");
    const root = dialog.querySelector('[data-slot="media-editor"]')!;
    expect(root.className).toContain("min-w-0");
    expect(root.className).toContain("min-h-0");
  });
});

// ─── #8 chip-row cue ─────────────────────────────────────────────────────

describe("chip-row overflow cue (#8)", () => {
  function setMetrics(el: HTMLElement, m: { scrollWidth: number; clientWidth: number; scrollLeft: number }) {
    for (const [k, v] of Object.entries(m)) Object.defineProperty(el, k, { configurable: true, value: v });
    fireEvent.scroll(el);
  }
  const cue = (el: HTMLElement) => [el.hasAttribute("data-overflow-start"), el.hasAttribute("data-overflow-end")];

  it("shows the fade only on the side that has hidden content", async () => {
    await mountPhoto();
    const scroller = screen.getByRole("toolbar").parentElement as HTMLElement;
    setMetrics(scroller, { scrollWidth: 300, clientWidth: 300, scrollLeft: 0 });
    expect(cue(scroller)).toEqual([false, false]);
    setMetrics(scroller, { scrollWidth: 600, clientWidth: 300, scrollLeft: 0 });
    expect(cue(scroller)).toEqual([false, true]);
    setMetrics(scroller, { scrollWidth: 600, clientWidth: 300, scrollLeft: 150 });
    expect(cue(scroller)).toEqual([true, true]);
    setMetrics(scroller, { scrollWidth: 600, clientWidth: 300, scrollLeft: 300 });
    expect(cue(scroller)).toEqual([true, false]);
  });

  it("RTL: scrollLeft is negative and the cue is measured from the inline-start edge", async () => {
    await mountPhoto();
    const scroller = screen.getByRole("toolbar").parentElement as HTMLElement;
    setMetrics(scroller, { scrollWidth: 600, clientWidth: 300, scrollLeft: -150 });
    expect(cue(scroller)).toEqual([true, true]);
    setMetrics(scroller, { scrollWidth: 600, clientWidth: 300, scrollLeft: -300 });
    expect(cue(scroller)).toEqual([true, false]);
  });
});

// ─── #6 focus ────────────────────────────────────────────────────────────

describe("focus on unmount (#6)", () => {
  const hostApi = { hide: () => {} };
  function Host({ presentation }: { presentation: "dialog" | "inline" }) {
    const [shown, setShown] = React.useState(false);
    React.useEffect(() => {
      hostApi.hide = () => setShown(false);
    }, []);
    return (
      <>
        <button type="button" onClick={() => setShown(true)}>
          Open editor
        </button>
        {shown ? (
          <MediaEditor
            presentation={presentation}
            isOpen={presentation === "dialog" ? true : undefined}
            onClose={() => {}}
            mediaSources={["upload"]}
          />
        ) : null}
      </>
    );
  }

  it("dialog: unmounting while open returns focus to the opener", async () => {
    render(<Host presentation="dialog" />);
    const opener = screen.getByRole("button", { name: "Open editor" });
    await userEvent.click(opener);
    await screen.findByRole("dialog");
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
    expect(document.activeElement).not.toBe(opener);
    act(() => hostApi.hide());
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("inline: the opener is captured at mount and restored on unmount", async () => {
    render(<Host presentation="inline" />);
    const opener = screen.getByRole("button", { name: "Open editor" });
    await userEvent.click(opener);
    const pick = await screen.findByRole("button", { name: ENGLISH.galleryPicker });
    act(() => pick.focus());
    expect(document.activeElement).toBe(pick);
    act(() => hostApi.hide());
    await flush();
    expect(document.body.contains(pick)).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it("does not steal focus when it is somewhere else outside the editor", async () => {
    render(
      <>
        <Host presentation="inline" />
        <input aria-label="elsewhere" />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open editor" }));
    await screen.findByRole("button", { name: ENGLISH.galleryPicker });
    const other = screen.getByLabelText("elsewhere");
    act(() => other.focus());
    act(() => hostApi.hide());
    await flush();
    expect(document.activeElement).toBe(other);
  });
});
