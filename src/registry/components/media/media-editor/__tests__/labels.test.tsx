/**
 * media-editor 0.5.0 (C17 + ME1) - every user-visible string comes from labels.
 *
 * A full Turkish-marker label set (every resolved key replaced) is mounted through each surface
 * (file intake + mode pill, edit stage with every tool open, text-only canvas, empty / error
 * states, the capture permission prompt, discard dialog, canvas aria + crop handles, colour
 * picker, toolbar, trim bar) and the DOM is scanned for any text or accessible name that still
 * equals a default English string.
 */
import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import {
  editorLabelsFromFlat,
  resolveEditorLabels,
} from "../lib/normalize-labels";
import type { MediaEditorLabels, MediaEditorResolvedLabels } from "../types";
import { MediaCaptureExtensionContext } from "../hooks/use-capture-extension";
import { CameraPermissionPrompt } from "../features/capture/parts/camera-permission-prompt";
import { DiscardConfirmDialog } from "../parts/discard-confirm-dialog";
import { ColorSwatchPicker } from "../parts/color-swatch-picker";
import { EditorToolbar } from "../parts/editor-toolbar";
import { ModeTogglePill } from "../parts/mode-toggle-pill";
import { ToolAdjustSliders } from "../parts/tool-adjust-sliders";
import { VideoTrimBar } from "../parts/video-trim-bar";
import { EditorCanvas } from "../parts/editor-canvas";

// The konva canvas needs a real <canvas>; the editor chrome is what these tests are about.
vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));
vi.mock("react-konva", () => {
  const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Nothing = () => null;
  return {
    Stage: Box,
    Layer: Box,
    Image: Nothing,
    Line: Nothing,
    Text: Nothing,
    Transformer: Nothing,
  };
});
vi.mock("../hooks/use-konva-stage-size", () => ({
  useKonvaStageSize: () => ({ width: 400, height: 300 }),
}));

const ENGLISH = resolveEditorLabels(undefined);

/** Every resolved key replaced by a marker; functions return `TR_<key>` too. */
function turkish(): {
  flat: MediaEditorResolvedLabels;
  nested: MediaEditorLabels;
} {
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ENGLISH)) {
    flat[k] = typeof v === "function" ? () => `TR_${k}` : `TR_${k}`;
  }
  const typed = flat as unknown as MediaEditorResolvedLabels;
  return { flat: typed, nested: editorLabelsFromFlat(typed) };
}

const ENGLISH_STRINGS = new Set(
  Object.values(ENGLISH).filter((v): v is string => typeof v === "string"),
);

/** Visible text nodes + accessible-name attributes in the whole document. */
function visibleStrings(): string[] {
  const out: string[] = [];
  for (const el of Array.from(document.body.querySelectorAll("*"))) {
    if (el.tagName === "CODE") continue; // config values (aspect, source kind), not language
    for (const n of Array.from(el.childNodes)) {
      if (n.nodeType === 3) {
        const t = (n.textContent ?? "").trim();
        if (t) out.push(t);
      }
    }
    for (const a of ["aria-label", "placeholder", "alt", "title"]) {
      const v = el.getAttribute(a);
      if (v) out.push(v);
    }
  }
  return out;
}

function leaks(): string[] {
  return visibleStrings().filter(
    (s) =>
      ENGLISH_STRINGS.has(s) ||
      /^Resize [A-Z]{2}$/.test(s) ||
      /^Color #/.test(s) ||
      /crop aspects\)$/.test(s) ||
      /^Trim (start|end): .*s$/.test(s),
  );
}

// One blob for the whole file: the editor keys its source load on the blob's identity.
const SOURCE_BLOB = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });

