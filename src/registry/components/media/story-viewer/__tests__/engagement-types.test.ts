/**
 * story-viewer 0.6.0 - the inline copy of engagement-bar's action type must stay assignable to
 * the real one (that is what lets `parts/engagement-overlay.tsx` drop its `as any`). The
 * assertions are compile-time: `pnpm tsc --noEmit` fails when the copies drift. The
 * `@ts-expect-error` lines prove the check is not vacuous.
 */
import { describe, expect, it } from "vitest";
import type {
  EngagementAction,
  EngagementBarLabels,
} from "@/registry/components/data/engagement-bar/types";
import type { StoryEngagementAction, StoryEngagementBarLabels } from "../types";

describe("inline engagement types vs engagement-bar", () => {
  it("StoryEngagementAction is assignable to EngagementAction", () => {
    const widen = (action: StoryEngagementAction): EngagementAction => action;
    const label = (labels: StoryEngagementBarLabels): EngagementBarLabels => labels;
    const sample: StoryEngagementAction = {
      kind: "like",
      count: null,
      align: "start",
      hidden: false,
      onToggle: () => Promise.resolve(),
    };
    expect(widen(sample)).toBe(sample);
    expect(label({ like: "x" })).toEqual({ like: "x" });
  });

  it("0.6.2 - the comment / share disclosure fields stay assignable (engagement-bar 0.7.0)", () => {
    const widen = (action: StoryEngagementAction): EngagementAction => action;
    const samples: StoryEngagementAction[] = [
      { kind: "comment", count: 2, expanded: true, controls: "sheet-c", onClick: () => {} },
      { kind: "share", expanded: false, controls: "sheet-s", onClick: () => {} },
    ];
    expect(samples.map(widen)).toEqual(samples);
  });

  it("the assignability check can fail (non-vacuous)", () => {
    // @ts-expect-error - an arm the real type does not have
    const bad: EngagementAction = { kind: "nope" };
    // @ts-expect-error - a made-up alignment value
    const bad2: EngagementAction = { kind: "like", align: "middle" };
    expect([bad, bad2]).toHaveLength(2);
  });
});
