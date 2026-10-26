/**
 * Consumer-contract checks (C11) for CarouselComposer: render, labels override, controlled
 * `value` + `onChange`, RTL render with axe, a keyboard path, axe.
 */
import { expect } from "vitest";
import { CarouselComposer } from "../carousel-composer";
import { describeContract, mockResizeObserver } from "../../../../../../tests/helpers";
import { ITEMS } from "./support";

const thumbs = (s: typeof import("@testing-library/react").screen) =>
  s.getAllByRole("button", { name: /Media item \d+ of \d+/ });

describeContract("CarouselComposer", {
  render: (props) => <CarouselComposer {...props} />,
  setup: () => mockResizeObserver(),
  renders: (s) => {
    expect(s.getByText("Drag photos & videos here")).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Browse" })).toBeInTheDocument();
  },
  labels: {
    props: { labels: { dropzoneTitle: "Fotoğraf sürükleyin", dropzoneBrowse: "Gözat" } },
    expect: (s) => {
      expect(s.getByText("Fotoğraf sürükleyin")).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Gözat" })).toBeInTheDocument();
      expect(s.queryByText("Drag photos & videos here")).toBeNull();
    },
  },
  controlled: {
    initial: { value: ITEMS },
    next: { value: [ITEMS[0]] },
    callback: "onChange",
    expectInitial: (s) => expect(thumbs(s)).toHaveLength(2),
    expectNext: (s) => expect(thumbs(s)).toHaveLength(1),
    request: async (user, s) => {
      await user.click(s.getAllByRole("button", { name: /^Remove item \d+ of \d+$/ })[0]);
    },
  },
  rtl: {
    props: {
      value: ITEMS,
      labels: { removeItem: () => "إزالة", itemAria: ({ position }: { position: number }) => `العنصر ${position}` },
    },
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      expect(s.getByRole("button", { name: "العنصر 1" })).toBeInTheDocument();
      expect(s.getAllByRole("button", { name: "إزالة" })).toHaveLength(2);
    },
  },
  keyboard: {
    props: { value: ITEMS },
    run: async (user) => {
      await user.tab();
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      const [first] = thumbs(s);
      expect(first).toHaveFocus();
      expect(first).toHaveAttribute("aria-current", "true");
    },
  },
  axeStates: [
    {
      value: [
        { ...ITEMS[0], status: "uploading", progress: 0.4 },
        { ...ITEMS[1], status: "error", error: "Network lost" },
      ],
      onRetry: () => {},
    },
    { value: ITEMS, enableAltText: true },
  ],
});
