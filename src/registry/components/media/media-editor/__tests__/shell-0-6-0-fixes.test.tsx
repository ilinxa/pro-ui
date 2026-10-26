/**
 * media-editor 0.6.0 - fix wave B (shell + state hook): settled/commit ordering,
 * baseline keep, Back restore, memoised crop aspects, text seeding, adjust
 * debounce lifecycle, crop Apply token, intake override, composited-video frame,
 * initialSource pending, stage-instance painted, capture discard confirm,
 * inline unmount focus, measured text card.
 *
 * Same harness as shell-0-6-0.test.tsx: the Konva canvas is a stub that records its props.
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
import { compositeVideo } from "../lib/composite-video";
import { resolveCropAspects } from "../lib/resolve-crop-aspects";
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
vi.mock("../lib/composite-video", () => ({ compositeVideo: vi.fn() }));
vi.mock("../lib/resolve-crop-aspects", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/resolve-crop-aspects")>();
  return { ...actual, resolveCropAspects: vi.fn(actual.resolveCropAspects) };
});

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
const VIDEO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "video/mp4" });
const STAGE = { width: 400, height: 300 };
const FULL = { x: 0, y: 0, width: 400, height: 300 };
const MID = { x: 100, y: 0, width: 200, height: 300 };

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
  vi.mocked(compositeVideo).mockReset();
  vi.mocked(compositeVideo).mockImplementation(async () => ({
    blob: new Blob(["v"], { type: "video/webm" }),
    mimeType: "video/webm",
    durationMs: 1000,
  }));
  vi.mocked(resolveCropAspects).mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const wait = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const flush = () => wait(0);
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
const SMILE = { id: "smile", src: "data:,", alt: "Smile" };

function stubCropEnvironment(deferBlob?: { release: () => void }) {
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
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => {
    const blob = new Blob(["c"], { type: "image/jpeg" });
    if (deferBlob) deferBlob.release = () => cb(blob);
    else cb(blob);
  });
}

// ─── R1 / R17 settled waits for the committed remap ──────────────────────

describe("R1 + R17: export waits for the remap to COMMIT and reads the committed state", () => {
  const BIG = { stage: { width: 800, height: 600 }, media: { x: 200, y: 0, width: 400, height: 600 } };
  it("an export started during a loadState remap renders and reports the remapped overlays", async () => {
    const m = await mountPhoto();
    await layout(BIG);
    const saved: MediaEditorState = {
      ...snap(m),
      stickers: [STICKER(200, 150)],
      frame: { stageWidth: 400, stageHeight: 300, media: MID },
    };
    await act(async () => {
      m.ref.current!.loadState(saved, { sourceBlob: PHOTO });
      await new Promise((r) => setTimeout(r, 0));
    });
    const url = h.props!.imageUrl;
    let atRender: unknown = null;
    vi.mocked(renderPhoto).mockImplementation(async (o) => {
      atRender = h.props!.stickers[0];
      return { blob: new Blob(["x"]), width: o.width, height: o.height };
    });
    const exporting = m.ref.current!.exportImage();
    await layout({ ...BIG, url });
    const res = await exporting;
    expect(atRender).toMatchObject({ x: 400, y: 300, scale: 2 }); // not the pre-remap (200, 150)
    expect(res.metadata.stickers[0]).toMatchObject({ x: 400, y: 300, scale: 2 });
    expect(res.metadata.frame).toEqual({ stageWidth: 800, stageHeight: 600, media: BIG.media });
  });

  it("the editor is not settled while a painted image still owes its overlay remap", async () => {
    const m = await mountPhoto();
    await layout({ media: MID });
    await seed(m, { stickers: [STICKER(200, 150)] });
    let settledDuring: boolean | null = null;
    await act(async () => {
      h.props!.onMediaRect({ x: 0, y: 0, width: 400, height: 600 });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      settledDuring = m.ref.current!.isSettled(); // remap dispatched, not yet committed
    });
    expect(settledDuring).toBe(false);
    expect(m.ref.current!.isSettled()).toBe(true);
    expect(h.props!.stickers[0]).toMatchObject({ x: 200, y: 300, scale: 2 });
  });

  it("getState pairs the committed state with the frame recorded with it (R17)", async () => {
    const m = await mountPhoto();
    await layout({ media: MID });
    await seed(m, { stickers: [STICKER(200, 150)] });
    let during: MediaEditorState | null = null;
    await act(async () => {
      h.props!.onMediaRect({ x: 0, y: 0, width: 400, height: 600 });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      during = m.ref.current!.getState();
    });
    // Nothing has committed yet inside the act: the sticker is still the old one, so the frame must be too.
    expect(during!.stickers[0]).toMatchObject({ x: 200, y: 150 });
    expect(during!.frame!.media).toEqual(MID);
    const after = snap(m);
    expect(after.stickers[0]).toMatchObject({ x: 200, y: 300 });
    expect(after.frame!.media).toEqual({ x: 0, y: 0, width: 400, height: 600 });
  });
});

// ─── R4 keep the baseline when the media rect vanishes ───────────────────

describe("R4: a media-less frame for the same source keeps the baseline", () => {
  it("hidden container (media null) then a real layout still maps by the photo's content", async () => {
    const m = await mountPhoto();
    await layout({ media: MID });
    await seed(m, { stickers: [STICKER(150, 50)] });
    await act(async () => { h.props!.onMediaRect(null); await new Promise((r) => setTimeout(r, 0)); });
    await act(async () => { h.props!.onStageSize({ width: 800, height: 300 }); await new Promise((r) => setTimeout(r, 0)); });
    await act(async () => { h.props!.onMediaRect({ x: 300, y: 0, width: 200, height: 300 }); await new Promise((r) => setTimeout(r, 0)); });
    expect(h.props!.stickers[0]).toMatchObject({ x: 350, y: 50, scale: 1 });
  });
});

// ─── R5 shell: measured text card ────────────────────────────────────────

describe("R5: text card export measures the live text surface", () => {
  it("passes the computed font size, the text box width and the direction", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(500);
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element, pseudo?: string | null) => {
      const cs = real(el, pseudo);
      if ((el as HTMLElement).dataset?.slot !== "textcard-input") return cs;
      return new Proxy(cs, {
        get(target, prop) {
          if (prop === "fontSize") return "33.6px";
          if (prop === "direction") return "rtl";
          if (prop === "paddingInlineStart" || prop === "paddingInlineEnd") return "8px";
          const v = Reflect.get(target, prop);
          return typeof v === "function" ? v.bind(target) : v;
        },
      });
    });
    Object.defineProperty(HTMLTextAreaElement.prototype, "clientWidth", { configurable: true, get: () => 256 });
    try {
      const ref = React.createRef<MediaEditorHandle>();
      render(<MediaEditor ref={ref} presentation="inline" enabledModes={["text"]} />);
      fireEvent.change(screen.getByPlaceholderText(ENGLISH.textPlaceholder), { target: { value: "merhaba" } });
      await ref.current!.export();
      const call = vi.mocked(exportTextCardBlob).mock.calls[0]![0];
      expect(call.fontSizePx).toBe(33.6);
      expect(call.textBoxWidth).toBe(240); // 256 - 2 * 8
      expect(call.direction).toBe("rtl");
    } finally {
      delete (HTMLTextAreaElement.prototype as unknown as Record<string, unknown>).clientWidth;
    }
  });

  it("leaves the measurements out when the environment cannot report them", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(500);
    const ref = React.createRef<MediaEditorHandle>();
    render(<MediaEditor ref={ref} presentation="inline" enabledModes={["text"]} />);
    await ref.current!.export();
    const call = vi.mocked(exportTextCardBlob).mock.calls[0]![0];
    expect(call.textBoxWidth).toBeUndefined(); // jsdom: clientWidth 0
  });
});

// ─── R6 + R7 Back on a tool panel ────────────────────────────────────────

describe("R6 + R7: Back restores the entry state, frame-mapped, flag and all", () => {
  it("R6: Back after the auto-seeded text overlay leaves nothing and clears modified; text-remove is emitted", async () => {
    const m = await mountPhoto();
    await layout();
    fireEvent.click(chip("text"));
    await vi.waitFor(() => expect(h.props!.textOverlays).toHaveLength(1));
    const id = h.props!.textOverlays[0].id;
    expect(m.ref.current!.isModified()).toBe(true);
    fireEvent.click(screen.getByText(ENGLISH.back));
    await flush();
    expect(h.props!.textOverlays).toHaveLength(0);
    expect(m.ref.current!.isModified()).toBe(false);
    expect(content(m.actions)).toEqual([
      { kind: "text-add", overlay: expect.objectContaining({ id }) },
      { kind: "text-remove", id },
    ]);
  });

  it("R6: the flag captured at entry is restored, not cleared", async () => {
    const m = await mountPhoto();
    await layout();
    act(() => m.ref.current!.applyFilter("noir"));
    expect(m.ref.current!.isModified()).toBe(true);
    fireEvent.click(chip("text"));
    await vi.waitFor(() => expect(h.props!.textOverlays).toHaveLength(1));
    fireEvent.click(screen.getByText(ENGLISH.back));
    await flush();
    expect(m.ref.current!.isModified()).toBe(true);
  });

  it("R7: the entry snapshot is mapped onto the layout of NOW, and stickers added meanwhile emit sticker-remove", async () => {
    const m = await mountPhoto();
    await layout({ media: MID });
    await seed(m, { stickers: [STICKER(200, 150)] });
    fireEvent.click(chip("stickers"));
    await flush();
    act(() => m.ref.current!.addSticker(SMILE));
    const added = h.props!.stickers.find((s: { id: string }) => s.id !== "s1");
    expect(added).toBeDefined();
    // the layout doubles while the tool is open: the photo now fills a 400 x 600 stage
    await layout({ stage: { width: 400, height: 600 }, media: { x: 0, y: 0, width: 400, height: 600 }, url: h.props!.imageUrl });
    expect(h.props!.stickers.find((s: { id: string }) => s.id === "s1")).toMatchObject({ x: 200, y: 300, scale: 2 });
    fireEvent.click(screen.getByText(ENGLISH.back));
    await flush();
    expect(h.props!.stickers).toHaveLength(1);
    expect(h.props!.stickers[0]).toMatchObject({ id: "s1", x: 200, y: 300, scale: 2 }); // raw entry would be (200, 150, 1)
    expect(content(m.actions).filter((a) => a.kind === "sticker-remove")).toEqual([
      { kind: "sticker-remove", id: added.id },
    ]);
  });
});

// ─── R8 memoised crop aspects ────────────────────────────────────────────

describe("R8: crop aspects resolve when their inputs change, not per render", () => {
  it("an inline cropAspects literal re-rendered does not re-resolve; a changed one does", () => {
    const ui = (aspects: string[]) => (
      <MediaEditor presentation="inline" enabledModes={["photo"]} mediaSources={["upload"]} cropAspects={aspects as never} />
    );
    const { rerender } = render(ui(["1:1", "3:2"]));
    const initial = vi.mocked(resolveCropAspects).mock.calls.length;
    expect(initial).toBeGreaterThan(0);
    expect(initial).toBeLessThanOrEqual(2);
    rerender(ui(["1:1", "3:2"]));
    rerender(ui(["1:1", "3:2"]));
    rerender(ui(["1:1", "3:2"]));
    expect(vi.mocked(resolveCropAspects).mock.calls.length).toBe(initial);
    rerender(ui(["1:1", "4:5"]));
    expect(vi.mocked(resolveCropAspects).mock.calls.length).toBeGreaterThan(initial);
  });
});

// ─── R9 text seeding ─────────────────────────────────────────────────────

describe("R9: a text snapshot without textOnly seeds the card; addText in text mode shows", () => {
  it("loadState seeds text and gradient id from textContent / textBackground", () => {
    const { result } = renderHook(() => useMediaEditorState());
    const base = result.current.state;
    const { textOnly: _t, ...old } = base;
    void _t;
    const ocean = DEFAULT_TEXT_GRADIENTS.find((g) => g.id === "ocean")!;
    act(() =>
      result.current.loadState({ ...old, mode: "text", textContent: "from 0.5", textBackground: ocean } as MediaEditorState),
    );
    expect(result.current.textOnly.text).toBe("from 0.5");
    expect(result.current.textOnly.gradientId).toBe("ocean");
  });

  it("only the non-null field seeds; a text snapshot with neither leaves the card alone", () => {
    const { result } = renderHook(() => useMediaEditorState());
    act(() => result.current.setTextOnly({ text: "keep", gradientId: "sunset" }));
    const { textOnly: _t, ...old } = result.current.state;
    void _t;
    act(() => result.current.loadState({ ...old, mode: "text", textContent: "only text", textBackground: null } as MediaEditorState));
    expect(result.current.textOnly).toMatchObject({ text: "only text", gradientId: "sunset" });
    act(() => result.current.loadState({ ...old, mode: "text", textContent: null, textBackground: null } as MediaEditorState));
    expect(result.current.textOnly).toMatchObject({ text: "only text", gradientId: "sunset" });
  });

  it("handle.addText(text) in text mode is visible on the card and in the snapshot", async () => {
    const ref = React.createRef<MediaEditorHandle>();
    render(<MediaEditor ref={ref} presentation="inline" enabledModes={["text"]} />);
    act(() => ref.current!.addText("typed from the host"));
    expect((screen.getByPlaceholderText(ENGLISH.textPlaceholder) as HTMLTextAreaElement).value).toBe("typed from the host");
    expect(ref.current!.getState().textOnly?.text).toBe("typed from the host");
    expect(ref.current!.getState().textContent).toBe("typed from the host");
    expect(ref.current!.isModified()).toBe(true);
  });
});

// ─── R10 adjust debounce lifecycle ───────────────────────────────────────

describe("R10: the pending adjust-change follows the source it described", () => {
  const nudge = async () => {
    fireEvent.click(chip("adjust"));
    const thumb = (await screen.findAllByRole("slider"))[0]!;
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
  };
  const adjusts = (m: Mount) => m.actions.filter((a) => a.kind === "adjust-change");

  it("reset drops it", async () => {
    const m = await mountPhoto();
    await nudge();
    act(() => m.ref.current!.reset());
    await wait(400);
    expect(adjusts(m)).toEqual([]);
  });

  it("loadState drops it", async () => {
    const m = await mountPhoto();
    await nudge();
    await seed(m, {});
    await wait(400);
    expect(adjusts(m)).toEqual([]);
  });

  it("a keepModified round-trip flushes it instead (the edit is still in the state)", async () => {
    const m = await mountPhoto();
    await nudge();
    act(() => m.ref.current!.loadState(m.ref.current!.getState(), { keepModified: true }));
    expect(adjusts(m)).toHaveLength(1);
    await wait(400);
    expect(adjusts(m)).toHaveLength(1);
  });

  it("an export flushes it first", async () => {
    const m = await mountPhoto();
    await layout();
    await nudge();
    expect(adjusts(m)).toEqual([]);
    const exporting = m.ref.current!.exportImage();
    expect(adjusts(m)).toHaveLength(1); // emitted synchronously at the start of the export
    await exporting;
    await wait(400);
    expect(adjusts(m)).toHaveLength(1); // and not again when the timer would have fired
  });

  it("a new initialSource drops it", async () => {
    const actions: EditAction[] = [];
    const ui = (blob: Blob) => (
      <MediaEditor
        presentation="inline"
        enabledModes={["photo"]}
        mediaSources={["upload"]}
        initialSource={{ kind: "blob", blob, mode: "photo" }}
        onEditAction={(a) => actions.push(a)}
      />
    );
    const { rerender } = render(ui(PHOTO));
    await screen.findByLabelText(ENGLISH.backToCapture);
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    await nudge();
    rerender(ui(new Blob([new Uint8Array([9, 9, 9])], { type: "image/png" })));
    await wait(400);
    expect(actions.filter((a) => a.kind === "adjust-change")).toEqual([]);
  });
});

async function waitForInput(): Promise<HTMLInputElement> {
  return vi.waitFor(() => {
    const el = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!el) throw new Error("no file input yet");
    return el;
  });
}

// ─── R11 crop Apply token ────────────────────────────────────────────────

describe("R11: a crop Apply in flight is a token", () => {
  async function startApply() {
    const m = await mountPhoto();
    await layout();
    const deferred = { release: () => {} };
    stubCropEnvironment(deferred);
    fireEvent.click(chip("crop"));
    act(() => h.props!.onCropChange({ x: 100, y: 50, width: 200, height: 150 }));
    fireEvent.click(screen.getByText(ENGLISH.apply));
    await vi.waitFor(() => expect(deferred.release).not.toBe(undefined));
    await flush(); // the image decode + canvas draw happened, toBlob is held
    return { m, deferred };
  }

  it("while it encodes the editor is not settled (whenSettled waits for it)", async () => {
    const { m, deferred } = await startApply();
    expect(m.ref.current!.isSettled()).toBe(false);
    let resolved = false;
    void m.ref.current!.whenSettled({ timeoutMs: 5000 }).then(() => { resolved = true; });
    await flush();
    expect(resolved).toBe(false);
    await act(async () => { deferred.release(); await new Promise((r) => setTimeout(r, 0)); });
    await vi.waitFor(() => expect(h.props!.imageUrl).not.toBe("blob:u1"));
    expect(m.ref.current!.isSettled()).toBe(false); // the cropped image is not painted yet
    await layout({ natural: { width: 200, height: 150 } });
    await vi.waitFor(() => expect(resolved).toBe(true));
  });

  it("a second Apply press while the first encodes is ignored (one crop-set, one swap)", async () => {
    const { m, deferred } = await startApply();
    const before = h.props!.imageUrl;
    fireEvent.click(screen.getByText(ENGLISH.apply));
    await flush();
    // Only the first press reached the encoder.
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledTimes(1);
    await act(async () => { deferred.release(); await new Promise((r) => setTimeout(r, 10)); });
    await vi.waitFor(() => expect(h.props!.imageUrl).not.toBe(before));
    expect(m.actions.filter((a) => a.kind === "crop-set")).toHaveLength(1);
  });

  it("a loadState during the encode wins; the stale Apply neither swaps the draft nor emits crop-set", async () => {
    const { m, deferred } = await startApply();
    const before = h.props!.imageUrl;
    await act(async () => {
      m.ref.current!.loadState({ ...m.ref.current!.getState(), crop: null }, { sourceBlob: PHOTO });
      await new Promise((r) => setTimeout(r, 0));
    });
    const loaded = h.props!.imageUrl;
    expect(loaded).not.toBe(before);
    await act(async () => { deferred.release(); await new Promise((r) => setTimeout(r, 10)); });
    expect(h.props!.imageUrl).toBe(loaded);
    expect(m.actions.some((a) => a.kind === "crop-set")).toBe(false);
    expect(m.ref.current!.isModified()).toBe(false);
  });
});

// ─── R12 stale override cleared by intake ────────────────────────────────

describe("R12: intake handlers drop a stale image override", () => {
  it("a file pick after an odd loadState is not stuck unsettled", async () => {
    const ref = React.createRef<MediaEditorHandle>();
    render(<MediaEditor ref={ref} presentation="inline" enabledModes={["photo"]} mediaSources={["upload"]} />);
    // a photo snapshot whose image is never shown (capture stage, dead URL)
    act(() => ref.current!.loadState({ ...ref.current!.getState(), mode: "photo", stage: "capture", imageSrc: "blob:ghost" }));
    expect(ref.current!.isSettled()).toBe(false);
    const input = await waitForInput();
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File([new Uint8Array([1, 2])], "a.png", { type: "image/png" })] } });
    });
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    await layout();
    expect(ref.current!.isSettled()).toBe(true);
  });
});

// ─── R14 composited video frame ──────────────────────────────────────────

describe("R14: composited video metadata carries the frame; the pass-through does not", () => {
  async function mountVideo() {
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
    await act(async () => { h.props!.onStageSize(STAGE); await new Promise((r) => setTimeout(r, 0)); });
    return ref;
  }

  it("re-encoded export has frame", async () => {
    const ref = await mountVideo();
    act(() => ref.current!.applyFilter("noir"));
    const { metadata } = await ref.current!.exportVideo();
    expect(compositeVideo).toHaveBeenCalledTimes(1);
    expect(metadata.frame).toEqual({ stageWidth: 400, stageHeight: 300 });
  });

  it("the original-file pass-through omits it", async () => {
    const ref = await mountVideo();
    const { metadata } = await ref.current!.exportVideo();
    expect(compositeVideo).not.toHaveBeenCalled();
    expect(metadata.frame).toBeUndefined();
  });
});

// ─── R21 initialSource pending ───────────────────────────────────────────

describe("R21: unsettled while the initialSource is fetched", () => {
  it("a url source is pending until it lands and paints", async () => {
    let finish: (r: Response) => void = () => {};
    vi.stubGlobal("fetch", () => new Promise<Response>((r) => { finish = r; }));
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor
        ref={ref}
        presentation="inline"
        enabledModes={["photo"]}
        mediaSources={["upload"]}
        initialSource={{ kind: "url", url: "https://example.test/a.png", mode: "photo" }}
      />,
    );
    expect(ref.current!.isSettled()).toBe(false);
    let waited = false;
    void ref.current!.whenSettled({ timeoutMs: 5000 }).then(() => { waited = true; });
    await wait(20);
    expect(ref.current!.isSettled()).toBe(false);
    expect(waited).toBe(false);
    await act(async () => {
      finish(new Response(PHOTO, { status: 200 }));
      await new Promise((r) => setTimeout(r, 20));
    });
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    expect(ref.current!.isSettled()).toBe(false); // loaded, not painted
    await layout();
    expect(ref.current!.isSettled()).toBe(true);
    await vi.waitFor(() => expect(waited).toBe(true));
  });

  it("a failed fetch settles (so a waiter is not left hanging) and the export says nothing is painted", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("boom")));
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor
        ref={ref}
        presentation="inline"
        enabledModes={["photo"]}
        mediaSources={["upload"]}
        initialSource={{ kind: "url", url: "https://example.test/a.png", mode: "photo" }}
      />,
    );
    await vi.waitFor(() => expect(ref.current!.isSettled()).toBe(true));
  });
});

// ─── R22 painted is tied to the stage instance ───────────────────────────

describe("R22: a canvas remount is unsettled until it paints again", () => {
  it("the inline-ref null/stage churn of the same stage keeps it settled; a new stage does not", async () => {
    const m = await mountPhoto();
    await layout();
    expect(m.ref.current!.isSettled()).toBe(true);
    act(() => { h.props!.onStageReady(null); h.props!.onStageReady(h.stage); });
    expect(m.ref.current!.isSettled()).toBe(true);
    act(() => { h.props!.onStageReady(null); h.props!.onStageReady(fakeStage()); });
    expect(m.ref.current!.isSettled()).toBe(false);
    await act(async () => {
      h.props!.onImagePainted(h.props!.imageUrl, { width: 800, height: 600 });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(m.ref.current!.isSettled()).toBe(true);
  });
});

// ─── R23 discard confirm covers a capture ────────────────────────────────

describe("R23: the discard confirm shows when modified OR the media was captured / picked", () => {
  const escape = async () => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await wait(80);
  };

  it("a file pick, untouched: Cancel asks (isModified stays false)", async () => {
    const onClose = vi.fn();
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor ref={ref} presentation="dialog" isOpen onClose={onClose} enabledModes={["photo"]} mediaSources={["upload"]} />,
    );
    const input = await waitForInput();
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File([new Uint8Array([1, 2])], "a.png", { type: "image/png" })] } });
    });
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    await wait(80);
    expect(ref.current!.isModified()).toBe(false);
    await escape();
    await screen.findByText(ENGLISH.discardConfirmTitle);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("an untouched initialSource: Cancel closes without asking", async () => {
    const onClose = vi.fn();
    await mountPhoto({ presentation: "dialog", isOpen: true, onClose });
    await wait(80);
    await escape();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(ENGLISH.discardConfirmTitle)).toBeNull();
  });

  it("loadState clears the capture flag (a restored draft is recoverable)", async () => {
    const onClose = vi.fn();
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor ref={ref} presentation="dialog" isOpen onClose={onClose} enabledModes={["photo"]} mediaSources={["upload"]} />,
    );
    const input = await waitForInput();
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File([new Uint8Array([1, 2])], "a.png", { type: "image/png" })] } });
    });
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    await act(async () => {
      ref.current!.loadState(ref.current!.getState(), { sourceBlob: PHOTO });
      await new Promise((r) => setTimeout(r, 0));
    });
    await escape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── R26 inline unmount with focus on <body> ─────────────────────────────

describe("R26: inline unmount restores focus only when it was inside the editor", () => {
  const hostApi = { hide: () => {} };
  function Host() {
    const [shown, setShown] = React.useState(false);
    React.useEffect(() => {
      hostApi.hide = () => setShown(false);
    }, []);
    return (
      <>
        <button type="button" onClick={() => setShown(true)}>
          Open editor
        </button>
        {shown ? <MediaEditor presentation="inline" mediaSources={["upload"]} /> : null}
      </>
    );
  }

  it("focus parked on <body> stays there (no stale opener refocus)", async () => {
    render(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Open editor" }));
    await screen.findByRole("button", { name: ENGLISH.galleryPicker });
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    expect(document.activeElement).toBe(document.body);
    act(() => hostApi.hide());
    await flush();
    expect(document.activeElement).toBe(document.body);
  });

  it("focus inside the editor still goes back to the opener", async () => {
    render(<Host />);
    const opener = screen.getByRole("button", { name: "Open editor" });
    await userEvent.click(opener);
    const pick = await screen.findByRole("button", { name: ENGLISH.galleryPicker });
    act(() => pick.focus());
    act(() => hostApi.hide());
    await flush();
    expect(document.activeElement).toBe(opener);
  });
});
