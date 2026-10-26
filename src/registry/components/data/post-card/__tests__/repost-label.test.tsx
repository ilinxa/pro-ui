/** 0.6.0 — the quoted (repost) mini-card's link name is a label (it was hard-coded English). */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RepostOfCard } from "../parts/repost-of-card";
import type { Post } from "../types";

const original: Post = {
  id: "p0",
  author: { id: "u0", name: "Ayşe" },
  content: "Original",
  createdAt: "2026-01-01T00:00:00Z",
  likes: 0,
  comments: 0,
};

describe("RepostOfCard label", () => {
  it("names the link with the English default", () => {
    render(<RepostOfCard originalPost={original} onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Open Ayşe's post" })).toBeTruthy();
  });

  it("labels.openRepost(name) overrides it", () => {
    render(
      <RepostOfCard
        originalPost={original}
        onClick={() => {}}
        labels={{ openRepost: (name) => `${name} gönderisini aç` }}
      />,
    );
    expect(screen.getByRole("button", { name: "Ayşe gönderisini aç" })).toBeTruthy();
  });
});
