/**
 * Part 1 R11 / C10 — pinned dependency ranges, and no hard edge into a heavy item.
 * Fixtures follow the request's accept list: a bare name fails; a static import or a
 * registryDependencies entry targeting a heavy item fails.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { depProblems, heavyEdges, parseDep, pinned, transitiveHeavyEdges } from "../scripts/validate-registry-deps.mjs";

const ROOT = path.resolve(__dirname, "..");
const declared = { "lucide-react": "^1.11.0", konva: "^10.3.0", "@scope/pkg": "^2.0.0" };

describe("A — pinned ranges", () => {
  it("parses scoped and unscoped specs", () => {
    expect(parseDep("@scope/pkg@^2.0.0")).toEqual({ name: "@scope/pkg", range: "^2.0.0" });
    expect(parseDep("@scope/pkg")).toEqual({ name: "@scope/pkg", range: undefined });
    expect(parseDep("konva")).toEqual({ name: "konva", range: undefined });
  });

  it("fails a bare name, a drifted range and an undeclared package; passes a matching pin", () => {
    const items = [
      { name: "a", dependencies: ["lucide-react"] },
      { name: "b", dependencies: ["konva@^9.0.0"] },
      { name: "c", dependencies: ["left-pad@^1.0.0"] },
      { name: "d", dependencies: ["@scope/pkg@^2.0.0"] },
    ];
    expect(depProblems(items, declared).map((p: { item: string }) => p.item)).toEqual(["a", "b", "c"]);
  });

  it("--pin rewrites only bare, declared names", () => {
    const out = pinned([{ name: "a", dependencies: ["lucide-react", "konva@^9.0.0", "left-pad"] }], declared);
    expect(out[0].dependencies).toEqual(["lucide-react@^1.11.0", "konva@^9.0.0", "left-pad"]);
  });
});

describe("B — heavy edges", () => {
  const heavy = new Set(["media-editor", "media-editor-capture"]);
  const read = (p: string) =>
    ({
      "src/registry/components/media/c/edit.tsx": 'import { MediaEditor } from "@/registry/components/media/media-editor/media-editor";',
      "src/registry/components/media/d/types.ts": 'import type { MediaSource } from "@/registry/components/media/media-editor/media-editor";',
      "src/registry/components/media/media-editor/features/capture/index.ts":
        'import { x } from "@/registry/components/media/media-editor/media-editor";',
    })[p] ?? "";

  it("fails a static import and a registryDependencies entry into a heavy item", () => {
    const edges = heavyEdges(
      [
        { name: "c", registryDependencies: ["@ilinxa/media-editor-capture"], files: [{ path: "src/registry/components/media/c/edit.tsx" }] },
      ],
      heavy,
      read,
    );
    expect(edges).toEqual([
      { from: "c", to: "media-editor-capture", via: "registryDependencies" },
      { from: "c", to: "media-editor", via: "static import" },
    ]);
  });

  it("ignores type-only imports, the heavy item's own fixtures and feature slices, and aliases", () => {
    const edges = heavyEdges(
      [
        { name: "d", files: [{ path: "src/registry/components/media/d/types.ts" }] },
        { name: "media-editor-fixtures", registryDependencies: ["@ilinxa/media-editor"] },
        {
          name: "media-editor-capture",
          meta: { featureOf: "media-editor" },
          registryDependencies: ["@ilinxa/media-editor"],
          files: [{ path: "src/registry/components/media/media-editor/features/capture/index.ts" }],
        },
        { name: "old-alias", meta: { deprecated: true }, registryDependencies: ["@ilinxa/media-editor"] },
      ],
      heavy,
      read,
    );
    expect(edges).toEqual([]);
  });
});

describe("B — transitive heavy edges", () => {
  it("an edge into an item that reaches a heavy item is a heavy edge too", () => {
    const heavy = new Set(["rich-text-editor"]);
    const items = [
      { name: "json-form", registryDependencies: ["@ilinxa/rich-text-editor"] },
      { name: "content-composer", registryDependencies: ["@ilinxa/json-form"] },
      { name: "plain", registryDependencies: ["@ilinxa/button-ish"] },
    ];
    const edges = transitiveHeavyEdges(items, heavy, () => "");
    expect(edges.map((e: { from: string; to: string }) => `${e.from}→${e.to}`)).toEqual([
      "json-form→rich-text-editor",
      "content-composer→json-form",
    ]);
    expect(heavy.has("plain")).toBe(false);
  });

  it("a feature slice may reach a heavy item (it is the opt-in route), but an edge into it still counts", () => {
    const heavy = new Set(["media-editor"]);
    const items = [
      { name: "carousel-composer", registryDependencies: ["button"] },
      {
        name: "carousel-composer-editing",
        meta: { featureOf: "carousel-composer" },
        registryDependencies: ["@ilinxa/carousel-composer", "@ilinxa/media-editor"],
      },
      { name: "content-composer", registryDependencies: ["@ilinxa/carousel-composer-editing"] },
    ];
    const edges = transitiveHeavyEdges(items, heavy, () => "");
    expect(edges.map((e: { from: string; to: string }) => `${e.from}→${e.to}`)).toEqual([
      "content-composer→carousel-composer-editing",
    ]);
    expect(heavy.has("carousel-composer-editing")).toBe(true);
    expect(heavy.has("carousel-composer")).toBe(false);
  });
});

describe("wiring + catalog", () => {
  it("runs in registry:build before shadcn build", () => {
    const chain = (JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> })
      .scripts["registry:build"] ?? "";
    const at = chain.indexOf("validate-registry-deps.mjs");
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(chain.indexOf("shadcn build"));
  });

  it("registry.json has no bare dependency name, and the gate is green", () => {
    const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "registry.json"), "utf8")) as {
      items: { dependencies?: string[] }[];
    };
    const bare = reg.items.flatMap((i) => i.dependencies ?? []).filter((d) => !parseDep(d).range);
    expect(bare).toEqual([]);
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "validate-registry-deps.mjs")], { cwd: ROOT, encoding: "utf8" });
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });
});
