/**
 * Shared custom-key fixtures for the card-tree lib suite. Deliberately NOT a
 * `*.test.ts` file — Vitest's `lib` project only includes `*.test.ts`, so this
 * module is import-only and never collected as its own test file.
 *
 * These mirror the fixtures used in the v0.6.0 invariant probe
 * (e:/tmp/card-tree-v060-invariant-probe.ts) verbatim, so the ported tests
 * stay a faithful reproduction of record.
 */
import type { CustomPredefinedKey } from "../types";

export const bodyKey: CustomPredefinedKey = {
  key: "body",
  defaultValue: () => [],
  validate: (v) => ({ ok: Array.isArray(v) }),
  render: () => null,
};

export const metricKey: CustomPredefinedKey = {
  key: "metric",
  defaultValue: () => ({ value: 0, unit: "" }),
  validate: (v) =>
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).value === "number"
      ? { ok: true }
      : { ok: false, errors: [{ code: "shape", message: "bad metric" }] },
  render: () => null,
};

export const throwingKey: CustomPredefinedKey = {
  key: "boom",
  defaultValue: () => null,
  validate: () => {
    throw new Error("host validator exploded");
  },
  render: () => null,
};
