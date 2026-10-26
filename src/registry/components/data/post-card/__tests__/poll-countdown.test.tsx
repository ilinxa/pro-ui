/** A poll closing in the future reads "Closes in 3d" in English (it read "Closes Just now"). */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostCard } from "../post-card";
import type { Post } from "../types";

const NOW = new Date("2026-03-10T12:00:00Z");
const post: Post = {
  id: "p1",
  author: { id: "u1", name: "Ada" },
  content: "Pick one",
  createdAt: "2026-03-10T11:00:00Z",
  likes: 0,
  comments: 0,
  poll: {
    options: [
      { id: "a", label: "A", voteCount: 1 },
      { id: "b", label: "B", voteCount: 2 },
    ],
    totalVotes: 3,
    closesAt: new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000),
  },
};

describe("poll countdown", () => {
  it("English: a future closing time reads 'Closes in 3d'", () => {
    render(<PostCard variant="feed" post={post} now={NOW} />);
    expect(screen.getByText("Closes in 3d")).toBeTruthy();
    expect(screen.queryByText(/Just now/)).toBeNull();
  });

  it("Turkish: 'Closes' label function over the Turkish relative time", () => {
    render(
      <PostCard
        variant="feed"
        post={post}
        now={NOW}
        locale="tr"
        labels={{ pollClosesAtLabel: (t) => `Kapanış ${t}` }}
      />,
    );
    expect(screen.getByText("Kapanış 3 gün sonra")).toBeTruthy();
  });
});
