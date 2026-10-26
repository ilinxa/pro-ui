import { beforeAll, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LikersStrip, defaultLikersStripLabels } from "../parts/likers-strip";
import type { EngagementLikerProfile } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const u = (id: string, name = `User ${id}`, username?: string): EngagementLikerProfile => ({
  id,
  name,
  username,
});
// The load-more pill lives in its own listitem (axe: a role=list may only hold listitems).
const people = () => screen.queryAllByRole("listitem").filter((n) => !n.querySelector("button"));
const A = [u("1"), u("2")];

// jsdom has no pointer capture; the strip's mouse drag-to-scroll calls it on pointerdown.
beforeAll(() => {
  Object.assign(HTMLElement.prototype, {
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  });
});

describe("LikersStrip", () => {
  it("renders heading, names and the default +N pill", () => {
    render(<LikersStrip totalCount={5} likers={A} onLoadMore={async () => []} />);
    expect(screen.getByText("Likes")).toBeInTheDocument();
    expect(people()).toHaveLength(2);
    const pill = screen.getByRole("button", { name: "+3 more" });
    expect(pill).toHaveTextContent("+3");
  });

  it("overrides every label key", () => {
    const onClose = vi.fn();
    render(
      <LikersStrip
        totalCount={1200}
        likers={A}
        onClose={onClose}
        onLoadMore={async () => []}
        labels={{
          heading: "Beğenenler",
          close: "Gizle",
          moreAriaLabel: (n, f) => `${f} kişi daha (${n})`,
          morePill: (f) => `~${f}`,
        }}
      />,
    );
    expect(screen.getByText("Beğenenler")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gizle" })).toBeInTheDocument();
    const pill = screen.getByRole("button", { name: /kişi daha \(1198\)/ });
    expect(pill).toHaveTextContent("~1.2K");
  });

  it("labels.loading and labels.loadMore", async () => {
    let resolve!: (v: EngagementLikerProfile[]) => void;
    const onLoadMore = () => new Promise<EngagementLikerProfile[]>((r) => (resolve = r));
    render(
      <LikersStrip
        totalCount={null}
        likers={A}
        onLoadMore={onLoadMore}
        labels={{ loadMore: "Daha", loading: "Yükleniyor" }}
      />,
    );
    const btn = screen.getByRole("button", { name: "Daha" });
    await userEvent.click(btn);
    expect(btn).toHaveTextContent("Yükleniyor");
    expect(btn).toHaveAttribute("aria-busy", "true");
    await act(async () => resolve([]));
    expect(btn).not.toHaveAttribute("aria-busy");
  });

  it("an undefined label value does not erase the default", () => {
    render(
      <LikersStrip
        totalCount={null}
        likers={A}
        onClose={() => {}}
        onLoadMore={async () => []}
        labels={{ heading: undefined, close: undefined, loadMore: undefined }}
      />,
    );
    expect(screen.getByText(defaultLikersStripLabels.heading)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("legacy aliases still work; labels win over them", () => {
    const { rerender } = render(
      <LikersStrip
        totalCount={10}
        likers={A}
        heading="Old heading"
        closeLabel="Old close"
        moreAriaLabelTemplate="plus {count} extra"
        onClose={() => {}}
        onLoadMore={async () => []}
      />,
    );
    expect(screen.getByText("Old heading")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Old close" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "plus 8 extra" })).toBeInTheDocument();
    rerender(
      <LikersStrip
        totalCount={10}
        likers={A}
        heading="Old heading"
        closeLabel="Old close"
        moreAriaLabelTemplate="plus {count} extra"
        labels={{ heading: "New", close: "New close", moreAriaLabel: (_, f) => `n${f}` }}
        onClose={() => {}}
        onLoadMore={async () => []}
      />,
    );
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New close" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "n8" })).toBeInTheDocument();
  });

  describe("data modes", () => {
    it("controlled: shows the likers prop every render", () => {
      const { rerender } = render(
        <LikersStrip totalCount={9} likers={A} onLikersChange={() => {}} />,
      );
      expect(people()).toHaveLength(2);
      rerender(
        <LikersStrip totalCount={9} likers={[...A, u("3")]} onLikersChange={() => {}} />,
      );
      expect(people()).toHaveLength(3);
    });

    it("controlled load-more reports prop+loaded and leaves the DOM alone until the parent re-renders", async () => {
      const onLikersChange = vi.fn();
      const onLoadMore = vi.fn(async () => [u("3"), u("4")]);
      const { rerender } = render(
        <LikersStrip
          totalCount={4}
          likers={A}
          onLikersChange={onLikersChange}
          onLoadMore={onLoadMore}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "+2 more" }));
      await waitFor(() => expect(onLikersChange).toHaveBeenCalledTimes(1));
      expect(onLikersChange.mock.calls[0][0].map((x: EngagementLikerProfile) => x.id)).toEqual([
        "1",
        "2",
        "3",
        "4",
      ]);
      expect(people()).toHaveLength(2);
      rerender(
        <LikersStrip
          totalCount={4}
          likers={onLikersChange.mock.calls[0][0]}
          onLikersChange={onLikersChange}
          onLoadMore={onLoadMore}
        />,
      );
      expect(people()).toHaveLength(4);
    });

    it("controlled load-more reads the LATEST prop, not a stale closure", async () => {
      const onLikersChange = vi.fn();
      let resolve!: (v: EngagementLikerProfile[]) => void;
      const onLoadMore = () => new Promise<EngagementLikerProfile[]>((r) => (resolve = r));
      const { rerender } = render(
        <LikersStrip totalCount={9} likers={A} onLikersChange={onLikersChange} onLoadMore={onLoadMore} />,
      );
      await userEvent.click(screen.getByRole("button", { name: /more/ }));
      rerender(
        <LikersStrip
          totalCount={9}
          likers={[...A, u("9")]}
          onLikersChange={onLikersChange}
          onLoadMore={onLoadMore}
        />,
      );
      await act(async () => resolve([u("3")]));
      expect(onLikersChange.mock.calls[0][0].map((x: EngagementLikerProfile) => x.id)).toEqual([
        "1",
        "2",
        "9",
        "3",
      ]);
    });

    it("likers alone: follows a changed prop AND keeps loaded extras, no duplicate ids", async () => {
      const onLoadMore = async () => [u("3"), u("2")];
      const { rerender } = render(<LikersStrip totalCount={9} likers={A} onLoadMore={onLoadMore} />);
      await userEvent.click(screen.getByRole("button", { name: /more/ }));
      await waitFor(() => expect(people()).toHaveLength(3));
      rerender(
        <LikersStrip totalCount={9} likers={[u("1"), u("2"), u("5")]} onLoadMore={onLoadMore} />,
      );
      const names = people().map((n) => n.textContent);
      expect(names).toHaveLength(4); // 1,2,5 from prop + 3 loaded; "2" deduped
      expect(names.filter((t) => t?.includes("User"))).toHaveLength(4);
      expect(screen.getAllByText("User", { exact: false }).length).toBeGreaterThanOrEqual(4);
    });

    it("defaultLikers is read once and load-more appends", async () => {
      const onLoadMore = async () => [u("7")];
      const { rerender } = render(
        <LikersStrip totalCount={5} defaultLikers={A} onLoadMore={onLoadMore} />,
      );
      expect(people()).toHaveLength(2);
      rerender(<LikersStrip totalCount={5} defaultLikers={[u("8")]} onLoadMore={onLoadMore} />);
      expect(people()).toHaveLength(2);
      await userEvent.click(screen.getByRole("button", { name: /more/ }));
      await waitFor(() => expect(people()).toHaveLength(3));
    });

    it("none of the three renders an empty list", () => {
      render(<LikersStrip totalCount={0} />);
      expect(people()).toHaveLength(0);
    });
  });

  describe("totalCount / hasMore", () => {
    it("null renders no digit anywhere and uses labels.loadMore", () => {
      const { container } = render(
        <LikersStrip
          totalCount={null}
          likers={[u("1", "Ann"), u("2", "Bob")]}
          onLoadMore={async () => []}
        />,
      );
      const btn = screen.getByRole("button", { name: "More" });
      expect(btn).toHaveTextContent("More");
      expect(container.textContent).not.toMatch(/\d/);
      expect(btn.getAttribute("aria-label")).not.toMatch(/\d/);
    });

    it("null + hasMore={false} hides the pill; no onLoadMore hides it", () => {
      const { rerender } = render(
        <LikersStrip totalCount={null} likers={A} onLoadMore={async () => []} hasMore={false} />,
      );
      expect(screen.queryByRole("button")).toBeNull();
      rerender(<LikersStrip totalCount={null} likers={A} />);
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("hasMore overrides the count-derived visibility in both directions", () => {
      const { rerender } = render(
        <LikersStrip totalCount={50} likers={A} onLoadMore={async () => []} hasMore={false} />,
      );
      expect(screen.queryByRole("button")).toBeNull();
      rerender(<LikersStrip totalCount={2} likers={A} onLoadMore={async () => []} hasMore />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("shows the full (compact) count, so the visible text is part of the name", () => {
      render(<LikersStrip totalCount={500} likers={A} onLoadMore={async () => []} />);
      const pill = screen.getByRole("button");
      expect(pill).toHaveTextContent("+498");
      expect(pill).toHaveAttribute("aria-label", "+498 more");
      expect(pill.getAttribute("aria-label")).toContain(pill.textContent ?? "");
    });

    it("a mouse press on the pill without dragging is a click (it loads more)", async () => {
      const onLoadMore = vi.fn(async () => []);
      const { container } = render(
        <LikersStrip totalCount={500} likers={A} onLoadMore={onLoadMore} />,
      );
      const pill = screen.getByRole("button");
      const strip = pill.closest("[class*='overflow-x']") ?? container.firstElementChild!;
      const capture = vi.fn();
      (strip as HTMLElement).setPointerCapture = capture;
      fireEvent.pointerDown(pill, { pointerType: "mouse", pointerId: 1, clientX: 10 });
      fireEvent.pointerMove(pill, { pointerType: "mouse", pointerId: 1, clientX: 11 });
      fireEvent.pointerUp(pill, { pointerType: "mouse", pointerId: 1, clientX: 11 });
      expect(capture).not.toHaveBeenCalled();
      fireEvent.click(pill);
      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
    });

    it("a press released outside the strip does not start a drag when the pointer comes back", () => {
      const { container } = render(
        <LikersStrip totalCount={500} likers={A} onLoadMore={async () => []} />,
      );
      const pill = screen.getByRole("button");
      const strip = pill.closest("[class*='overflow-x']") ?? container.firstElementChild!;
      const capture = vi.fn();
      (strip as HTMLElement).setPointerCapture = capture;
      fireEvent.pointerDown(pill, { pointerType: "mouse", pointerId: 1, clientX: 10, buttons: 1 });
      // released elsewhere: the next move over the strip has no button held
      fireEvent.pointerMove(pill, { pointerType: "mouse", pointerId: 1, clientX: 60, buttons: 0 });
      fireEvent.pointerMove(pill, { pointerType: "mouse", pointerId: 1, clientX: 90, buttons: 0 });
      expect(capture).not.toHaveBeenCalled();
    });

    it("a real drag captures the pointer", () => {
      const { container } = render(
        <LikersStrip totalCount={500} likers={A} onLoadMore={async () => []} />,
      );
      const pill = screen.getByRole("button");
      const strip = pill.closest("[class*='overflow-x']") ?? container.firstElementChild!;
      const capture = vi.fn();
      (strip as HTMLElement).setPointerCapture = capture;
      fireEvent.pointerDown(pill, { pointerType: "mouse", pointerId: 1, clientX: 10, buttons: 1 });
      fireEvent.pointerMove(pill, { pointerType: "mouse", pointerId: 1, clientX: 40, buttons: 1 });
      expect(capture).toHaveBeenCalledWith(1);
    });
  });

  describe("load-more failures", () => {
    it("catches a rejection, leaves the list, and allows retry", async () => {
      const unhandled = vi.fn();
      process.on("unhandledRejection", unhandled);
      const onLoadMore = vi
        .fn<() => Promise<EngagementLikerProfile[]>>()
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce([u("3")]);
      render(<LikersStrip totalCount={3} likers={A} onLoadMore={onLoadMore} />);
      const btn = screen.getByRole("button", { name: /more/ });
      await userEvent.click(btn);
      await waitFor(() => expect(btn).toBeEnabled());
      await new Promise((r) => setTimeout(r, 10));
      expect(unhandled).not.toHaveBeenCalled();
      process.off("unhandledRejection", unhandled);
      expect(people()).toHaveLength(2);
      expect(btn).not.toHaveAttribute("aria-busy");
      await userEvent.click(btn);
      await waitFor(() => expect(people()).toHaveLength(3));
      expect(onLoadMore).toHaveBeenCalledTimes(2);
    });
  });

  describe("locale", () => {
    it("formats compact counts per locale (tr)", () => {
      render(
        <LikersStrip
          totalCount={1202}
          likers={[]}
          locale="tr"
          onLoadMore={async () => []}
          labels={{ morePill: (f) => f, moreAriaLabel: (_, f) => f }}
        />,
      );
      expect(screen.getByRole("button")).toHaveAccessibleName(/^1,2\s?B$/);
    });

    it("formatCount overrides the formatter", () => {
      render(
        <LikersStrip
          totalCount={7}
          likers={A}
          onLoadMore={async () => []}
          formatCount={(n) => `<${n}>`}
        />,
      );
      expect(screen.getByRole("button")).toHaveAccessibleName("+<5> more");
    });

    it("uppercases initials with the locale (tr: ilker -> İ)", () => {
      render(<LikersStrip totalCount={1} likers={[u("1", "ilker")]} locale="tr" />);
      expect(screen.getByText("İ")).toBeInTheDocument();
    });

    it("plain en initial is ASCII I", () => {
      render(<LikersStrip totalCount={1} likers={[u("1", "ilker")]} />);
      expect(screen.getByText("I")).toBeInTheDocument();
    });
  });

  describe("axe", () => {
    it("default", async () => {
      const { container } = render(
        <LikersStrip totalCount={5} likers={A} onClose={() => {}} onLoadMore={async () => []} />,
      );
      await expectNoAxeViolations(container);
    });
    it("loading", async () => {
      const { container } = render(
        <LikersStrip totalCount={5} likers={A} onLoadMore={() => new Promise(() => {})} />,
      );
      await userEvent.click(screen.getByRole("button", { name: /more/ }));
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
      await expectNoAxeViolations(container);
    });
  });
});
