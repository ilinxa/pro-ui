/**
 * Week/Day time-grid overlap packing — pure. Classic greedy interval-graph
 * column assignment: overlapping timed events split into side-by-side lanes;
 * each cluster reports its lane count so blocks can size to `1 / laneCount`.
 */
import type { CalendarOccurrence } from "../types";

export type PackedBlock = {
  occ: CalendarOccurrence;
  lane: number; // 0-based column within its cluster
  laneCount: number; // columns in the cluster (block width = 1 / laneCount)
};

export function packLanes(timed: CalendarOccurrence[]): PackedBlock[] {
  const sorted = [...timed].sort(
    (a, b) => a.startMs - b.startMs || a.endMs - b.endMs,
  );

  const out: PackedBlock[] = [];
  let cluster: { occ: CalendarOccurrence; lane: number }[] = [];
  let clusterEnd = -Infinity;
  const laneEnds: number[] = []; // end ms per active lane

  const flush = () => {
    if (!cluster.length) return;
    const laneCount = Math.max(1, ...cluster.map((c) => c.lane + 1));
    for (const c of cluster) out.push({ occ: c.occ, lane: c.lane, laneCount });
    cluster = [];
    laneEnds.length = 0;
  };

  for (const occ of sorted) {
    // A gap with no overlap closes the current cluster.
    if (cluster.length && occ.startMs >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= occ.startMs);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(occ.endMs);
    } else {
      laneEnds[lane] = occ.endMs;
    }
    cluster.push({ occ, lane });
    clusterEnd = Math.max(clusterEnd, occ.endMs);
  }
  flush();
  return out;
}

/** Vertical placement of a timed block within a day column, as 0..1 fractions. */
export function blockOffsets(
  occ: CalendarOccurrence,
  dayStartMs: number,
): { top: number; height: number } {
  const dayMs = 86_400_000;
  const top = Math.max(0, (occ.startMs - dayStartMs) / dayMs);
  const rawH = (occ.endMs - occ.startMs) / dayMs;
  // Minimum height so a very short event is still tappable.
  const height = Math.min(1 - top, Math.max(rawH, 0.02));
  return { top, height };
}
