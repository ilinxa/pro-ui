/**
 * media-editor 0.8.0: ME-1 fixed-aspect fit, ME-2 edge to edge, ME-3
 * `contentClassName`, ME-5 tool strip. jsdom has no layout — these assert the
 * inline styles / classes / container type the shell sets and the stage-size
 * maths; the browser pass measures the geometry.
 */
import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { resolveEditorLabels } from "../lib/normalize-labels";
import { stageSizeFor } from "../hooks/use-konva-stage-size";

const h = vi.hoisted(() => ({ props: null as null | Record<string, any> })); // eslint-disable-line @typescript-eslint/no-explicit-any

vi.mock("../parts/lazy-editor-canvas", () => ({
  default: function StubCanvas(props: Record<string, unknown>) {
    h.props = props;
    return null;
  },
}));

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });

beforeEach(() => {
  URL.createObjectURL = () => "blob:u1";
  URL.revokeObjectURL = () => {};
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  h.props = null;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type Pres = "inline" | "dialog";

async function mount(presentation: Pres, aspect: string, extra: Record<string, unknown> = {}) {
  const dialog = presentation === "dialog" ? { isOpen: true, onClose: () => {} } : {};
  render(
    <MediaEditor
      presentation={presentation}
      enabledModes={["photo"]}
      mediaSources={["upload"]}
      initialSource={{ kind: "blob", blob: PHOTO, mode: "photo" }}
      aspect={aspect as never}
      {...dialog}
      {...extra}
    />,
  );
  await screen.findByLabelText(ENGLISH.backToCapture);
  const root = document.querySelector<HTMLElement>('[data-slot="media-editor"]')!;
  const box = document.querySelector<HTMLElement>("[data-canvas-placeholder]")!;
  return { root, box, region: box.parentElement!, content: document.querySelector<HTMLElement>('[data-slot="dialog-content"]') };
}

describe("ME-1 fixed-aspect fit", () => {
  it("dialog: the region is a size container and the box is min(100cqw, 100cqh * W/H)", async () => {
    const { box, region } = await mount("dialog", "9:16");
    expect(region.className).toContain("[container-type:size]");
    // jsdom folds calc(100cqh * 0.5625) to 56.25cqh
    expect(box.style.width).toMatch(/^min\(100cqw, (56\.25cqh|calc\(100cqh \* 0\.5625\))\)$/);
    expect(box.style.aspectRatio).toBe("9 / 16");
    expect(box.className).not.toContain("h-full");
    expect(box.className).not.toMatch(/(^|\s)border(\s|$)/);
  });

  it("dialog: a custom W:H builds the same maths", async () => {
    const { box } = await mount("dialog", "3:2");
    expect(box.style.width).toMatch(/^min\(100cqw, (150cqh|calc\(100cqh \* 1\.5\))\)$/);
    expect(box.style.aspectRatio).toBe("3 / 2");
  });

  it("inline: width-driven, the 70vh cap enters the width and no max-h can break the ratio", async () => {
    const { box, region } = await mount("inline", "9:16");
    expect(region.className).not.toContain("container-type");
    // 70vh * 0.5625 = 39.375vh
    expect(box.style.width).toMatch(/^min\(100%, 30rem, (39\.375vh|calc\(70vh \* 0\.5625\))\)$/);
    expect(box.style.aspectRatio).toBe("9 / 16");
    expect(box.className).not.toContain("max-h-");
    expect(box.className).not.toMatch(/(^|\s)border(\s|$)/);
  });

  it("free is unchanged in both presentations", async () => {
    const inline = await mount("inline", "free");
    expect(inline.box.style.width).toBe("");
    expect(inline.box.className).toContain("max-h-[70vh]");
    expect(inline.box.className).toContain("border-dashed");
    cleanup();
    const dialog = await mount("dialog", "free");
    expect(dialog.region.className).not.toContain("container-type");
    expect(dialog.box.className).toContain("h-full w-full");
    expect(dialog.box.className).toContain("border-dashed");
  });

  it("the canvas gets the exact stage ratio (fixed) or null (free)", async () => {
    await mount("inline", "9:16");
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    expect(h.props!.stageRatio).toBe(0.5625);
    cleanup();
    h.props = null;
    await mount("inline", "free");
    await vi.waitFor(() => expect(h.props).not.toBeNull());
    expect(h.props!.stageRatio).toBeNull();
  });
});

describe("stageSizeFor", () => {
  it("fits the largest ratio box, rounding the longer side once", () => {
    // 9:16 box 343.6 x 700 is taller than the ratio: width-limited, h = 343.6 / (9/16) = 610.8 -> 611
    expect(stageSizeFor(343.6, 700, 9 / 16)).toEqual({ width: 344, height: 611 });
    // height unmeasured: the width is the only constraint
    expect(stageSizeFor(390, 0, 9 / 16)).toEqual({ width: 390, height: 693 });
  });
  it("passes the measured size through without a ratio, or for an unusable one", () => {
    expect(stageSizeFor(300.4, 200.6)).toEqual({ width: 300, height: 201 });
    expect(stageSizeFor(300, 200, null)).toEqual({ width: 300, height: 200 });
    expect(stageSizeFor(300, 200, 0)).toEqual({ width: 300, height: 200 });
    expect(stageSizeFor(0, 200, 0.5)).toEqual({ width: 0, height: 200 });
  });
});

describe("ME-2 edge to edge", () => {
  it("fixed-aspect dialog: no root padding, border-0 content, no box rounding", async () => {
    const { root, box, content } = await mount("dialog", "9:16");
    expect(root.className).not.toMatch(/(^|\s)p-4(\s|$)/);
    expect(root.className).toContain("gap-3");
    expect(content!.className).toContain("border-0");
    expect(box.className).not.toContain("rounded-xl");
  });
  it("free dialog and fixed inline keep their padding", async () => {
    const free = await mount("dialog", "free");
    expect(free.root.className).toMatch(/(^|\s)p-4(\s|$)/);
    expect(free.content!.className).not.toContain("border-0");
    cleanup();
    const inline = await mount("inline", "9:16");
    expect(inline.root.className).toMatch(/(^|\s)p-4(\s|$)/);
    expect(inline.root.className).toContain("rounded-2xl");
  });
});

describe("ME-3 contentClassName", () => {
  for (const presentation of ["inline", "dialog"] as const) {
    it(`${presentation}: reaches the root and wins over the defaults`, async () => {
      const { root } = await mount(presentation, "free", { contentClassName: "p-0 bg-black custom-x" });
      expect(root.className).toContain("custom-x");
      expect(root.className).toContain("bg-black");
      expect(root.className).toMatch(/(^|\s)p-0(\s|$)/);
      expect(root.className).not.toMatch(/(^|\s)p-4(\s|$)/);
    });
  }
});

describe("ME-5 tool strip", () => {
  it("every chip has an icon, a title and a label that stays in the DOM (sr-only when narrow)", async () => {
    await mount("dialog", "9:16");
    const chips = Array.from(document.querySelectorAll<HTMLElement>("[data-tool]"));
    expect(chips.length).toBe(6);
    for (const chip of chips) {
      expect(chip.querySelector("svg")).not.toBeNull();
      expect(chip.getAttribute("title")).toBeTruthy();
      const label = chip.querySelector("span")!;
      expect(label.textContent).toBe(chip.getAttribute("title"));
      expect(label.className).toContain("@max-[31rem]:sr-only");
    }
    expect(screen.getByRole("button", { name: ENGLISH.toolCrop })).toBeTruthy();
    expect(screen.getByRole("button", { name: ENGLISH.toolStickers })).toBeTruthy();
  });
  it("the chip row's container is a CSS container", async () => {
    await mount("dialog", "9:16");
    const chip = document.querySelector<HTMLElement>("[data-tool]")!;
    expect(chip.closest(".\\@container")).not.toBeNull();
  });
});
