/**
 * Regression tests for the 0.3.0 hardening (loop doc R1–R8 + U0 findings). Each block names
 * the reproduction it replays.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations, renderWithContext } from "../../../../../../tests/helpers";
import { enforceUniqueKeys } from "../lib/enforce-unique-keys";
import { firstGrapheme } from "../parts/switcher-trigger";
import { defaultAccountSwitcherLabels } from "../types";
import { FLAT_ITEMS, GROUPS, ITEMS, Switcher, installDomStubs, popoverContent } from "./support";

let restore: () => void;
beforeEach(() => {
  restore = installDomStubs();
});
afterEach(() => restore());

const trigger = () => screen.getAllByRole("button")[0]!;
const options = () => within(screen.getByRole("listbox")).getAllByRole("option");
const optionNamed = (name: string) => options().find((o) => o.textContent?.includes(name))!;

describe("R1 — ↓ / ↑ on the trigger open the list (AW1)", () => {
  it.each(["{ArrowDown}", "{ArrowUp}"])("%s opens with focus on the active option", async (key) => {
    const user = userEvent.setup();
    render(<Switcher />);
    await user.tab();
    await user.keyboard(key);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(optionNamed("Acme")).toHaveFocus();
  });

  it("opens on the first option when the active item is a fallback outside the list", async () => {
    const user = userEvent.setup();
    render(<Switcher activeKey="missing" fallbackActiveItem={{ key: "fb", label: "Pick one" }} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(options()[0]).toHaveFocus();
  });
});

describe("R2 — one Tab stop; arrows / Home / End in rendered order (AW1)", () => {
  it("only the current option is tabbable", async () => {
    render(<Switcher defaultOpen />);
    const tabbable = options().filter((o) => o.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveTextContent("Acme");
  });

  it("moves without wrapping and follows the grouped visual order", async () => {
    const user = userEvent.setup();
    // Array order differs from visual order: the ungrouped item and the groups' order reorder it.
    const items = [
      { key: "console", label: "Console", group: "platform" },
      { key: "acme", label: "Acme", group: "business" },
      { key: "loose", label: "Loose" },
      { key: "me", label: "Ayşe", group: "personal" },
    ];
    render(<Switcher items={items} groups={GROUPS} activeKey="loose" />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    const order = options().map((o) => o.textContent);
    expect(order).toEqual(["Loose", "Ayşe", "Acme", "Console"]);
    expect(optionNamed("Loose")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(optionNamed("Loose")).toHaveFocus(); // no wrap at the top
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(optionNamed("Acme")).toHaveFocus();
    await user.keyboard("{End}");
    expect(optionNamed("Console")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(optionNamed("Console")).toHaveFocus(); // no wrap at the bottom
    await user.keyboard("{Home}");
    expect(optionNamed("Loose")).toHaveFocus();
    // The roving stop follows focus.
    expect(options().filter((o) => o.tabIndex === 0)).toEqual([optionNamed("Loose")]);
  });

  it("Tab leaves the list for the footer slot", async () => {
    const user = userEvent.setup();
    render(<Switcher footerSlot={<button type="button">Create business</button>} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    await user.tab();
    expect(screen.getByRole("button", { name: "Create business" })).toHaveFocus();
  });
});

describe("R3 — select and close (AW1, L6)", () => {
  it("Enter on another option selects it, closes, and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Switcher onSelect={onSelect} />);
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: "globex" }));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
  });

  it("Space selects too; Enter on the active option closes without onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Switcher onSelect={onSelect} />);
    await user.tab();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{ArrowDown}{ArrowUp} ");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: "me" }));
  });

  it("Escape closes and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Switcher />);
    await user.tab();
    await user.keyboard("{ArrowDown}{Escape}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
  });
});

describe("R4 — labels (AW2)", () => {
  const TR = {
    trigger: (c: string | null) => (c === null ? "Hesap değiştir" : `Hesap değiştir, şu anki: ${c}`),
    list: "Hesaplar",
    empty: "Hesap yok",
  };

  it("names the trigger exactly labels.trigger(current) and leaves no English when all are set", () => {
    render(<Switcher labels={TR} defaultOpen />);
    expect(trigger()).toHaveAccessibleName("Hesap değiştir, şu anki: Acme");
    expect(screen.getByRole("listbox")).toHaveAccessibleName("Hesaplar");
    const english = /switch|account context|no items|current:/i;
    expect(document.body.textContent).not.toMatch(english);
    for (const el of document.body.querySelectorAll("[aria-label]")) {
      expect(el.getAttribute("aria-label")).not.toMatch(english);
    }
  });

  it("the empty placeholder uses labels.empty and labels.trigger(null)", () => {
    render(<Switcher items={[]} labels={TR} />);
    const placeholder = screen.getByRole("button");
    expect(placeholder).toBeDisabled();
    expect(placeholder).toHaveAccessibleName("Hesap değiştir");
    expect(placeholder).toHaveTextContent("Hesap yok");
  });

  it("an undefined label keeps its default", () => {
    render(<Switcher labels={{ trigger: undefined, list: undefined }} defaultOpen />);
    expect(trigger()).toHaveAccessibleName(defaultAccountSwitcherLabels.trigger("Acme"));
    expect(screen.getByRole("listbox")).toHaveAccessibleName(defaultAccountSwitcherLabels.list);
  });

  it("default names are unchanged from 0.2.1 (I1)", () => {
    render(<Switcher defaultOpen />);
    expect(trigger()).toHaveAccessibleName("Switch account context, current: Acme");
    expect(screen.getByRole("listbox")).toHaveAccessibleName("Switch account context");
  });

  it("the deprecated aria-label still names the list and the trigger; labels win over it", () => {
    const { unmount } = render(<Switcher aria-label="Workspaces" defaultOpen />);
    expect(trigger()).toHaveAccessibleName("Workspaces, current: Acme");
    expect(screen.getByRole("listbox")).toHaveAccessibleName("Workspaces");
    unmount();
    render(<Switcher aria-label="Workspaces" labels={{ list: "Spaces" }} defaultOpen />);
    expect(screen.getByRole("listbox")).toHaveAccessibleName("Spaces");
    expect(trigger()).toHaveAccessibleName("Workspaces, current: Acme");
  });
});

describe("R5 — groups, description, row size, renderItem (AW3)", () => {
  it("renders headings as named groups; ungrouped first; empty groups hidden", () => {
    const items = [...ITEMS.slice(0, 3), { key: "loose", label: "Loose" }];
    render(<Switcher items={items} groups={GROUPS} defaultOpen />);
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(2); // "platform" has no items → not rendered
    expect(groups[0]).toHaveAccessibleName("Personal");
    expect(groups[1]).toHaveAccessibleName("Businesses");
    expect(within(groups[1]!).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "AcmeOwner",
      "GlobexEditor",
    ]);
    expect(options()[0]).toHaveTextContent("Loose");
  });

  it("an unknown group id warns and renders the item ungrouped", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Switcher items={[{ key: "x", label: "X", group: "nope" }]} activeKey="x" groups={GROUPS} defaultOpen />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("x → nope"));
    expect(screen.queryByRole("group")).toBeNull();
    expect(options()).toHaveLength(1);
    warn.mockRestore();
  });

  it("group ids with spaces still label their group", () => {
    render(
      <Switcher
        items={[{ key: "a", label: "A", group: "my team" }]}
        activeKey="a"
        groups={[{ id: "my team", label: "My team" }]}
        defaultOpen
      />,
    );
    expect(screen.getByRole("group")).toHaveAccessibleName("My team");
  });

  it("renders the description line and the lg avatar box", () => {
    render(<Switcher items={ITEMS} groups={GROUPS} itemSize="lg" defaultOpen />);
    expect(optionNamed("Acme")).toHaveTextContent("Owner");
    expect(optionNamed("Acme").querySelector(".size-8")).not.toBeNull();
  });

  it("renderItem replaces the content; the option, selection and keyboard stay", async () => {
    const user = userEvent.setup();
    render(
      <Switcher
        renderItem={(item, { active }) => <span>{`${item.label}${active ? " ✓" : ""}`}</span>}
      />,
    );
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(optionNamed("Acme")).toHaveTextContent("Acme ✓");
    expect(optionNamed("Acme")).toHaveAttribute("aria-selected", "true");
    expect(optionNamed("Acme")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(optionNamed("Globex")).toHaveFocus();
  });
});

describe("R6 — collapsed side follows direction (AW4)", () => {
  it.each([
    ["ltr", undefined, "right"],
    ["rtl", undefined, "left"],
    ["ltr", "start", "left"],
    ["rtl", "start", "right"],
    ["rtl", "right", "right"],
  ] as const)("%s, side=%s → %s", (dir, side, expected) => {
    renderWithContext(<Switcher isCollapsed collapsedPopoverSide={side} defaultOpen />, { dir });
    expect(popoverContent()).toHaveAttribute("data-side", expected);
  });

  it("the dir prop wins over the surrounding direction", () => {
    renderWithContext(<Switcher isCollapsed dir="ltr" defaultOpen />, { dir: "rtl" });
    expect(popoverContent()).toHaveAttribute("data-side", "right");
    expect(popoverContent()).toHaveAttribute("dir", "ltr");
  });

  it("expanded mode still opens below", () => {
    renderWithContext(<Switcher defaultOpen />, { dir: "rtl" });
    expect(popoverContent()).toHaveAttribute("data-side", "bottom");
  });
});

describe("R7 — width comes from the class only (U0-1)", () => {
  it("sets no inline width that would beat the dual-var class", () => {
    render(<Switcher defaultOpen />);
    expect(popoverContent().style.width).toBe("");
    expect(popoverContent().className).toContain("w-(--radix-popover-trigger-width,var(--anchor-width))");
  });
});

describe("R8 — the portaled list carries the direction (U0-2)", () => {
  it.each(["ltr", "rtl"] as const)("%s", (dir) => {
    renderWithContext(<Switcher defaultOpen />, { dir });
    expect(popoverContent()).toHaveAttribute("dir", dir);
  });
});

describe("U0-3 / U0-4 / F-01", () => {
  it("aria-controls only while open, pointing at the listbox", async () => {
    const user = userEvent.setup();
    render(<Switcher />);
    expect(trigger()).not.toHaveAttribute("aria-controls");
    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
  });

  it("the collapsed initial is a whole grapheme", () => {
    expect(firstGrapheme("🦊 Fox")).toBe("🦊");
    expect(firstGrapheme("👩‍💻 Dev")).toBe("👩‍💻");
    expect(firstGrapheme("İstanbul")).toBe("İ");
    expect(firstGrapheme("")).toBeUndefined();
    render(<Switcher items={[{ key: "f", label: "🦊 Fox" }]} activeKey="f" isCollapsed />);
    expect(trigger()).toHaveTextContent("🦊");
  });

  it("dedupe returns the input array when there are no duplicates", () => {
    expect(enforceUniqueKeys(FLAT_ITEMS)).toBe(FLAT_ITEMS);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const deduped = enforceUniqueKeys([...FLAT_ITEMS, FLAT_ITEMS[0]!]);
    expect(deduped).toHaveLength(FLAT_ITEMS.length);
    warn.mockRestore();
  });
});

describe("controlled open (C5, L13)", () => {
  it("the prop wins: a requested close keeps the list open until the parent changes it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Switcher open onOpenChange={onOpenChange} />);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});

describe("axe over the open (portaled) list", () => {
  it.each([
    ["flat", {}],
    ["grouped lg", { items: ITEMS, groups: GROUPS, itemSize: "lg" as const }],
    ["with footer", { footerSlot: <button type="button">Create</button> }],
  ])("%s", async (_name, props) => {
    render(<Switcher defaultOpen {...props} />);
    await expectNoAxeViolations(document.body);
  });

  it("rtl, collapsed", async () => {
    renderWithContext(<Switcher items={ITEMS} groups={GROUPS} isCollapsed defaultOpen />, { dir: "rtl" });
    await expectNoAxeViolations(document.body);
  });
});

describe("U4 finder A — regressions", () => {
  it("F1: a repeated group id keeps its first occurrence (no duplicate options) and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const groups = [
      { id: "business", label: "A" },
      { id: "business", label: "B" },
      { id: "personal", label: "P" },
    ];
    render(<Switcher items={ITEMS} groups={groups} defaultOpen />);
    expect(options().map((o) => o.textContent)).toEqual(["ConsoleStaff", "AcmeOwner", "GlobexEditor", "Ayşe@ayse"]);
    expect(screen.getAllByRole("group").map((g) => g.textContent?.slice(0, 1))).toEqual(["A", "P"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Duplicate group ids"));
    warn.mockRestore();
  });

  it("F2: mounted empty (items loading) in an RTL section, the list still gets RTL once items arrive", () => {
    const { rerender } = renderWithContext(<Switcher items={[]} isCollapsed />, { dir: "rtl" });
    rerender(<Switcher items={FLAT_ITEMS} isCollapsed defaultOpen />);
    // defaultOpen only applies at mount — open it explicitly.
    rerender(<Switcher items={FLAT_ITEMS} isCollapsed open onOpenChange={() => {}} />);
    expect(popoverContent()).toHaveAttribute("dir", "rtl");
    expect(popoverContent()).toHaveAttribute("data-side", "left");
  });

  it("F3: removing the focused option keeps keyboard focus in the list", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Switcher open onOpenChange={() => {}} />);
    await user.keyboard("{ArrowDown}"); // focus moves from Acme to Globex
    expect(optionNamed("Globex")).toHaveFocus();
    rerender(<Switcher items={FLAT_ITEMS.filter((i) => i.key !== "globex")} open onOpenChange={() => {}} />);
    expect(optionNamed("Acme")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(optionNamed("Ayşe")).toHaveFocus();
  });

  it("F4: the open-focus retry never pulls focus back from the footer", async () => {
    const frames: FrameRequestCallback[] = [];
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    render(<Switcher defaultOpen footerSlot={<button type="button">Create</button>} />);
    screen.getByRole("button", { name: "Create" }).focus();
    for (const cb of frames) cb(0);
    expect(screen.getByRole("button", { name: "Create" })).toHaveFocus();
    raf.mockRestore();
  });

  it("F5: an inline groups literal does not re-warn on every render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const items = [{ key: "x", label: "X", group: "nope" }];
    const { rerender } = render(<Switcher items={items} activeKey="x" groups={[{ id: "a", label: "A" }]} />);
    for (let i = 0; i < 4; i++) rerender(<Switcher items={items} activeKey="x" groups={[{ id: "a", label: "A" }]} />);
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("x → nope"))).toHaveLength(1);
    warn.mockRestore();
  });

  it.each(["{Control>}{ArrowDown}{/Control}", "{Meta>}{ArrowDown}{/Meta}", "{Shift>}{ArrowUp}{/Shift}"])(
    "F6: %s on the trigger does not open (left to the app)",
    async (keys) => {
      const user = userEvent.setup();
      render(<Switcher />);
      await user.tab();
      await user.keyboard(keys);
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    },
  );

  it("F6: Alt+ArrowDown still opens (APG)", async () => {
    const user = userEvent.setup();
    render(<Switcher />);
    await user.tab();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });
});

describe("U4 finder B — regressions", () => {
  it("B1: expanded width is the trigger width with no min-width floor; collapsed keeps the floor", () => {
    const { unmount } = render(<Switcher defaultOpen />);
    expect(popoverContent().className).not.toMatch(/\bmin-w-56\b/);
    unmount();
    render(<Switcher isCollapsed defaultOpen />);
    expect(popoverContent().className).toMatch(/\bmin-w-56\b/);
    expect(popoverContent().className).not.toContain("--radix-popover-trigger-width");
  });

  it("B3: keyboard focus has a ring that hover and the active row don't", () => {
    render(<Switcher defaultOpen />);
    for (const o of options()) expect(o.className).toContain("focus-visible:ring-2");
    expect(optionNamed("Acme").className).not.toMatch(/(^|\s)ring-2/);
  });
});
