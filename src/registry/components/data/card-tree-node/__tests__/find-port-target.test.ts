/**
 * FU-A reproduction + regression guard (card-tree-node v0.5.0).
 *
 * `lib/find-port-target.ts` shipped in v0.2.0 with a PRIVATE copy of the
 * `isCardLike` value-shape heuristic — "this object is a card if it carries
 * `__rcid` / `__rcorder` / `__rcmeta`, or its own `ports` array". v0.4.0
 * retired that heuristic everywhere else (`enumerateSubcards` now routes
 * through `classifyNodeKey`, mirroring card-tree's locked key precedence) but
 * deliberately left the walker alone, because correcting it needs the host's
 * key registrations threaded through the port-editor API — a change with its
 * own runtime-proof burden. That deferral is FU-A.
 *
 * The consequence is that the **viewer and the port editor disagree about
 * what a card is**, in both directions:
 *
 *   - MISS  — the viewer paints an `__rcid`-less object as a subcard outline
 *             (key-first: it is a plain object under a non-block key), but the
 *             walker refuses to descend through it, so no port target nested
 *             beneath it is reachable. The strip renders "No card found at
 *             this path." for ports the canvas is visibly drawing.
 *   - CLAIM — the viewer paints a registered custom block (or a built-in
 *             block) as a block, but the walker treats its payload as a card
 *             whenever that payload happens to carry `ports` or an `__rcid`,
 *             so `updateIn` will write a `ports` array *into a block payload*.
 *
 * Both directions are pinned below. The agreement invariant at the end is the
 * one that matters long-term: anything the viewer surfaces as an editable
 * subcard must resolve, and nothing it classifies as a block may.
 */
import { describe, expect, it } from "vitest";
import type { CanvasData, Port } from "../../flow-canvas/types";
import type { CardTreeCanvasNode } from "../types";
import { findPortTarget } from "../lib/find-port-target";
import { enumerateSubcards } from "../lib/enumerate-subcards";
import { CUSTOM_KEY_NAMES } from "./fixtures";

const keyOptions = {
  customKeyNames: CUSTOM_KEY_NAMES,
  disabledPredefinedKeys: [],
} as const;

const port = (id: string): Port => ({
  id,
  side: "left",
  dir: "in",
  type: "default",
});

function canvasOf(data: CardTreeCanvasNode): CanvasData {
  return {
    version: 1,
    nodes: [{ id: "n1", position: { x: 0, y: 0 }, data }],
    edges: [],
  };
}

/**
 * One card exercising every divergence at once:
 *
 *   plainChild   — object under an ordinary key with NO `__rcid`. The viewer
 *                  renders it (key-first) as a subcard outline; F-03 disables
 *                  its own click-to-focus, but flow-canvas's port walker still
 *                  finds `deepChild`'s handles beneath it.
 *   deepChild    — a genuine card WITH `__rcid` + ports, sitting under
 *                  plainChild. Only reachable if the walker descends through
 *                  an `__rcid`-less parent.
 *   metric       — a registered CUSTOM block whose payload carries both an
 *                  `__rcid` and a `ports` array. Viewer: block. Walker (old):
 *                  a card.
 *   table        — a BUILT-IN block, same trap.
 *   realChild    — the ordinary case: `__rcid` + ports under a plain key.
 *                  Must keep resolving; this is the no-regression anchor.
 */
const divergentCard: CardTreeCanvasNode = {
  __type: "card-tree",
  __rcid: "root",
  title: "Divergent",
  ports: [port("root-in")],
  realChild: {
    __rcid: "real-child",
    title: "Real child",
    ports: [port("rc-in")],
  },
  plainChild: {
    title: "Never round-tripped through <CardTree>",
    deepChild: {
      __rcid: "deep-child",
      title: "Deep child",
      ports: [port("dc-in")],
    },
  },
  metric: { __rcid: "metric-payload", value: 94, ports: [port("m-in")] },
  table: {
    __rcid: "table-payload",
    headers: ["a"],
    rows: [[1]],
    ports: [port("t-in")],
  },
};

describe("findPortTarget: the ordinary paths still resolve (no-regression)", () => {
  it("targets the root card when subPath is undefined", () => {
    const target = findPortTarget(canvasOf(divergentCard), "n1", undefined, keyOptions);
    expect(target).not.toBeNull();
    expect(target!.cardRcid).toBe("root");
    expect(target!.ports.map((p) => p.id)).toEqual(["root-in"]);
  });

  it("resolves a depth-1 child that carries its own __rcid", () => {
    const target = findPortTarget(canvasOf(divergentCard), "n1", "real-child", keyOptions);
    expect(target).not.toBeNull();
    expect(target!.ports.map((p) => p.id)).toEqual(["rc-in"]);
  });

  it("returns null for an unknown node id and for an unmatched subPath", () => {
    expect(findPortTarget(canvasOf(divergentCard), "nope", undefined, keyOptions)).toBeNull();
    expect(findPortTarget(canvasOf(divergentCard), "n1", "no-such-rcid", keyOptions)).toBeNull();
  });
});

