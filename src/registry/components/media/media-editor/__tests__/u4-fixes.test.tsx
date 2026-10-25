/**
 * media-editor 0.5.0 - U4 fix wave regressions (M1, M4-M6, M9, M11, M13-M15, SC-2).
 */
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { MediaCaptureExtensionContext } from "../hooks/use-capture-extension";
import { validateGalleryFile } from "../lib/validate-media-file";
import { ToolDrawControls } from "../parts/tool-draw-controls";
import { ToolTextInput } from "../parts/tool-text-input";
import { resolveEditorLabels } from "../lib/normalize-labels";
import { probeVideo } from "../lib/probe-video";
import type { MediaEditorHandle } from "../types";

vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));
vi.mock("../lib/probe-video", () => ({ probeVideo: vi.fn(async () => null) }));

const ENGLISH = resolveEditorLabels(undefined);

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  URL.createObjectURL = () => "blob:u4";
  URL.revokeObjectURL = () => {};
  vi.mocked(probeVideo).mockReset();
  vi.mocked(probeVideo).mockResolvedValue(null);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});


const body = () => document.querySelector<HTMLElement>('[data-slot="media-editor-body"]')!;
const host = () => document.querySelector<HTMLElement>('[data-slot="media-editor-overlay"]');
const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
const pick = (file: File) => fireEvent.change(fileInput(), { target: { files: [file] } });
const sized = (bytes: number, type = "image/png") => {
  const f = new File(["x"], "f", { type });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
};

describe("M1 inert labels", () => {
  it("the tool-chip row is a labelled toolbar", () => {
    render(<MediaEditor presentation="inline" mediaSources={["upload"]} labels={{ shell: { editTools: "Werkzeuge" } }} />);
    pick(new File(["x"], "a.jpg", { type: "image/jpeg" }));
    const bar = screen.getByRole("toolbar");
    expect(bar.getAttribute("aria-label")).toBe("Werkzeuge");
    expect(bar.getAttribute("aria-orientation")).toBe("horizontal");
    expect(bar.querySelectorAll("[data-tool]").length).toBe(6);
  });

  it("labels.trim dev-warns once on <MediaEditor>, and is silent without it", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<MediaEditor presentation="inline" mediaSources={["upload"]} labels={{ trim: { start: "S" } }} />);
    rerender(<MediaEditor presentation="inline" mediaSources={["upload"]} labels={{ trim: { start: "S" } }} />);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("labels.trim"))).toHaveLength(1);
    warn.mockClear();
    cleanup();
    render(<MediaEditor presentation="inline" mediaSources={["upload"]} labels={{ shell: { back: "B" } }} />);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("labels.trim"))).toHaveLength(0);
  });
});

describe("M4 English file-size message is unchanged", () => {
  const MB = 1024 * 1024;
  it.each([
    [0.25, 1 * MB, "File is 1.0 MB — maximum is 0.25 MB"],
    [2.25, 3 * MB, "File is 3.0 MB — maximum is 2.25 MB"],
    [1000, 1500 * MB, "File is 1500.0 MB — maximum is 1000 MB"],
  ])("limit %s MB", (limit, bytes, expected) => {
    expect(validateGalleryFile(sized(bytes), limit)?.message).toBe(expected);
  });
});

describe("M5 falsy overlays do not lock the editor", () => {
  it.each([["null", null], ["undefined", undefined], ["false", false], ["true", true], ["empty string", ""]])(
    "%s renders nothing and leaves the body interactive",
    (_n, value) => {
      render(<MediaEditor presentation="inline" mediaSources={["upload"]} overlay={value as React.ReactNode} />);
      expect(body().hasAttribute("inert")).toBe(false);
      expect(host()).toBeNull();
    },
  );
  it("a rendered 0 is an overlay (React prints it)", () => {
    render(<MediaEditor presentation="inline" mediaSources={["upload"]} overlay={0} />);
    expect(body().hasAttribute("inert")).toBe(true);
    expect(host()!.textContent).toBe("0");
  });
});

