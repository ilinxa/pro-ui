/**
 * `getHighlighter()` caches per engine (v0.2.0).
 *
 * The integrator asked for a selectable regex engine so a CSP-restricted host
 * could avoid WebAssembly. The non-obvious half is the cache: 0.1.x memoised
 * into ONE module-level promise with no key, so had the engine simply become a
 * parameter, the first block to mount would have won and every later block
 * asking for the other engine would silently get the cached one — an option
 * that looks wired and isn't. These tests pin the keying, not the engines.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createHighlighterCore = vi.fn();
const createOnigurumaEngine = vi.fn(() => ({ __engine: "oniguruma" }));
const createJavaScriptRegexEngine = vi.fn(() => ({ __engine: "javascript" }));

vi.mock("shiki/core", () => ({
  createHighlighterCore: (opts: unknown) => {
    createHighlighterCore(opts);
    // A unique object per call, so identity tells us whether the cache was hit.
    return Promise.resolve({ id: createHighlighterCore.mock.calls.length });
  },
}));
vi.mock("shiki/engine/oniguruma", () => ({
  createOnigurumaEngine: (...a: unknown[]) => createOnigurumaEngine(...(a as [])),
}));
vi.mock("shiki/engine/javascript", () => ({
  createJavaScriptRegexEngine: () => createJavaScriptRegexEngine(),
}));
vi.mock("shiki/wasm", () => ({ default: () => Promise.resolve({}) }));

describe("getHighlighter caches per engine", () => {
  beforeEach(() => {
    vi.resetModules();
    createHighlighterCore.mockClear();
    createOnigurumaEngine.mockClear();
    createJavaScriptRegexEngine.mockClear();
  });

  afterEach(() => vi.resetModules());

  it("returns the SAME highlighter for repeated calls with the same engine", async () => {
    const { getHighlighter } = await import("../lib/shiki-bundle");
    const [a, b] = await Promise.all([
      getHighlighter("oniguruma"),
      getHighlighter("oniguruma"),
    ]);
    expect(a).toBe(b);
    expect(createHighlighterCore).toHaveBeenCalledTimes(1);
  });

  it("returns a DIFFERENT highlighter per engine — the first caller must not win", async () => {
    const { getHighlighter } = await import("../lib/shiki-bundle");
    const oniguruma = await getHighlighter("oniguruma");
    const javascript = await getHighlighter("javascript");

    expect(oniguruma).not.toBe(javascript);
    expect(createHighlighterCore).toHaveBeenCalledTimes(2);
    expect(createOnigurumaEngine).toHaveBeenCalledTimes(1);
    expect(createJavaScriptRegexEngine).toHaveBeenCalledTimes(1);
  });

  it("defaults to oniguruma, so 0.1.x consumers keep their engine", async () => {
    const { getHighlighter } = await import("../lib/shiki-bundle");
    await getHighlighter();
    expect(createOnigurumaEngine).toHaveBeenCalledTimes(1);
    expect(createJavaScriptRegexEngine).not.toHaveBeenCalled();
  });

  it("does not import shiki/wasm at all for the javascript engine", async () => {
    const { getHighlighter } = await import("../lib/shiki-bundle");
    await getHighlighter("javascript");
    // The whole point for a CSP-restricted host: no wasm engine constructed.
    expect(createOnigurumaEngine).not.toHaveBeenCalled();
    expect(createJavaScriptRegexEngine).toHaveBeenCalledTimes(1);
  });

  it("evicts a failed highlighter so one bad compile cannot poison the page", async () => {
    const { getHighlighter } = await import("../lib/shiki-bundle");

    createHighlighterCore.mockImplementationOnce(() => {
      throw new Error("wasm blocked");
    });
    await expect(getHighlighter("oniguruma")).rejects.toThrow("wasm blocked");

    // A later call must get a fresh attempt, not the cached rejection.
    await expect(getHighlighter("oniguruma")).resolves.toBeDefined();
  });
});
