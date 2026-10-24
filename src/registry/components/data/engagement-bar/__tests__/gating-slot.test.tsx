/** EB3 / EB4 — disabled + hidden + trailing slot; I12 stacked shape; I-neg; I1; R3 exports. */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EngagementBar } from "../engagement-bar";
import * as barrel from "../index";
import { DEFAULT_ENGAGEMENT_BAR_LABELS, defaultEngagementBarLabels } from "../types";
import type { EngagementAction, EngagementBarHandle } from "../types";
import { installDomStubs, KINDS } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => {
  vi.useRealTimers();
  restore();
});

const flush = () => act(async () => {});

describe("EB3 / I7: disabled actions", () => {
  const cases: Array<[string, (h: () => void) => EngagementAction, string, RegExp]> = [
    ["like", (h) => ({ kind: "like", count: 3, disabled: true, onToggle: h }), "button", /^Like/],
    ["bookmark", (h) => ({ kind: "bookmark", disabled: true, onToggle: h }), "button", /^Bookmark/],
    ["comment", (h) => ({ kind: "comment", count: 3, disabled: true, onClick: h }), "button", /^Comment/],
    ["share", (h) => ({ kind: "share", count: 3, disabled: true, onClick: h }), "button", /^Share/],
    [
      "custom",
      (h) => ({ kind: "custom", id: "s", label: "Star", icon: "*", disabled: true, onClick: h }),
      "button",
      /^Star/,
    ],
  ];

  for (const [label, make, role, name] of cases) {
    it(`${label}: aria-disabled, focusable, click + Enter never call the handler`, async () => {
      const user = userEvent.setup();
      const handler = vi.fn();
      render(<EngagementBar actions={[make(handler)]} />);
      const el = screen.getByRole(role, { name });
      expect(el).toHaveAttribute("aria-disabled", "true");
      expect(el).not.toBeDisabled();
      await user.tab();
      expect(el).toHaveFocus();
      await user.click(el);
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      await flush();
      expect(handler).not.toHaveBeenCalled();
    });
  }

  it("a disabled like does not change state when clicked", async () => {
    const user = userEvent.setup();
    render(<EngagementBar actions={[{ kind: "like", count: 3, disabled: true }]} />);
    await user.click(screen.getByRole("button", { name: "Like 3" }));
    expect(screen.getByRole("button", { name: "Like 3" })).toHaveAttribute("aria-pressed", "false");
  });

  it("an enabled action is NOT aria-disabled and calls its handler (control)", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<EngagementBar actions={[{ kind: "comment", count: 3, onClick: handler }]} />);
    const el = screen.getByRole("button", { name: "Comment 3" });
    expect(el).not.toHaveAttribute("aria-disabled");
    await user.click(el);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("split like: the count button is inert when disabled", async () => {
    const user = userEvent.setup();
    const onCountClick = vi.fn();
    render(<EngagementBar actions={[{ kind: "like", count: 3, disabled: true, onCountClick }]} />);
    const count = screen.getByRole("button", { name: "Show likers 3" });
    expect(count).toHaveAttribute("aria-disabled", "true");
    await user.click(count);
    expect(onCountClick).not.toHaveBeenCalled();
  });

  it("split like enabled: the count button calls onCountClick (control)", async () => {
    const user = userEvent.setup();
    const onCountClick = vi.fn();
    render(<EngagementBar actions={[{ kind: "like", count: 3, onCountClick }]} />);
    await user.click(screen.getByRole("button", { name: "Show likers 3" }));
    expect(onCountClick).toHaveBeenCalledTimes(1);
  });

  it("reaction: aria-disabled and the picker never opens on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EngagementBar actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9, disabled: true, onSelect }]} />);
    const trigger = screen.getByRole("button", { name: "React 9" });
    expect(trigger).toHaveAttribute("aria-disabled", "true");
    await user.click(trigger);
    await user.keyboard("{Enter}");
    await flush();
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("reaction: a long-press never opens the picker when disabled, and does when enabled (control)", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <EngagementBar actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9, disabled: true }]} />,
    );
    const press = () => {
      fireEvent.pointerDown(screen.getByRole("button", { name: "React 9" }), { clientX: 0, clientY: 0, pointerId: 1 });
      act(() => {
        vi.advanceTimersByTime(400);
      });
    };
    press();
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull();
    rerender(<EngagementBar actions={[{ kind: "reaction", kinds: KINDS, totalCount: 9 }]} />);
    press();
    expect(screen.getByRole("group", { name: "Pick a reaction" })).toBeInTheDocument();
  });
});

