/**
 * FU-2 reproduction + regression guard (card-tree-node v0.4.0).
 *
 * Before v0.4.0 the canvas viewer had no concept of a card-tree *block*. It
 * knew two things: scalars (`deriveFlatFields`) and `__rc`-tagged objects
 * (`enumerateSubcards`). Every built-in predefined block and every
 * host-registered custom block therefore matched NEITHER filter and rendered
 * as literally nothing — silently, with no warning, in a composition the
 * procomp's own guide encourages.
 *
 * FU-2 logged only the custom-block half. These tests pin down the whole
 * defect: `image` / `table` / `codearea` / `list` vanished too, and `quote`
 * (a *string* built-in) leaked into the flat-field strip as an ordinary
 * string, where it could consume one of the three MAX_FLAT_FIELDS slots and
 * push a real field out of view.
 *
 * The fix routes all three consumers through one classifier that mirrors
 * card-tree's own locked precedence (`card-tree/lib/classify-key.ts`):
 *   reserved -> built-in -> custom -> scalar -> object/array
 */
import { describe, expect, it } from "vitest";
import { deriveBlocks } from "../lib/derive-blocks";
import { deriveFlatFields } from "../lib/derive-flat-fields";
import { enumerateSubcards } from "../lib/enumerate-subcards";
import { classifyNodeKey } from "../lib/classify-node-key";
import { CUSTOM_KEY_NAMES, everyBlockCard, plainCard } from "./fixtures";

const opts = { customKeyNames: CUSTOM_KEY_NAMES, disabledPredefinedKeys: [] };

describe("classifyNodeKey: precedence mirrors card-tree's classify-key", () => {
  it("routes reserved keys out of band", () => {
    expect(classifyNodeKey("__rcid", "x", opts)).toBe("reserved");
    expect(classifyNodeKey("__rcorder", 1, opts)).toBe("reserved");
    expect(classifyNodeKey("__rcmeta", {}, opts)).toBe("reserved");
  });

  it("routes every built-in predefined key to 'block', whatever the value shape", () => {
    expect(classifyNodeKey("image", { src: "a" }, opts)).toBe("block");
    expect(classifyNodeKey("table", { headers: [], rows: [] }, opts)).toBe("block");
    expect(classifyNodeKey("codearea", { format: "ts", content: "" }, opts)).toBe("block");
    expect(classifyNodeKey("list", ["a"], opts)).toBe("block");
    // `quote` is a STRING built-in — the shape that used to leak into fields.
    expect(classifyNodeKey("quote", "hello", opts)).toBe("block");
  });

  it("matches custom keys by NAME before inspecting the value (the v0.6.0 lock)", () => {
    expect(classifyNodeKey("body", [{ type: "p" }], opts)).toBe("block");
    expect(classifyNodeKey("metric", { value: 1 }, opts)).toBe("block");
  });

  it("demotes a built-in the consumer opted out of, exactly like card-tree", () => {
    const disabled = { ...opts, disabledPredefinedKeys: ["quote"] as const };
    expect(classifyNodeKey("quote", "hello", disabled)).toBe("field");
    // card-tree returns "field" for ANY opted-out built-in without inspecting
    // the value, so an object-valued one is a field whose value is not a
    // scalar — i.e. it drops out. Mirrored deliberately; diverging is FU-2.
    expect(
      classifyNodeKey("table", { headers: [], rows: [] }, {
        ...opts,
        disabledPredefinedKeys: ["table"] as const,
      }),
    ).toBe("field");
  });

  it("does not let a host registration capture a built-in key name", () => {
    // card-tree's resolveCustomKeys drops colliding names at mount; the viewer
    // must reach the same answer from the registration list alone.
    const colliding = { ...opts, customKeyNames: ["table"] };
    expect(classifyNodeKey("table", { headers: [], rows: [] }, colliding)).toBe("block");
  });

  it("routes scalars to 'field' and plain objects to 'child'", () => {
    expect(classifyNodeKey("status", "active", opts)).toBe("field");
    expect(classifyNodeKey("weight", 12, opts)).toBe("field");
    expect(classifyNodeKey("flag", false, opts)).toBe("field");
    expect(classifyNodeKey("child", { title: "c" }, opts)).toBe("child");
  });

  it("skips ports and the canvas discriminator", () => {
    expect(classifyNodeKey("ports", [], opts)).toBe("skip");
    expect(classifyNodeKey("__type", "card-tree", opts)).toBe("skip");
  });

  it("skips an UNREGISTERED array — card-tree's parser rejects those (Q-P4)", () => {
    expect(classifyNodeKey("tags", ["a", "b"], opts)).toBe("skip");
  });
});

