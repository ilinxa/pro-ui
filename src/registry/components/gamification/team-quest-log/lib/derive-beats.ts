import type { DerivedBeat, Milestone, NarrativeChapter } from "../types";

/**
 * Derive each chapter's beat state from its milestone (LOCK — D-A2). Pure,
 * framework-free, SSR-safe, test-ready, order-independent (stable sort on
 * `NarrativeChapter.order`, `Milestone.order` tie-break):
 *
 *   done     = milestone.done === true
 *   current  = the FIRST not-done beat by order ("you are here")
 *   upcoming = the rest
 *
 * An unresolved `milestoneId` (no matching milestone) is treated as not-done
 * (so it can become current/upcoming) and flagged `unresolved` — the part warns
 * (dev-only) + renders it gracefully; **never throws**.
 */
export function deriveBeats(
  chapters: NarrativeChapter[],
  milestones: Milestone[],
): DerivedBeat[] {
  const byId = new Map(milestones.map((m) => [m.id, m]));

  const ordered = [...chapters].sort(
    (a, b) =>
      a.order - b.order ||
      (byId.get(a.milestoneId)?.order ?? 0) -
        (byId.get(b.milestoneId)?.order ?? 0),
  );

  let currentAssigned = false;
  return ordered.map((chapter) => {
    const milestone = byId.get(chapter.milestoneId);
    const unresolved = milestone === undefined;
    const done = milestone?.done === true;

    let state: DerivedBeat["state"];
    if (done) {
      state = "done";
    } else if (!currentAssigned) {
      state = "current";
      currentAssigned = true;
    } else {
      state = "upcoming";
    }

    return { chapter, milestone, state, unresolved };
  });
}