let originalCreate: typeof URL.createObjectURL;
let originalRevoke: typeof URL.revokeObjectURL;
beforeEach(() => {
  originalCreate = URL.createObjectURL;
  originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:media-editor-test";
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  URL.revokeObjectURL = () => {};
});
afterEach(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Edit stage without the camera stack: an initial image source + one capture mode. */
function EditStage(props: Partial<React.ComponentProps<typeof MediaEditor>>) {
  return (
    <MediaEditor
      presentation="inline"
      enabledModes={["photo"]}
      mediaSources={["upload"]}
      initialSource={{ kind: "blob", blob: SOURCE_BLOB, mode: "photo" }}
      {...props}
    />
  );
}

const chip = (tool: string) => document.querySelector<HTMLElement>(`[data-tool="${tool}"]`)!;

describe("scan sanity (the leak detector is not vacuous)", () => {
  it("finds English strings in a default-label edit stage", async () => {
    render(<EditStage />);
    await screen.findByLabelText("Back to capture");
    fireEvent.click(chip("adjust"));
    await screen.findByText("Brightness");
    expect(leaks().length).toBeGreaterThan(4);
  });
});

describe("a full Turkish label set leaves no default English", () => {
  it("edit stage with every tool open", async () => {
    const { nested } = turkish();
    render(<EditStage labels={nested} />);
    await screen.findByLabelText("TR_backToCapture");
    expect(leaks()).toEqual([]);
    // chip row shows the localized tool names + crop count
    expect(screen.getByText("TR_cropAspectCount")).toBeTruthy();

    const ready: Record<string, () => Promise<unknown>> = {
      adjust: () => screen.findAllByText("TR_adjustBrightness"),
      draw: () => screen.findAllByText("TR_drawEraser"),
      text: () => screen.findByLabelText("TR_textDelete"),
      stickers: () => screen.findAllByText("TR_back"),
      filters: () => screen.findAllByText("TR_back"),
      crop: () => screen.findByText("TR_cancel"),
    };
    for (const tool of Object.keys(ready)) {
      fireEvent.click(chip(tool));
      await ready[tool]!();
      expect(leaks(), `tool ${tool}`).toEqual([]);
      if (tool !== "crop") {
        // panel chrome comes from labels
        expect(screen.getAllByText("TR_back").length).toBeGreaterThan(0);
        expect(screen.getAllByText("TR_apply").length).toBeGreaterThan(0);
      } else {
        expect(screen.getByText("TR_cancel")).toBeTruthy();
        expect(screen.getByText("TR_cropAspectFree")).toBeTruthy();
      }
    }
    // text tool specifics
    fireEvent.click(chip("text"));
    await screen.findByLabelText("TR_textAlignLeft");
    expect(screen.getByLabelText("TR_textAlignCenter")).toBeTruthy();
    expect(screen.getByLabelText("TR_textAlignRight")).toBeTruthy();
  });

  it("file-intake surface and the mode pill", () => {
    const { nested } = turkish();
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={["photo", "video", "text"]}
        mediaSources={["upload"]}
        labels={nested}
      />,
    );
    expect(screen.getByText("TR_intakePrompt")).toBeTruthy();
    expect(screen.getByText("TR_galleryPicker")).toBeTruthy();
    expect(screen.getByText("TR_modePhoto")).toBeTruthy();
    expect(screen.getByText("TR_modeVideo")).toBeTruthy();
    expect(screen.getByText("TR_modeText")).toBeTruthy();
    expect(leaks()).toEqual([]);
  });

  it("camera entry button + hint (capture extension wired)", () => {
    const { nested } = turkish();
    // A minimal custom capture provider through the public seam.
    const Surface = () => null;
    const capture = {
      Provider: ({ children }: { children: React.ReactNode }) => (
        <MediaCaptureExtensionContext.Provider value={{ CameraSurface: Surface }}>
          {children}
        </MediaCaptureExtensionContext.Provider>
      ),
    };
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={["photo", "video"]}
        mediaSources={["camera"]}
        capture={capture}
        labels={nested}
      />,
    );
    expect(screen.getByText("TR_connectHint")).toBeTruthy();
    expect(screen.getByText("TR_connectCamera")).toBeTruthy();
    expect(leaks()).toEqual([]);
  });

  it("text-only canvas", () => {
    const { nested } = turkish();
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={["text"]}
        mediaSources={["upload"]}
        labels={nested}
      />,
    );
    expect(screen.getByText("TR_textBackground")).toBeTruthy();
    expect(screen.getByLabelText("TR_textFontFamily")).toBeTruthy();
    expect(screen.getByLabelText("TR_drawColor")).toBeTruthy();
    expect(screen.getByPlaceholderText("TR_textPlaceholder")).toBeTruthy();
    expect(leaks()).toEqual([]);
  });

  it("empty state (no source configured) and the aria name", () => {
    const { nested } = turkish();
    render(<MediaEditor presentation="inline" enabledModes={[]} labels={nested} />);
    expect(screen.getByText("TR_emptyNoSource")).toBeTruthy();
    expect(screen.getByText("TR_emptyNoSourceHint")).toBeTruthy();
    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("TR_emptyNoSourceAria");
    expect(leaks()).toEqual([]);
  });

  it("no capture source configured", () => {
    const { nested } = turkish();
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={["photo"]}
        mediaSources={[]}
        labels={nested}
      />,
    );
    expect(screen.getByText("TR_emptyNoCaptureSource")).toBeTruthy();
    const diag = screen.getByText("TR_emptyNoCaptureSource").nextElementSibling!;
    expect(diag.textContent).toContain("TR_emptyAspect");
    expect(diag.textContent).toContain("TR_emptySources");
    expect(diag.textContent).toContain("TR_emptyNone");
    expect(leaks()).toEqual([]);
  });

  it("source error (mode not enabled) with its diagnostics", async () => {
    const { nested } = turkish();
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={["video"]}
        mediaSources={["upload"]}
        initialSource={{ kind: "blob", blob: SOURCE_BLOB, mode: "photo" }}
        labels={nested}
      />,
    );
    await screen.findByText("TR_emptyLoadFailed");
    const p = document.querySelector("p.text-\\[11px\\]")!;
    expect(p.textContent).toContain("TR_emptyAttempted");
    expect(p.textContent).toContain("TR_emptyEnabled");
    expect(leaks()).toEqual([]);
  });

  it("dialog title and description", () => {
    const { nested } = turkish();
    render(
      <MediaEditor
        presentation="dialog"
        isOpen
        onClose={() => {}}
        enabledModes={["text"]}
        mediaSources={["upload"]}
        labels={nested}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("TR_composerLabel");
    expect(dialog.textContent).toContain("TR_composerDescription");
    expect(leaks()).toEqual([]);
  });

  it("discard dialog", () => {
    const { flat } = turkish();
    render(
      <DiscardConfirmDialog open labels={flat} onCancel={() => {}} onConfirm={() => {}} />,
    );
    expect(screen.getByText("TR_discardConfirmTitle")).toBeTruthy();
    expect(screen.getByText("TR_discardConfirmBody")).toBeTruthy();
    expect(screen.getByText("TR_discardCancel")).toBeTruthy();
    expect(screen.getByText("TR_discardConfirm")).toBeTruthy();
    expect(leaks()).toEqual([]);
  });

  it("capture permission prompt, every variant", () => {
    const { flat } = turkish();
    const variants = {
      idle: ["TR_permissionIdleTitle", "TR_permissionIdleBody", "TR_permissionEnable", "TR_permissionUsePicker"],
      pending: ["TR_permissionRequesting"],
      denied: ["TR_permissionDeniedTitle", "TR_permissionDeniedBody", "TR_permissionRetry", "TR_permissionUsePicker"],
      "no-camera": ["TR_permissionNoCameraTitle", "TR_permissionDeniedBody"],
      error: ["TR_permissionErrorTitle", "TR_permissionDeniedBody"],
    } as const;
    for (const [variant, expected] of Object.entries(variants)) {
      const { unmount } = render(
        <CameraPermissionPrompt
          variant={variant as keyof typeof variants}
          labels={flat}
          onRetry={() => {}}
          onUsePicker={() => {}}
        />,
      );
      for (const text of expected) expect(screen.getAllByText(text).length).toBeGreaterThan(0);
      expect(leaks(), variant).toEqual([]);
      unmount();
    }
  });

  it("colour picker, toolbar, mode pill", () => {
    const { flat } = turkish();
    render(
      <>
        <ColorSwatchPicker
          value="#ffffff"
          presets={["#ffffff", "#000000"]}
          onChange={() => {}}
          ariaLabel={flat.drawColor}
          labels={flat}
        />
        <EditorToolbar
          activeTool={null}
          enabledTools={["text", "crop"]}
          labels={flat}
          onSelect={() => {}}
        />
        <ModeTogglePill
          mode="photo"
          visibleModes={["photo", "video"]}
          labels={flat}
          onModeChange={() => {}}
        />
      </>,
    );
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("TR_editTools");
    fireEvent.click(screen.getByLabelText("TR_drawColor"));
    expect(screen.getAllByLabelText("TR_colorSwatch").length).toBe(2);
    expect(screen.getByText("TR_colorHex")).toBeTruthy();
    expect(leaks()).toEqual([]);
  });

  it("canvas aria name, reset zoom and crop resize handles", () => {
    const { flat } = turkish();
    render(
      <EditorCanvas
        imageUrl={null}
        textOverlays={[]}
        stickers={[]}
        drawingStrokes={[]}
        selectedTextId={null}
        selectedStickerId={null}
        resolveSticker={() => undefined}
        cropActive
        cropRect={{ x: 10, y: 10, width: 100, height: 100 }}
        labels={flat}
      />,
    );
    expect(screen.getByRole("group").getAttribute("aria-label")).toBe("TR_canvasAriaLabel");
    expect(screen.getAllByLabelText("TR_resizeHandle")).toHaveLength(4);
    expect(leaks()).toEqual([]);
  });

  it("reset-zoom button name (appears once the view is zoomed)", () => {
    const { flat } = turkish();
    render(
      <EditorCanvas
        imageUrl={null}
        textOverlays={[]}
        stickers={[]}
        drawingStrokes={[]}
        selectedTextId={null}
        selectedStickerId={null}
        resolveSticker={() => undefined}
        labels={flat}
      />,
    );
    expect(screen.queryByLabelText("TR_resetZoom")).toBeNull();
    fireEvent.keyDown(screen.getByRole("group"), { key: "+" });
    expect(screen.getByLabelText("TR_resetZoom")).toBeTruthy();
    expect(leaks()).toEqual([]);
  });
});

