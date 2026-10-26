import { describe, expect, it } from "vitest";
import { cropAspectToRatio, isValidCropAspect } from "../lib/crop-aspect";

describe("isValidCropAspect", () => {
  it("accepts every AspectRatio, original, and W:H with positive numbers", () => {
    for (const v of ["9:16", "1:1", "16:9", "4:5", "free", "original", "3:2", "2.5:1", "1920:1080"]) {
      expect(isValidCropAspect(v), v).toBe(true);
    }
  });

  it("rejects malformed values", () => {
    for (const v of ["", "3", "3:", ":2", "0:1", "1:0", "-3:2", "a:b", "3:2:1", " 3:2", "3: 2", "NaN:1", "Infinity:1", "FREE", "constructor", "__proto__"]) {
      expect(isValidCropAspect(v), v).toBe(false);
    }
    for (const v of [null, undefined, 3, {}, ["1:1"]]) {
      expect(isValidCropAspect(v)).toBe(false);
    }
  });
});

describe("cropAspectToRatio", () => {
  it("maps named aspects, free is null", () => {
    expect(cropAspectToRatio("1:1", null)).toBe(1);
    expect(cropAspectToRatio("16:9", null)).toBeCloseTo(16 / 9);
    expect(cropAspectToRatio("9:16", null)).toBeCloseTo(9 / 16);
    expect(cropAspectToRatio("4:5", null)).toBeCloseTo(0.8);
    expect(cropAspectToRatio("free", 2)).toBeNull();
  });

  it("maps custom W:H", () => {
    expect(cropAspectToRatio("3:2", null)).toBeCloseTo(1.5);
    expect(cropAspectToRatio("2.5:1", null)).toBeCloseTo(2.5);
  });

  it("original follows the media ratio and is free until it is known", () => {
    expect(cropAspectToRatio("original", 1.25)).toBe(1.25);
    expect(cropAspectToRatio("original", null)).toBeNull();
    expect(cropAspectToRatio("original", 0)).toBeNull();
    expect(cropAspectToRatio("original", Number.NaN)).toBeNull();
  });
});
