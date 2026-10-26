/**
 * PC2: `reactions`. The default actions swap the like for a reaction action; double-tap on the
 * media applies `defaultKind` when the viewer has no reaction yet and only bursts when one is set.
 */
import { createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { EngagementAction } from "../../engagement-bar/types";
import type { PostCardHandle, PostCardProps, PostReactions } from "../types";
import { card, installDomStubs, KINDS, makePost } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

/** Deterministic double-tap: a media slot button that fires the wired trigger. */
const renderMedia: NonNullable<PostCardProps["renderMedia"]> = (_media, helpers) => (
  <button type="button" data-testid="media" onClick={() => helpers.onDoubleTap?.()}>
    media
  </button>
);
const withMedia = makePost({ media: [{ id: "m1", type: "image", url: "https://x.test/a.jpg", alt: "a" }] });
const burst = (c: HTMLElement) => c.querySelectorAll(".engagement-heart-burst-icon");
const tap = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTestId("media"));
    await Promise.resolve();
  });
};

/** The host adopts every pick, the way a controlled reaction is meant to be used. */
function Host({
  onReact,
  defaultKind,
  extra,
  initial = null,
}: {
  onReact: PostReactions["onReact"];
  defaultKind?: string;
  extra?: Partial<PostCardProps>;
  initial?: string | null;
}) {
  const [viewerReaction, setViewerReaction] = useState<string | null>(initial);
  return card({
    post: withMedia,
    renderMedia,
    reactions: {
      kinds: KINDS,
      totalCount: 8,
      viewerReaction,
      defaultKind,
      onReact: (id, kind) => {
        setViewerReaction(kind);
        return onReact?.(id, kind);
      },
    },
    ...extra,
  });
}

describe("reaction-only double-tap (no onLike)", () => {
  it("applies defaultKind and bursts once", async () => {
    const onReact = vi.fn();
    const { container } = render(<Host onReact={onReact} defaultKind="laugh" />);
    await tap();
    expect(onReact).toHaveBeenCalledTimes(1);
    expect(onReact).toHaveBeenCalledWith("p1", "laugh");
    expect(burst(container)).toHaveLength(1);
  });

  it("falls back to the first kind when defaultKind is absent", async () => {
    const onReact = vi.fn();
    render(<Host onReact={onReact} />);
    await tap();
    expect(onReact).toHaveBeenCalledWith("p1", "love");
  });

  it("falls back to the first kind when defaultKind is not in the catalog", async () => {
    const onReact = vi.fn();
    render(<Host onReact={onReact} defaultKind="nope" />);
    await tap();
    expect(onReact).toHaveBeenCalledWith("p1", "love");
  });

  it("a second double-tap with a reaction set only bursts: no change is requested", async () => {
    const onReact = vi.fn();
    const { container } = render(<Host onReact={onReact} defaultKind="laugh" />);
    await tap();
    await tap();
    expect(onReact).toHaveBeenCalledTimes(1);
    expect(burst(container)).toHaveLength(1);
  });

  it("never clears a reaction the viewer already had", async () => {
    const onReact = vi.fn();
    const { container } = render(<Host onReact={onReact} defaultKind="love" initial="laugh" />);
    await tap();
    expect(onReact).not.toHaveBeenCalled();
    expect(burst(container)).toHaveLength(1);
  });

  it("does nothing when the actions slot left the reaction out", async () => {
    const onReact = vi.fn();
    const { container } = render(
      <Host onReact={onReact} extra={{ engagementActions: () => [{ kind: "comment", count: 0 }] }} />,
    );
    await tap();
    expect(onReact).not.toHaveBeenCalled();
    expect(burst(container)).toHaveLength(0);
  });

  it("does nothing under a renderEngagementBar takeover", async () => {
    const onReact = vi.fn();
    const { container } = render(
      <Host onReact={onReact} extra={{ renderEngagementBar: () => <div>custom bar</div> }} />,
    );
    await tap();
    expect(onReact).not.toHaveBeenCalled();
    expect(burst(container)).toHaveLength(0);
  });

  it.each([
    ["disabled", { disabled: true }],
    ["hidden", { hidden: true }],
  ] as const)("does nothing when the reaction action is %s", async (_name, gate) => {
    const onReact = vi.fn();
    const slot = (): EngagementAction[] => [{ kind: "reaction", kinds: KINDS, viewerReaction: null, ...gate }];
    const { container } = render(<Host onReact={onReact} extra={{ engagementActions: slot }} />);
    await tap();
    expect(onReact).not.toHaveBeenCalled();
    expect(burst(container)).toHaveLength(0);
  });

  it("is not wired without onLike or reactions.onReact", async () => {
    const { container } = render(
      card({
        post: withMedia,
        renderMedia,
        reactions: { kinds: KINDS, viewerReaction: null },
      }),
    );
    await tap();
    expect(burst(container)).toHaveLength(0);
  });
});

describe("default actions with reactions", () => {
  it("replaces the like with a reaction trigger carrying the total", () => {
    render(card({ reactions: { kinds: KINDS, totalCount: 8, viewerReaction: null, onReact: vi.fn() } }));
    expect(screen.queryByRole("button", { name: /^Like/ })).toBeNull();
    expect(screen.getByRole("button", { name: "React 8" })).toBeInTheDocument();
  });

  it("merges counts into the kinds and passes a pick to onReact", async () => {
    const onReact = vi.fn();
    const user = (await import("@testing-library/user-event")).default.setup();
    render(
      card({
        reactions: {
          kinds: KINDS,
          counts: { love: 1200, laugh: null },
          totalCount: 1200,
          viewerReaction: null,
          onReact,
        },
        locale: "tr",
      }),
    );
    await user.click(screen.getByRole("button", { name: /^React/ }));
    // love: tally from `counts` (compact, Turkish); laugh: withheld (`null`), so no number.
    expect(await screen.findByRole("button", { name: /^Love 1,2\sB$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Laugh" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Laugh" }));
    expect(onReact).toHaveBeenCalledWith("p1", "laugh");
  });

  it("keeps today's like when `reactions` is absent", () => {
    render(card());
    expect(screen.getByRole("button", { name: "Like 10" })).toBeInTheDocument();
  });
});

describe("handle triggerLike with reactions", () => {
  it("sets the default reaction, then clears it", async () => {
    const onReact = vi.fn();
    const ref = createRef<PostCardHandle>();
    render(<Host onReact={onReact} defaultKind="laugh" extra={{ ref }} />);
    await act(async () => {
      ref.current!.triggerLike();
      await Promise.resolve();
    });
    expect(onReact).toHaveBeenLastCalledWith("p1", "laugh");
    await act(async () => {
      ref.current!.triggerLike();
      await Promise.resolve();
    });
    expect(onReact).toHaveBeenLastCalledWith("p1", null);
  });
});
