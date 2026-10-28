/** 0.7.0 - EB-1 (disclosure state + event-passing handlers) and EB-5 (hideZeroCounts). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EngagementBar } from "../engagement-bar";
import type { EngagementAction, EngagementBarHandle } from "../types";
import { installDomStubs, KINDS } from "./support";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const BUTTON_KINDS = ["comment", "share", "custom"] as const;
function buttonAction(
  kind: (typeof BUTTON_KINDS)[number],
  extra: Record<string, unknown> = {},
): EngagementAction {
  if (kind === "custom") {
    return { kind, id: "star", label: "Star", icon: "*", count: 3, ...extra } as EngagementAction;
  }
  return { kind, count: 3, ...extra } as EngagementAction;
}
const NAME = { comment: "Comment 3", share: "Share 3", custom: "Star 3" } as const;

describe("EB-1: comment / share / custom disclosure", () => {
  for (const kind of BUTTON_KINDS) {
    describe(kind, () => {
      it("expanded=true: aria-expanded true + aria-controls", () => {
        render(<EngagementBar actions={[buttonAction(kind, { expanded: true, controls: "panel-1" })]} />);
        const btn = screen.getByRole("button", { name: NAME[kind] });
        expect(btn).toHaveAttribute("aria-expanded", "true");
        expect(btn).toHaveAttribute("aria-controls", "panel-1");
      });

      it("expanded=false: aria-expanded false, NO aria-controls", () => {
        render(<EngagementBar actions={[buttonAction(kind, { expanded: false, controls: "panel-1" })]} />);
        const btn = screen.getByRole("button", { name: NAME[kind] });
        expect(btn).toHaveAttribute("aria-expanded", "false");
        expect(btn).not.toHaveAttribute("aria-controls");
      });

      it("I1: no expanded -> markup identical to a render without the props", () => {
        const a = render(<EngagementBar actions={[buttonAction(kind)]} />);
        const withoutProps = a.container.innerHTML.replace(/_r_[a-z0-9]+_|:r[a-z0-9]+:/g, "ID");
        a.unmount();
        const b = render(<EngagementBar actions={[buttonAction(kind, { controls: "panel-1" })]} />);
        const withControlsOnly = b.container.innerHTML.replace(/_r_[a-z0-9]+_|:r[a-z0-9]+:/g, "ID");
        expect(withControlsOnly).toBe(withoutProps);
        expect(b.container.innerHTML).not.toMatch(/saria-(expanded|controls)=/);
      });

      it("handler receives a click event whose currentTarget is the button", async () => {
        const seen: Array<{ type: string; target: EventTarget | null }> = [];
        const onClick = vi.fn((e: { type: string; currentTarget: EventTarget }) => {
          seen.push({ type: e.type, target: e.currentTarget });
        });
        render(<EngagementBar actions={[buttonAction(kind, { onClick })]} />);
        const btn = screen.getByRole("button", { name: NAME[kind] });
        await userEvent.click(btn);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(seen[0]!.type).toBe("click");
        expect(seen[0]!.target).toBe(btn);
      });

      it("zero-argument handlers still work", async () => {
        const onClick = vi.fn(() => {});
        render(<EngagementBar actions={[buttonAction(kind, { onClick })]} />);
        await userEvent.click(screen.getByRole("button", { name: NAME[kind] }));
        expect(onClick).toHaveBeenCalledTimes(1);
      });

      it("disabled: handler never fires; disclosure attrs still render", async () => {
        const onClick = vi.fn();
        render(
          <EngagementBar
            actions={[buttonAction(kind, { onClick, disabled: true, expanded: true, controls: "p" })]}
          />,
        );
        const btn = screen.getByRole("button", { name: NAME[kind] });
        await userEvent.click(btn);
        expect(onClick).not.toHaveBeenCalled();
        expect(btn).toHaveAttribute("aria-expanded", "true");
        expect(btn).toHaveAttribute("aria-controls", "p");
      });

      it("hidden: renders nothing and the handler is unreachable", () => {
        const onClick = vi.fn();
        const { container } = render(
          <EngagementBar actions={[buttonAction(kind, { onClick, hidden: true, expanded: true })]} />,
        );
        expect(container).toBeEmptyDOMElement();
        expect(onClick).not.toHaveBeenCalled();
      });

      for (const open of [true, false]) {
        it(`axe clean (expanded=${open})`, async () => {
          const { container } = render(
            <div>
              {open ? <div id="p" /> : null}
              <EngagementBar actions={[buttonAction(kind, { expanded: open, controls: "p" })]} />
            </div>,
          );
          await expectNoAxeViolations(container);
        });
      }
    });
  }
});

describe("EB-1: custom active + expanded", () => {
  it("expanded wins: aria-expanded, no aria-pressed", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<EngagementBar actions={[buttonAction("custom", { active: true, expanded: false })]} />);
    const btn = screen.getByRole("button", { name: "Star 3" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(btn).not.toHaveAttribute("aria-pressed");
    vi.restoreAllMocks();
  });

  it("warns exactly once per mount, across re-renders", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <EngagementBar actions={[buttonAction("custom", { active: true, expanded: true })]} />,
    );
    rerender(<EngagementBar actions={[buttonAction("custom", { expanded: false })]} />);
    rerender(<EngagementBar actions={[buttonAction("custom", { active: true, expanded: true })]} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toMatch(/active.*expanded/);
    vi.restoreAllMocks();
  });

  it("no warning with active alone or expanded alone; active alone keeps aria-pressed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = render(<EngagementBar actions={[buttonAction("custom", { active: true })]} />);
    expect(screen.getByRole("button", { name: "Star 3" })).toHaveAttribute("aria-pressed", "true");
    a.unmount();
    render(<EngagementBar actions={[buttonAction("custom", { expanded: true })]} />);
    expect(warn).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("active={false} with expanded is no conflict: no warning, disclosure state renders", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<EngagementBar actions={[buttonAction("custom", { active: false, expanded: true })]} />);
    const btn = screen.getByRole("button", { name: "Star 3" });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(btn).not.toHaveAttribute("aria-pressed");
    expect(warn).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("EB-1: like / reaction count button (split mode)", () => {
  it("like: countExpanded on the COUNT button only; heart keeps aria-pressed", () => {
    render(
      <EngagementBar
        actions={[
          { kind: "like", count: 12, onCountClick: () => {}, countExpanded: true, countControls: "likers" },
        ]}
      />,
    );
    const count = screen.getByRole("button", { name: /Show likers/ });
    const heart = screen.getByRole("button", { name: "Like" });
    expect(count).toHaveAttribute("aria-expanded", "true");
    expect(count).toHaveAttribute("aria-controls", "likers");
    expect(heart).toHaveAttribute("aria-pressed", "false");
    expect(heart).not.toHaveAttribute("aria-expanded");
    expect(heart).not.toHaveAttribute("aria-controls");
  });

  it("like: countExpanded=false -> aria-expanded false, no aria-controls", () => {
    render(
      <EngagementBar
        actions={[
          { kind: "like", count: 12, onCountClick: () => {}, countExpanded: false, countControls: "likers" },
        ]}
      />,
    );
    const count = screen.getByRole("button", { name: /Show likers/ });
    expect(count).toHaveAttribute("aria-expanded", "false");
    expect(count).not.toHaveAttribute("aria-controls");
  });

  it("like: no countExpanded -> no disclosure attrs anywhere", () => {
    const { container } = render(
      <EngagementBar actions={[{ kind: "like", count: 12, onCountClick: () => {} }]} />,
    );
    expect(container.innerHTML).not.toMatch(/saria-(expanded|controls)=/);
  });

  it("like: onCountClick receives an event whose currentTarget is the count button; heart does not fire it", async () => {
    const seen: Array<EventTarget | null> = [];
    const onCountClick = vi.fn((e: { currentTarget: EventTarget }) => {
      seen.push(e.currentTarget);
    });
    const onToggle = vi.fn();
    render(<EngagementBar actions={[{ kind: "like", count: 12, onCountClick, onToggle }]} />);
    const count = screen.getByRole("button", { name: /Show likers/ });
    await userEvent.click(count);
    expect(onCountClick).toHaveBeenCalledTimes(1);
    expect(seen[0]).toBe(count);
    expect(onToggle).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(onCountClick).toHaveBeenCalledTimes(1);
  });

  it("like: disabled never fires onCountClick, attrs still render", async () => {
    const onCountClick = vi.fn();
    render(
      <EngagementBar
        actions={[{ kind: "like", count: 12, disabled: true, onCountClick, countExpanded: true, countControls: "l" }]}
      />,
    );
    const count = screen.getByRole("button", { name: /Show likers/ });
    await userEvent.click(count);
    expect(onCountClick).not.toHaveBeenCalled();
    expect(count).toHaveAttribute("aria-expanded", "true");
  });

  it("like (stacked): count button carries aria-expanded", () => {
    render(
      <EngagementBar
        variant="stacked"
        actions={[{ kind: "like", count: 12, onCountClick: () => {}, countExpanded: true, countControls: "l" }]}
      />,
    );
    expect(screen.getByRole("button", { name: /Show likers/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("reaction: countExpanded on the count button; the trigger gets no host value", async () => {
    const seen: Array<EventTarget | null> = [];
    const onCountClick = vi.fn((e: { currentTarget: EventTarget }) => {
      seen.push(e.currentTarget);
    });
    render(
      <EngagementBar
        actions={[
          {
            kind: "reaction",
            kinds: KINDS,
            totalCount: 9,
            onCountClick,
            countExpanded: true,
            countControls: "reactors",
          },
        ]}
      />,
    );
    const count = screen.getByRole("button", { name: /Show reactions/ });
    expect(count).toHaveAttribute("aria-expanded", "true");
    expect(count).toHaveAttribute("aria-controls", "reactors");
    const trigger = screen.getByRole("button", { name: "React" });
    expect(trigger).not.toHaveAttribute("aria-controls", "reactors");
    expect(trigger.getAttribute("aria-expanded")).not.toBe("true");
    await userEvent.click(count);
    expect(seen[0]).toBe(count);
  });

  for (const open of [true, false]) {
    it(`axe clean, like + reaction split (expanded=${open})`, async () => {
      const { container } = render(
        <div>
          {open ? <div id="p" /> : null}
          <EngagementBar
            actions={[
              { kind: "like", count: 12, onCountClick: () => {}, countExpanded: open, countControls: "p" },
              {
                kind: "reaction",
                kinds: KINDS,
                totalCount: 9,
                onCountClick: () => {},
                countExpanded: open,
                countControls: "p",
              },
            ]}
          />
        </div>,
      );
      await expectNoAxeViolations(container);
    });
  }
});

describe("EB-1: imperative handle never calls the click handlers", () => {
  it("triggerLike / triggerBookmark / triggerReaction leave onClick + onCountClick untouched", async () => {
    const onCountClick = vi.fn();
    const onClick = vi.fn();
    const ref = createRef<EngagementBarHandle>();
    render(
      <EngagementBar
        ref={ref}
        actions={[
          { kind: "like", count: 1, onCountClick },
          { kind: "comment", count: 1, onClick },
          { kind: "bookmark" },
          { kind: "reaction", kinds: KINDS, totalCount: 2, onCountClick },
        ]}
      />,
    );
    ref.current!.triggerLike();
    ref.current!.triggerBookmark();
    ref.current!.triggerReaction("love");
    await Promise.resolve();
    expect(onCountClick).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("EB-5: hideZeroCounts", () => {
  const ZERO: Array<[string, EngagementAction, string, string]> = [
    ["like", { kind: "like", count: 0 }, "button", "Like"],
    ["comment", { kind: "comment", count: 0 }, "button", "Comment"],
    ["share", { kind: "share", count: 0 }, "button", "Share"],
    ["view-count", { kind: "view-count", count: 0 }, "group", "Views"],
    ["custom", { kind: "custom", id: "star", label: "Star", icon: "*", count: 0 }, "button", "Star"],
    ["reaction", { kind: "reaction", kinds: [{ key: "love", icon: "L", label: "Love", count: 0 }], totalCount: 0 }, "button", "React"],
    [
      "reaction with viewer reaction",
      { kind: "reaction", kinds: [{ key: "love", icon: "L", label: "Love", count: 0 }], totalCount: 0, viewerReaction: "love" },
      "button",
      "Love",
    ],
  ];

  for (const [label, action, role, name] of ZERO) {
    it(`${label}: 0 shows without the flag, hides with it (no digit, name has no count)`, () => {
      const hidden = render(<EngagementBar hideZeroCounts actions={[action]} />);
      const el = screen.getByRole(role, { name });
      expect(el).toHaveAccessibleName(name);
      expect(hidden.container.textContent ?? "").not.toMatch(/\d/);
      hidden.unmount();
      if (label.startsWith("reaction")) return; // reaction already hides a zero total (viewer-less)
      const shown = render(<EngagementBar actions={[action]} />);
      expect(shown.container.textContent).toMatch(/0/);
      expect(screen.getByRole(role, { name: `${name} 0` })).toBeInTheDocument();
    });
  }

  it("like split mode: a zero count renders no count button", () => {
    render(<EngagementBar hideZeroCounts actions={[{ kind: "like", count: 0, onCountClick: () => {} }]} />);
    expect(screen.queryByRole("button", { name: /Show likers/ })).toBeNull();
  });

  it("null behaviour unchanged; a later 1 renders normally; a later 0 hides again", () => {
    const { rerender, container } = render(
      <EngagementBar hideZeroCounts actions={[{ kind: "comment", count: null }]} />,
    );
    expect(container.textContent).not.toMatch(/\d/);
    rerender(<EngagementBar hideZeroCounts actions={[{ kind: "comment", count: 1 }]} />);
    expect(screen.getByRole("button", { name: "Comment 1" })).toBeInTheDocument();
    rerender(<EngagementBar hideZeroCounts actions={[{ kind: "comment", count: 0 }]} />);
    expect(container.textContent).not.toMatch(/\d/);
  });

  it("only exactly 0 hides; non-zero counts and the default (no flag) are unchanged", () => {
    render(
      <EngagementBar
        hideZeroCounts
        actions={[
          { kind: "comment", count: 5 },
          { kind: "share", count: 0 },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Comment 5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("an uncontrolled like moves 1 to 2 normally under the flag", async () => {
    render(<EngagementBar hideZeroCounts actions={[{ kind: "like", count: 1 }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Like 1" }));
    expect(screen.getByRole("button", { name: "Unlike 2" })).toBeInTheDocument();
  });
});
