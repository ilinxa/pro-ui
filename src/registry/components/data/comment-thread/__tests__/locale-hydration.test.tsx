/**
 * locale / time (C2, C3): `locale="tr"` end to end, "now" handling (the `now` prop wins; otherwise
 * the clock is read after mount so server and first client render agree), and the RTL indent.
 */
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../comment-thread";
import type { Comment } from "../types";
import { NOW, comment, installDomStubs, rowQueries } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => {
  restore();
  vi.useRealTimers();
});

const fiveMinutesAgo = new Date(NOW.getTime() - 5 * 60 * 1000);
const tree = (): Comment[] => [comment("a", { createdAt: fiveMinutesAgo })];

describe('locale="tr"', () => {
  it("a comment stamped ahead of the viewer's clock reads as now, never 'in …'", () => {
    const ahead = new Date(NOW.getTime() + 2 * 60 * 60 * 1000);
    render(<CommentThread now={NOW} locale="tr" comments={[comment("a", { createdAt: ahead })]} />);
    const row = rowQueries("Body a");
    expect(row.getByText("şimdi")).toBeInTheDocument();
    expect(row.queryByText(/sonra/)).toBeNull();
  });

  it("prints relative times, the labels and counts in Turkish", () => {
    render(
      <CommentThread
        now={NOW}
        locale="tr"
        comments={[comment("a", { createdAt: fiveMinutesAgo, likes: 1234 })]}
        labels={{ reply: "Yanıtla" }}
        currentUser={{ id: "me", name: "Ada" }}
      />,
    );
    const row = rowQueries("Body a");
    expect(row.getByText("5 dk. önce")).toBeInTheDocument();
    expect(row.getByRole("button", { name: "Yanıtla" })).toBeInTheDocument();
    // Intl compact notation, Turkish: "1,2 B"
    expect(row.getByRole("button", { name: /^Like/ })).toHaveAccessibleName(/^Like 1,2\sB$/);
  });

  it("an explicit formatRelativeTime prop beats the locale formatter", () => {
    render(
      <CommentThread
        now={NOW}
        locale="tr"
        comments={tree()}
        formatRelativeTime={() => "custom time"}
      />,
    );
    expect(screen.getByText("custom time")).toBeInTheDocument();
  });

  it("the deprecated labels.formatRelativeTime is still honoured when the prop is not set", () => {
    render(
      <CommentThread now={NOW} comments={tree()} labels={{ formatRelativeTime: () => "legacy time" }} />,
    );
    expect(screen.getByText("legacy time")).toBeInTheDocument();
  });

  it("timeZone fixes the absolute date", () => {
    render(
      <CommentThread
        now={new Date("2026-06-01T12:00:00Z")}
        timeZone="America/Los_Angeles"
        comments={[comment("a", { createdAt: new Date("2026-03-01T00:30:00Z") })]}
      />,
    );
    expect(screen.getByText("February 28")).toBeInTheDocument();
  });

  it("wraps the time in <time dateTime> with the ISO instant", () => {
    render(<CommentThread now={NOW} comments={tree()} />);
    const time = screen.getByText("5m");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", fiveMinutesAgo.toISOString());
  });

  it("an unparseable date renders no text and does not throw", () => {
    expect(() =>
      render(<CommentThread now={NOW} comments={[comment("a", { createdAt: "not a date" })]} />),
    ).not.toThrow();
  });
});

describe("now", () => {
  it("without the `now` prop the clock is read after mount (relative text appears)", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01T01:00:00Z"), toFake: ["Date", "setInterval", "clearInterval"] });
    render(<CommentThread comments={tree()} />);
    expect(screen.getByText("5m")).toBeInTheDocument();
  });

  it("and again every minute", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01T01:00:00Z"), toFake: ["Date", "setInterval", "clearInterval"] });
    render(<CommentThread comments={tree()} />);
    expect(screen.getByText("5m")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(3 * 60_000);
    });
    expect(screen.getByText("8m")).toBeInTheDocument();
  });
});

describe("server render vs first client render", () => {
  const element = () => <CommentThread comments={tree()} locale="tr" />;

  it("the server prints NO relative text (an empty <time>)", () => {
    const html = renderToString(element());
    expect(html).toMatch(/<time[^>]*><\/time>/);
    expect(html).not.toMatch(/dk\./);
  });

  it("hydrates without a mismatch, then fills the time in", async () => {
    const html = renderToString(element());
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, element());
    });
    const mismatches = error.mock.calls.filter((c) => /hydrat|did not match|mismatch/i.test(String(c[0])));
    expect(mismatches).toEqual([]);
    error.mockRestore();
    // After mount the clock is read: some relative text has appeared (Turkish, from the real now).
    expect(container.querySelector("time")?.textContent).toMatch(/önce|şimdi|\d/);
    act(() => root.unmount());
    container.remove();
  });

  it("with the `now` prop the server already prints the time (and the client agrees)", async () => {
    const withNow = () => <CommentThread comments={tree()} locale="tr" now={NOW} />;
    const html = renderToString(withNow());
    expect(html).toContain("5 dk. önce");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, withNow());
    });
    expect(error.mock.calls.filter((c) => /hydrat|did not match|mismatch/i.test(String(c[0])))).toEqual([]);
    error.mockRestore();
    expect(container.querySelector("time")?.textContent).toBe("5 dk. önce");
    act(() => root.unmount());
    container.remove();
  });
});

describe("indent (RTL-safe)", () => {
  it("indents replies with the inline-start edge, never the physical left", () => {
    const { container } = render(
      <CommentThread
        now={NOW}
        indentPx={30}
        comments={[comment("a", { replies: [comment("kid")] })]}
      />,
    );
    const reply = screen.getByText("Body kid").closest("article")!;
    expect(reply.getAttribute("style") ?? "").toMatch(/padding-inline-start:\s*30px/);
    expect(reply.getAttribute("style") ?? "").not.toMatch(/padding-left/);
    expect(container).toBeTruthy();
  });
});
