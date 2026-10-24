/** EB6 (direction, align) and EB7 (locale, formatting) + hydration — I10, I11, R8, R9. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { EngagementBar } from "../engagement-bar";
import { formatEngagementCount } from "../lib/format-count";
import type { EngagementAction } from "../types";
import { renderWithContext } from "../../../../../../tests/helpers";
import { installDomStubs, KINDS } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const reaction = (over: Record<string, unknown> = {}): EngagementAction =>
  ({ kind: "reaction", kinds: KINDS, totalCount: 9, ...over }) as EngagementAction;

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^React/ }));
  return screen.findByRole("group", { name: "Pick a reaction" });
}

const focusKind = (group: HTMLElement, name: RegExp) => {
  const el = within(group).getByRole("button", { name });
  el.focus();
  return el;
};

describe("EB6 / I10 / R8: picker arrow keys follow the direction", () => {
  it("R8: dir='rtl' - ArrowRight moves to the PREVIOUS kind (wraps), ArrowLeft to the next", async () => {
    const user = userEvent.setup();
    render(<EngagementBar dir="rtl" actions={[reaction()]} />);
    const group = await openPicker(user);
    focusKind(group, /^Love/);
    await user.keyboard("{ArrowRight}");
    expect(within(group).getByRole("button", { name: /^Wow/ })).toHaveFocus(); // wrapped to the last
    await user.keyboard("{ArrowRight}");
    expect(within(group).getByRole("button", { name: /^Laugh/ })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(within(group).getByRole("button", { name: /^Wow/ })).toHaveFocus();
  });

  it("LTR: ArrowRight moves to the next kind, ArrowLeft to the previous (wraps)", async () => {
    const user = userEvent.setup();
    render(<EngagementBar dir="ltr" actions={[reaction()]} />);
    const group = await openPicker(user);
    focusKind(group, /^Love/);
    await user.keyboard("{ArrowRight}");
    expect(within(group).getByRole("button", { name: /^Laugh/ })).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(within(group).getByRole("button", { name: /^Wow/ })).toHaveFocus();
  });

  it("Home / End: first and last kind, Remove last when a reaction is set (clearOnTap=false)", async () => {
    const user = userEvent.setup();
    render(<EngagementBar actions={[reaction({ viewerReaction: "laugh", clearOnTap: false })]} />);
    await user.click(screen.getByRole("button", { name: /^Laugh/ }));
    const group = await screen.findByRole("group", { name: "Pick a reaction" });
    focusKind(group, /^Laugh/);
    await user.keyboard("{End}");
    expect(within(group).getByRole("button", { name: "Remove reaction" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(within(group).getByRole("button", { name: /^Love/ })).toHaveFocus();
  });

  it("an ancestor <div dir='rtl'> without the prop also flips the arrows (after mount)", async () => {
    const user = userEvent.setup();
    renderWithContext(<EngagementBar actions={[reaction()]} />, { dir: "rtl", locale: "ar" });
    const group = await openPicker(user);
    focusKind(group, /^Love/);
    await user.keyboard("{ArrowRight}");
    expect(within(group).getByRole("button", { name: /^Wow/ })).toHaveFocus();
  });

  it("an ancestor LTR keeps the LTR arrows (control)", async () => {
    const user = userEvent.setup();
    renderWithContext(<EngagementBar actions={[reaction()]} />, { dir: "ltr" });
    const group = await openPicker(user);
    focusKind(group, /^Love/);
    await user.keyboard("{ArrowRight}");
    expect(within(group).getByRole("button", { name: /^Laugh/ })).toHaveFocus();
  });

  it("the bar's dir prop reaches the DOM", () => {
    const { container } = render(<EngagementBar dir="rtl" actions={[{ kind: "like", count: 1 }]} />);
    expect(container.firstElementChild).toHaveAttribute("dir", "rtl");
  });
});

describe("EB6 / R8: align groups", () => {
  /** [start group, end group | null] of the default-variant row. */
  function groups(container: HTMLElement) {
    const row = container.firstElementChild!.firstElementChild as HTMLElement;
    return { start: row.children[0] as HTMLElement, end: (row.children[1] as HTMLElement | undefined) ?? null };
  }
  const inGroup = (g: HTMLElement | null, name: RegExp) => !!g && within(g).queryByRole("button", { name }) !== null;

  const actions = (comment: Record<string, unknown>, bookmark: Record<string, unknown> = {}): EngagementAction[] => [
    { kind: "like", count: 1 },
    { kind: "comment", count: 2, ...comment } as EngagementAction,
    { kind: "bookmark", ...bookmark } as EngagementAction,
  ];

  for (const align of ["end", "right"] as const) {
    it(`align: '${align}' puts an action in the end group`, () => {
      const { container } = render(<EngagementBar actions={actions({ align })} />);
      const g = groups(container);
      expect(inGroup(g.end, /^Comment/)).toBe(true);
      expect(inGroup(g.start, /^Comment/)).toBe(false);
    });
  }

  for (const align of ["start", "left"] as const) {
    it(`align: '${align}' puts an action in the start group (even a bookmark)`, () => {
      const { container } = render(<EngagementBar actions={actions({ align }, { align })} />);
      const g = groups(container);
      expect(inGroup(g.start, /^Comment/)).toBe(true);
      expect(inGroup(g.start, /^Bookmark/)).toBe(true);
      expect(inGroup(g.end, /^Bookmark/)).toBe(false);
    });
  }

  it("regression: explicit align 'auto' on a bookmark lands in the END group", () => {
    const { container } = render(<EngagementBar actions={actions({}, { align: "auto" })} />);
    const g = groups(container);
    expect(inGroup(g.end, /^Bookmark/)).toBe(true);
    expect(inGroup(g.start, /^Bookmark/)).toBe(false);
  });

  it("align 'auto' on a comment lands in the START group; omitted bookmark defaults to END", () => {
    const { container } = render(<EngagementBar actions={actions({ align: "auto" })} />);
    const g = groups(container);
    expect(inGroup(g.start, /^Comment/)).toBe(true);
    expect(inGroup(g.end, /^Bookmark/)).toBe(true);
  });
});

