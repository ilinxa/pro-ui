/**
 * The registry-tokens gate — is it WIRED, and is each rule ARMED?
 *
 * A component that styles itself with `text-warning` or `bg-destructive-foreground`
 * renders fine on the docs site (our globals.css defines both) and renders NOTHING
 * in a consumer whose theme lacks them. No other gate sees this. The locked fix
 * (docs/plans/fix-now-batch-plan.md, decision 4) is a `cssVars.theme` mapping with a
 * `var()` fallback on the item — never `cssVars.light` / `dark`, never a
 * registry:theme|style|font|base dependency.
 *
 * Each rule is falsified both ways with a tiny temp-dir registry: the defect is
 * reported (exit 1 under --strict) and the same item without the defect is not.
 */
import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const VALIDATOR = path.join(REPO_ROOT, "scripts", "validate-registry-tokens.mjs");

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

type Item = Record<string, unknown>;

function run(items: Item[], files: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reg-tokens-"));
  tmpDirs.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  const registry = path.join(dir, "registry.json");
  fs.writeFileSync(registry, JSON.stringify({ name: "t", items }));
  const r = spawnSync(
    process.execPath,
    [VALIDATOR, "--strict", "--registry", registry, "--root", dir],
    { encoding: "utf8" },
  );
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const item = (extra: Item = {}, file = "src/a.tsx"): Item => ({
  name: "thing",
  type: "registry:block",
  files: [{ path: file, type: "registry:component", target: "components/thing/a.tsx" }],
  ...extra,
});
const WARN = { "color-warning": "var(--warning, oklch(0.78 0.16 75))" };

describe("wiring", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };

  it("exposes a `validate:registry-tokens` script", () => {
    expect(pkg.scripts["validate:registry-tokens"]).toContain("validate-registry-tokens.mjs");
  });

  it("runs inside `registry:build` with --strict, before `shadcn build`", () => {
    const chain = pkg.scripts["registry:build"] ?? "";
    expect(chain).toContain("validate-registry-tokens.mjs --strict");
    expect(chain.indexOf("validate-registry-tokens.mjs")).toBeLessThan(chain.indexOf("shadcn build"));
  });

  it("is clean against the real catalog", () => {
    const r = spawnSync(process.execPath, [VALIDATOR, "--strict"], { cwd: REPO_ROOT, encoding: "utf8" });
    expect(r.stdout).toContain("0 findings");
    expect(r.status).toBe(0);
  });
});