describe("EB3 / I7: handle methods respect the gate", () => {
  const handleCases: Array<[string, { disabled?: boolean; hidden?: boolean }]> = [
    ["disabled", { disabled: true }],
    ["hidden", { hidden: true }],
  ];

  for (const [label, gate] of handleCases) {
    it(`triggerLike / triggerBookmark / triggerReaction are no-ops on a ${label} action`, async () => {
      const ref = createRef<EngagementBarHandle>();
      const onLike = vi.fn();
      const onBookmark = vi.fn();
      const onSelect = vi.fn();
      render(
        <EngagementBar
          ref={ref}
          actions={[
            { kind: "like", count: 1, onToggle: onLike, ...gate },
            { kind: "bookmark", onToggle: onBookmark, ...gate },
            { kind: "reaction", kinds: KINDS, totalCount: 9, onSelect, ...gate },
            { kind: "comment", count: 1 },
          ]}
        />,
      );
      act(() => {
        ref.current!.triggerLike();
        ref.current!.triggerBookmark();
        ref.current!.triggerReaction("love");
      });
      await flush();
      expect(onLike).not.toHaveBeenCalled();
      expect(onBookmark).not.toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
      expect(ref.current!.getCurrentState().liked).toBe(false);
      expect(ref.current!.getCurrentState().bookmarked).toBe(false);
      expect(ref.current!.getCurrentReaction()).toBeNull();
    });
  }

  it("the same handle methods DO fire on an ungated action (control)", async () => {
    const ref = createRef<EngagementBarHandle>();
    const onLike = vi.fn();
    const onBookmark = vi.fn();
    const onSelect = vi.fn();
    render(
      <EngagementBar
        ref={ref}
        actions={[
          { kind: "like", count: 1, onToggle: onLike },
          { kind: "bookmark", onToggle: onBookmark },
          { kind: "reaction", kinds: KINDS, totalCount: 9, onSelect },
        ]}
      />,
    );
    act(() => {
      ref.current!.triggerLike();
      ref.current!.triggerBookmark();
      ref.current!.triggerReaction("love");
    });
    await flush();
    expect(onLike).toHaveBeenCalledWith(true);
    expect(onBookmark).toHaveBeenCalledWith(true);
    expect(onSelect).toHaveBeenCalledWith("love");
  });
});