describe("nested-only typing (no cast)", () => {
  it("accepts a partial nested object and renders the override", () => {
    // Compile-time proof: no group or key is required, no `as never`.
    const labels: MediaEditorLabels = { capture: { modes: { photo: "Foto" } } };
    render(
      <MediaEditor
        presentation="dialog"
        isOpen
        onClose={() => {}}
        enabledModes={["photo", "video", "text"]}
        mediaSources={["upload"]}
        labels={{ capture: { modes: { photo: "Foto" } } }}
      />,
    );
    expect(screen.getByText("Foto")).toBeTruthy();
    expect(screen.getByText("Video")).toBeTruthy(); // untouched keys keep the English default
    expect(labels.capture?.modes?.photo).toBe("Foto");
  });

  it("labels.empty is implemented: it renders and does not warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={[]}
        labels={{ empty: { noSource: "Kaynak yok", noSourceHint: "İpucu" } }}
      />,
    );
    expect(screen.getByText("Kaynak yok")).toBeTruthy();
    expect(screen.getByText("İpucu")).toBeTruthy();
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("labels."))).toHaveLength(0);
  });

  it("flat keys still win over nested (I1) through the component", () => {
    render(
      <MediaEditor
        presentation="dialog"
        isOpen
        onClose={() => {}}
        enabledModes={["photo", "video"]}
        mediaSources={["upload"]}
        labels={{ capture: { modes: { photo: "Nested" } }, modePhoto: "Flat" } as MediaEditorLabels}
      />,
    );
    expect(screen.getByText("Flat")).toBeTruthy();
    expect(screen.queryByText("Nested")).toBeNull();
  });
});

