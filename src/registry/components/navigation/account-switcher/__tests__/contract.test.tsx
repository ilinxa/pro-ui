/**
 * Consumer-contract kit (C11) for AccountSwitcher. The kit's axe passes cover the render
 * container; the popover is portaled to <body>, so `hardening.test.tsx` runs axe over the
 * open list there.
 */
import { expect } from "vitest";
import { describeContract } from "../../../../../../tests/helpers";
import { AR_ITEMS, Switcher, installDomStubs, popoverContent } from "./support";

const trigger = (s: typeof import("@testing-library/react").screen) => s.getAllByRole("button")[0]!;

describeContract("AccountSwitcher", {
  render: (props) => <Switcher {...props} />,
  setup: installDomStubs,
  renders: (s) => {
    expect(trigger(s)).toHaveAccessibleName("Switch account context, current: Acme");
    expect(trigger(s)).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger(s)).toHaveAttribute("aria-expanded", "false");
  },
  labels: {
    props: { labels: { trigger: (current: string | null) => `Hesap değiştir, şu anki: ${current}` } },
    expect: (s) => expect(trigger(s)).toHaveAccessibleName("Hesap değiştir, şu anki: Acme"),
  },
  controlled: {
    initial: { open: false },
    next: { open: true },
    callback: "onOpenChange",
    expectInitial: (s) => expect(trigger(s)).toHaveAttribute("aria-expanded", "false"),
    expectNext: (s) => expect(s.getByRole("listbox")).toBeInTheDocument(),
    request: (user, s) => user.click(trigger(s)),
  },
  rtl: {
    props: { items: AR_ITEMS, activeKey: "me", isCollapsed: true, defaultOpen: true },
    // AW4 + U0-2: the portaled list carries the section's direction, and the collapsed
    // popover opens toward the inline end (left in RTL).
    expect: () => {
      expect(popoverContent()).toHaveAttribute("dir", "rtl");
      expect(popoverContent()).toHaveAttribute("data-side", "left");
    },
  },
  keyboard: {
    // AW1: ↓ on the trigger opens on the active option; End → last; Enter selects and closes.
    run: async (user) => {
      await user.tab();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{End}");
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      expect(trigger(s)).toHaveFocus();
      expect(trigger(s)).toHaveAttribute("aria-expanded", "false");
    },
  },
  axeStates: [{ isCollapsed: true }, { items: [] }],
});