describe("M6 overlay without a focusable control", () => {
  it("focuses the (tabIndex -1) host", () => {
    render(<MediaEditor presentation="inline" mediaSources={["upload"]} overlay={<p>Uploading…</p>} />);
    expect(host()!.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(host());
  });
  it("skips hidden candidates and finds contenteditable", () => {
    render(
      <MediaEditor
        presentation="inline"
        mediaSources={["upload"]}
        overlay={
          <div>
            <button hidden>hidden-attr</button>
            <div style={{ display: "none" }}>
              <button>display-none</button>
            </div>
            <div contentEditable suppressContentEditableWarning data-testid="ce">
              note
            </div>
          </div>
        }
      />,
    );
    expect(document.activeElement).toBe(screen.getByTestId("ce"));
  });
});

describe("M9 numbers follow the locale", () => {
  it("brush size and font size go through formatNumber", () => {
    const { container, unmount } = render(
      <ToolDrawControls
        color="#fff"
        brushSize={12}
        mode="draw"
        colorPresets={[]}
        labels={ENGLISH}
        locale="ar-EG"
        onColorChange={() => {}}
        onBrushSizeChange={() => {}}
        onModeChange={() => {}}
      />,
    );
    expect(container.textContent).toContain("١٢");
    unmount();
    const t = render(
      <ToolTextInput
        overlay={{ id: "t", text: "x", x: 0, y: 0, rotation: 0, scale: 1, fontFamily: "sans", fontSize: 40, fill: "#fff", align: "center" }}
        fonts={[]}
        colorPresets={[]}
        labels={ENGLISH}
        locale="ar-EG"
        onChange={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(t.container.textContent).toContain("٤٠");
  });
});

describe("M11 pass-through metadata reports the real file", () => {
  const exportOf = async (blob: Blob, extra: Partial<React.ComponentProps<typeof MediaEditor>> = {}) => {
    const ref = React.createRef<MediaEditorHandle>();
    render(
      <MediaEditor
        ref={ref}
        presentation="inline"
        mediaSources={["upload"]}
        initialSource={{ kind: "blob", blob, mode: "video" }}
        {...extra}
      />,
    );
    await screen.findByLabelText(ENGLISH.backToCapture);
    return ref.current!.export();
  };

  it("uses the probed size and duration", async () => {
    vi.mocked(probeVideo).mockResolvedValue({ width: 640, height: 360, durationMs: 4200 });
    const { metadata } = await exportOf(new Blob(["v"], { type: "video/mp4" }));
    expect([metadata.width, metadata.height, metadata.durationMs]).toEqual([640, 360, 4200]);
  });

  it("falls back to the old constants only when nothing is known", async () => {
    const { metadata } = await exportOf(new Blob(["v"], { type: "video/mp4" }));
    expect([metadata.width, metadata.height, metadata.durationMs]).toEqual([720, 1280, undefined]);
  });

  it("a captured draft's own duration wins over the probe", async () => {
    vi.mocked(probeVideo).mockResolvedValue({ width: 640, height: 360, durationMs: 1 });
    const ref = React.createRef<MediaEditorHandle>();
    const capture = {
      Provider: ({ children }: { children: React.ReactNode }) => (
        <MediaCaptureExtensionContext.Provider
          value={{
            CameraSurface: ((p: { onVideo: (v: { blob: Blob; durationMs: number; mimeType: string }) => void }) => (
              <button data-testid="rec" onClick={() => p.onVideo({ blob: new Blob(["v"], { type: "video/webm" }), durationMs: 9000, mimeType: "video/webm" })} />
            )) as never,
          }}
        >
          {children}
        </MediaCaptureExtensionContext.Provider>
      ),
    };
    render(<MediaEditor ref={ref} presentation="inline" capture={capture} mediaSources={["camera"]} defaultMode="video" />);
    fireEvent.click(screen.getByTestId("rec"));
    await screen.findByLabelText(ENGLISH.backToCapture);
    const { metadata } = await ref.current!.export();
    expect(metadata.durationMs).toBe(9000);
    expect([metadata.width, metadata.height]).toEqual([640, 360]);
  });
});

describe("dialog presentation with an overlay", () => {
  const dialogProps = { presentation: "dialog" as const, isOpen: true, mediaSources: ["upload" as const] };
  const Overlay = () => (
    <div data-testid="ov">
      <button type="button">first</button>
      <button type="button">middle</button>
      <button type="button">last</button>
    </div>
  );
  const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 80)); });

  it("SC-2: Escape does not reach requestClose while the overlay is mounted", async () => {
    const onClose = vi.fn();
    render(<MediaEditor {...dialogProps} onClose={onClose} overlay={<Overlay />} />);
    await settle();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Escape" });
    await settle();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText(ENGLISH.discardConfirmTitle)).toBeNull();
  });

  it("SC-2: without an overlay Escape still closes", async () => {
    const onClose = vi.fn();
    render(<MediaEditor {...dialogProps} onClose={onClose} />);
    await settle();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await settle();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("M14: Tab wraps last -> first and Shift+Tab first -> last inside the overlay", async () => {
    render(<MediaEditor {...dialogProps} onClose={() => {}} overlay={<Overlay />} />);
    await settle();
    const first = screen.getByText("first");
    const last = screen.getByText("last");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    // mid-list Tab is left to the browser
    const middle = screen.getByText("middle");
    middle.focus();
    const ev = fireEvent.keyDown(middle, { key: "Tab" });
    expect(ev).toBe(true);
    expect(document.activeElement).toBe(middle);
  });

  it("M15: focus ends up in the overlay even if the dialog scope focuses elsewhere, and is pulled back from the dialog root", async () => {
    render(<MediaEditor {...dialogProps} onClose={() => {}} overlay={<Overlay />} />);
    await settle();
    expect(screen.getByTestId("ov").contains(document.activeElement)).toBe(true);
    const dialogRoot = screen.getByRole("dialog");
    act(() => dialogRoot.focus()); // what Radix FocusScope falls back to when everything else is inert
    expect(screen.getByTestId("ov").contains(document.activeElement)).toBe(true);
  });
});
