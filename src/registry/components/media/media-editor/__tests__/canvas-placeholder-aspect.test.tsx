/**
 * Release 8 FX-A / A5: the inline canvas placeholder of a locked aspect has no min-height
 * (it would beat aspect-ratio on a narrow column) and builds its CSS ratio from parsed numbers.
 */
import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaEditor } from "../media-editor";
import { resolveEditorLabels } from "../lib/normalize-labels";

vi.mock("../parts/lazy-editor-canvas", () => ({ default: () => null }));

const ENGLISH = resolveEditorLabels(undefined);
const PHOTO = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" });

beforeEach(() => {
  URL.createObjectURL = () => "blob:u1";
  URL.revokeObjectURL = () => {};
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function placeholder(aspect: string) {
  render(
    <MediaEditor
      presentation="inline"
      enabledModes={["photo"]}
      mediaSources={["upload"]}
      initialSource={{ kind: "blob", blob: PHOTO, mode: "photo" }}
      aspect={aspect as never}
    />,
  );
  await screen.findByLabelText(ENGLISH.backToCapture);
  return document.querySelector("[data-canvas-placeholder]") as HTMLElement;
}

describe("canvas placeholder aspect", () => {
  it("1.91:1 has no min-h-64 and a numeric ratio", async () => {
    const el = await placeholder("1.91:1");
    expect(el.className).not.toContain("min-h-64");
    expect(el.className).toContain("min-w-50");
    expect(el.style.aspectRatio).toBe("1.91 / 1");
  });
  it("16:9 has no min-h-64", async () => {
    const el = await placeholder("16:9");
    expect(el.className).not.toContain("min-h-64");
    expect(el.style.aspectRatio).toBe("16 / 9");
  });
  it("free keeps min-h-64 and 16 / 9", async () => {
    const el = await placeholder("free");
    expect(el.className).toContain("min-h-64");
    expect(el.style.aspectRatio).toBe("16 / 9");
  });
});
