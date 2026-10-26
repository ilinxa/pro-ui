/**
 * media-editor 0.5.0 (C17 + ME1) - label plumbing (node tier): the nested <-> flat table,
 * the single English source, the locale-aware intake message, preset renaming.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_LABELS, type MediaEditorResolvedLabels } from "../types";
import {
  editorLabelsFromFlat,
  normalizeEditorLabels,
  resolveEditorLabels,
} from "../lib/normalize-labels";
import { formatNumber } from "../lib/format-number";
import { validateGalleryFile } from "../lib/validate-media-file";
import {
  renameBackgrounds,
  renameFilters,
  renameFonts,
  renameStickerSets,
} from "../lib/preset-names";
import { BUILT_IN_FILTER_PRESETS } from "../lib/konva-filters";
import { BUILT_IN_STICKER_SETS } from "../lib/built-in-stickers";
import { DEFAULT_FONTS, DEFAULT_TEXT_GRADIENTS } from "../lib/defaults";

/** Every resolved key replaced by a marker (functions return the marker). */
function markerFlat(): Record<string, string | ((...a: never[]) => string)> {
  const out: Record<string, string | ((...a: never[]) => string)> = {};
  for (const [k, v] of Object.entries(resolveEditorLabels(undefined))) {
    out[k] = typeof v === "function" ? () => `TR_${k}` : `TR_${k}`;
  }
  return out;
}

// Written out independently of the lib: the `Record<keyof ..., true>` type makes tsc fail when
// MediaEditorResolvedLabels gains or loses a key without this list following.
const ALL_KEYS: Record<keyof MediaEditorResolvedLabels, true> = {
  composerLabel: true, composerDescription: true, back: true, apply: true, cancel: true,
  backToCapture: true, editTools: true, modePhoto: true, modeVideo: true, modeText: true,
  shutterPhoto: true, shutterVideoStart: true, shutterVideoStop: true, galleryPicker: true,
  switchCamera: true, recordingLabel: true, connectCamera: true, connectHint: true,
  permissionRequesting: true, permissionIdleTitle: true, permissionIdleBody: true,
  permissionEnable: true, permissionDeniedTitle: true, permissionDeniedBody: true,
  permissionRetry: true, permissionUsePicker: true, permissionNoCameraTitle: true,
  permissionErrorTitle: true, videoUnsupported: true, videoFailed: true, videoCodecUnavailable: true, toolText: true,
  toolDraw: true, toolStickers: true, toolFilters: true, toolAdjust: true, toolCrop: true,
  adjustBrightness: true, adjustContrast: true, adjustSaturation: true, adjustBlur: true,
  drawColor: true, drawBrush: true, drawEraser: true, textPlaceholder: true, textFontFamily: true,
  textFontSize: true, textAlignLeft: true, textAlignCenter: true, textAlignRight: true,
  textDelete: true, textBackground: true, colorHex: true, colorSwatch: true, cropAspectFree: true,
  cropAspectOriginal: true, cropAspectCount: true, canvasAriaLabel: true, resetZoom: true, resizeHandle: true,
  trimStart: true, trimEnd: true, trimSeconds: true, discardConfirmTitle: true,
  discardConfirmBody: true, discardConfirm: true, discardCancel: true, intakePrompt: true,
  fileUnknownType: true, fileUnsupportedType: true, fileTooLarge: true, emptyNoSource: true,
  emptyNoSourceHint: true, emptyNoSourceAria: true, emptyLoadFailed: true, emptyAttempted: true,
  emptyEnabled: true, emptyType: true, emptyBlank: true, emptyNone: true,
  emptyNoCaptureSource: true, emptyAspect: true, emptySources: true,
};

function countLeaves(node: unknown): number {
  if (typeof node === "string" || typeof node === "function") return 1;
  if (node && typeof node === "object") {
    return Object.values(node).reduce((n: number, v) => n + countLeaves(v), 0);
  }
  return 0;
}

describe("DEFAULT_LABELS is the single source of the resolved defaults", () => {
  it("every resolved key has exactly one nested default, and every nested default one key", () => {
    const resolved = resolveEditorLabels(undefined);
    expect(Object.keys(resolved).sort()).toEqual(Object.keys(ALL_KEYS).sort());
    // 1:1: as many nested leaves as flat keys (a nested default with no table entry, or two
    // keys sharing a path, would break the equality)
    expect(countLeaves(DEFAULT_LABELS)).toBe(Object.keys(ALL_KEYS).length);
    for (const v of Object.values(resolved)) {
      expect(["string", "function"]).toContain(typeof v);
    }
  });

  it("keeps the English strings the editor rendered before 0.5.0", () => {
    const r = resolveEditorLabels(undefined);
    expect(r.discardConfirmTitle).toBe("Discard?");
    expect(r.discardConfirmBody).toBe("You'll lose your captured media and edits.");
    expect(r.permissionDeniedBody).toBe(
      "We need camera permission to capture media. Enable it in your browser settings, or pick a file from your gallery.",
    );
    expect(r.emptyNoSource).toBe("No source provided");
    expect(r.resizeHandle("NW")).toBe("Resize NW");
    expect(r.colorSwatch("#fff")).toBe("Color #fff");
    expect(r.cropAspectCount(5, "5")).toBe("(5 crop aspects)");
    expect(r.trimSeconds(1.5, "1.5")).toBe("1.5s");
    expect(r.fileUnsupportedType("text/plain")).toBe("Unsupported file type: text/plain");
    expect(r.fileTooLarge(12.3, 10, "12.3", "10")).toBe("File is 12.3 MB — maximum is 10 MB");
  });
});

