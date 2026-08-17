/**
 * T3 — precedence ordering: reserved > built-in > custom > scalar > child.
 * Ported from the v0.6.0 probe's "Precedence" section, then widened
 * (custom beating scalar AND array AND object explicitly named; unregistered
 * object still routed to `child`).
 */
import { describe, expect, it } from "vitest";
import { classifyKey } from "../lib/classify-key";

describe("classifyKey precedence: reserved > built-in > custom > scalar > child", () => {
  it("reserved wins over a same-named custom registration", () => {
    expect(classifyKey("__rcid", "x", [], ["__rcid"])).toBe("reserved");
  });

  it("built-in predefined wins over a same-named custom registration", () => {
    expect(classifyKey("quote", "x", [], ["quote"])).toBe("predefined");
  });

  it("custom beats a scalar (string) value", () => {
    expect(classifyKey("body", "a string", [], ["body"])).toBe("custom");
  });

  it("custom beats a scalar (number) value", () => {
    expect(classifyKey("body", 42, [], ["body"])).toBe("custom");
  });

  it("custom beats an object value (would otherwise route to child)", () => {
    expect(classifyKey("body", { a: 1 }, [], ["body"])).toBe("custom");
  });

  it("custom beats an array value (would otherwise be rejected as an unsupported child)", () => {
    expect(classifyKey("body", [1, 2], [], ["body"])).toBe("custom");
  });

  it("an unregistered object-valued key is still routed to child", () => {
    expect(classifyKey("other", { a: 1 }, [], ["body"])).toBe("child");
  });

  it("an unregistered array-valued key is still routed to child (Q-P4 rejects it downstream)", () => {
    expect(classifyKey("other", [1, 2], [], ["body"])).toBe("child");
  });

  it("a disabled built-in predefined key falls through to field", () => {
    expect(classifyKey("quote", "x", ["quote"], [])).toBe("field");
  });

  it("empty customKeyNames (default) preserves v0.5 behaviour for a would-be custom name", () => {
    expect(classifyKey("body", [1, 2], [])).toBe("child");
  });
});
