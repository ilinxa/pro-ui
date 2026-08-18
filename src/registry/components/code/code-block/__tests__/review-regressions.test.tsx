/**
 * Regression tests for the three defects the v0.2.0 adversarial review found.
 * Each one existed in the first cut of the fix, so each gets a test that fails
 * without its repair.
 *
 * R1 — cross-engine language cache (High). Making the engine selectable created
 *      a SECOND highlighter, which turned the module-global `loadedLangs` Set
 *      into a cross-instance lie: instance B short-circuited on A's load, never
 *      called `loadLanguage` on itself, and then threw on the next tokenize —
 *      surfacing as a permanent plaintext fallback on a healthy engine.
 * R2 — `editorFellBack` was a one-way trap (High): once the user took the
 *      view-only recovery, flipping `mode` back to "edit" did nothing forever.
 * R3 — highlighted rows lost their tint in the plaintext fallback (Medium),
 *      while the gutter number still bolded — a half-applied highlight.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

afterEach(() => cleanup());

/* ─────────── R1: language loading is per-highlighter ─────────── */

describe("R1: lazy languages load per highlighter instance, not globally", () => {
  afterEach(() => vi.resetModules());

  it("loads the grammar into EVERY instance that asks for it", async () => {
    vi.resetModules();

    // Two independent fake highlighters with their own loaded-language state —
    // exactly the shape `createHighlighterCore` returns per engine.
    const makeHighlighter = () => {
      const loaded = new Set<string>(["ts"]);
      return {
        getLoadedLanguages: () => [...loaded],
        loadLanguage: vi.fn((...regs: Array<{ name: string }>) => {
          for (const r of regs) loaded.add(r.name);
          return Promise.resolve();
        }),
      };
    };

    const { ensureLangLoaded } = await import("../lib/shiki-bundle");

    const a = makeHighlighter();
    const b = makeHighlighter();

    expect(await ensureLangLoaded(a as never, "rust")).toBe("rust");
    expect(await ensureLangLoaded(b as never, "rust")).toBe("rust");

    // The whole finding: B must have loaded it too, not ridden on A's bookkeeping.
    expect(a.loadLanguage).toHaveBeenCalledTimes(1);
    expect(b.loadLanguage).toHaveBeenCalledTimes(1);
    expect(b.getLoadedLanguages()).toContain("rust");
  });

  it("still short-circuits when THAT instance already has the language", async () => {
    vi.resetModules();
    const { ensureLangLoaded } = await import("../lib/shiki-bundle");
    const h = {
      getLoadedLanguages: () => ["ts", "rust"],
      loadLanguage: vi.fn(() => Promise.resolve()),
    };
    expect(await ensureLangLoaded(h as never, "rust")).toBe("rust");
    expect(h.loadLanguage).not.toHaveBeenCalled();
  });
});

/* ─────────── R2 + R3: rendered behaviour ─────────── */

describe("R2/R3: recovery and degraded-highlight rendering", () => {
  afterEach(() => {
    vi.doUnmock("../lib/shiki-bundle");
    vi.doUnmock("../lib/codemirror-langs");
    vi.resetModules();
  });

  it("R2: flipping mode away from edit and back restores the editor", async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.doMock("../lib/codemirror-langs", () => ({
      loadCodeMirrorLang: () => Promise.reject(new Error("chunk load failed")),
    }));

    const { CodeBlock } = await import("../code-block");
    const { rerender } = render(<CodeBlock mode="edit" value="const a = 1;" lang="ts" />);

    // Take the recovery.
    (await screen.findByRole("button", { name: "Reload as view-only" })).click();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());

    // Host toggles to preview, then back to edit.
    rerender(<CodeBlock mode="view" value="const a = 1;" lang="ts" />);
    rerender(<CodeBlock mode="edit" value="const a = 1;" lang="ts" />);

    // The editor must be attempted again — it fails again here (the mock still
    // rejects), and that error UI IS the proof the fallback flag was reset.
    // Before the fix this stayed on the view body forever.
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeNull());
    warn.mockRestore();
  }, 30_000);

  it("R3: highlighted rows keep their marker in the plaintext fallback", async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.doMock("../lib/shiki-bundle", async () => {
      const actual = await vi.importActual<typeof import("../lib/shiki-bundle")>(
        "../lib/shiki-bundle",
      );
      return { ...actual, getHighlighter: () => Promise.reject(new Error("no engine")) };
    });

    const { CodeBlock } = await import("../code-block");
    render(
      <CodeBlock value={"one\ntwo\nthree"} lang="ts" highlightedLines={[2]} showLineNumbers />,
    );

    const body = await waitFor(() => {
      const el = document.querySelector('[data-highlight="failed"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    const rows = body.querySelectorAll("pre > code > span");
    expect(rows).toHaveLength(3);
    // Row 2 (1-indexed) carries the marker the CSS keys the tint off; the
    // others must not, or every row would look highlighted.
    expect(rows[1].getAttribute("data-highlighted")).toBe("true");
    expect(rows[0].getAttribute("data-highlighted")).toBeNull();
    expect(rows[2].getAttribute("data-highlighted")).toBeNull();
    warn.mockRestore();
  }, 30_000);
});
