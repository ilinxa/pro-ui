/** Consumer-contract kit (C11) for CategoryCloud — controlled data is `value` / `onChange`. */
import { expect } from "vitest";
import { CategoryCloud } from "../category-cloud";
import { describeContract } from "../../../../../../tests/helpers";

const ITEMS = [
  { value: "tech", label: "Teknoloji", count: 12 },
  { value: "events", label: "Etkinlik", count: 3 },
];
const AR = [
  { value: "tech", label: "التقنية", count: 12 },
  { value: "events", label: "الفعاليات", count: 3 },
];

describeContract("CategoryCloud", {
  render: (props) => <CategoryCloud items={ITEMS} {...props} />,
  renders: (s) => {
    expect(s.getByRole("group", { name: "Categories" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Teknoloji (12)" })).toHaveAttribute("aria-pressed", "false");
  },
  labels: {
    props: { labels: { group: "Kategoriler", count: (_n: number, f: string) => ` · ${f} yazı` } },
    expect: (s) => {
      expect(s.getByRole("group", { name: "Kategoriler" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Teknoloji · 12 yazı" })).toBeInTheDocument();
    },
  },
  controlled: {
    initial: { value: "tech" },
    next: { value: "events" },
    callback: "onChange",
    expectInitial: (s) => {
      expect(s.getByRole("button", { name: /Teknoloji/ })).toHaveAttribute("aria-pressed", "true");
      expect(s.getByRole("button", { name: /Etkinlik/ })).toHaveAttribute("aria-pressed", "false");
    },
    expectNext: (s) => {
      expect(s.getByRole("button", { name: /Etkinlik/ })).toHaveAttribute("aria-pressed", "true");
      expect(s.getByRole("button", { name: /Teknoloji/ })).toHaveAttribute("aria-pressed", "false");
    },
    request: (user, s) => user.click(s.getByRole("button", { name: /Etkinlik/ })),
  },
  rtl: {
    props: { items: AR, locale: "ar" },
    expect: (s) => {
      expect(s.getByRole("group")).toBeInTheDocument();
      expect(s.getAllByRole("button")).toHaveLength(2);
    },
  },
  keyboard: {
    run: async (user) => {
      await user.tab();
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      const first = s.getByRole("button", { name: /Teknoloji/ });
      expect(first).toHaveFocus();
      expect(first).toHaveAttribute("aria-pressed", "true");
    },
  },
  axeStates: [
    { value: "tech" },
    { getHref: (i: { value: string }) => `/c/${i.value}`, value: "tech", title: "Kategoriler" },
  ],
});
