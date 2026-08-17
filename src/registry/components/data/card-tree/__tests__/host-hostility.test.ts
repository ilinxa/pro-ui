/**
 * T3 — host-code hostility (I3 in the v0.6.0 probe): a registered validator
 * that rejects, throws, or returns garbage must degrade to a dropped entry +
 * diagnostic — `parseInput` itself must never throw or crash.
 */
import { describe, expect, it } from "vitest";
import { parseInput } from "../lib/parse";
import type { ParseResult } from "../lib/parse";
import { resolveCustomKeys } from "../lib/custom-keys";
import type { CardTreeJsonNode, CustomPredefinedKey } from "../types";
import { metricKey, throwingKey } from "./fixtures";

function parseWith(key: CustomPredefinedKey, input: Record<string, unknown>) {
  return parseInput(input as unknown as CardTreeJsonNode, {
    disabledPredefinedKeys: [],
    dateDetection: "auto",
    customKeys: resolveCustomKeys([key]).keys,
  });
}

describe("host-code hostility: validate() returning { ok: false }", () => {
  it("drops the entry and emits a diagnostic", () => {
    const r = parseWith(metricKey, { title: "x", metric: { value: "not-a-number" } });
    expect(
      r.errors.some((e) => e.message.includes("failed validation")),
    ).toBe(true);
    expect(r.tree?.predefined.length ?? -1).toBe(0);
  });
});

describe("host-code hostility: validate() throwing", () => {
  it("does not take parseInput down — no throw escapes", () => {
    expect(() => parseWith(throwingKey, { title: "x", boom: { a: 1 } })).not.toThrow();
  });

  it("drops the entry and emits a 'validator threw' diagnostic", () => {
    const r = parseWith(throwingKey, { title: "x", boom: { a: 1 } });
    expect(r.errors.some((e) => e.message.includes("validator threw"))).toBe(true);
    expect(r.tree?.predefined.length ?? -1).toBe(0);
  });
});

describe("host-code hostility: validate() returning garbage", () => {
  const garbageCases: Array<[string, unknown]> = [
    ["null", null],
    ["undefined", undefined],
    ["{ ok: 'yes' } (truthy non-boolean ok)", { ok: "yes" }],
    ["{} (missing ok)", {}],
  ];

  for (const [label, garbage] of garbageCases) {
    it(`treats "${label}" as a validation failure without crashing`, () => {
      const garbageKey: CustomPredefinedKey = {
        key: "garbage",
        defaultValue: () => null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validate: () => garbage as any,
        render: () => null,
      };
      let r: ParseResult | undefined;
      expect(() => {
        r = parseWith(garbageKey, { title: "x", garbage: { a: 1 } });
      }).not.toThrow();
      expect(r!.tree?.predefined.length ?? -1).toBe(0);
      expect(
        r!.errors.some((e) => e.message.includes('custom predefined-key "garbage"')),
      ).toBe(true);
    });
  }
});
