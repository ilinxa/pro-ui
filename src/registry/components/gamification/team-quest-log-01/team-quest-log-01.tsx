"use client";

import * as React from "react";

import { TeamQuestNameEditor } from "./parts/team-quest-name-editor";
import { TeamQuestChapters } from "./parts/team-quest-chapters";
import { TeamQuestLogRoot } from "./parts/team-quest-log-root";
import type { TeamQuestLogHandle, TeamQuestLogProps } from "./types";

/**
 * Tier A — the batteries-included assembly: `Root` + `TeamQuestNameEditor`
 * (gated by `showNameEditor`) + `TeamQuestChapters` (gated by `showChapters`).
 * Contains **no logic the parts don't** — a hand-assembled layout (`Root` + a
 * subset of parts) gets identical title resolution, beat derivation, and
 * fire-once telemetry. Forwards the imperative handle from `Root`.
 *
 * A light team narrative overlay: a skippable quest name (never forced) + a
 * milestone-chapter timeline (done / current / upcoming), team-scoped.
 */
export const TeamQuestLog01 = React.forwardRef<
  TeamQuestLogHandle,
  TeamQuestLogProps
>(function TeamQuestLog01(
  { showNameEditor = true, showChapters = true, ...rest },
  ref,
) {
  return (
    <TeamQuestLogRoot ref={ref} {...rest}>
      {showNameEditor ? <TeamQuestNameEditor /> : null}
      {showChapters ? <TeamQuestChapters /> : null}
    </TeamQuestLogRoot>
  );
});
