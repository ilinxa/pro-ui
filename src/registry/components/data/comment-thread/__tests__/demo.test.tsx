/**
 * The demo is the first thing a consumer copies from: every tab must mount without a React
 * error, and the new surfaces it advertises (controlled + cursor paging + replies, the
 * moderation add-on, reactions, Turkish, RTL) must actually be there.
 */
import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CommentThreadDemo from "../demo";
import { installDomStubs } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
  window.matchMedia ??= (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => restore());

describe("demo", () => {
  it("mounts every tab under StrictMode without a React error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <StrictMode>
        <CommentThreadDemo />
      </StrictMode>,
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThanOrEqual(12);
    for (const tab of tabs) {
      await user.click(tab);
      expect(screen.getAllByRole("tabpanel").length).toBeGreaterThan(0);
    }
    const reactErrors = error.mock.calls.filter((c) => /Warning|Error:|act\(/.test(String(c[0])));
    expect(reactErrors).toEqual([]);
    error.mockRestore();
    // 12 tabs clicked one by one under StrictMode: well past the 5 s default when the whole suite
    // runs in parallel (a deploy-gating run), so it gets its own budget.
  }, 30_000);

  it("the RTL tab renders inside dir=rtl with Arabic text, and the moderation tab shows its tombstone and pin", async () => {
    const user = userEvent.setup();
    const { container } = render(<CommentThreadDemo />);
    await user.click(screen.getByRole("tab", { name: "Moderation" }));
    expect(await screen.findByText("This comment was hidden")).toBeInTheDocument();
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "RTL" }));
    expect(container.querySelector('[dir="rtl"][lang="ar"]')).not.toBeNull();
    expect(await screen.findByText(/مقال رائع/)).toBeInTheDocument();
  });

  it("the controlled tab pages by cursor and loads replies on demand", async () => {
    const user = userEvent.setup();
    render(<CommentThreadDemo />);
    await user.click(screen.getByRole("tab", { name: "Controlled" }));
    expect(await screen.findByRole("button", { name: "View 3 replies" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load older comments" })).toBeInTheDocument();
  });
});
