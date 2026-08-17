/**
 * T2/T3 — the headline invariant (I2 in the v0.6.0 probe): an array-valued
 * custom block classified as a block (not a child), keeps the `custom: true`
 * discriminant, serializes byte-identically, and is a fixed point under a
 * second parse -> serialize round trip.
 *
 * Ported from e:/tmp/card-tree-v060-invariant-probe.ts "I2" section.
 */
import { describe, expect, it } from "vitest";
import { parseInput } from "../lib/parse";
import { treeToJsonNode } from "../lib/serialize";
import { resolveCustomKeys } from "../lib/custom-keys";
import type { CardTreeJsonNode } from "../types";
import { bodyKey, metricKey } from "./fixtures";

describe("round-trip: array-valued custom block", () => {
  const resolved = resolveCustomKeys([bodyKey, metricKey]);
  const input = {
    title: "Post",
    metric: { value: 94, unit: "% task success" },
    body: [
      { type: "heading", level: 2, text: "Why arrays matter" },
      { type: "paragraph", text: "Plate Value documents are arrays of blocks." },
    ],
  };

  const r1 = parseInput(input as unknown as CardTreeJsonNode, {
    disabledPredefinedKeys: [],
    dateDetection: "auto",
    customKeys: resolved.keys,
  });

  it("produces a tree with no parse errors", () => {
    expect(r1.tree).not.toBeNull();
    expect(r1.errors).toEqual([]);
  });

  it("classifies the array-valued key as a predefined entry, not a child card", () => {
    const bodyEntry = r1.tree?.predefined.find((p) => p.key === "body");
    expect(bodyEntry).toBeTruthy();
    expect(r1.tree?.children.length ?? -1).toBe(0);
  });

  it("keeps the `custom: true` discriminant on the entry", () => {
    const bodyEntry = r1.tree?.predefined.find((p) => p.key === "body");
    expect(bodyEntry && "custom" in bodyEntry && bodyEntry.custom).toBe(true);
  });

  it("keeps the value as an array (not coerced/flattened)", () => {
    const bodyEntry = r1.tree?.predefined.find((p) => p.key === "body");
    expect(Array.isArray((bodyEntry as { value: unknown })?.value)).toBe(true);
  });

  const out1 = treeToJsonNode(r1.tree!);

  it("serialize deep-equals the input array verbatim", () => {
    expect(JSON.stringify(out1.body)).toBe(JSON.stringify(input.body));
  });

  it("serialize deep-equals the input object verbatim", () => {
    expect(JSON.stringify(out1.metric)).toBe(JSON.stringify(input.metric));
  });

  it("FIXED POINT: parse(serialize(parse(x))) is byte-identical on the second round trip", () => {
    const r2 = parseInput(out1 as unknown as CardTreeJsonNode, {
      disabledPredefinedKeys: [],
      dateDetection: "auto",
      customKeys: resolved.keys,
    });
    const out2 = treeToJsonNode(r2.tree!);
    expect(JSON.stringify(out2)).toBe(JSON.stringify(out1));
  });
});

describe("round-trip: Q-P4 still holds for unregistered arrays", () => {
  it("an unregistered array at a child position still errors", () => {
    const resolved = resolveCustomKeys([bodyKey, metricKey]);
    const r = parseInput(
      { title: "x", notRegistered: [{ a: 1 }] } as unknown as CardTreeJsonNode,
      {
        disabledPredefinedKeys: [],
        dateDetection: "auto",
        customKeys: resolved.keys,
      },
    );
    expect(
      r.errors.some((e) => e.message.includes("array values are not supported")),
    ).toBe(true);
  });
});

describe("round-trip: no-registration regression (byte-identical to v0.5.0 behaviour)", () => {
  const input = {
    title: "Post",
    metric: { value: 94, unit: "% task success" },
    body: [{ type: "heading", level: 2, text: "Why arrays matter" }],
  };

  const r = parseInput(input as unknown as CardTreeJsonNode, {
    disabledPredefinedKeys: [],
    dateDetection: "auto",
    // no customKeys passed at all
  });

  it("rejects the array-valued key as an unsupported child (old behaviour)", () => {
    expect(
      r.errors.some((e) => e.message.includes("array values are not supported")),
    ).toBe(true);
  });

  it("turns the object-valued key into a child card (old behaviour)", () => {
    expect(r.tree?.children.some((c) => c.parentKey === "metric")).toBe(true);
  });

  it("produces zero predefined entries without registration", () => {
    expect(r.tree?.predefined.length ?? -1).toBe(0);
  });
});
