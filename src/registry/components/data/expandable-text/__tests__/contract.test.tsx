/**
 * Reference use of the consumer-contract kit (C11 / Part 1 R9): the six checks for
 * ExpandableText. Copy this shape for a component closed under the contract; per-bug
 * regression tests go in their own files next to it.
 *
 * jsdom has no layout, so `setup` reports a paragraph taller than `maxLines` (the toggle
 * only renders when the text is actually clamped) and stubs ResizeObserver.
 */
import { expect } from "vitest";
import { ExpandableText } from "../expandable-text";
import { describeContract, mockLayout, mockResizeObserver } from "../../../../../../tests/helpers";

const LONG = "Ahmet paylaştı: bugün kampüste uzun bir yürüyüş yaptık ve çok güzel fotoğraflar çektik.";
const toggle = (s: typeof import("@testing-library/react").screen) => s.getByRole("button");

describeContract("ExpandableText", {
  render: (props) => <ExpandableText content={LONG} maxLines={2} {...props} />,
  setup: () => {
    const restoreLayout = mockLayout({ scrollHeight: 200, lineHeight: "20px" });
    const restoreObserver = mockResizeObserver();
    return () => {
      restoreObserver();
      restoreLayout();
    };
  },
  renders: (s) => {
    expect(s.getByText(LONG)).toBeInTheDocument();
    expect(toggle(s)).toHaveAccessibleName("Show more");
    expect(toggle(s)).toHaveAttribute("aria-expanded", "false");
  },
  labels: {
    props: { labels: { showMore: "Devamını gör" } },
    expect: (s) => expect(toggle(s)).toHaveAccessibleName("Devamını gör"),
  },
  controlled: {
    initial: { expanded: false },
    next: { expanded: true },
    callback: "onExpandedChange",
    expectInitial: (s) => expect(toggle(s)).toHaveAttribute("aria-expanded", "false"),
    expectNext: (s) => expect(toggle(s)).toHaveAccessibleName("Show less"),
    request: (user, s) => user.click(toggle(s)),
  },
  rtl: {
    props: { content: "شارك أحمد: قمنا اليوم بنزهة طويلة في الحرم الجامعي والتقطنا صوراً جميلة جداً." },
    expect: (s) => expect(toggle(s)).toBeInTheDocument(),
  },
  keyboard: {
    run: async (user) => {
      await user.tab();
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      expect(toggle(s)).toHaveFocus();
      expect(toggle(s)).toHaveAttribute("aria-expanded", "true");
    },
  },
  axeStates: [{ defaultExpanded: true }],
});
