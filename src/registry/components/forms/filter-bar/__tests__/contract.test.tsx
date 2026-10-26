/** Consumer-contract kit (C11) for FilterBar — controlled data is `category` / `onCategoryChange`. */
import { expect } from "vitest";
import { FilterBar } from "../filter-bar";
import { describeContract } from "../../../../../../tests/helpers";

const CATS = [
  { value: "tech", label: "Teknoloji" },
  { value: "events", label: "Etkinlik" },
];
const AR = [
  { value: "tech", label: "التقنية" },
  { value: "events", label: "الفعاليات" },
];

describeContract("FilterBar", {
  render: (props) => <FilterBar categories={CATS} {...props} />,
  renders: (s) => {
    expect(s.getByRole("search")).toBeInTheDocument();
    expect(s.getByRole("group", { name: "Filter by category" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(s.getByRole("button", { name: "Teknoloji" })).toHaveAttribute("aria-pressed", "false");
  },
  labels: {
    props: {
      labels: {
        searchAriaLabel: "Haber arama",
        allLabel: "Tümü",
        categoriesAriaLabel: "Kategori",
        dateButtonText: "Tarih",
      },
    },
    expect: (s) => {
      expect(s.getByRole("searchbox", { name: "Haber arama" })).toBeInTheDocument();
      expect(s.getByRole("group", { name: "Kategori" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Tümü" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Tarih" })).toBeInTheDocument();
    },
  },
  controlled: {
    initial: { category: "tech" },
    next: { category: "events" },
    callback: "onCategoryChange",
    expectInitial: (s) => {
      expect(s.getByRole("button", { name: "Teknoloji" })).toHaveAttribute("aria-pressed", "true");
      expect(s.getByRole("button", { name: "Etkinlik" })).toHaveAttribute("aria-pressed", "false");
    },
    expectNext: (s) => {
      expect(s.getByRole("button", { name: "Etkinlik" })).toHaveAttribute("aria-pressed", "true");
      expect(s.getByRole("button", { name: "Teknoloji" })).toHaveAttribute("aria-pressed", "false");
    },
    request: (user, s) => user.click(s.getByRole("button", { name: "Etkinlik" })),
  },
  rtl: {
    props: {
      categories: AR,
      locale: "ar",
      labels: { searchAriaLabel: "بحث", allLabel: "الكل", categoriesAriaLabel: "الفئات", dateButtonText: "التاريخ" },
    },
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      expect(s.getByRole("group", { name: "الفئات" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "التقنية" })).toBeInTheDocument();
    },
  },
  keyboard: {
    run: async (user) => {
      await user.tab(); // search box
      await user.tab(); // "All"
      await user.tab(); // first category
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      const first = s.getByRole("button", { name: "Teknoloji" });
      expect(first).toHaveFocus();
      expect(first).toHaveAttribute("aria-pressed", "true");
    },
  },
  axeStates: [
    { category: "tech", resultsCount: 3, searchAccessory: <button type="button" aria-label="Options">o</button> },
    { hideSearch: true, hideDateRange: true, align: "right" },
  ],
});
