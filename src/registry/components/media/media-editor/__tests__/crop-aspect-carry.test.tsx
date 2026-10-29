/**
 * media-editor 0.7.0 - slice A2: crop aspect carried through the editor (I2-I6).
 * `defaultCropAspect`, `crop-set` aspect + ratio, a changing `cropAspects` list, chip
 * names + aria-pressed, canvas `"W:H"` aspect, `getState().cropAspect` round trip.
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { resolveEditorLabels } from "../lib/normalize-labels";
import { dialogDimsForAspect } from "../lib/dialog-size-for-aspect";
import { resolveCropAspects } from "../lib/resolve-crop-aspects";
import type { CropAspect, EditAction, MediaEditorHandle } from "../types";

const h = vi.hoisted(() => ({
  props: null as null | Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

vi.mock("../parts/lazy-editor-canvas", () => ({
  default: function StubCanvas(props: Record<string, unknown>) {
    h.props = props;
    const onStageReady = props.onStageReady as ((s: unknown) => void) | undefined;
    React.useEffect(() => {
      onStageReady?.({ width: () => 400, height: () => 300, x: () => 0, y: () => 0, scaleX: () => 1, scaleY: () => 1, scale: () => {}, position: () => {}, batchDraw: () => {}, findOne: () => undefined });
    }, [onStageReady]);
    return null;
  },
}));

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });
const STAGE = { width: 400, height: 300 };
const FULL = { x: 0, y: 0, width: 400, height: 300 };

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
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const chip = (tool: string) => document.querySelector<HTMLElement>(`[data-tool="${tool}"]`)!;
type Props = Partial<React.ComponentProps<typeof MediaEditor>>;
const baseProps: Props = {
  presentation: "inline",
  enabledModes: ["photo"],
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
  return { ref, actions, view };
}
async function layout(natural = { width: 800, height: 600 }) {
  await act(async () => {
    h.props!.onStageSize(STAGE);
    h.props!.onMediaRect(FULL);
    h.props!.onImagePainted(h.props!.imageUrl, natural);
    await new Promise((r) => setTimeout(r, 0));
  });
}
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
const chips = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"));
const pressed = () => chips().filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);
const crops = (a: EditAction[]) => a.filter((x) => x.kind === "crop-set");

describe("I2: defaultCropAspect + crop-set carries the aspect", () => {
  it("opens Crop on defaultCropAspect with a 4:5 frame; Apply after picking 1:1 emits aspect + ratio", async () => {
    const m = await mountPhoto({ defaultCropAspect: "4:5" });
    await layout();
    stubCropEnvironment();
    fireEvent.click(chip("crop"));
    expect(h.props!.cropAspectRatio).toBeCloseTo(0.8, 6);
    expect(pressed()).toEqual(["4:5"]);
    fireEvent.click(screen.getByText("1:1"));
    act(() => h.props!.onCropChange({ x: 0, y: 0, width: 200, height: 200 }));
    fireEvent.click(screen.getByText(ENGLISH.apply));
    await vi.waitFor(() => expect(crops(m.actions)).toHaveLength(1));
    expect(crops(m.actions)[0]).toMatchObject({ kind: "crop-set", aspect: "1:1", ratio: 1 });
  });

  it('"original" reports the photo ratio', async () => {
    const m = await mountPhoto({ cropAspects: ["original", "free"] });
    await layout({ width: 800, height: 400 });
    stubCropEnvironment();
    fireEvent.click(chip("crop"));
    act(() => h.props!.onCropChange({ x: 0, y: 0, width: 200, height: 100 }));
    fireEvent.click(screen.getByText(ENGLISH.apply));
    await vi.waitFor(() => expect(crops(m.actions)).toHaveLength(1));
    expect(crops(m.actions)[0]).toMatchObject({ aspect: "original", ratio: 2 });
  });

  it("a defaultCropAspect that is not on offer falls back to the first entry with one warning", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m = await mountPhoto({ cropAspects: ["1:1", "4:5"], defaultCropAspect: "16:9" });
    m.view.rerender(
      <MediaEditor {...baseProps} cropAspects={["1:1", "4:5"]} defaultCropAspect="16:9" />,
    );
    await layout();
    fireEvent.click(chip("crop"));
    expect(pressed()).toEqual(["1:1"]);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("defaultCropAspect"))).toHaveLength(1);
  });
});

describe("I3: a changed cropAspects list while mounted", () => {
  it("moves a dropped selection to defaultCropAspect (if listed) else the first entry, and clears the pending rect", async () => {
    const props = { ...baseProps, defaultCropAspect: "16:9" as CropAspect };
    const m = await mountPhoto({ ...props, cropAspects: ["9:16", "16:9"] });
    await layout();
    fireEvent.click(chip("crop"));
    expect(pressed()).toEqual(["16:9"]);
    act(() => h.props!.onCropChange({ x: 10, y: 10, width: 100, height: 56 }));
    expect(h.props!.cropRect).not.toBeNull();
    // 16:9 dropped, default not listed -> first entry
    m.view.rerender(<MediaEditor {...props} cropAspects={["1:1", "4:5"]} />);
    expect(pressed()).toEqual(["1:1"]);
    expect(h.props!.cropRect).toBeNull();
    expect(h.props!.cropAspectRatio).toBe(1);
    // selection still listed -> untouched
    fireEvent.click(screen.getByText("4:5"));
    m.view.rerender(<MediaEditor {...props} cropAspects={["4:5", "1:1", "3:2"]} />);
    expect(pressed()).toEqual(["4:5"]);
    // dropped again, default listed -> default
    m.view.rerender(<MediaEditor {...props} cropAspects={["1:1", "16:9"]} />);
    expect(pressed()).toEqual(["16:9"]);
  });
});

describe("I4: chip names", () => {
  it('"1.91:1" reads as the ratio, free / original use the labels, chips carry aria-pressed', async () => {
    await mountPhoto({ cropAspects: ["1.91:1", "original", "free"] });
    await layout();
    fireEvent.click(chip("crop"));
    expect(chips().map((b) => b.textContent)).toEqual(["1.91:1", "original", "free"]);
    expect(chips().map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    fireEvent.click(screen.getByText("free"));
    expect(chips().map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
  });

  it("a host's crop.free / crop.original still win when labels.crop.aspect is absent", async () => {
    await mountPhoto({ cropAspects: ["original", "free"], labels: { crop: { free: "Serbest", original: "Orijinal" } } });
    await layout();
    fireEvent.click(chip("crop"));
    expect(chips().map((b) => b.textContent)).toEqual(["Orijinal", "Serbest"]);
  });

  it("labels.crop.aspect names every chip and receives a locale number formatter", async () => {
    await mountPhoto({
      cropAspects: ["1.91:1", "4:5"],
      labels: { crop: { aspect: (a, f) => (a === "1.91:1" ? "Landscape" : `R${f(4)}`) } },
    });
    await layout();
    fireEvent.click(chip("crop"));
    expect(chips().map((b) => b.textContent)).toEqual(["Landscape", "R4"]);
  });

  it("labels.crop.aspect also names free / original (it wins over crop.free)", async () => {
    await mountPhoto({
      cropAspects: ["original", "free"],
      labels: { crop: { free: "Serbest", aspect: (a) => `N-${a}` } },
    });
    await layout();
    fireEvent.click(chip("crop"));
    expect(chips().map((b) => b.textContent)).toEqual(["N-original", "N-free"]);
  });

  it("renders the default ratio chip in the editor locale (ar-EG digits)", async () => {
    await mountPhoto({ locale: "ar-EG", cropAspects: ["1.91:1", "4:5"] });
    await layout();
    fireEvent.click(chip("crop"));
    const nf = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 4, useGrouping: false });
    const [a, b] = chips().map((x) => x.textContent!);
    expect(a).toBe(`${nf.format(1.91)}:${nf.format(1)}`);
    expect(a).not.toMatch(/[0-9]/);
    expect(b).not.toMatch(/[0-9]/);
  });

  it("a single aspect shows no chip row", async () => {
    await mountPhoto({ cropAspects: ["1.91:1"] });
    await layout();
    fireEvent.click(chip("crop"));
    expect(chips()).toHaveLength(0);
  });
});

describe("I5: canvas aspect W:H", () => {
  it("renders a 1.91 frame inline; the default crop list is [aspect]", async () => {
    await mountPhoto({ aspect: "1.91:1" });
    const root = document.querySelector('[data-slot="media-editor"]')!;
    expect(root.getAttribute("data-aspect")).toBe("1.91:1");
    expect(document.querySelector<HTMLElement>("[data-canvas-placeholder]")!.style.aspectRatio).toBe("1.91 / 1");
    expect(resolveCropAspects("1.91:1", undefined)).toEqual(["1.91:1"]);
  });

  it("mounts the dialog branch without crashing", async () => {
    render(<MediaEditor {...baseProps} presentation="dialog" isOpen onClose={() => {}} aspect="1.91:1" />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.getAttribute("style") ?? "").toContain("1.91 / 1");
  });

  it("dialog dims: 1.91:1 is landscape, 4:5 portrait, named stay as they were", () => {
    expect(dialogDimsForAspect("1.91:1")).toEqual({ aspectRatio: "1.91 / 1", orientation: "landscape" });
    expect(dialogDimsForAspect("4:5")).toEqual({ aspectRatio: "4 / 5", orientation: "portrait" });
    expect(dialogDimsForAspect("3:5")).toEqual({ aspectRatio: "3 / 5", orientation: "portrait" });
    expect(dialogDimsForAspect("free")).toEqual({ aspectRatio: "4 / 3", orientation: "landscape" });
  });

  it("an invalid aspect falls back to free with exactly one warning", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m = await mountPhoto({ aspect: "wide:tall" as never });
    m.view.rerender(<MediaEditor {...baseProps} aspect={"wide:tall" as never} />);
    expect(document.querySelector('[data-slot="media-editor"]')!.getAttribute("data-aspect")).toBe("free");
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("invalid aspect"))).toHaveLength(1);
  });
});

describe("I6: getState().cropAspect", () => {
  it("is always filled and round-trips through loadState", async () => {
    const m = await mountPhoto({ cropAspects: ["9:16", "1:1", "4:5"] });
    await layout();
    expect(m.ref.current!.getState().cropAspect).toBe("9:16");
    fireEvent.click(chip("crop"));
    fireEvent.click(screen.getByText("4:5"));
    const snapshot = m.ref.current!.getState();
    expect(snapshot.cropAspect).toBe("4:5");
    fireEvent.click(screen.getByText("1:1"));
    expect(m.ref.current!.getState().cropAspect).toBe("1:1");
    await act(async () => {
      m.ref.current!.loadState(snapshot);
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(m.ref.current!.getState().cropAspect).toBe("4:5");
  });

  it("a snapshot aspect that is not on offer keeps the current selection", async () => {
    const m = await mountPhoto({ cropAspects: ["9:16", "1:1"] });
    await layout();
    await act(async () => {
      m.ref.current!.loadState({ ...m.ref.current!.getState(), cropAspect: "16:9" });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(m.ref.current!.getState().cropAspect).toBe("9:16");
  });
});
