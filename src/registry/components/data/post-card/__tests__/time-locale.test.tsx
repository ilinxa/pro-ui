/**
 * PC4: `locale`, `timeZone`, `now`, `formatRelativeTime`. No relative text on the server or the
 * first client render, no clock read while rendering, Turkish text with `locale="tr"`.
 */
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { PostCard } from "../post-card";
import type { PostCardProps } from "../types";
import { card, installDomStubs, makePost, NOW } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => {
  vi.useRealTimers();
  restore();
});

const feed = (props: Partial<PostCardProps> = {}) => (
  <PostCard variant="feed" engagementMode="navigate" post={makePost()} {...props} />
);

describe("server render and hydration", () => {
  it("prints no relative text before the card knows 'now'", () => {
    const html = renderToString(feed());
    expect(html).toContain('<time dateTime="2026-03-10T09:00:00.000Z"></time>');
    expect(html).not.toMatch(/Just now|\b\d+[mhdw]\b/);
  });

  it("prints it at once when `now` is given", () => {
    const html = renderToString(feed({ now: NOW }));
    expect(html).toContain("3h</time>");
  });

  it("hydrates the server markup without a mismatch, then shows the time", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    const html = renderToString(feed());
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      hydrateRoot(container, feed(), { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector("time")).toHaveTextContent("3h");
    consoleError.mockRestore();
    container.remove();
  });

  it("agrees on the edited tooltip when a time zone is given, and leaves it out otherwise", () => {
    const post = makePost({ editedAt: "2026-03-10T10:00:00Z" });
    expect(renderToString(feed({ post }))).not.toContain("title=");
    expect(renderToString(feed({ post, timeZone: "UTC" }))).toMatch(/title="Mar 10, 2026, 10:00/);
  });
});

describe("no clock read while rendering", () => {
  it("keeps the text stable across re-renders until the minute tick", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const { rerender } = render(feed());
    expect(screen.getByText("3h")).toBeInTheDocument();

    // The wall clock moves on, but nothing re-reads it while rendering.
    vi.setSystemTime(new Date("2026-03-10T14:30:00Z"));
    rerender(feed());
    rerender(feed({ className: "x" }));
    expect(screen.getByText("3h")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("5h")).toBeInTheDocument();
  });

  it("an explicit `now` never ticks", () => {
    vi.useFakeTimers();
    render(feed({ now: NOW }));
    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.getByText("3h")).toBeInTheDocument();
  });
});

describe("English output is unchanged without locale", () => {
  const at = (iso: string) => {
    render(feed({ post: makePost({ createdAt: iso }), now: NOW }));
    return screen.getByText((_, el) => el?.tagName === "TIME" && (el.textContent ?? "") !== "");
  };
  it.each([
    ["2026-03-10T11:59:40Z", "Just now"],
    ["2026-03-10T11:55:00Z", "5m"],
    ["2026-03-10T10:00:00Z", "2h"],
    ["2026-03-07T12:00:00Z", "3d"],
    ["2026-02-24T12:00:00Z", "2w"],
    ["2026-01-05T12:00:00Z", "January 5"],
    ["2025-01-05T12:00:00Z", "January 5, 2025"],
  ])("%s -> %s", (iso, text) => {
    expect(at(iso)).toHaveTextContent(text);
  });
});

describe("locale", () => {
  it('locale="tr" prints Turkish relative text', () => {
    render(feed({ locale: "tr", now: NOW }));
    expect(screen.getByText("3 sa. önce")).toBeInTheDocument();
  });

  it('locale="tr" spells an old date out in Turkish', () => {
    render(feed({ locale: "tr", now: NOW, post: makePost({ createdAt: "2026-01-05T12:00:00Z" }) }));
    expect(screen.getByText(/5 Ocak/)).toBeInTheDocument();
  });

  it("an invalid locale falls back to English instead of throwing", () => {
    render(feed({ locale: "en_US", now: NOW }));
    expect(screen.getByText("3h")).toBeInTheDocument();
  });

  it("the edited tooltip follows locale and timeZone", () => {
    const post = makePost({ editedAt: "2026-03-10T10:00:00Z" });
    render(feed({ post, now: NOW, timeZone: "America/New_York", locale: "en" }));
    expect(screen.getByText("(edited)")).toHaveAttribute("title", expect.stringMatching(/Mar 10, 2026, 6:00/));
  });

  it("the edited tooltip is Turkish with locale=tr", () => {
    const post = makePost({ editedAt: "2026-03-10T10:00:00Z" });
    render(feed({ post, now: NOW, timeZone: "UTC", locale: "tr" }));
    expect(screen.getByText("(edited)")).toHaveAttribute("title", expect.stringMatching(/10 Mar 2026.*10:00/));
  });
});

describe("formatRelativeTime", () => {
  it("the prop wins over the deprecated label", () => {
    render(
      card({
        formatRelativeTime: () => "prop-fmt",
        labels: { formatRelativeTime: () => "label-fmt" },
      }),
    );
    expect(screen.getByText("prop-fmt")).toBeInTheDocument();
  });

  it("the deprecated label is honoured when the prop is not set", () => {
    render(card({ labels: { formatRelativeTime: () => "label-fmt" } }));
    expect(screen.getByText("label-fmt")).toBeInTheDocument();
  });
});

describe("poll uses the same 'now'", () => {
  const poll = (closesAt: string) => ({
    options: [
      { id: "a", label: "Cats", voteCount: 3 },
      { id: "b", label: "Dogs", voteCount: 1 },
    ],
    totalVotes: 4,
    closesAt,
  });

  it("closes against `now`", () => {
    render(card({ post: makePost({ poll: poll("2026-03-10T11:00:00Z") }) }));
    expect(screen.getByText("Poll closed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cats" })).toBeNull();
  });

  it("counts as open on the server render, with no countdown", () => {
    const html = renderToString(feed({ post: makePost({ poll: poll("2026-03-10T11:00:00Z") }) }));
    expect(html).not.toContain("Poll closed");
    expect(html).toContain("Cats");
  });

  it("counts down with the card's locale", () => {
    render(card({ locale: "tr", post: makePost({ poll: poll("2026-03-10T15:00:00Z") }) }));
    expect(screen.getByText(/^Closes 3 sa\. sonra$/)).toBeInTheDocument();
  });
});