describe("missing-mapping", () => {
  const src = { "src/a.tsx": `export const A = () => <b className="bg-warning/90 text-warning-foreground hover:bg-destructive" />;` };

  it("flags a non-default token with no cssVars.theme entry", () => {
    const r = run([item()], src);
    expect(r.status).toBe(1);
    expect(r.out).toContain("missing-mapping");
    expect(r.out).toContain('"warning"');
    expect(r.out).toContain('"warning-foreground"');
    expect(r.out).not.toContain('"destructive"'); // default token, never flagged
  });

  it("passes once every used token is mapped", () => {
    const theme = { ...WARN, "color-warning-foreground": "var(--warning-foreground, oklch(0.18 0 0))" };
    const r = run([item({ cssVars: { theme } })], src);
    expect(r.out).toContain("0 findings");
    expect(r.status).toBe(0);
  });

  it("catches variant-prefixed, alpha and gradient-stop usage, and var() references", () => {
    const r = run(
      [item()],
      { "src/a.tsx": `const c = "md:hover:from-brand/20 via-sunrise to-transparent"; const s = { color: "var(--halo)" };` },
    );
    expect(r.status).toBe(1);
    for (const t of ["brand", "sunrise", "halo"]) expect(r.out).toContain(`"${t}"`);
  });

  it("catches the Tailwind v4 `bg-(--x)` shorthand and the bare `bg-[--x]` arbitrary form", () => {
    const r = run([item()], { "src/a.tsx": `const c = "bg-(--glow) text-[--ember]";` });
    expect(r.status).toBe(1);
    for (const t of ["glow", "ember"]) expect(r.out).toContain(`"${t}"`);
  });

  it("treats a var() with an inline fallback as an override knob, but still scans the fallback", () => {
    const ok = run([item()], { "src/a.tsx": `const c = "w-(--fade-width,3rem)"; const s = { width: "var(--gap, 12px)" };` });
    expect(ok.out).toContain("0 findings");
    expect(ok.status).toBe(0);
    const nested = run([item()], { "src/a.tsx": `const s = { color: "var(--ring-from, var(--halo))" };` });
    expect(nested.status).toBe(1);
    expect(nested.out).toContain(`"halo"`);
    expect(nested.out).not.toContain(`"ring-from"`);
  });

  it("does not read a JS decrement like `(--count)` as a token", () => {
    const r = run([item()], { "src/a.tsx": `let count = 2; const x = (--count) + [--count][0];` });
    expect(r.out).toContain("0 findings");
    expect(r.status).toBe(0);
  });

  it("does not flag palette names, literals, sizes, own vars, private vars or comments", () => {
    const r = run(
      [item()],
      {
        "src/a.tsx": [
          "// bg-warning in a line comment",
          "/* text-warning in a block comment */",
          `const c = "bg-red-500 text-white border-transparent text-sm text-center shadow-lg bg-linear-to-t ring-offset-2 border-dashed";`,
          `const d = "--mine": "x"; const e = "var(--mine) var(--ilinxa-thing) var(--radix-popover-trigger-width)";`,
        ].join("\n"),
      },
    );
    expect(r.out).toContain("0 findings");
    expect(r.status).toBe(0);
  });

  it("accepts a mapping inherited through a registryDependency (the CLI merges cssVars across the tree)", () => {
    const base = { ...item({ cssVars: { theme: WARN } }), name: "base" };
    const fx = { ...item({ registryDependencies: ["@ilinxa/base"] }), name: "base-fixtures" };
    const r = run([base, fx], { "src/a.tsx": `const c = "bg-warning";` });
    expect(r.out).toContain("0 findings");
    expect(r.status).toBe(0);
  });

  it("skips deprecated aliases and file-less items", () => {
    const alias = { name: "old", type: "registry:block", meta: { deprecated: true }, registryDependencies: ["@ilinxa/thing"] };
    const r = run([alias, item({ cssVars: { theme: WARN } })], { "src/a.tsx": `const c = "bg-warning";` });
    expect(r.status).toBe(0);
  });
});

describe("forbidden-light-dark", () => {
  const files = { "src/a.tsx": `const c = "bg-primary";` };

  it.each(["light", "dark"])("flags cssVars.%s", (k) => {
    const r = run([item({ cssVars: { [k]: { warning: "oklch(0.78 0.16 75)" } } })], files);
    expect(r.status).toBe(1);
    expect(r.out).toContain("forbidden-light-dark");
  });

  it("passes with cssVars.theme only", () => {
    const r = run([item({ cssVars: { theme: WARN } })], files);
    expect(r.status).toBe(0);
  });
});

describe("forbidden-theme-dependency", () => {
  const files = { "src/a.tsx": `const c = "bg-primary";` };

  it.each(["registry:theme", "registry:style", "registry:font", "registry:base"])(
    "flags a dependency on a %s item",
    (type) => {
      const themeItem = { name: "brand", type };
      const r = run([themeItem, item({ registryDependencies: ["@ilinxa/brand"] })], files);
      expect(r.status).toBe(1);
      expect(r.out).toContain("forbidden-theme-dependency");
    },
  );

  it("passes a dependency on an ordinary block", () => {
    const other = { name: "other", type: "registry:block", files: [] };
    const r = run([other, item({ registryDependencies: ["@ilinxa/other", "button"] })], files);
    expect(r.status).toBe(0);
  });
});
