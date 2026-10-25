/**
 * story-viewer 0.6.0 - SV17 viewers paging, initial per-item counts, the reaction picker layer.
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type {
  Story,
  StoryItem,
  StoryViewerHandle,
  StoryViewersPage,
  ViewerListItem,
} from "../types";

const item = (id: string, extra: Partial<StoryItem> = {}): StoryItem => ({
  id,
  type: "image",
  src: `${id}.jpg`,
  ...extra,
});
const story = (id: string, items: StoryItem[], extra: Partial<Story> = {}): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
  ...extra,
});
const viewerOf = (n: number): ViewerListItem => ({ id: `v${n}`, name: `Viewer ${n}` });

// jsdom lacks what the Radix popover (reaction picker) needs.
const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
const originalRO = globalThis.ResizeObserver;
beforeEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
  class StubResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.hasPointerCapture = () => false;
  proto.scrollIntoView = () => {};
});
afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalRO;
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

const flush = () => act(async () => {});
const handle = createRef<StoryViewerHandle>();
const goToItem = (index: number) => act(() => handle.current!.goToItem(index));

function mountOwner(
  stories: Story[],
  onLoadViewers: (itemId: string, cursor: string | null) => Promise<StoryViewersPage>,
  extra: Record<string, unknown> = {},
) {
  return render(
    <StoryViewer
      ref={handle}
      stories={stories}
      isOpen
      initialStoryIndex={0}
      onClose={() => {}}
      disableStoryTransition
      viewerMode="owner"
      onLoadViewers={onLoadViewers}
      {...extra}
    />,
  );
}
const chip = () => document.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
const openList = async () => {
  fireEvent.click(chip());
  await flush();
};

describe("SV17: viewers list paging", () => {
  it("loads the first page with (itemId, null), shows a loading state, then the rows", async () => {
    let resolve!: (p: StoryViewersPage) => void;
    const onLoadViewers = vi.fn(
      () => new Promise<StoryViewersPage>((r) => (resolve = r)),
    );
    mountOwner([story("s1", [item("i1")])], onLoadViewers);
    fireEvent.click(chip());
    expect(onLoadViewers).toHaveBeenCalledWith("i1", null);
    expect(screen.getByText("Loading viewers…")).toBeInTheDocument();
    await act(async () => resolve({ items: [viewerOf(1), viewerOf(2)], nextCursor: null }));
    expect(screen.getByText("Viewer 1")).toBeInTheDocument();
    expect(screen.queryByText("Loading viewers…")).toBeNull();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("Load more passes the previous nextCursor and appends; it disappears on the last page", async () => {
    const onLoadViewers = vi.fn(async (_id: string, cursor: string | null) =>
      cursor === null
        ? { items: [viewerOf(1)], nextCursor: "c2" }
        : { items: [viewerOf(2)], nextCursor: null },
    );
    mountOwner([story("s1", [item("i1")])], onLoadViewers);
    await openList();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await flush();
    expect(onLoadViewers).toHaveBeenLastCalledWith("i1", "c2");
    expect(screen.getByText("Viewer 1")).toBeInTheDocument();
    expect(screen.getByText("Viewer 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("a rejection shows an error row with Retry (no swallowed errors); Retry repeats the call", async () => {
    const onLoadViewers = vi
      .fn<(id: string, cursor: string | null) => Promise<StoryViewersPage>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ items: [viewerOf(1)], nextCursor: null });
    mountOwner([story("s1", [item("i1")])], onLoadViewers);
    await openList();
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load viewers.");
    expect(screen.queryByText("No viewers yet.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await flush();
    expect(onLoadViewers).toHaveBeenCalledTimes(2);
    expect(onLoadViewers).toHaveBeenLastCalledWith("i1", null);
    expect(screen.getByText("Viewer 1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a failed next page keeps the loaded rows and Retry repeats THAT cursor", async () => {
    const onLoadViewers = vi
      .fn<(id: string, cursor: string | null) => Promise<StoryViewersPage>>()
      .mockResolvedValueOnce({ items: [viewerOf(1)], nextCursor: "c2" })
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ items: [viewerOf(2)], nextCursor: null });
    mountOwner([story("s1", [item("i1")])], onLoadViewers);
    await openList();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await flush();
    expect(screen.getByText("Viewer 1")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await flush();
    expect(onLoadViewers).toHaveBeenLastCalledWith("i1", "c2");
    expect(screen.getByText("Viewer 2")).toBeInTheDocument();
  });

  it("every string goes through labels", async () => {
    const onLoadViewers = vi
      .fn<(id: string, cursor: string | null) => Promise<StoryViewersPage>>()
      .mockResolvedValueOnce({ items: [viewerOf(1)], nextCursor: "c2" })
      .mockRejectedValueOnce(new Error("boom"));
    mountOwner([story("s1", [item("i1")])], onLoadViewers, {
      labels: {
        viewersLoadMore: "Daha fazla",
        viewersRetry: "Tekrar dene",
        viewersError: "Yuklenemedi",
        viewersLoading: "Yukleniyor",
      },
    });
    await openList();
    fireEvent.click(screen.getByRole("button", { name: "Daha fazla" }));
    await flush();
    expect(screen.getByRole("alert")).toHaveTextContent("Yuklenemedi");
    expect(screen.getByRole("button", { name: "Tekrar dene" })).toBeInTheDocument();
  });

  it("an empty page shows the empty label", async () => {
    mountOwner(
      [story("s1", [item("i1")])],
      async () => ({ items: [], nextCursor: null }),
      { labels: { viewersEmpty: "Nobody" } },
    );
    await openList();
    expect(screen.getByText("Nobody")).toBeInTheDocument();
  });

  it("the list resets when the current item changes and loads that item's viewers", async () => {
    const onLoadViewers = vi.fn(async (id: string) => ({
      items: [{ id: `v-${id}`, name: `Viewer of ${id}` }],
      nextCursor: null,
    }));
    mountOwner([story("s1", [item("i1"), item("i2")])], onLoadViewers);
    await openList();
    expect(screen.getByText("Viewer of i1")).toBeInTheDocument();
    goToItem(1);
    await flush();
    expect(screen.queryByText("Viewer of i1")).toBeNull();
    expect(chip().getAttribute("aria-expanded")).toBe("false");
    await openList();
    expect(onLoadViewers).toHaveBeenLastCalledWith("i2", null);
    expect(screen.getByText("Viewer of i2")).toBeInTheDocument();
  });

  it("a response that lands after the item changed is dropped", async () => {
    let resolveFirst!: (p: StoryViewersPage) => void;
    const onLoadViewers = vi
      .fn<(id: string, cursor: string | null) => Promise<StoryViewersPage>>()
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce({ items: [viewerOf(2)], nextCursor: null });
    mountOwner([story("s1", [item("i1"), item("i2")])], onLoadViewers);
    fireEvent.click(chip());
    goToItem(1);
    await flush();
    await act(async () => resolveFirst({ items: [viewerOf(1)], nextCursor: null }));
    await openList();
    expect(screen.queryByText("Viewer 1")).toBeNull();
    expect(screen.getByText("Viewer 2")).toBeInTheDocument();
  });
});

describe("viewerCount on Story and StoryItem", () => {
  const chipLabel = () => chip().getAttribute("aria-label");
  it("owner mode shows the current item's count; the story's is the fallback", async () => {
    mountOwner(
      [story("s1", [item("i1", { viewerCount: 5 }), item("i2")], { viewerCount: 40 })],
      async () => ({ items: [], nextCursor: null }),
    );
    expect(chipLabel()).toContain("5 views");
    goToItem(1);
    await flush();
    expect(chipLabel()).toContain("40 views");
  });

  it("null renders no number and no count in the accessible name", () => {
    mountOwner(
      [story("s1", [item("i1", { viewerCount: null })], { viewerCount: 40 })],
      async () => ({ items: [], nextCursor: null }),
    );
    expect(chipLabel()).not.toMatch(/\d+ views/);
    expect(chip().textContent).not.toMatch(/\b40\b/);
    expect(chip().querySelector(".font-semibold")).toBeNull();
  });
});

describe("initial per-item counts (StoryItem.engagement)", () => {
  function mountViewer(items: StoryItem[], extra: Record<string, unknown> = {}) {
    return render(
      <StoryViewer
        stories={[story("s1", items)]}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
        viewerMode="viewer"
        currentUser={{ id: "me", name: "Me" }}
        {...extra}
      />,
    );
  }
  const column = () => document.querySelector<HTMLElement>('[class*="end-3"]')!;
  const expand = () => fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);

  it("renders the seeded like / comment counts; a toggle applies on top", () => {
    const onLikeStory = vi.fn();
    mountViewer([item("i1", { engagement: { likeCount: 12, replyCount: 3 } })], { onLikeStory });
    expand();
    const likeBtn = column().querySelector<HTMLButtonElement>('button[aria-pressed]')!;
    expect(column().textContent).toContain("12");
    expect(column().textContent).toContain("3");
    fireEvent.click(likeBtn);
    expect(onLikeStory).toHaveBeenCalledWith("s1", "i1", true);
    expect(column().textContent).toContain("13");
  });

  it("a seeded liked state starts liked", () => {
    mountViewer([item("i1", { engagement: { likeCount: 2, liked: true } })]);
    expand();
    expect(column().querySelector('button[aria-pressed="true"]')).not.toBeNull();
  });

  it("null renders no like number", () => {
    mountViewer([item("i1", { engagement: { likeCount: null } })]);
    expand();
    expect(column().textContent).not.toMatch(/\d/);
  });

  it("without a seed nothing changes (the 0.5.x defaults)", () => {
    mountViewer([item("i1")]);
    expand();
    expect(column().textContent).toBe("Like0CommentShare");
  });
});

describe("the reaction picker is a layer", () => {
  const kinds = [{ key: "love", icon: "L", label: "Love" }];
  const isPausedUi = () => !!document.querySelector('[aria-label="Play"]');

  it("the story pauses while the picker is open and resumes when it closes", async () => {
    render(
      <StoryViewer
        stories={[story("s1", [item("i1")])]}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
        viewerMode="viewer"
        currentUser={{ id: "me", name: "Me" }}
        reactionKinds={kinds}
      />,
    );
    fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
    expect(isPausedUi()).toBe(false);
    const trigger = screen.getByRole("button", { name: "React" });
    fireEvent.click(trigger);
    await flush();
    expect(screen.getByRole("group", { name: "Pick a reaction" })).toBeInTheDocument();
    expect(isPausedUi()).toBe(true);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await flush();
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull();
    expect(isPausedUi()).toBe(false);
  });
});

describe("viewer count follows `locale`", () => {
  it("locale=\"tr\" groups the count (12.345) in the chip and its name", () => {
    mountOwner([story("s1", [item("i1", { viewerCount: 12345 })])], vi.fn(), { locale: "tr" });
    const expected = new Intl.NumberFormat("tr").format(12345);
    expect(chip().textContent).toContain(expected);
    expect(chip().getAttribute("aria-label") ?? "").toContain(expected);
  });
});
