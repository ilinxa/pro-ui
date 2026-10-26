/**
 * 0.6.0 labels: label functions (`likersMoreLabel`, `pollTotalVotesLabel`, `pollClosesAtLabel`),
 * the list variant's meta, and `formatCount`.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostCard } from "../post-card";
import type { PostCardProps } from "../types";
import { card, installDomStubs, makePost, NOW } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const list = (props: Partial<PostCardProps> = {}) => (
  <PostCard variant="list" engagementMode="navigate" now={NOW} post={makePost()} {...props} />
);
const meta = (c: HTMLElement) => c.querySelector("span.text-xs.text-muted-foreground")!;

describe("list variant meta", () => {
  it("renders likes, comments and shares through the label functions", () => {
    const { container } = render(list({ post: makePost({ likes: 7, comments: 1, shares: 1 }) }));
    expect(container.textContent).toContain("7 likes");
    expect(container.textContent).toContain("1 comment");
    expect(container.textContent).not.toContain("1 comments");
    expect(container.textContent).toContain("1 share");
  });

  it("leaves shares out when the post has none, and separates the rest with a decorative dot", () => {
    const { container } = render(list({ post: makePost({ shares: undefined }) }));
    expect(meta(container).textContent).not.toContain("share");
    const seps = meta(container).querySelectorAll('span[aria-hidden="true"]');
    expect(seps).toHaveLength(1);
    expect(seps[0]).toHaveTextContent("·");
  });

  it("formats every count with the card's locale (compact)", () => {
    const { container } = render(
      list({ locale: "tr", post: makePost({ likes: 1200, comments: 1500, shares: 2300 }) }),
    );
    expect(container.textContent).toMatch(/1,2\sB likes/);
    expect(container.textContent).toMatch(/1,5\sB comments/);
    expect(container.textContent).toMatch(/2,3\sB shares/);
  });

  it("honours a custom formatCount", () => {
    const { container } = render(list({ formatCount: (n) => `<${n}>` }));
    expect(container.textContent).toContain("<10> likes");
  });

  it("takes listLikes / listComments / listShares, with the formatted count passed in", () => {
    const { container } = render(
      list({
        locale: "tr",
        post: makePost({ likes: 1200, comments: 3, shares: 2 }),
        labels: {
          listLikes: (_n, f) => `${f} beğeni`,
          listComments: (n) => `${n} yorum`,
          listShares: (n) => `${n} paylaşım`,
        },
      }),
    );
    expect(container.textContent).toMatch(/1,2\sB beğeni.*3 yorum.*2 paylaşım/);
  });

  it("an explicit undefined label keeps the default", () => {
    const { container } = render(list({ labels: { listLikes: undefined } }));
    expect(container.textContent).toContain("10 likes");
  });
});

describe("poll label functions", () => {
  const poll = (totalVotes: number, closesAt?: string) => ({
    options: [
      { id: "a", label: "Cats", voteCount: totalVotes },
      { id: "b", label: "Dogs", voteCount: 0 },
    ],
    totalVotes,
    closesAt,
  });

  it("pollTotalVotesLabel: singular for a count of 1", () => {
    render(card({ post: makePost({ poll: poll(1) }) }));
    expect(screen.getByText("1 vote")).toBeInTheDocument();
  });

  it("pollTotalVotesLabel: plural, and the formatted count follows the locale", () => {
    render(card({ locale: "tr", post: makePost({ poll: poll(1200) }) }));
    expect(screen.getByText(/^1,2\sB votes$/)).toBeInTheDocument();
  });

  it("pollTotalVotesLabel: a custom function gets the count and the formatted count", () => {
    render(
      card({
        locale: "tr",
        post: makePost({ poll: poll(1200) }),
        labels: { pollTotalVotesLabel: (n, f) => `${n} oy (${f})` },
      }),
    );
    expect(screen.getByText(/^1200 oy \(1,2\sB\)$/)).toBeInTheDocument();
  });

  it("pollClosesAtLabel: gets the relative time", () => {
    render(
      card({
        formatRelativeTime: () => "yarın",
        post: makePost({ poll: poll(4, "2026-03-11T12:00:00Z") }),
        labels: { pollClosesAtLabel: (t) => `Kapanış: ${t}` },
      }),
    );
    expect(screen.getByText("Kapanış: yarın")).toBeInTheDocument();
  });

  it("pollClosedLabel still applies to a closed poll", () => {
    render(card({ post: makePost({ poll: poll(4, "2026-03-09T12:00:00Z") }), labels: { pollClosedLabel: "Kapandı" } }));
    expect(screen.getByText("Kapandı")).toBeInTheDocument();
  });
});

describe("likersMoreLabel", () => {
  it("is a function of the count and its formatted text", () => {
    render(
      card({
        engagementMode: "inline",
        defaultInlinePanel: "likes",
        post: makePost({ likes: 12 }),
        likers: [{ id: "a", name: "Ayşe Kaya" }],
        onLoadMoreLikers: async () => [],
        labels: { likersMoreLabel: (n, f) => `${n}:${f} daha` },
      }),
    );
    expect(screen.getByRole("button", { name: "11:11 daha" })).toBeInTheDocument();
  });
});
