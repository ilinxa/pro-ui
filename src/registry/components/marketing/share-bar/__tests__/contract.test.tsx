/**
 * Consumer-contract kit (C11) for ShareBar. `controlled` does not apply: the bar renders
 * no caller-owned value (copy feedback is transient internal state, not controlled data).
 */
import { waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { ShareBar } from "../share-bar";
import { describeContract } from "../../../../../../tests/helpers";

const TARGETS = [{ kind: "twitter" as const }, { kind: "copy" as const }];

describeContract("ShareBar", {
  setup: () => {
    const nav = navigator as unknown as Record<string, unknown>;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: { writeText: () => Promise.resolve() },
    });
    return () => {
      delete nav.clipboard;
    };
  },
  render: (props) => <ShareBar targets={TARGETS} url="https://example.com/p" title="Post" headingAs="h4" {...props} />,
  renders: (s) => {
    expect(s.getByRole("group", { name: "Share" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Share on X" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  },
  labels: {
    props: { labels: { heading: "Paylaş", targets: { twitter: "X'te paylaş", copy: "Bağlantıyı kopyala" } } },
    expect: (s) => {
      expect(s.getByRole("group", { name: "Paylaş" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "X'te paylaş" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Bağlantıyı kopyala" })).toBeInTheDocument();
    },
  },
  controlled: {
    notApplicable:
      "no caller-owned value: copy feedback is transient internal state and there is no value/onChange pair",
  },
  rtl: {
    props: { labels: { heading: "مشاركة", targets: { twitter: "مشاركة على إكس", copy: "نسخ الرابط" } } },
    expect: (s, root) => {
      expect(s.getByRole("group", { name: "مشاركة" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "نسخ الرابط" })).toBeInTheDocument();
      expect(root.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
      // Logical layout only: the row follows the inherited direction (no row-reverse / physical margins).
      expect(root.innerHTML).not.toMatch(/row-reverse|\b(?:ml|mr|pl|pr)-\d/);
    },
  },
  keyboard: {
    run: async (user, s) => {
      await user.tab();
      await user.tab();
      await user.keyboard("{Enter}");
      // Enter activated Copy link: the copy resolves and the live region announces it.
      await waitFor(() => expect(s.getByRole("status")).toHaveTextContent("Link copied"));
    },
    expect: (s) => {
      expect(s.getByRole("button", { name: "Copy link" })).toHaveFocus();
    },
  },
  axeStates: [{ headingAs: null }, { targets: [{ kind: "twitter", disabled: true }, { kind: "copy" }] }],
});
