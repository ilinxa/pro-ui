/**
 * Install graph (CC1): the base installs without media-editor. Only `features/` (the
 * `carousel-composer-editing` item) and tests may import it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const IMPORT_OF_MEDIA_EDITOR = /(?:from\s+|import\s*\(\s*|import\s+)["'][^"']*media-editor[^"']*["']/;

describe("install graph", () => {
  it("no base file outside features/ and __tests__/ imports media-editor", () => {
    const base = walk(ROOT).filter((f) => {
      const rel = relative(ROOT, f).split(sep);
      return /\.(ts|tsx)$/.test(f) && rel[0] !== "features" && rel[0] !== "__tests__";
    });
    expect(base.length).toBeGreaterThan(5);
    const offenders = base.filter((f) => IMPORT_OF_MEDIA_EDITOR.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("no shipped file re-exports from `@/registry/…` (the shadcn rewriter only rewrites imports)", () => {
    const shipped = walk(ROOT).filter((f) => {
      const rel = relative(ROOT, f).split(sep);
      return /\.(ts|tsx)$/.test(f) && rel[0] !== "__tests__";
    });
    expect(shipped.length).toBeGreaterThan(10);
    const REEXPORT = /export\s+(?:type\s+)?(?:\*|\{[^}]*\})(?:\s+as\s+\w+)?\s+from\s+["']@\/registry\//;
    const offenders = shipped.filter((f) => REEXPORT.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("the re-export check can see a re-export", () => {
    const REEXPORT = /export\s+(?:type\s+)?(?:\*|\{[^}]*\})(?:\s+as\s+\w+)?\s+from\s+["']@\/registry\//;
    expect(REEXPORT.test('export type {\n  A,\n  B,\n} from "@/registry/x/y";')).toBe(true);
    expect(REEXPORT.test('import type { A } from "@/registry/x/y";\nexport type { A };')).toBe(false);
  });

  it("the feature does import it (the check can see an import)", () => {
    const panel = readFileSync(join(ROOT, "features/editing/parts/edit-panel.tsx"), "utf8");
    expect(IMPORT_OF_MEDIA_EDITOR.test(panel)).toBe(true);
  });
});
