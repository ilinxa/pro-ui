/**
 * T3 — `resolveCustomKeys` collision + duplicate policy (I4 in the v0.6.0
 * probe). Built-in collision, reserved collision, duplicate (keep-first), and
 * empty/whitespace name are each rejected with the right diagnostic code;
 * only valid registrations survive.
 */
import { describe, expect, it } from "vitest";
import { resolveCustomKeys } from "../lib/custom-keys";
import { bodyKey } from "./fixtures";

describe("resolveCustomKeys: collision + duplicate policy", () => {
  const collide = resolveCustomKeys([
    { ...bodyKey, key: "quote" }, // collides with a built-in predefined key
    { ...bodyKey, key: "__rcid" }, // collides with a reserved key
    bodyKey, // valid — "body"
    bodyKey, // duplicate of the above
    { ...bodyKey, key: "  " }, // empty/whitespace name
  ]);

  it("rejects a name colliding with a built-in predefined key", () => {
    expect(
      collide.diagnostics.some((d) => d.code === "collides-with-predefined"),
    ).toBe(true);
  });

  it("rejects a name colliding with a reserved key", () => {
    expect(
      collide.diagnostics.some((d) => d.code === "collides-with-reserved"),
    ).toBe(true);
  });

  it("rejects a duplicate registration and keeps the first", () => {
    expect(collide.diagnostics.some((d) => d.code === "duplicate")).toBe(true);
  });

  it("rejects an empty/whitespace-only name", () => {
    expect(collide.diagnostics.some((d) => d.code === "empty-key")).toBe(true);
  });

  it("only the one valid registration survives", () => {
    expect(collide.keys.length).toBe(1);
    expect(collide.names[0]).toBe("body");
  });

  it("returns a frozen empty result when nothing is registered", () => {
    const empty = resolveCustomKeys(undefined);
    expect(empty.keys).toEqual([]);
    expect(empty.names).toEqual([]);
    expect(empty.diagnostics).toEqual([]);
  });

  it("returns a frozen empty result for an empty array", () => {
    const empty = resolveCustomKeys([]);
    expect(empty.keys).toEqual([]);
  });
});
