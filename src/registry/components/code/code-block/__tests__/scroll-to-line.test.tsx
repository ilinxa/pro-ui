/**
 * `CodeBlockHandle.scrollToLine()` — v0.2.1.
 *
 * The method existed from v0.1.0 as an empty function body, while `meta.ts`
 * advertised it as part of a working imperative handle. Calling it did nothing,
 * silently, for three minor versions. Nothing caught it: the symbol existed, so
 * tsc, lint, the barrel gate and the test tier were all green.
 *
 * These tests assert the behaviour rather than the symbol — each one fails if
 * `scrollToLine` goes back to being a no-op.
 *
 * jsdom does not implement `scrollIntoView`, so it is stubbed and asserted on:
 * WHICH element the method targets is the actual contract here, and that is
 * exactly what a no-op cannot satisfy.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { CodeBlock } from "../code-block";
import type { CodeBlockHandle } from "../types";

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  // jsdom has no layout engine and no scrollIntoView; install a spy so the
  // target element is observable.
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView =
    scrollIntoView;
});

afterEach(() => cleanup());

const CODE = ["one", "two", "three", "four", "five", "six", "seven", "eight"].join("\n");

/** The element `scrollIntoView` was called on. */
function targetedRow() {
  expect(scrollIntoView).toHaveBeenCalledTimes(1);
  return scrollIntoView.mock.instances[0] as HTMLElement;
}

describe("scrollToLine — view mode", () => {
  it("scrolls to the requested row, not merely 'somewhere'", async () => {
    const ref = createRef<CodeBlockHandle>();
    render(<CodeBlock ref={ref} value={CODE} lang="ts" />);

    // The plaintext fallback renders immediately (pre-tokenize), and carries
    // `.line` exactly like Shiki's output — so this path is real in both states.
    await waitFor(() => {
      expect(document.querySelectorAll("[data-cb-scroller] .line").length).toBe(8);
    });

    ref.current!.scrollToLine(3);

    const row = targetedRow();
    expect(row.textContent).toBe("three");
  });

  it("clamps past-the-end input to the last row instead of doing nothing", async () => {
    const ref = createRef<CodeBlockHandle>();
    render(<CodeBlock ref={ref} value={CODE} lang="ts" />);
    await waitFor(() => {
      expect(document.querySelectorAll("[data-cb-scroller] .line").length).toBe(8);
    });

    ref.current!.scrollToLine(999);

    expect(targetedRow().textContent).toBe("eight");
  });

  it("clamps zero/negative input to the first row", async () => {
    const ref = createRef<CodeBlockHandle>();
    render(<CodeBlock ref={ref} value={CODE} lang="ts" />);
    await waitFor(() => {
      expect(document.querySelectorAll("[data-cb-scroller] .line").length).toBe(8);
    });

    ref.current!.scrollToLine(0);

    expect(targetedRow().textContent).toBe("one");
  });
});

describe("scrollToLine — terminal mode", () => {
  it("targets the transcript row at that index", async () => {
    const ref = createRef<CodeBlockHandle>();
    render(
      <CodeBlock
        ref={ref}
        mode="terminal"
        lines={[
          { kind: "input", text: "$ pnpm install" },
          { kind: "output", text: "Resolving..." },
          { kind: "error", text: "ENOENT" },
        ]}
      />,
    );

    await waitFor(() => {
      expect(document.querySelectorAll("[data-cb-line]").length).toBe(3);
    });

    ref.current!.scrollToLine(3);

    expect(targetedRow().textContent).toContain("ENOENT");
  });
});

describe("scrollToLine — collapsed blocks", () => {
  it("expands a collapsed block instead of scrolling to a row under the fade", async () => {
    const onExpandedChange = vi.fn();
    const ref = createRef<CodeBlockHandle>();
    render(
      <CodeBlock
        ref={ref}
        value={CODE}
        lang="ts"
        maxLines={3}
        onExpandedChange={onExpandedChange}
      />,
    );
    await waitFor(() => {
      expect(document.querySelectorAll("[data-cb-scroller] .line").length).toBe(8);
    });

    ref.current!.scrollToLine(7);

    // `maxLines` clips by height rather than dropping rows, so row 7 exists in
    // the DOM. Scrolling to it without expanding would move the scroller and
    // still show the user nothing — the same silent no-op being fixed here.
    expect(onExpandedChange).toHaveBeenCalledWith({ expanded: true });
  });

  it("does not expand when the target is already visible", async () => {
    const onExpandedChange = vi.fn();
    const ref = createRef<CodeBlockHandle>();
    render(
      <CodeBlock
        ref={ref}
        value={CODE}
        lang="ts"
        maxLines={5}
        onExpandedChange={onExpandedChange}
      />,
    );
    await waitFor(() => {
      expect(document.querySelectorAll("[data-cb-scroller] .line").length).toBe(8);
    });

    ref.current!.scrollToLine(2);

    expect(onExpandedChange).not.toHaveBeenCalled();
  });
});
