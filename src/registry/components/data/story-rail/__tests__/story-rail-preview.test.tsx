/**
 * Preview image, avatar-card fallback, refresh flow, ring tokens, muted state.
 * Invariants I4, I5, I6 (+ R4).
 *
 * jsdom never loads images, so Radix `AvatarImage` never mounts an `<img>`;
 * any `<img>` inside a tile's ring is therefore the preview itself.
 */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StoryRail } from "../story-rail";
import type { StoryRailItem } from "../types";

vi.mock("embla-carousel-react", () => ({
  default: () => [() => {}, null],
}));

const withPreview = (extra: Partial<StoryRailItem> = {}): StoryRailItem => ({
  id: "a",
  username: "ada",
  hasUnread: true,
  previewImage: "https://cdn.test/a.jpg",
  ...extra,
});

const ring = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="story-rail-ring"]')!;
const previewImg = (container: HTMLElement) => ring(container).querySelector("img");
const avatarCard = (container: HTMLElement) =>
  container.querySelector('[data-slot="story-rail-avatar-card"]');

describe("I4: preview fallback", () => {
  it("I4: no previewImage renders the avatar card and no <img> in the ring", () => {
    const { container } = render(
      <StoryRail defaultItems={[withPreview({ previewImage: undefined })]} />,
    );
    expect(avatarCard(container)).not.toBeNull();
    expect(previewImg(container)).toBeNull();
    expect(container.querySelector('img[src=""]')).toBeNull();
  });

  it("I4: avatar card shows the initials fallback", () => {
    const { container } = render(
      <StoryRail defaultItems={[withPreview({ previewImage: undefined, username: "ada lovelace" })]} />,
    );
    expect(avatarCard(container)).toHaveTextContent("AL");
  });

  it("I4: a preview renders an <img> and no avatar card", () => {
    const { container } = render(<StoryRail defaultItems={[withPreview()]} />);
    expect(previewImg(container)).toHaveAttribute("src", "https://cdn.test/a.jpg");
    expect(avatarCard(container)).toBeNull();
  });

  it("I4: error -> onPreviewError(item) once -> <img src> becomes the resolved URL", async () => {
    const onPreviewError = vi.fn().mockResolvedValue("https://cdn.test/fresh.jpg");
    const item = withPreview();
    const { container } = render(
      <StoryRail defaultItems={[item]} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    expect(onPreviewError).toHaveBeenCalledTimes(1);
    expect(onPreviewError.mock.calls[0][0]).toMatchObject({ id: "a" });
    await waitFor(() =>
      expect(previewImg(container)).toHaveAttribute("src", "https://cdn.test/fresh.jpg"),
    );
    expect(avatarCard(container)).toBeNull();
  });

  it("I4: the avatar card covers the refresh wait (no broken <img> while pending)", () => {
    const onPreviewError = vi.fn(() => new Promise<string | void>(() => {}));
    const { container } = render(
      <StoryRail defaultItems={[withPreview()]} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    expect(previewImg(container)).toBeNull();
    expect(avatarCard(container)).not.toBeNull();
  });

  it("I4: a second error after the retry falls back to the avatar card (no second refresh)", async () => {
    const onPreviewError = vi.fn().mockResolvedValue("https://cdn.test/fresh.jpg");
    const { container } = render(
      <StoryRail defaultItems={[withPreview()]} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    await waitFor(() =>
      expect(previewImg(container)).toHaveAttribute("src", "https://cdn.test/fresh.jpg"),
    );
    fireEvent.error(previewImg(container)!);
    await waitFor(() => expect(avatarCard(container)).not.toBeNull());
    expect(previewImg(container)).toBeNull();
    expect(onPreviewError).toHaveBeenCalledTimes(1);
  });

  it("I4: onPreviewError resolving undefined falls back to the avatar card", async () => {
    const onPreviewError = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <StoryRail defaultItems={[withPreview()]} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    await waitFor(() => expect(avatarCard(container)).not.toBeNull());
    expect(previewImg(container)).toBeNull();
  });

  it("I4: onPreviewError rejecting falls back to the avatar card", async () => {
    const onPreviewError = vi.fn().mockRejectedValue(new Error("expired"));
    const { container } = render(
      <StoryRail defaultItems={[withPreview()]} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    await waitFor(() => expect(avatarCard(container)).not.toBeNull());
    expect(previewImg(container)).toBeNull();
  });

  it("I4: onPreviewError throwing synchronously falls back to the avatar card", () => {
    const onPreviewError = vi.fn(() => {
      throw new Error("boom");
    });
    const { container } = render(
      <StoryRail defaultItems={[withPreview()]} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    expect(avatarCard(container)).not.toBeNull();
  });

  it("I4: without onPreviewError an error falls straight to the avatar card", () => {
    const { container } = render(<StoryRail defaultItems={[withPreview()]} />);
    fireEvent.error(previewImg(container)!);
    expect(avatarCard(container)).not.toBeNull();
    expect(previewImg(container)).toBeNull();
  });

  it("I4: a new previewImage from the host after failure renders a fresh <img>", () => {
    const first = withPreview();
    const { container, rerender } = render(
      <StoryRail items={[first]} onItemsChange={() => {}} />,
    );
    fireEvent.error(previewImg(container)!);
    expect(avatarCard(container)).not.toBeNull();
    rerender(
      <StoryRail
        items={[{ ...first, previewImage: "https://cdn.test/new.jpg" }]}
        onItemsChange={() => {}}
      />,
    );
    expect(previewImg(container)).toHaveAttribute("src", "https://cdn.test/new.jpg");
    expect(avatarCard(container)).toBeNull();
  });

  it("I4: the retry budget resets with a new previewImage (refresh is available again)", async () => {
    const onPreviewError = vi.fn().mockResolvedValue("https://cdn.test/fresh.jpg");
    const first = withPreview();
    const { container, rerender } = render(
      <StoryRail items={[first]} onItemsChange={() => {}} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    await waitFor(() =>
      expect(previewImg(container)).toHaveAttribute("src", "https://cdn.test/fresh.jpg"),
    );
    rerender(
      <StoryRail
        items={[{ ...first, previewImage: "https://cdn.test/b.jpg" }]}
        onItemsChange={() => {}}
        onPreviewError={onPreviewError}
      />,
    );
    fireEvent.error(previewImg(container)!);
    expect(onPreviewError).toHaveBeenCalledTimes(2);
  });
});

describe("I5: preview <img> attributes", () => {
  it("I5: loading=lazy decoding=async width=80 height=112 and empty alt", () => {
    const { container } = render(<StoryRail defaultItems={[withPreview()]} />);
    const img = previewImg(container)!;
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("width", "80");
    expect(img).toHaveAttribute("height", "112");
    expect(img).toHaveAttribute("alt", "");
  });

  it("I5: srcSet and sizes are forwarded", () => {
    const { container } = render(
      <StoryRail
        defaultItems={[
          withPreview({
            previewSrcSet: "a-1x.jpg 1x, a-2x.jpg 2x",
            previewSizes: "(min-width: 600px) 120px, 80px",
          }),
        ]}
      />,
    );
    const img = previewImg(container)!;
    expect(img).toHaveAttribute("srcset", "a-1x.jpg 1x, a-2x.jpg 2x");
    expect(img).toHaveAttribute("sizes", "(min-width: 600px) 120px, 80px");
  });

  it("I5: sizes defaults to 80px when only srcSet is given", () => {
    const { container } = render(
      <StoryRail defaultItems={[withPreview({ previewSrcSet: "a-1x.jpg 1x, a-2x.jpg 2x" })]} />,
    );
    expect(previewImg(container)).toHaveAttribute("sizes", "80px");
  });

  it("I5: no srcSet -> no srcset/sizes attributes", () => {
    const { container } = render(<StoryRail defaultItems={[withPreview()]} />);
    expect(previewImg(container)).not.toHaveAttribute("srcset");
    expect(previewImg(container)).not.toHaveAttribute("sizes");
  });
});

describe("I6: ring tokens, read, muted", () => {
  it("I6: unread ring references both story-ring tokens", () => {
    const { container } = render(<StoryRail defaultItems={[withPreview()]} />);
    const r = ring(container);
    expect(r.className).toContain("from-story-ring-from");
    expect(r.className).toContain("to-story-ring-to");
    expect(r.className).not.toContain("bg-muted");
    expect(r).toHaveAttribute("data-state", "unread");
  });

  it("I6: read ring is bg-muted with no gradient tokens", () => {
    const { container } = render(
      <StoryRail defaultItems={[withPreview({ hasUnread: false })]} />,
    );
    const r = ring(container);
    expect(r.className).toContain("bg-muted");
    expect(r.className).not.toContain("from-story-ring-from");
    expect(r.className).not.toContain("opacity-60");
    expect(r).toHaveAttribute("data-state", "read");
  });

  it("I6: muted + unread -> bg-muted, opacity-60, data-state=muted", () => {
    const { container } = render(
      <StoryRail defaultItems={[withPreview({ muted: true, hasUnread: true })]} />,
    );
    const r = ring(container);
    expect(r.className).toContain("bg-muted");
    expect(r.className).toContain("opacity-60");
    expect(r.className).not.toContain("from-story-ring-from");
    expect(r).toHaveAttribute("data-state", "muted");
  });

  it("I6: muted also dims the username row", () => {
    render(<StoryRail defaultItems={[withPreview({ muted: true })]} />);
    const name = screen.getByText("ada");
    expect(name.parentElement!.className).toContain("opacity-60");
  });

  it("I6: default aria name for muted is '{username}, muted'", () => {
    render(<StoryRail defaultItems={[withPreview({ muted: true })]} />);
    expect(screen.getByRole("button", { name: "ada, muted" })).toBeInTheDocument();
  });

  it("I6: a custom thumbnailAriaLabel receives the item with muted: true and its return is the accessible name", () => {
    const thumbnailAriaLabel = vi.fn((item: StoryRailItem) =>
      item.muted ? `${item.username} sessiz` : `${item.username} hikaye`,
    );
    render(
      <StoryRail
        defaultItems={[withPreview({ muted: true })]}
        labels={{ thumbnailAriaLabel }}
      />,
    );
    expect(screen.getByRole("button", { name: "ada sessiz" })).toBeInTheDocument();
    expect(thumbnailAriaLabel).toHaveBeenCalledWith(expect.objectContaining({ muted: true }));
  });
});

describe("U4 review regressions: preview refresh", () => {
  it("F-C: the retry <img> after a refresh carries the fresh src and NO srcset/sizes", async () => {
    const onPreviewError = vi.fn().mockResolvedValue("https://cdn.test/fresh.jpg");
    const { container } = render(
      <StoryRail
        defaultItems={[withPreview({ previewSrcSet: "a-1x.jpg 1x, a-2x.jpg 2x" })]}
        onPreviewError={onPreviewError}
      />,
    );
    expect(previewImg(container)).toHaveAttribute("srcset");
    fireEvent.error(previewImg(container)!);
    await waitFor(() =>
      expect(previewImg(container)).toHaveAttribute("src", "https://cdn.test/fresh.jpg"),
    );
    expect(previewImg(container)).not.toHaveAttribute("srcset");
    expect(previewImg(container)).not.toHaveAttribute("sizes");
  });

  it("F-D: a host writing the refreshed URL back does not trigger another refresh", async () => {
    const onPreviewError = vi.fn().mockResolvedValue("https://cdn.test/fresh.jpg");
    const first = withPreview();
    const { container, rerender } = render(
      <StoryRail items={[first]} onItemsChange={() => {}} onPreviewError={onPreviewError} />,
    );
    fireEvent.error(previewImg(container)!);
    await waitFor(() =>
      expect(previewImg(container)).toHaveAttribute("src", "https://cdn.test/fresh.jpg"),
    );
    rerender(
      <StoryRail
        items={[{ ...first, previewImage: "https://cdn.test/fresh.jpg" }]}
        onItemsChange={() => {}}
        onPreviewError={onPreviewError}
      />,
    );
    fireEvent.error(previewImg(container)!);
    expect(onPreviewError).toHaveBeenCalledTimes(1);
    expect(avatarCard(container)).not.toBeNull();
    expect(previewImg(container)).toBeNull();
  });

  it("F-E: two error events on the same img before the promise resolves call onPreviewError once", () => {
    const onPreviewError = vi.fn(() => new Promise<string | void>(() => {}));
    const { container } = render(
      <StoryRail defaultItems={[withPreview()]} onPreviewError={onPreviewError} />,
    );
    const img = previewImg(container)!;
    act(() => {
      fireEvent.error(img);
      fireEvent.error(img);
    });
    expect(onPreviewError).toHaveBeenCalledTimes(1);
  });
});
