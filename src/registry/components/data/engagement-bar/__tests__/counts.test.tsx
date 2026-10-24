/** EB1 / C6 — withheld counts (I2, I3, R1, R4). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EngagementBar } from "../engagement-bar";
import type { EngagementAction, EngagementDelta } from "../types";
import { installDomStubs, makeSubscribe } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const noDigit = (el: Element) => expect(el.textContent ?? "").not.toMatch(/\d/);

const WITHHELD: Array<[string, EngagementAction, string, string]> = [
  // [label, action, role, name]
  ["like", { kind: "like", count: null }, "button", "Like"],
  ["comment", { kind: "comment", count: null }, "button", "Comment"],
  ["share", { kind: "share", count: null }, "button", "Share"],
  ["view-count", { kind: "view-count", count: null }, "group", "Views"],
  ["custom", { kind: "custom", id: "star", label: "Star", icon: "*", count: null }, "button", "Star"],
  [
    "reaction (null total)",
    { kind: "reaction", kinds: [{ key: "love", icon: "L", label: "Love", count: null }], totalCount: null },
    "button",
    "React",
  ],
];

describe("EB1: withheld counts render no digit and no count in the name", () => {
  for (const [label, action, role, name] of WITHHELD) {
    it(`I2: ${label} - count null`, () => {
      const { container } = render(<EngagementBar actions={[action]} />);
      expect(screen.getByRole(role, { name })).toHaveAccessibleName(name);
      noDigit(container);
    });
  }

  for (const [label, action, role, name] of WITHHELD) {
    it(`I2: ${label} - count omitted`, () => {
      const stripped = { ...action } as Record<string, unknown>;
      delete stripped.count;
      delete stripped.totalCount;
      if (Array.isArray(stripped.kinds)) {
        stripped.kinds = (stripped.kinds as Array<Record<string, unknown>>).map((k) => {
          const copy = { ...k };
          delete copy.count;
          return copy;
        });
      }
      const { container } = render(<EngagementBar actions={[stripped as unknown as EngagementAction]} />);
      expect(screen.getByRole(role, { name })).toHaveAccessibleName(name);
      noDigit(container);
    });
  }

  it("R4: reaction with totalCount null + a viewerReaction shows no digit and no count in the name", () => {
    const { container } = render(
      <EngagementBar
        actions={[
          {
            kind: "reaction",
            kinds: [{ key: "love", icon: "L", label: "Love", count: null }],
            totalCount: null,
            viewerReaction: "love",
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Love" })).toHaveAccessibleName("Love");
    noDigit(container);
  });

  it("I2: picker kinds with null / omitted counts render no digit and no count in their names", async () => {
    const user = userEvent.setup();
    render(
      <EngagementBar
        actions={[
          {
            kind: "reaction",
            totalCount: null,
            kinds: [
              { key: "love", icon: "L", label: "Love", count: null },
              { key: "laugh", icon: "H", label: "Laugh" },
            ],
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "React" }));
    const picker = await screen.findByRole("group", { name: "Pick a reaction" });
    expect(screen.getByRole("button", { name: "Love" })).toHaveAccessibleName("Love");
    expect(screen.getByRole("button", { name: "Laugh" })).toHaveAccessibleName("Laugh");
    noDigit(picker);
  });

  it("I2: a split like with a null count renders NO count button", () => {
    render(<EngagementBar actions={[{ kind: "like", count: null, onCountClick: () => {} }]} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Show likers/ })).toBeNull();
  });

  it("I2: a split like with a count renders a count button named with the count", () => {
    render(<EngagementBar actions={[{ kind: "like", count: 12, onCountClick: () => {} }]} />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Show likers 12" })).toBeInTheDocument();
    // The heart's own name carries no count when the count has its own button.
    expect(screen.getByRole("button", { name: "Like" })).toHaveAccessibleName("Like");
  });

  it("split reaction with a null total renders no count button", () => {
    render(
      <EngagementBar
        actions={[
          {
            kind: "reaction",
            kinds: [{ key: "love", icon: "L", label: "Love" }],
            totalCount: null,
            viewerReaction: "love",
            onCountClick: () => {},
          },
        ]}
      />,
    );
    expect(screen.queryByRole("button", { name: /Show reactions/ })).toBeNull();
  });
});

describe("EB1: counts that are known", () => {
  it("I2: count 0 renders '0' and the name 'Like 0'", () => {
    const { container } = render(<EngagementBar actions={[{ kind: "like", count: 0 }]} />);
    expect(screen.getByRole("button", { name: "Like 0" })).toBeInTheDocument();
    expect(container.textContent).toContain("0");
  });

  it("count 0 on comment / share / view-count renders '0' in the name", () => {
    render(
      <EngagementBar
        actions={[
          { kind: "comment", count: 0 },
          { kind: "share", count: 0 },
          { kind: "view-count", count: 0 },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Comment 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share 0" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Views 0" })).toBeInTheDocument();
  });

  it("I2: names carry the count: 'Like 12', 'Comment 3', 'Views 1.2K'", () => {
    render(
      <EngagementBar
        actions={[
          { kind: "like", count: 12 },
          { kind: "comment", count: 3 },
          { kind: "view-count", count: 1234 },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Like 12" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comment 3" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Views 1.2K" })).toBeInTheDocument();
  });

  it("reaction total and a custom action carry the count in their names", () => {
    render(
      <EngagementBar
        actions={[
          { kind: "reaction", kinds: [{ key: "love", icon: "L", label: "Love", count: 4 }], totalCount: 4 },
          { kind: "custom", id: "star", label: "Star", icon: "*", count: 7 },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "React 4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Star 7" })).toBeInTheDocument();
  });

  it("a reaction total of 0 with no viewer reaction shows no digit", () => {
    const { container } = render(
      <EngagementBar
        actions={[{ kind: "reaction", kinds: [{ key: "love", icon: "L", label: "Love", count: 0 }], totalCount: 0 }]}
      />,
    );
    expect(screen.getByRole("button", { name: "React" })).toBeInTheDocument();
    noDigit(container);
  });
});

describe("R1: undefined count never renders NaN", () => {
  it("{ kind: 'comment', count: undefined } renders no number", () => {
    const { container } = render(<EngagementBar actions={[{ kind: "comment", count: undefined }]} />);
    expect(container.textContent).not.toMatch(/NaN/i);
    noDigit(container);
    expect(screen.getByRole("button", { name: "Comment" })).toBeInTheDocument();
  });

  it("no action renders 'NaN' with undefined counts, in any variant", () => {
    for (const variant of ["default", "compact", "stacked"] as const) {
      const { container, unmount } = render(
        <EngagementBar
          variant={variant}
          actions={[
            { kind: "like", count: undefined },
            { kind: "comment", count: undefined },
            { kind: "share", count: undefined },
            { kind: "view-count", count: undefined },
            { kind: "custom", id: "c", label: "C", icon: "*", count: undefined },
          ]}
        />,
      );
      expect(container.textContent).not.toMatch(/NaN/i);
      unmount();
    }
  });
});

describe("I3: withheld stays withheld", () => {
  it("clicking like flips liked but reveals no digit (uncontrolled)", async () => {
    const user = userEvent.setup();
    const { container } = render(<EngagementBar actions={[{ kind: "like", count: null }]} />);
    await user.click(screen.getByRole("button", { name: "Like" }));
    expect(screen.getByRole("button", { name: "Unlike" })).toHaveAttribute("aria-pressed", "true");
    noDigit(container);
  });

  it("a like-changed delta reveals no digit (uncontrolled)", () => {
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    const { container } = render(<EngagementBar actions={[{ kind: "like", count: null }]} subscribe={subscribe} />);
    act(() => emit({ kind: "like-changed", count: 42, liked: true }));
    expect(screen.getByRole("button", { name: "Unlike" })).toBeInTheDocument();
    noDigit(container);
  });

  it("a comment-count-changed delta reveals no digit when the prop is withheld", () => {
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    const { container } = render(<EngagementBar actions={[{ kind: "comment", count: null }]} subscribe={subscribe} />);
    act(() => emit({ kind: "comment-count-changed", count: 9 }));
    noDigit(container);
  });

  it("an optimistic like on a controlled withheld count flips liked, shows no digit", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EngagementBar actions={[{ kind: "like", liked: false, count: null, onToggle: () => new Promise(() => {}) }]} />,
    );
    await user.click(screen.getByRole("button", { name: "Like" }));
    expect(screen.getByRole("button", { name: "Unlike" })).toBeInTheDocument();
    noDigit(container);
  });

  it("a pending optimistic count never reveals a count the host has since withheld (like)", async () => {
    const user = userEvent.setup();
    const pending = new Promise<void>(() => {});
    const make = (count: number | null) => (
      <EngagementBar actions={[{ kind: "like", count, onToggle: () => pending }]} />
    );
    const { container, rerender } = render(make(12));
    await user.click(screen.getByRole("button", { name: "Like 12" }));
    expect(screen.getByRole("button", { name: "Unlike 13" })).toBeInTheDocument();
    rerender(make(null));
    expect(screen.getByRole("button", { name: "Unlike" })).toBeInTheDocument();
    noDigit(container);
  });

  it("a pending optimistic reaction never reveals a total / kind count the host has since withheld", async () => {
    const user = userEvent.setup();
    const pending = new Promise<void>(() => {});
    const make = (count: number | null) => (
      <EngagementBar
        actions={[
          {
            kind: "reaction",
            totalCount: count,
            kinds: [{ key: "love", icon: "L", label: "Love", count }],
            onSelect: () => pending,
          },
        ]}
      />
    );
    const { container, rerender } = render(make(4));
    await user.click(screen.getByRole("button", { name: "React 4" }));
    await user.click(await screen.findByRole("button", { name: "Love 4" }));
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Love 5" })).toBeInTheDocument();
    rerender(make(null));
    expect(screen.getByRole("button", { name: "Love" })).toBeInTheDocument();
    noDigit(container);
  });

  it("reaction select and reaction-changed keep a withheld total / kind count withheld", async () => {
    const user = userEvent.setup();
    const { subscribe, emit } = makeSubscribe<EngagementDelta>();
    const { container } = render(
      <EngagementBar
        subscribe={subscribe}
        actions={[
          { kind: "reaction", totalCount: null, kinds: [{ key: "love", icon: "L", label: "Love", count: null }] },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "React" }));
    await user.click(await screen.findByRole("button", { name: "Love" }));
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Love" })).toHaveAttribute("aria-pressed", "true");
    act(() => emit({ kind: "reaction-changed", counts: { love: 5 }, totalCount: 5, viewerReaction: "love" }));
    noDigit(container);
  });
});
