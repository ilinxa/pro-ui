/**
 * C11 kit for EngagementBar: the six contract checks. The kit passes `props` into `render`, so
 * `render` routes bar-level keys to the bar and everything else to the like action.
 */
import { expect } from "vitest";
import { EngagementBar } from "../engagement-bar";
import type { EngagementAction } from "../types";
import { describeContract } from "../../../../../../tests/helpers";
import { installDomStubs, KINDS } from "./support";

const BAR_KEYS = ["labels", "variant", "dir", "locale", "reaction"] as const;

function renderBar(props: Record<string, unknown> = {}) {
  const bar: Record<string, unknown> = {};
  const like: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if ((BAR_KEYS as readonly string[]).includes(k)) bar[k] = v;
    else like[k] = v;
  }
  const { reaction, ...barProps } = bar;
  const actions: EngagementAction[] = [
    { kind: "like", count: 12, ...like } as EngagementAction,
    { kind: "comment", count: 3 },
    { kind: "share", count: 2 },
    { kind: "bookmark" },
    { kind: "view-count", count: 1234 },
  ];
  if (reaction) actions.push({ kind: "reaction", kinds: KINDS, totalCount: 9, ...(reaction as object) } as EngagementAction);
  return <EngagementBar actions={actions} {...barProps} />;
}

const likeBtn = (s: typeof import("@testing-library/react").screen) => s.getByRole("button", { name: /^(Like|Unlike|Beğen)/ });

describeContract("EngagementBar", {
  render: renderBar,
  setup: installDomStubs,
  renders: (s) => {
    expect(s.getByRole("button", { name: "Like 12" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Comment 3" })).toBeInTheDocument();
    expect(s.getByRole("button", { name: "Bookmark" })).toBeInTheDocument();
  },
  labels: {
    props: { labels: { like: "Beğen" } },
    expect: (s) => expect(s.getByRole("button", { name: /^Beğen/ })).toHaveAccessibleName("Beğen 12"),
  },
  controlled: {
    initial: { liked: false, count: 12 },
    next: { liked: true, count: 13 },
    callback: "onToggle",
    expectInitial: (s) => {
      expect(likeBtn(s)).toHaveAccessibleName("Like 12");
      expect(likeBtn(s)).toHaveAttribute("aria-pressed", "false");
    },
    expectNext: (s) => {
      expect(likeBtn(s)).toHaveAccessibleName("Unlike 13");
      expect(likeBtn(s)).toHaveAttribute("aria-pressed", "true");
    },
    request: async (user, s) => {
      await user.click(likeBtn(s));
    },
  },
  rtl: {
    props: { reaction: {} },
    expect: (s, root) => {
      expect(root).toHaveAttribute("dir", "rtl");
      expect(root.querySelector("[dir='rtl'] button")).not.toBeNull();
      // DOM order is logical (start group first), CSS mirrors it.
      const like = s.getByRole("button", { name: "Like 12" });
      const bookmark = s.getByRole("button", { name: "Bookmark" });
      expect(like.compareDocumentPosition(bookmark) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    },
  },
  keyboard: {
    props: { reaction: {} },
    run: async (user, s) => {
      const trigger = s.getByRole("button", { name: "React 9" });
      trigger.focus();
      await user.keyboard("{Enter}");
      const love = await s.findByRole("button", { name: /^Love/ });
      love.focus();
      await user.keyboard("{ArrowRight}");
    },
    expect: (s) => {
      expect(s.getByRole("button", { name: /^Laugh/ })).toHaveFocus();
    },
  },
  axeStates: [
    { count: null },
    { disabled: true },
    { variant: "compact" },
    { variant: "stacked" },
    { reaction: {} },
    { liked: true, count: 0 },
  ],
});
