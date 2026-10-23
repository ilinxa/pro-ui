import { describe, expect, it } from "vitest";
import { normalizeEditorLabels } from "../lib/normalize-labels";

describe("normalizeEditorLabels", () => {
  it("maps nested MediaEditorLabels keys onto the flat shape", () => {
    const out = normalizeEditorLabels({
      capture: {
        requestingCamera: "R",
        cameraDenied: { title: "T", body: "B", retryCta: "Re", useGalleryCta: "G" },
        galleryButton: "GB",
        switchCamera: "SC",
        modes: { photo: "P", video: "V", text: "X" },
      },
      toolbar: { text: "t", draw: "d", stickers: "s", filters: "f", adjust: "a", crop: "c" },
      adjust: { brightness: "b", contrast: "c2", saturation: "s2", blur: "bl" },
      discard: { title: "dt", body: "db", cancel: "dc", confirm: "dk" },
      publish: { exporting: "ignored" },
      empty: { noSource: "ignored" },
    });
    expect(out).toEqual({
      permissionRequesting: "R",
      permissionDeniedTitle: "T",
      permissionDeniedBody: "B",
      permissionRetry: "Re",
      permissionUsePicker: "G",
      galleryPicker: "GB",
      switchCamera: "SC",
      modePhoto: "P",
      modeVideo: "V",
      modeText: "X",
      toolText: "t",
      toolDraw: "d",
      toolStickers: "s",
      toolFilters: "f",
      toolAdjust: "a",
      toolCrop: "c",
      adjustBrightness: "b",
      adjustContrast: "c2",
      adjustSaturation: "s2",
      adjustBlur: "bl",
      discardConfirmTitle: "dt",
      discardConfirmBody: "db",
      discardCancel: "dc",
      discardConfirm: "dk",
    });
  });

  it("passes flat string keys through unchanged", () => {
    const flat = { composerLabel: "Cmp", shutterPhoto: "Snap", toolDraw: "Pen" };
    expect(normalizeEditorLabels(flat)).toEqual(flat);
  });

  it("mixed: flat wins over nested on conflict, nested fills the rest", () => {
    const out = normalizeEditorLabels({
      toolbar: { draw: "Nested draw", crop: "Nested crop" },
      toolDraw: "Flat draw",
    });
    expect(out).toEqual({ toolDraw: "Flat draw", toolCrop: "Nested crop" });
  });

  it("ignores non-string values and non-object input", () => {
    expect(
      normalizeEditorLabels({
        toolbar: { draw: 3, crop: null },
        toolText: undefined,
        modePhoto: 5,
      }),
    ).toEqual({});
    expect(normalizeEditorLabels(undefined)).toEqual({});
    expect(normalizeEditorLabels(null)).toEqual({});
  });
});