describe("EB7 / C3 / I11 / R9: locale + formatting", () => {
  it("R9: locale='tr' shows 1200 likes as '1,2 B'", () => {
    render(<EngagementBar locale="tr" actions={[{ kind: "like", count: 1200 }]} />);
    const btn = screen.getByRole("button", { name: /^Like/ });
    expect(btn.textContent).toMatch(/1,2\s?B/);
    expect(btn).toHaveAccessibleName(expect.stringMatching(/1,2\s?B/));
  });

  it("English default: 1234 -> '1.2K'", () => {
    render(<EngagementBar actions={[{ kind: "like", count: 1234 }]} />);
    expect(screen.getByRole("button", { name: "Like 1.2K" })).toBeInTheDocument();
  });

  it("formatCount prop wins over labels.formatCount, which wins over the default", () => {
    const { rerender } = render(
      <EngagementBar
        actions={[{ kind: "like", count: 5 }]}
        formatCount={(n) => `prop:${n}`}
        labels={{ formatCount: (n) => `label:${n}` }}
      />,
    );
    expect(screen.getByRole("button", { name: "Like prop:5" })).toBeInTheDocument();
    rerender(<EngagementBar actions={[{ kind: "like", count: 5 }]} labels={{ formatCount: (n) => `label:${n}` }} />);
    expect(screen.getByRole("button", { name: "Like label:5" })).toBeInTheDocument();
    rerender(<EngagementBar actions={[{ kind: "like", count: 5 }]} />);
    expect(screen.getByRole("button", { name: "Like 5" })).toBeInTheDocument();
  });

  it("picker per-kind counts go through the formatter (1500 -> '1.5K')", async () => {
    const user = userEvent.setup();
    render(<EngagementBar actions={[reaction()]} />);
    const group = await openPicker(user);
    expect(within(group).getByRole("button", { name: "Wow 1.5K" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "Love 5" })).toBeInTheDocument();
  });

  it("picker per-kind counts honour a custom formatter and the locale", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<EngagementBar formatCount={(n) => `#${n}`} actions={[reaction()]} />);
    let group = await openPicker(user);
    expect(within(group).getByRole("button", { name: "Love #5" })).toBeInTheDocument();
    unmount();
    render(<EngagementBar locale="tr" actions={[reaction()]} />);
    group = await openPicker(user);
    expect(within(group).getByRole("button", { name: /^Wow 1,5\s?B/ })).toBeInTheDocument();
  });

  it("formatEngagementCount: locale, negatives and non-finite values", () => {
    expect(formatEngagementCount(1200, "tr")).toMatch(/1,2\s?B/);
    expect(formatEngagementCount(1234)).toBe("1.2K");
    expect(formatEngagementCount(999)).toBe("999");
    expect(formatEngagementCount(-5)).toBe("0");
    expect(formatEngagementCount(Number.NaN)).toBe("");
    expect(formatEngagementCount(Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("I11: hydration (server HTML == first client render)", () => {
  it("locale='tr': renderToString then hydrateRoot raises no hydration warnings and the text matches", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const make = () => (
      <EngagementBar
        locale="tr"
        actions={[
          { kind: "like", count: 1200, liked: true },
          { kind: "comment", count: 3 },
          reaction({ viewerReaction: "love", totalCount: 1200 }),
          { kind: "bookmark" },
          { kind: "view-count", count: 5000 },
        ]}
        trailing={<span>more</span>}
      />
    );
    const html = renderToString(make());
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const textBefore = container.textContent;
    expect(textBefore).toMatch(/1,2\s?B/);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, make());
    });
    expect(spy).not.toHaveBeenCalled();
    expect(container.textContent).toBe(textBefore);
    expect(within(container).getByRole("button", { name: /^Like|^Unlike/ })).toBeInTheDocument();
    act(() => root.unmount());
    container.remove();
    spy.mockRestore();
  });

  it("server markup carries no dir attribute unless the dir prop is passed", () => {
    const html = renderToString(<EngagementBar actions={[reaction()]} />);
    expect(html).not.toMatch(/dir="rtl"/);
  });
});
