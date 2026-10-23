/**
 * The cross-category import gate (R12) — the import shapes the shadcn CLI can
 * mis-resolve or leave unrewritten on install fail `registry:build`.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { applyBaseline, findSpecifiers, findViolations } from "../scripts/validate-cross-category-imports.mjs";

const ROOT = path.resolve(__dirname, "..");
const P = "src/registry/components/";

describe("findSpecifiers", () => {
  it("reads single-line, multi-line, export-from and dynamic specifiers", () => {
    const src = [
      'import { A } from "@/registry/components/media/x/x";',
      "import {",
      "  B,",
      '} from "@/registry/components/forms/y/lib/y";',
      'export { C } from "@/registry/components/code/z/z";',
      'const L = lazy(() => import("@/registry/components/data/w/w"));',
    ].join("\n");
    expect(findSpecifiers(src).map((s: { kind: string; cat: string }) => `${s.kind}:${s.cat}`)).toEqual([
      "import:media",
      "import:forms",
      "export:code",
      "dynamic:data",
    ]);
  });

  it("ignores specifiers in comments but not after string literals that look like comments", () => {
    const src = [
      '/** import { A } from "@/registry/components/media/x/x"; */',
      '// import { B } from "@/registry/components/media/x/x";',
      'const accept = "image/*";',
      'import { C } from "@/registry/components/forms/y/y";',
    ].join("\n");
    expect(findSpecifiers(src)).toHaveLength(1);
  });

  it("does not let a `/*` inside a line comment or a string swallow a real import", () => {
    const viaComment = '// matches /* glob\nimport { a } from "@/registry/components/media/x/x";\nconst z = "*/";';
    const viaString = 'const g = " /* x";\nimport { a } from "@/registry/components/media/x/x";';
    expect(findSpecifiers(viaComment)).toHaveLength(1);
    expect(findSpecifiers(viaString)).toHaveLength(1);
  });

  it("reads side-effect imports and template-literal dynamic imports", () => {
    expect(findSpecifiers('import "@/registry/components/media/x/styles";')).toMatchObject([
      { kind: "import", cat: "media", rest: "x/styles" },
    ]);
    expect(findSpecifiers("const L = () => import(`@/registry/components/media/x/x`);")).toMatchObject([
      { kind: "dynamic" },
    ]);
  });

  it("takes the kind from the statement's own keyword, and ignores typeof import()", () => {
    const noSemis = 'export const a = 1\nimport { b } from "@/registry/components/media/x/x"';
    expect(findSpecifiers(noSemis)).toMatchObject([{ kind: "import" }]);
    expect(findSpecifiers('type T = typeof import("@/registry/components/media/x/x");')).toEqual([]);
  });
});

describe("findViolations", () => {
  const files = (entries: Record<string, string>) =>
    new Map(Object.entries(entries).map(([k, s]) => [P + k, s]));

  it("passes a cross-category import of a uniquely named file, and ignores same-category ones", () => {
    const v = findViolations(
      files({
        "data/a/a.tsx": 'import { M } from "@/registry/components/media/m/m";\nimport { T } from "@/registry/components/data/b/types";',
        "media/m/m.tsx": "export const M = 1;",
        "data/b/types.ts": "",
        "media/m/types.ts": "",
      }),
    );
    expect(v).toEqual([]);
  });

  it("flags a cross-category target whose basename another shipped file shares", () => {
    const v = findViolations(
      files({
        "media/c/gates.ts": 'import { g } from "@/registry/components/forms/j/lib/path";',
        "forms/j/lib/path.ts": "",
        "navigation/f/lib/path.ts": "",
      }),
    );
    expect(v).toMatchObject([{ rule: "A", target: "forms/j/lib/path" }]);
  });

  it("resolves an index import and flags its generic basename", () => {
    const v = findViolations(
      files({
        "data/a/a.tsx": 'import { K } from "@/registry/components/media/k";',
        "media/k/index.ts": "",
        "data/a/index.ts": "",
      }),
    );
    // The detail proves the index was RESOLVED and then failed on its basename —
    // not reported as "not a shipped file", which would also be rule A.
    expect(v).toMatchObject([{ rule: "A", detail: expect.stringMatching(/basename "index"/) }]);
  });

  it("passes a uniquely named index import", () => {
    const v = findViolations(
      files({
        "data/a/a.tsx": 'import { K } from "@/registry/components/media/k";',
        "media/k/index.ts": "",
      }),
    );
    expect(v).toEqual([]);
  });

  it("fails cross-category export-from, dynamic import, and an unshipped target", () => {
    const v = findViolations(
      files({
        "data/a/a.tsx": [
          'export { M } from "@/registry/components/media/m/m";',
          'const L = () => import("@/registry/components/media/m/m");',
          'import { Q } from "@/registry/components/media/q/q";',
        ].join("\n"),
        "media/m/m.tsx": "",
      }),
    );
    expect(v.map((x: { rule: string }) => x.rule).sort()).toEqual(["A", "B", "C"]);
  });
});

describe("applyBaseline", () => {
  it("separates baselined from fresh violations and reports stale rows", () => {
    const a = { importer: "i", target: "t", rule: "A" };
    const b = { importer: "j", target: "u", rule: "A" };
    const gone = { importer: "k", target: "w", rule: "B" };
    const r = applyBaseline([a, b], [a, gone]);
    expect(r.fresh).toEqual([b]);
    expect(r.stale).toEqual([gone]);
  });
});

describe("wiring + catalog", () => {
  it("runs inside registry:build before shadcn build", () => {
    const chain = (JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    }).scripts["registry:build"] ?? "";
    const at = chain.indexOf("validate-cross-category-imports.mjs");
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(chain.indexOf("shadcn build"));
  });

  it("is green against the real catalog, with only the baselined collision", () => {
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "validate-cross-category-imports.mjs")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("1 baselined violation");
  });
});