describe("FU-A / MISS: the walker descends through an __rcid-less parent", () => {
  it("resolves a card nested under a parent the old heuristic could not see", () => {
    const target = findPortTarget(canvasOf(divergentCard), "n1", "deep-child", keyOptions);
    expect(target).not.toBeNull();
    expect(target!.cardRcid).toBe("deep-child");
    expect(target!.ports.map((p) => p.id)).toEqual(["dc-in"]);
  });

  it("writes through that parent without disturbing its siblings", () => {
    const canvas = canvasOf(divergentCard);
    const target = findPortTarget(canvas, "n1", "deep-child", keyOptions)!;
    const next = target.updateIn([port("dc-in"), port("dc-out")]);

    const root = next.nodes[0].data as CardTreeCanvasNode;
    const plainChild = root.plainChild as Record<string, unknown>;
    const deepChild = plainChild.deepChild as Record<string, unknown>;
    expect((deepChild.ports as Port[]).map((p) => p.id)).toEqual(["dc-in", "dc-out"]);

    // the intermediate keeps its own content, and untouched branches are intact
    expect(plainChild.title).toBe("Never round-tripped through <CardTree>");
    expect((root.realChild as Record<string, unknown>).ports).toEqual([port("rc-in")]);

    // pure — the input canvas is untouched
    const original = canvasOf(divergentCard).nodes[0].data as CardTreeCanvasNode;
    expect(
      ((original.plainChild as Record<string, unknown>).deepChild as Record<string, unknown>)
        .ports,
    ).toEqual([port("dc-in")]);
  });
});

describe("FU-A / CLAIM: block payloads are not port targets", () => {
  it("refuses a registered custom block whose payload carries __rcid + ports", () => {
    expect(
      findPortTarget(canvasOf(divergentCard), "n1", "metric-payload", keyOptions),
    ).toBeNull();
  });

  it("refuses a built-in block whose payload carries __rcid + ports", () => {
    expect(
      findPortTarget(canvasOf(divergentCard), "n1", "table-payload", keyOptions),
    ).toBeNull();
  });

  it("treats an UNregistered key by value, so the same payload IS a card without the registration", () => {
    // `metric` is only a block because the host registered it. Drop the
    // registration and the viewer classifies it as a child card — the walker
    // must follow, or the two disagree again in the opposite direction.
    const target = findPortTarget(canvasOf(divergentCard), "n1", "metric-payload", {
      customKeyNames: [],
      disabledPredefinedKeys: [],
    });
    expect(target).not.toBeNull();
    expect(target!.ports.map((p) => p.id)).toEqual(["m-in"]);
  });

  it("defaults to zero registrations when options are omitted", () => {
    // Back-compat for v0.2–v0.4 call sites: no options === no custom keys.
    // Built-ins are unconditional, so `table` stays a block either way.
    expect(findPortTarget(canvasOf(divergentCard), "n1", "table-payload")).toBeNull();
    expect(findPortTarget(canvasOf(divergentCard), "n1", "metric-payload")).not.toBeNull();
  });
});

describe("FU-A: the viewer and the port editor agree", () => {
  it("resolves every subcard the viewer surfaces with an __rcid", () => {
    const subcards = enumerateSubcards(divergentCard, keyOptions);
    // the viewer's depth-1 outlines: realChild + plainChild (blocks excluded)
    expect(subcards.map((s) => s.key).sort()).toEqual(["plainChild", "realChild"]);

    for (const { card } of subcards) {
      if (typeof card.__rcid !== "string") continue;
      expect(
        findPortTarget(canvasOf(divergentCard), "n1", card.__rcid, keyOptions),
        `subcard ${card.__rcid} is drawn by the viewer but unreachable from the port editor`,
      ).not.toBeNull();
    }
  });

  it("resolves nothing the viewer classifies as a block", () => {
    const blockRcids = ["metric-payload", "table-payload"];
    for (const rcid of blockRcids) {
      expect(
        findPortTarget(canvasOf(divergentCard), "n1", rcid, keyOptions),
        `${rcid} is a block payload; the port editor must not write ports into it`,
      ).toBeNull();
    }
  });

  it("treats a non-reserved __rc-prefixed key exactly as the viewer does", () => {
    // Surfaced by the v0.5.0 self-review. The retired heuristic skipped ANY
    // key starting with `__rc`; `RESERVED_KEYS` is only the three real ones
    // (`__rcid` / `__rcorder` / `__rcmeta`), so `__rcfoo` is now walkable
    // where it used to be skipped. That is a widening — but it is the SAME
    // widening `enumerateSubcards` already took at v0.4.0, so the two agree.
    // Pinned here so a future reader meets it as a decision, not a surprise.
    const card: CardTreeCanvasNode = {
      __type: "card-tree",
      __rcid: "root",
      __rcfoo: { __rcid: "odd-child", ports: [port("odd-in")] },
    };
    expect(enumerateSubcards(card, keyOptions).map((s) => s.key)).toEqual(["__rcfoo"]);
    expect(findPortTarget(canvasOf(card), "n1", "odd-child", keyOptions)).not.toBeNull();
  });

  it("follows card-tree's opt-out semantics for a disabled built-in", () => {
    // card-tree demotes an opted-out built-in to a plain FIELD without
    // inspecting the value — so an object-valued one is neither block nor
    // child. The viewer drops it; the walker must too.
    const disabled = {
      customKeyNames: CUSTOM_KEY_NAMES,
      disabledPredefinedKeys: ["table"],
    } as const;
    expect(enumerateSubcards(divergentCard, disabled).map((s) => s.key).sort()).toEqual([
      "plainChild",
      "realChild",
    ]);
    expect(
      findPortTarget(canvasOf(divergentCard), "n1", "table-payload", disabled),
    ).toBeNull();
  });
});