describe("locale", () => {
  it("trim bar formats seconds with the locale (1.5 -> 1,5 in tr)", () => {
    const render1 = (locale?: string) =>
      render(
        <VideoTrimBar
          videoUrl=""
          startSec={1.5}
          endSec={2.5}
          durationSec={10}
          labels={ENGLISH}
          locale={locale}
          onChange={() => {}}
        />,
      );
    const tr = render1("tr");
    expect(screen.getByText("Trim start: 1,5s")).toBeTruthy();
    expect(screen.getByText("Trim end: 2,5s")).toBeTruthy();
    tr.unmount();
    render1("en");
    expect(screen.getByText("Trim start: 1.5s")).toBeTruthy();
  });

  it("trim seconds go through the trimSeconds label function", () => {
    render(
      <VideoTrimBar
        videoUrl=""
        startSec={1.5}
        endSec={2.5}
        durationSec={10}
        labels={{ ...ENGLISH, trimSeconds: (s, f) => `${f} sn (${s})` }}
        locale="tr"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Trim start: 1,5 sn (1.5)")).toBeTruthy();
  });

  it("crop-aspect count is formatted with the locale (ar-EG digits)", async () => {
    render(<EditStage locale="ar-EG" />);
    await screen.findByLabelText("Back to capture");
    const n = new Intl.NumberFormat("ar-EG").format(5);
    expect(n).not.toBe("5");
    expect(screen.getByText(`(${n} crop aspects)`)).toBeTruthy();
  });

  it("crop-aspect count is plain in English by default", async () => {
    render(<EditStage />);
    await screen.findByLabelText("Back to capture");
    expect(screen.getByText("(5 crop aspects)")).toBeTruthy();
  });

  it("adjust values follow the locale", () => {
    render(
      <ToolAdjustSliders
        value={{ brightness: 0, contrast: 10, saturation: 0.5, blur: 0 }}
        onChange={() => {}}
        labels={ENGLISH}
        locale="tr"
      />,
    );
    expect(screen.getByText("0,50")).toBeTruthy();
    expect(screen.getByText("0,00")).toBeTruthy();
  });
});

describe("labels.presets renames preset data", () => {
  it("text-only backgrounds and fonts", () => {
    render(
      <MediaEditor
        presentation="inline"
        enabledModes={["text"]}
        mediaSources={["upload"]}
        labels={{
          presets: { backgrounds: { lime: "Limon" }, fonts: { serif: "Serifli" } },
        }}
      />,
    );
    fireEvent.click(screen.getByText("Background"));
    expect(screen.getByLabelText("Limon")).toBeTruthy();
    expect(screen.queryByLabelText("Lime")).toBeNull();
    expect(screen.getByLabelText("Sunset")).toBeTruthy(); // un-named presets keep their label
    expect(screen.getByRole("option", { name: "Serifli" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Serif" })).toBeNull();
  });

  it("filters, sticker sets and sticker alts", async () => {
    render(
      <EditStage
        labels={{
          presets: {
            filters: { clarendon: "Clarendon-TR" },
            stickerSets: { faces: "Yüzler" },
            stickers: { smile: "Gülümseme" },
          },
        }}
      />,
    );
    await screen.findByLabelText("Back to capture");
    fireEvent.click(chip("filters"));
    expect(await screen.findByLabelText("Clarendon-TR")).toBeTruthy();
    expect(screen.queryByLabelText("Clarendon")).toBeNull();
    fireEvent.click(chip("stickers"));
    expect(await screen.findByText("Yüzler")).toBeTruthy();
    expect(screen.getAllByLabelText("Gülümseme").length).toBeGreaterThan(0);
    expect(screen.getByText("Hearts")).toBeTruthy();
  });

  it("an inline labels literal does not rebuild the preset arrays on every render", async () => {
    // The filter strip rebuilds its thumbnails (one `new Image()`) whenever its
    // `presets` array changes identity.
    let imagesCreated = 0;
    vi.stubGlobal(
      "Image",
      class {
        crossOrigin = "";
        onload: (() => void) | null = null;
        set src(_v: string) {}
        constructor() {
          imagesCreated += 1;
        }
      },
    );
    function Probe() {
      const [n, setN] = React.useState(0);
      return (
        <>
          <button type="button" onClick={() => setN(n + 1)}>
            rerender
          </button>
          <EditStage labels={{ presets: { filters: { moon: "Ay" } } }} />
        </>
      );
    }
    render(<Probe />);
    await screen.findByLabelText("Back to capture");
    fireEvent.click(chip("filters"));
    await screen.findByLabelText("Ay");
    const afterFirst = imagesCreated;
    expect(afterFirst).toBeGreaterThan(0);
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        fireEvent.click(screen.getByText("rerender"));
      });
    }
    expect(imagesCreated).toBe(afterFirst);
    vi.unstubAllGlobals();
  });
});
