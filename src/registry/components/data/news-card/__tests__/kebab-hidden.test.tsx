/**
 * 0.4.5 — the kebab honours comment-thread 0.4.0's `CommentMenuItem.hidden`.
 */
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { NewsKebab } from "../parts/news-kebab";
import { NewsCard } from "../news-card";
import type { NewsCardHandle, NewsCardItem } from "../types";

const ITEM: NewsCardItem = {
  id: "n1",
  title: "Headline",
  image: "https://example.test/i.jpg",
  excerpt: "Body",
  date: "2026-10-01T10:00:00Z",
};

describe("NewsKebab hidden items", () => {
  it("leaves hidden items out of the open menu", () => {
    render(
      <NewsKebab
        open
        onOpenChange={() => {}}
        items={[
          { label: "Share", onClick: () => {} },
          { label: "Feature", onClick: () => {}, hidden: true },
          { label: "Report", onClick: () => {}, destructive: true },
        ]}
      />,
    );
    expect(screen.getByRole("menuitem", { name: "Share" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Report" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Feature" })).toBeNull();
  });

  it("renders no trigger when every item is hidden", () => {
    render(
      <NewsKebab
        triggerAriaLabel="More"
        items={[{ label: "Feature", onClick: () => {}, hidden: true }]}
      />,
    );
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  });

  it("a card whose kebab items are all hidden renders no kebab, and the list row keeps its arrow", () => {
    const { container } = render(
      <NewsCard
        variant="list"
        item={ITEM}
        kebabActions={() => [{ label: "Feature", onClick: () => {}, hidden: true }]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
    expect(container.querySelector("svg.lucide-arrow-right")).not.toBeNull();
  });

  it("openKebab() does nothing while every item is hidden, and the menu does not pop open later", async () => {
    const ref = createRef<NewsCardHandle>();
    const items = (hidden: boolean) => () => [{ label: "Feature", onClick: () => {}, hidden }];
    const { rerender } = render(<NewsCard ref={ref} variant="medium" item={ITEM} kebabActions={items(true)} />);
    act(() => ref.current!.openKebab());
    rerender(<NewsCard ref={ref} variant="medium" item={ITEM} kebabActions={items(false)} />);
    expect(screen.queryByRole("menuitem", { name: "Feature" })).toBeNull();
    act(() => ref.current!.openKebab());
    expect(await screen.findByRole("menuitem", { name: "Feature" })).toBeTruthy();
  });
});
