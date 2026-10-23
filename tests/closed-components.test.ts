/**
 * Part 1 R6 — a component closed under the consumer contract (listed in
 * scripts/contract-baseline.json `closed`) has an RTL example in its demo. The baseline
 * already forbids it any contract-gate row (tests/contract-gate.test.ts).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const COMPONENTS = path.join(ROOT, "src", "registry", "components");
const closed: string[] = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "contract-baseline.json"), "utf8")).closed;

const folderOf = (slug: string) => {
  for (const cat of fs.readdirSync(COMPONENTS)) {
    const dir = path.join(COMPONENTS, cat, slug);
    if (!cat.startsWith("_") && fs.existsSync(dir)) return dir;
  }
  throw new Error(`no folder for closed component ${slug}`);
};

describe("closed components", () => {
  it("lists at least the components closed so far", () => {
    expect(closed).toEqual(expect.arrayContaining(["story-rail", "app-sidebar"]));
  });

  it.each(closed)("%s: the demo renders an RTL example", (slug) => {
    const demo = fs.readFileSync(path.join(folderOf(slug), "demo.tsx"), "utf8");
    expect(demo).toMatch(/dir=["{]?["']?rtl["']?/);
  });
});
