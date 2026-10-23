/**
 * The CHANGELOG gate (R10) — every component's current version has an entry,
 * or a grandfathered baseline row that can only shrink.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { check, hasEntry } from "../scripts/validate-changelog.mjs";

const ROOT = path.resolve(__dirname, "..");
const v = (entries: Record<string, string>) =>
  new Map(Object.entries(entries).map(([s, version]) => [s, { version, status: "alpha", metaPath: "x" }]));

describe("hasEntry", () => {
  const log = "- `story-rail` 0.4.0 — preview image.\n- `card-tree` **10.4.0** — x\n- `ver-end` **2.0.0**.\n";

  it("matches the slug in backticks and the version on the same line", () => {
    expect(hasEntry(log, "story-rail", "0.4.0")).toBe(true);
    expect(hasEntry(log, "ver-end", "2.0.0")).toBe(true);
  });

  it("does not match a version inside a longer one, or a slug elsewhere", () => {
    expect(hasEntry(log, "card-tree", "0.4.0")).toBe(false);
    expect(hasEntry(log, "story-rail", "0.4.01")).toBe(false);
    expect(hasEntry("story-rail 0.4.0", "story-rail", "0.4.0")).toBe(false);
    expect(hasEntry("- `story-rail` x\n- 0.4.0", "story-rail", "0.4.0")).toBe(false);
  });

  it("does not credit a passing mention inside another component's entry", () => {
    const line = "- `story-composer` 0.5.0 — overlay fixed. Needs `media-editor` 0.4.0 or later.";
    expect(hasEntry(line, "story-composer", "0.5.0")).toBe(true);
    expect(hasEntry(line, "media-editor", "0.4.0")).toBe(false);
  });

  it("does not credit a prerelease for its release version", () => {
    expect(hasEntry("- `a` 0.1.0-beta.1 — x", "a", "0.1.0")).toBe(false);
    expect(hasEntry("- `a` 0.1.0-beta.1 — x", "a", "0.1.0-beta.1")).toBe(true);
  });
});

describe("check", () => {
  it("passes with an entry or a matching baseline row", () => {
    expect(check({ changelog: "- `a` 1.0.0", baseline: { b: "0.1.0" }, versions: v({ a: "1.0.0", b: "0.1.0" }) })).toEqual([]);
  });

  it("fails a version with no entry and no row", () => {
    expect(check({ changelog: "", baseline: {}, versions: v({ a: "1.0.0" }) })).toHaveLength(1);
  });

  it("fails a bump whose baseline row went stale (no entry written)", () => {
    const p = check({ changelog: "", baseline: { a: "1.0.0" }, versions: v({ a: "1.1.0" }) });
    expect(p.join()).toMatch(/stale/);
  });

  it("fails a row the CHANGELOG has made unnecessary, and a row for a removed slug", () => {
    expect(check({ changelog: "- `a` 1.1.0", baseline: { a: "1.0.0" }, versions: v({ a: "1.1.0" }) })).toHaveLength(1);
    expect(check({ changelog: "- `a` 1.0.0", baseline: { a: "1.0.0" }, versions: v({ a: "1.0.0" }) })).toHaveLength(1);
    expect(check({ changelog: "", baseline: { gone: "1.0.0" }, versions: v({}) })).toHaveLength(1);
  });
});

describe("wiring + catalog", () => {
  it("runs inside registry:build before shadcn build", () => {
    const chain = (JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    }).scripts["registry:build"] ?? "";
    const at = chain.indexOf("validate-changelog.mjs");
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(chain.indexOf("shadcn build"));
  });

  it("is green against the real CHANGELOG", () => {
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "validate-changelog.mjs")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });
});
