import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveCropAspects } from "../lib/resolve-crop-aspects";
import type { CropAspect } from "../types";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("resolveCropAspects", () => {
  it("derives the default menu", () => {
    expect(resolveCropAspects("free", undefined)).toEqual(["9:16", "1:1", "16:9", "4:5", "free"]);
    expect(resolveCropAspects("1:1", undefined)).toEqual(["1:1"]);
  });

  it("returns a valid override, widened to CropAspect", () => {
    expect(resolveCropAspects("free", ["original", "3:2", "free"])).toEqual(["original", "3:2", "free"]);
  });

  it("drops invalid entries, dedupes, warns once per distinct invalid value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = resolveCropAspects("free", [
      "1:1",
      "bad",
      "bad",
      "0:5",
      "1:1",
      "3:2",
    ] as CropAspect[]);
    expect(out).toEqual(["1:1", "3:2"]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("falls back to the default when everything is invalid", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveCropAspects("1:1", ["x", "y"] as unknown as CropAspect[])).toEqual(["1:1"]);
    expect(resolveCropAspects("free", ["x"] as unknown as CropAspect[])).toHaveLength(5);
  });

  it("does not warn in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    resolveCropAspects("free", ["x", "1:1"] as unknown as CropAspect[]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once per distinct invalid value across calls (module-level dedupe)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad = ["1:1", "dedupe-me"] as unknown as CropAspect[];
    resolveCropAspects("free", bad);
    resolveCropAspects("free", bad);
    resolveCropAspects("free", bad);
    expect(warn).toHaveBeenCalledTimes(1);
    resolveCropAspects("free", ["1:1", "dedupe-me-2"] as unknown as CropAspect[]);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
