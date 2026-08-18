/**
 * Soft-failure headline tests (v0.2.0).
 *
 * The component documents a soft-failure policy with four modes. Two of them
 * shipped 0.1.x unimplemented, and both failed the SAME way — an empty panel
 * with nothing on screen and nothing in the console:
 *
 *   - the view-mode highlighter had no fallback at all (reported externally);
 *   - the edit-mode CodeMirror mount was a floating `void mount()` promise, so
 *     a failed grammar chunk produced an unhandled rejection over a blank box.
 *
 * These can only be proven by mounting: the failure happens inside an async
 * effect, so a lib-tier test cannot observe the rendered consequence. Both
 * suites drive the real failure by making the module the component depends on
 * reject, which is what a strict CSP / failed chunk fetch does in production.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// `vitest.config.ts` does not set `test.globals: true`, so Testing Library's
// auto-cleanup never registers — wire it explicitly per file.
afterEach(() => cleanup());

const SNIPPET = 'const answer = 42;\nconsole.log("hi");';

/* ─────────── view mode: highlighter unavailable ─────────── */

describe("view mode: the highlighter failing must not blank the block", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    // Dev-only warning is expected here; asserting it fired keeps a *different*
    // silent failure from hiding behind the suppression.
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.doUnmock("../lib/shiki-bundle");
    vi.resetModules();
  });

  // Cold module graph (CodeMirror + Shiki) on the first mount: measured ~5.8s,
  // over vitest's 5s default. Budget generously rather than chase a flake.
  it("renders the raw code as text and marks the body degraded", async () => {
    vi.doMock("../lib/shiki-bundle", async () => {
      const actual = await vi.importActual<typeof import("../lib/shiki-bundle")>(
        "../lib/shiki-bundle",
      );
      return {
        ...actual,
        // Exactly what a CSP without 'wasm-unsafe-eval' produces.
        getHighlighter: () =>
          Promise.reject(new Error("Wasm code generation disallowed by embedder")),
      };
    });

    const { CodeBlock } = await import("../code-block");
    render(<CodeBlock value={SNIPPET} lang="ts" />);

    const body = await waitFor(() => {
      const el = document.querySelector('[data-highlight="failed"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    // The point of the whole fix: the code is on screen.
    expect(body.textContent).toContain("const answer = 42;");
    expect(body.textContent).toContain('console.log("hi");');
    // ...as TEXT, not as Shiki tokens.
    expect(body.querySelector("pre.shiki")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  }, 30_000);

  it("still renders one block per source line so the gutter stays aligned", async () => {
    vi.doMock("../lib/shiki-bundle", async () => {
      const actual = await vi.importActual<typeof import("../lib/shiki-bundle")>(
        "../lib/shiki-bundle",
      );
      return { ...actual, getHighlighter: () => Promise.reject(new Error("no engine")) };
    });

    const { CodeBlock } = await import("../code-block");
    render(<CodeBlock value={SNIPPET} lang="ts" showLineNumbers />);

    const body = await waitFor(() => {
      const el = document.querySelector('[data-highlight="failed"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });

    // 2 source lines -> 2 rendered line elements.
    expect(body.querySelectorAll("pre > code > span")).toHaveLength(2);
  }, 30_000);
});

/* ─────────── edit mode: CodeMirror mount fails ─────────── */

describe("edit mode: a failed editor mount must offer recovery, not a blank box", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.doUnmock("../lib/codemirror-langs");
    vi.resetModules();
  });

  async function renderFailingEditor() {
    vi.doMock("../lib/codemirror-langs", () => ({
      // A failed dynamic grammar chunk — the same class of failure that takes
      // the Shiki engine down, and previously an unhandled rejection here.
      loadCodeMirrorLang: () => Promise.reject(new Error("chunk load failed")),
    }));
    const { CodeBlock } = await import("../code-block");
    return render(<CodeBlock mode="edit" value={SNIPPET} lang="ts" />);
  }

  it("surfaces an inline error instead of failing silently", async () => {
    await renderFailingEditor();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("data-editor", "failed");
    expect(alert.textContent).toContain("The editor could not be loaded.");
    expect(warnSpy).toHaveBeenCalled();
  });

  it('"Reload as view-only" actually swaps in a readable view body', async () => {
    const user = userEvent.setup();
    await renderFailingEditor();

    await user.click(await screen.findByRole("button", { name: "Reload as view-only" }));

    // The recovery is only real if the code is now readable.
    await waitFor(() => {
      const body = document.querySelector("[data-highlight]");
      expect(body).not.toBeNull();
      expect(body?.textContent).toContain("const answer = 42;");
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("honours custom labels for both the message and the recovery control", async () => {
    vi.doMock("../lib/codemirror-langs", () => ({
      loadCodeMirrorLang: () => Promise.reject(new Error("chunk load failed")),
    }));
    const { CodeBlock } = await import("../code-block");
    render(
      <CodeBlock
        mode="edit"
        value={SNIPPET}
        lang="ts"
        labels={{ editorFailed: "Editor kaputt", reloadAsViewOnly: "Nur lesen" }}
      />,
    );

    expect((await screen.findByRole("alert")).textContent).toContain("Editor kaputt");
    expect(screen.getByRole("button", { name: "Nur lesen" })).toBeInTheDocument();
  });
});
