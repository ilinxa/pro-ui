/**
 * The demo is the first thing a consumer copies from: every tab must mount without a React
 * error, and the 0.6.0 surfaces it advertises (controlled post + rollback, reactions, header
 * slots, Turkish, RTL, cursor paging) must actually be there.
 */
import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockIntersectionObserver, mockMatchMedia } from "../../../../../../tests/helpers";
import PostCardDemo from "../demo";
import { installDomStubs } from "./support";

let restore: () => void;
let restoreMedia: () => void;
let restoreObserver: () => void;
beforeEach(() => {
  restore = installDomStubs();
  restoreMedia = mockMatchMedia();
  restoreObserver = mockIntersectionObserver();
});
afterEach(() => {
  vi.useRealTimers();
  restoreObserver();
  restoreMedia();
  restore();
});

describe("demo", () => {
  it("mounts every tab under StrictMode without a React error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <StrictMode>
        <PostCardDemo />
      </StrictMode>,
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThanOrEqual(18);
    for (const tab of tabs) {
      await user.click(tab);
      expect(screen.getAllByRole("tabpanel").length).toBeGreaterThan(0);
    }
    const reactErrors = error.mock.calls.filter((c) => /Warning|Error:|act\(/.test(String(c[0])));
    expect(reactErrors).toEqual([]);
    error.mockRestore();
  }, 60_000);

  it("the RTL tab renders inside dir=rtl lang=ar with Arabic text", async () => {
    const user = userEvent.setup();
    const { container } = render(<PostCardDemo />);
    await user.click(screen.getByRole("tab", { name: "RTL" }));
    expect(container.querySelector('[dir="rtl"][lang="ar"]')).not.toBeNull();
    expect(screen.getAllByText(/قضينا نهاية الأسبوع/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "إجراءات المنشور" }).length).toBeGreaterThan(0);
  });

  it("the controlled tab shows the like at once and rolls it back when the request is rejected", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(<PostCardDemo />);
    await user.click(screen.getByRole("tab", { name: "Controlled" }));
    const like = () => screen.getByRole("button", { name: /^(Like|Unlike)/ });
    expect(like()).toHaveAccessibleName("Like 384");
    await user.click(screen.getByRole("checkbox"));
    fireEvent.click(like());
    expect(like()).toHaveAccessibleName("Unlike 385");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(like()).toHaveAccessibleName("Like 384");
  });

  it("the controlled tab reports an accepted like and keeps it once the host adopts it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(<PostCardDemo />);
    await user.click(screen.getByRole("tab", { name: "Controlled" }));
    fireEvent.click(screen.getByRole("button", { name: /^Like/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.getByRole("button", { name: /^Unlike/ })).toHaveAccessibleName("Unlike 385");
    expect(screen.getByText(/last change\s+{"kind":"like","liked":true}/)).toBeInTheDocument();
  });

  it("the header tab shows the author link, the subtitle and the notice, and keeps the hidden item out", async () => {
    const user = userEvent.setup();
    render(<PostCardDemo />);
    await user.click(screen.getByRole("tab", { name: "Header" }));
    expect(screen.getAllByRole("link").some((l) => l.getAttribute("href")?.startsWith("/people/"))).toBe(true);
    expect(screen.getByText("Community manager")).toBeInTheDocument();
    expect(screen.getByText("This post is under review.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(await screen.findByRole("menuitem", { name: "Boost post" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Internal note" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
  });
});