describe("deriveBlocks: FU-2 — blocks are no longer invisible", () => {
  const blocks = deriveBlocks(everyBlockCard, 10, opts);
  const byKey = new Map(blocks.map((b) => [b.key, b]));

  it("finds all five built-in blocks plus both custom blocks", () => {
    expect([...byKey.keys()].sort()).toEqual(
      ["body", "codearea", "image", "list", "metric", "quote", "table"].sort(),
    );
  });

  it("tags each block with its kind — built-ins by name, host blocks as 'custom'", () => {
    expect(byKey.get("image")?.kind).toBe("image");
    expect(byKey.get("table")?.kind).toBe("table");
    expect(byKey.get("codearea")?.kind).toBe("codearea");
    expect(byKey.get("quote")?.kind).toBe("quote");
    expect(byKey.get("list")?.kind).toBe("list");
    expect(byKey.get("body")?.kind).toBe("custom");
    expect(byKey.get("metric")?.kind).toBe("custom");
  });

  it("summarises each block compactly enough for a canvas node", () => {
    expect(byKey.get("image")?.summary).toBe("Architecture diagram");
    expect(byKey.get("table")?.summary).toBe("2 x 3");
    expect(byKey.get("codearea")?.summary).toBe("ts, 2 lines");
    expect(byKey.get("list")?.summary).toBe("3 items");
    expect(byKey.get("body")?.summary).toBe("2 items");
    expect(byKey.get("metric")?.summary).toBe("2 fields");
    expect(byKey.get("quote")?.summary).toBe("A canvas node should not swallow a block.");
  });

  it("preserves the raw value so an opt-in full render can use it", () => {
    expect(byKey.get("metric")?.value).toEqual({ value: 94, unit: "% task success" });
  });

  it("honours the max cap, in Object.entries order", () => {
    const capped = deriveBlocks(everyBlockCard, 2, opts);
    expect(capped.map((b) => b.key)).toEqual(["image", "table"]);
  });

  it("returns nothing for a card with no blocks (v0.3.0 shape unchanged)", () => {
    expect(deriveBlocks(plainCard, 10, opts)).toEqual([]);
  });

  it("finds only built-ins when the host registered no custom keys", () => {
    const noCustom = deriveBlocks(everyBlockCard, 10, {
      customKeyNames: [],
      disabledPredefinedKeys: [],
    });
    expect(noCustom.map((b) => b.key).sort()).toEqual(
      ["codearea", "image", "list", "quote", "table"].sort(),
    );
  });
});

describe("deriveFlatFields: blocks no longer leak into the field strip", () => {
  it("keeps `quote` OUT of the flat fields (it is a block, not a string field)", () => {
    const fields = deriveFlatFields(everyBlockCard, 10, opts);
    expect(fields.map((f) => f.key)).not.toContain("quote");
  });

  it("still returns the genuine scalar fields", () => {
    const fields = deriveFlatFields(everyBlockCard, 10, opts);
    expect(fields.map((f) => f.key)).toEqual(["status", "weight"]);
  });

  it("REGRESSION: an opted-out `quote` comes back as an ordinary string field", () => {
    const fields = deriveFlatFields(everyBlockCard, 10, {
      customKeyNames: CUSTOM_KEY_NAMES,
      disabledPredefinedKeys: ["quote"],
    });
    const quote = fields.find((f) => f.key === "quote");
    expect(quote?.type).toBe("string");
  });

  it("REGRESSION: the v0.3.0 no-blocks card yields exactly its old fields", () => {
    const fields = deriveFlatFields(plainCard, 3, opts);
    expect(fields.map((f) => f.key)).toEqual(["model", "temperature", "streaming"]);
    expect(fields.map((f) => f.type)).toEqual(["string", "number", "boolean"]);
  });
});

describe("enumerateSubcards: blocks are never mistaken for child cards", () => {
  it("returns the ordinary child card and nothing else", () => {
    const subs = enumerateSubcards(everyBlockCard, opts);
    expect(subs.map((s) => s.key)).toEqual(["child"]);
  });

  it("does not claim a custom block whose value happens to carry `ports`", () => {
    // The old `isCardLike` heuristic keyed on `ports`, so a host block shaped
    // like this was rendered as a subcard outline instead of a block.
    const card = {
      __type: "card-tree",
      __rcid: "c",
      title: "T",
      metric: { value: 1, ports: [{ id: "p", side: "left", dir: "in", type: "text" }] },
    } as const;
    const subs = enumerateSubcards(card as never, opts);
    expect(subs).toEqual([]);
    expect(deriveBlocks(card as never, 10, opts).map((b) => b.key)).toEqual(["metric"]);
  });

  it("renders a child card that has no __rcid (F-03 degradation is reachable now)", () => {
    const card = {
      __type: "card-tree",
      title: "T",
      child: { title: "No id here", note: "x" },
    };
    const subs = enumerateSubcards(card as never, opts);
    expect(subs.map((s) => s.key)).toEqual(["child"]);
    expect(subs[0]?.card.__rcid).toBeUndefined();
  });
});