describe("editorLabelsFromFlat", () => {
  it("round-trips: flat -> nested -> normalize -> the same flat values", () => {
    const flat = markerFlat();
    const nested = editorLabelsFromFlat(flat as unknown as Partial<MediaEditorResolvedLabels>);
    const back = normalizeEditorLabels(nested) as Record<string, unknown>;
    expect(Object.keys(back).sort()).toEqual(Object.keys(flat).sort());
    for (const [k, v] of Object.entries(flat)) {
      if (typeof v === "string") expect(back[k]).toBe(v);
      else expect((back[k] as () => string)()).toBe(`TR_${k}`);
    }
  });

  it("ignores keys it does not know, and wrongly typed values (variable with extra keys)", () => {
    // Type test: a variable carrying extra keys is accepted with no cast.
    const extra = {
      toolText: "Metin",
      resizeHandle: (c: string) => `Boyut ${c}`,
      publish: "Yayınla",
      close: "Kapat",
      bogus: 3,
    };
    const nested = editorLabelsFromFlat(extra);
    expect(nested.toolbar?.text).toBe("Metin");
    expect(nested.canvas?.resizeHandle?.("NW")).toBe("Boyut NW");
    const json = JSON.stringify(nested);
    expect(json).not.toContain("Yayınla");
    expect(json).not.toContain("Kapat");
    expect(json).not.toContain("bogus");

    // A value of the wrong kind for a known key is dropped, not copied.
    const wrong = editorLabelsFromFlat({ modePhoto: 5 } as unknown as Partial<MediaEditorResolvedLabels>);
    expect(wrong.capture?.modes?.photo).toBeUndefined();
  });
});

describe("normalizeEditorLabels function-valued keys", () => {
  it("passes nested function templates through and ignores a string where a function is expected", () => {
    const out = normalizeEditorLabels({
      canvas: { resizeHandle: (c: string) => `R-${c}` },
      color: { swatch: "not a function" },
    });
    expect((out.resizeHandle as (c: string) => string)("NE")).toBe("R-NE");
    expect(out.colorSwatch).toBeUndefined();
  });

  it("flat function keys win over nested", () => {
    const out = normalizeEditorLabels({
      canvas: { resizeHandle: () => "nested" },
      resizeHandle: () => "flat",
    });
    expect((out.resizeHandle as () => string)()).toBe("flat");
  });
});

describe("formatNumber / validateGalleryFile locale", () => {
  it("formats with the given locale and survives an invalid tag", () => {
    expect(formatNumber(1.5, "tr", { min: 1 })).toBe("1,5");
    expect(formatNumber(1.5, "en", { min: 1 })).toBe("1.5");
    expect(() => formatNumber(1.5, "not_a_locale!!", { min: 1 })).not.toThrow();
  });

  it("builds ValidationError.message from the intake labels with locale-formatted sizes", () => {
    const big = new File([new Uint8Array(1.5 * 1024 * 1024)], "a.png", { type: "image/png" });
    const labels = {
      ...resolveEditorLabels(undefined),
      fileTooLarge: (_s: number, _m: number, sf: string, mf: string) =>
        `Dosya ${sf} MB, azami ${mf} MB`,
    };
    const err = validateGalleryFile(big, 1, { labels, locale: "tr" });
    expect(err?.kind).toBe("file-too-large");
    expect(err?.message).toBe("Dosya 1,5 MB, azami 1 MB");
    // English default unchanged
    expect(validateGalleryFile(big, 1)?.message).toBe("File is 1.5 MB — maximum is 1 MB");
  });

  it("translates the unsupported-type message, with a label for a blank MIME type", () => {
    const labels = {
      ...resolveEditorLabels(undefined),
      fileUnknownType: "bilinmiyor",
      fileUnsupportedType: (t: string) => `Desteklenmeyen tür: ${t}`,
    };
    const blank = new File(["x"], "a.bin", { type: "" });
    expect(validateGalleryFile(blank, 5, { labels })?.message).toBe(
      "Desteklenmeyen tür: bilinmiyor",
    );
    expect(validateGalleryFile(blank, 5)?.message).toBe("Unsupported file type: unknown");
  });
});

describe("preset renaming", () => {
  it("renames by id, keeps the rest, and returns the input untouched when there are no names", () => {
    expect(renameBackgrounds(DEFAULT_TEXT_GRADIENTS, undefined)).toBe(DEFAULT_TEXT_GRADIENTS);
    const g = renameBackgrounds(DEFAULT_TEXT_GRADIENTS, { lime: "Limon" });
    expect(g.find((x) => x.id === "lime")?.label).toBe("Limon");
    expect(g.find((x) => x.id === "sunset")?.label).toBe("Sunset");

    const f = renameFonts(DEFAULT_FONTS, { serif: "Serifli" });
    expect(f.find((x) => x.id === "serif")?.label).toBe("Serifli");
    expect(f.find((x) => x.id === "serif")?.family).toBe(
      DEFAULT_FONTS.find((x) => x.id === "serif")?.family,
    );

    const fl = renameFilters(BUILT_IN_FILTER_PRESETS, { clarendon: "Clarendon-TR" });
    expect(fl.find((x) => x.id === "clarendon")?.label).toBe("Clarendon-TR");
    expect(fl.find((x) => x.id === "moon")?.label).toBe("Moon");

    const s = renameStickerSets(BUILT_IN_STICKER_SETS, { faces: "Yüzler" }, { smile: "Gülümseme" });
    expect(s.find((x) => x.id === "faces")?.label).toBe("Yüzler");
    expect(s.find((x) => x.id === "faces")?.stickers.find((x) => x.id === "smile")?.alt).toBe(
      "Gülümseme",
    );
    expect(s.find((x) => x.id === "hearts")?.label).toBe("Hearts");
  });
});
