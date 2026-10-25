/**
 * Consumer-contract kit (C11) for EmptyState. All copy comes from the host and the component holds no
 * state, so `labels` and `controlled` are not applicable; the keyboard path is Tab to the action + Enter.
 */
import { expect, vi } from "vitest";
import { EmptyState } from "../empty-state";
import { describeContract } from "../../../../../../tests/helpers";

const onAction = vi.fn();
const button = (s: typeof import("@testing-library/react").screen) => s.getByRole("button", { name: "Clear filters" });

describeContract("EmptyState", {
  render: (props) => (
    <EmptyState
      variant="search"
      title="No results"
      description="Try a different term."
      action={{ label: "Clear filters", onClick: onAction }}
      {...props}
    />
  ),
  renders: (s) => {
    expect(s.getByRole("heading", { name: "No results" })).toBeInTheDocument();
    expect(button(s)).toBeInTheDocument();
  },
  labels: { notApplicable: "all copy comes from the host (title, description, action labels); the component ships no strings" },
  controlled: { notApplicable: "stateless presentational widget: no controlled value, the host decides when it renders" },
  rtl: {
    props: { title: "لا توجد نتائج", description: "جرّب كلمة مختلفة.", action: { label: "مسح", onClick: onAction } },
    expect: (s, root) => {
      expect(root.closest("[dir='rtl']")).not.toBeNull();
      expect(s.getByRole("heading", { name: "لا توجد نتائج" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "مسح" })).toBeInTheDocument();
      // Centered column: nothing is physically left/right-aligned, so RTL needs no mirroring.
      expect(root.querySelector(".text-center")).not.toBeNull();
      const own = root.querySelector("[role='status']") as HTMLElement; // the component root (shadcn Button internals excluded)
      expect(own.className).not.toMatch(/(^|\s)(ml|mr|pl|pr|left|right)-/);
    },
  },
  keyboard: {
    run: async (user) => {
      onAction.mockClear();
      await user.tab();
      await user.keyboard("{Enter}");
    },
    expect: (s) => {
      expect(button(s)).toHaveFocus();
      expect(onAction).toHaveBeenCalledTimes(1);
    },
  },
  axeStates: [
    { variant: "error" },
    { variant: "permission", action: undefined },
    { action: { label: "Open", href: "/x" } },
    { action: { label: "Open", href: "/x", disabled: true } },
  ],
});