describe("EB3: hidden actions", () => {
  it("a hidden action renders nothing", () => {
    render(
      <EngagementBar
        actions={[
          { kind: "like", count: 1, hidden: true },
          { kind: "comment", count: 1 },
        ]}
      />,
    );
    expect(screen.queryByRole("button", { name: /^Like/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Comment 1" })).toBeInTheDocument();
  });

  it("all actions hidden and no trailing renders null", () => {
    const { container } = render(
      <EngagementBar actions={[{ kind: "like", hidden: true }, { kind: "comment", hidden: true }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("all actions hidden but a trailing node renders the trailing node", () => {
    render(
      <EngagementBar actions={[{ kind: "like", hidden: true }]} trailing={<button type="button">Report</button>} />,
    );
    expect(screen.getByRole("button", { name: "Report" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Like/ })).toBeNull();
  });
});

describe("EB4 / I8: trailing slot", () => {
  const trailing = <button type="button">Report</button>;

  it("renders inside the row, after the end-aligned actions, last in DOM order", () => {
    const { container } = render(
      <EngagementBar
        actions={[{ kind: "like", count: 1 }, { kind: "bookmark" }, { kind: "view-count", count: 5 }]}
        trailing={trailing}
      />,
    );
    const report = screen.getByRole("button", { name: "Report" });
    const buttons = screen.getAllByRole("button");
    expect(buttons[buttons.length - 1]).toBe(report);
    // Same group as the end-aligned bookmark, and the row contains it.
    const bookmark = screen.getByRole("button", { name: "Bookmark" });
    expect(report.parentElement).toBe(bookmark.parentElement);
    const root = container.firstElementChild!;
    expect(root.contains(report)).toBe(true);
    // After the end actions, not before them.
    expect(bookmark.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("group", { name: "Views 5" }).compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("Tab reaches it after the bookmark", async () => {
    const user = userEvent.setup();
    render(<EngagementBar actions={[{ kind: "like", count: 1 }, { kind: "bookmark" }]} trailing={trailing} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Like 1" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Bookmark" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Report" })).toHaveFocus();
  });

  it("trailing is rendered when the row has no end-aligned actions", () => {
    render(<EngagementBar actions={[{ kind: "like", count: 1 }]} trailing={trailing} />);
    expect(screen.getByRole("button", { name: "Report" })).toBeInTheDocument();
  });

  it("stacked: trailing after the last action and before likersPreview", () => {
    const { container } = render(
      <EngagementBar
        variant="stacked"
        actions={[{ kind: "like", count: 1 }, { kind: "bookmark" }]}
        trailing={trailing}
        likersPreview={<p>liked by Ada</p>}
      />,
    );
    const report = screen.getByRole("button", { name: "Report" });
    const bookmark = screen.getByRole("button", { name: "Bookmark" });
    const preview = screen.getByText("liked by Ada");
    expect(bookmark.compareDocumentPosition(report) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(report.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const kids = Array.from(container.firstElementChild!.children);
    expect(kids.indexOf(report)).toBe(2);
  });
});

describe("I12: stacked variant shape", () => {
  it("root div has exactly one child element per visible action, then the previews", () => {
    const { container } = render(
      <EngagementBar
        variant="stacked"
        actions={[
          { kind: "like", count: 1 },
          { kind: "comment", count: 2, hidden: true },
          { kind: "share", count: 3 },
          { kind: "bookmark" },
          { kind: "view-count", count: 4 },
          { kind: "reaction", kinds: KINDS, totalCount: 9 },
        ]}
        likersPreview={<p>likers</p>}
        reactionsPreview={<p>reactors</p>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("DIV");
    const kids = Array.from(root.children);
    // 5 visible actions + 2 preview wrappers.
    expect(kids).toHaveLength(7);
    expect(kids[0]).toHaveAccessibleName("Like 1");
    expect(kids[1]).toHaveAccessibleName("Share 3");
    expect(kids[2]).toHaveAccessibleName("Bookmark");
    expect(kids[3]).toHaveAccessibleName("Views 4");
    expect(kids[4]).toHaveAccessibleName("React 9");
    expect(kids[5]).toHaveTextContent("likers");
    expect(kids[6]).toHaveTextContent("reactors");
  });

  it("stacked split like keeps ONE wrapper child (heart + count inside)", () => {
    const { container } = render(
      <EngagementBar variant="stacked" actions={[{ kind: "like", count: 1, onCountClick: () => {} }, { kind: "bookmark" }]} />,
    );
    expect(container.firstElementChild!.children).toHaveLength(2);
  });
});

describe("I-neg / I1 / R3", () => {
  it("renders with no subscribe, labels or locale", () => {
    render(<EngagementBar actions={[{ kind: "like", count: 1 }, { kind: "comment", count: 2 }]} />);
    expect(screen.getByRole("button", { name: "Like 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comment 2" })).toBeInTheDocument();
  });

  it("actions=[] renders null", () => {
    const { container } = render(<EngagementBar actions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("deprecated DEFAULT_ENGAGEMENT_BAR_LABELS is the same object as defaultEngagementBarLabels", () => {
    expect(DEFAULT_ENGAGEMENT_BAR_LABELS).toBe(defaultEngagementBarLabels);
    expect(barrel.DEFAULT_ENGAGEMENT_BAR_LABELS).toBe(barrel.defaultEngagementBarLabels);
  });

  it("labels={{ like: undefined }} keeps the default 'Like'", () => {
    render(<EngagementBar actions={[{ kind: "like", count: 1 }]} labels={{ like: undefined }} />);
    expect(screen.getByRole("button", { name: "Like 1" })).toBeInTheDocument();
  });

  it("labels override every action name", () => {
    render(
      <EngagementBar
        actions={[
          { kind: "like", count: 1, liked: true },
          { kind: "comment", count: 2 },
          { kind: "share", count: 3 },
          { kind: "bookmark", bookmarked: true },
          { kind: "view-count", count: 4 },
        ]}
        labels={{ unlike: "Geri al", comment: "Yorum", share: "Paylas", unbookmark: "Kaydi kaldir", viewCount: "Goruntulenme" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Geri al 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yorum 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paylas 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kaydi kaldir" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Goruntulenme 4" })).toBeInTheDocument();
  });

  it("R3: index exports ReactionPicker and ReactionAction", () => {
    expect(barrel.ReactionPicker).toBeDefined();
    expect(barrel.ReactionAction).toBeDefined();
  });

  it("R3: the exported ReactionAction and ReactionPicker render standalone", () => {
    const state = {
      liked: false,
      likeCount: null,
      commentCount: null,
      shareCount: null,
      viewCount: null,
      bookmarked: false,
      reactionCounts: { love: 5, laugh: 3, wow: null },
      reactionTotalCount: 8,
      viewerReaction: null,
    };
    const { unmount } = render(
      <barrel.ReactionAction
        action={{ kind: "reaction", kinds: KINDS, totalCount: 8 }}
        variant="default"
        state={state}
        onSelect={() => {}}
        format={String}
        labels={defaultEngagementBarLabels}
      />,
    );
    expect(screen.getByRole("button", { name: "React 8" })).toBeInTheDocument();
    unmount();
    render(
      <barrel.ReactionPicker
        kinds={KINDS}
        mergedCounts={{ love: 5, laugh: 3, wow: null }}
        viewerReaction={null}
        onSelect={() => {}}
        labels={defaultEngagementBarLabels}
      />,
    );
    expect(screen.getByRole("group", { name: "Pick a reaction" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Love 5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wow" })).toBeInTheDocument();
  });

  it("I1: reset() drops optimistic overlays and re-seeds from props", async () => {
    const ref = createRef<EngagementBarHandle>();
    const user = userEvent.setup();
    render(<EngagementBar ref={ref} actions={[{ kind: "like", count: 12 }]} />);
    await user.click(screen.getByRole("button", { name: "Like 12" }));
    expect(screen.getByRole("button", { name: "Unlike 13" })).toBeInTheDocument();
    act(() => ref.current!.reset());
    expect(screen.getByRole("button", { name: "Like 12" })).toBeInTheDocument();
  });
});
