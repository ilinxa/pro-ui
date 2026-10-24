/**
 * The consumer-contract gate (Part 1 R2 / R3 / R4 / R5 / R6 / R8). Fixtures come from
 * each R-item's own accept list in the platform's request, plus the baseline rules
 * ("may only shrink"; closed components have no row) and the R4 review's findings.
 */
import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  checkSource,
  collectByRule,
  compare,
  lowered,
  paletteHits,
  physicalHits,
  shippedFiles,
  utilityOf,
} from "../scripts/validate-contract.mjs";

const ROOT = path.resolve(__dirname, "..");
const SCRIPT = path.join(ROOT, "scripts", "validate-contract.mjs");
const rules = (src: string, file = "x.tsx") => checkSource(src, file).map((v: { rule: string }) => v.rule);

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

describe("class tokens", () => {
  it("strips variants (incl. bracketed), important marks and negatives", () => {
    expect(utilityOf("[&>svg]:text-red-500")).toBe("text-red-500");
    expect(utilityOf("data-[state=open]:md:!ml-2")).toBe("ml-2");
    expect(utilityOf("hover:-left-2")).toBe("left-2");
  });
});

describe("R4 palette", () => {
  it("fails palette and arbitrary colours, passes tokens, black/white and alpha", () => {
    expect(paletteHits("bg-red-500")).toEqual(["bg-red-500"]);
    expect(paletteHits("bg-[#fff]")).toEqual(["bg-[#fff]"]);
    expect(paletteHits("hover:text-zinc-400/60 dark:border-emerald-500")).toHaveLength(2);
    expect(paletteHits("text-[oklch(0.7_0.1_20)]")).toHaveLength(1);
    expect(paletteHits("text-white/60 bg-black/40 bg-destructive text-muted-foreground border-transparent")).toEqual([]);
    expect(paletteHits("bg-[var(--brand)] w-[120px] text-[13px] fill-current")).toEqual([]);
  });

  it("knows Tailwind 4.2's added palettes and colours inside other arbitrary values", () => {
    expect(paletteHits("bg-mauve-500 text-olive-400 bg-taupe-100 border-mist-200")).toHaveLength(4);
    expect(paletteHits("shadow-[0_0_0_1px_#fff] bg-[linear-gradient(#fff,#000)] text-shadow-red-500")).toHaveLength(3);
    expect(paletteHits("bg-[hsl(var(--x))] bg-[color-mix(in_oklch,var(--a)_50%,transparent)]")).toEqual([]);
  });

  it("checks classes inside cn() conditionals, clsx object keys and cva variants", () => {
    const src = `
      const a = cn("p-2", ok && "bg-red-500");
      const b = clsx({ "text-rose-400": bad });
      const v = cva("rounded", { variants: { tone: { bad: "text-rose-400", good: "text-success" } } });
    `;
    expect(rules(src, "x.ts").filter((r) => r === "palette")).toHaveLength(3);
  });

  it("skips module specifiers and literal types", () => {
    expect(rules('import x from "bg-red-500";\ntype T = "bg-red-500";', "x.ts")).toEqual([]);
  });

  it("honours a palette-ok escape with a reason, not without one", () => {
    expect(rules('// palette-ok: user swatch\nconst c = "bg-red-500";', "x.ts")).toEqual([]);
    expect(rules('// palette-ok:\nconst c = "bg-red-500";', "x.ts")).toEqual(["palette"]);
    expect(rules('const c = "bg-red-500"; // palette-ok: user swatch', "x.ts")).toEqual([]);
  });

  it("an escape trailing one line's code never covers the next line", () => {
    const src = 'const a = "bg-red-500"; // palette-ok: swatch\nconst b = "bg-blue-500";';
    expect(rules(src, "x.ts")).toEqual(["palette"]);
  });
});

describe("R6 physical", () => {
  it("fails physical inline-axis utilities and passes logical ones", () => {
    expect(physicalHits("ml-2")).toEqual(["ml-2"]);
    expect(physicalHits("ms-2 me-2 ps-4 pe-4 start-0 end-3 text-start border-s rounded-e-md")).toEqual([]);
    expect(physicalHits("md:pr-4 -left-2 text-right rounded-l-md border-r-2 float-left")).toHaveLength(6);
  });

  it("passes centring and an inset-x pair only under the same variant", () => {
    expect(physicalHits("absolute left-1/2 -translate-x-1/2")).toEqual([]);
    expect(physicalHits("absolute left-0 right-0")).toEqual([]);
    expect(physicalHits("inset-x-0 left-bar right-bar")).toEqual([]);
    expect(physicalHits("left-0 md:right-0")).toEqual(["left-0", "md:right-0"]);
    expect(physicalHits("left-1/2 translate-x-4")).toEqual(["left-1/2"]);
  });

  it("treats non-class JSX attributes as prose, class attributes as classes", () => {
    expect(rules('const a = <div aria-label="Align text-left" />;')).toEqual(["jsx-literal"]);
    expect(rules('const a = <div className="ml-2" />;')).toEqual(["physical"]);
    expect(rules('const a = <div contentClassName={"ml-2"} />;')).toEqual(["physical"]);
  });

  it("honours dir-ok on the line above", () => {
    expect(rules('// dir-ok: physical by definition\nconst c = "border-l";', "x.ts")).toEqual([]);
  });
});

describe("R2 template-fill", () => {
  it('fails .replace("{…") and replaceAll, not other replaces', () => {
    expect(rules('const s = labels.hint.replace("{max}", String(n));', "x.ts")).toEqual(["template-fill"]);
    expect(rules("const s = t.replaceAll(`{count}`, c);", "x.ts")).toEqual(["template-fill"]);
    expect(rules('const s = t.replace(/\\s+/g, " ");', "x.ts")).toEqual([]);
  });

  it("honours a template-ok escape (deprecated alias) with a reason, not without one", () => {
    expect(rules('// template-ok: deprecated alias\nconst s = t.replace("{count}", c);', "x.ts")).toEqual([]);
    expect(rules('// template-ok:\nconst s = t.replace("{count}", c);', "x.ts")).toEqual(["template-fill"]);
  });
});

describe("R3 intl + clock", () => {
  it("fails locale-less formatters, module-scope Intl, toLocale* without a locale, PluralRules('en')", () => {
    expect(rules("const f = new Intl.NumberFormat(undefined, {});", "x.ts")).toEqual(["intl", "intl"]);
    expect(rules("function f(){ return new Intl.NumberFormat(); }", "x.ts")).toEqual(["intl"]);
    expect(rules("function f(){ return Intl.DateTimeFormat().format(d); }", "x.ts")).toEqual(["intl"]);
    expect(rules("function f(d){ return d.toLocaleString(); }", "x.ts")).toEqual(["intl"]);
    expect(rules("function f(d){ return d.toLocaleString(undefined, { month: 'short' }); }", "x.ts")).toEqual(["intl"]);
    expect(rules('function f(){ return new Intl.PluralRules("en"); }', "x.ts")).toEqual(["intl"]);
  });

  it("passes formatters with a locale, and reading the runtime zone", () => {
    expect(rules("function f(){ return new Intl.NumberFormat(locale); }", "x.ts")).toEqual([]);
    expect(rules('function f(d){ return d.toLocaleDateString("tr"); }', "x.ts")).toEqual([]);
    expect(rules("function f(){ return Intl.DateTimeFormat().resolvedOptions().timeZone; }", "x.ts")).toEqual([]);
  });

  it("fails a render-time clock read (incl. useMemo and useState initialisers)", () => {
    expect(rules("function C(){ const t = new Date(); return null; }")).toEqual(["clock"]);
    expect(rules("function C(){ const t = useMemo(() => Date.now(), []); return null; }")).toEqual(["clock"]);
    expect(rules("function C(){ const [t] = useState(() => Date.now()); return null; }")).toEqual(["clock"]);
  });

  it("passes effects, useCallback, JSX handlers, handle* functions, timers, rAF, microtasks and promise callbacks", () => {
    expect(rules("function C(){ useEffect(() => { setNow(Date.now()); }, []); return null; }")).toEqual([]);
    expect(rules("function C(){ const save = useCallback(() => send(Date.now()), []); return null; }")).toEqual([]);
    expect(rules("function C(){ return <button onClick={() => log(Date.now())} />; }")).toEqual([]);
    expect(rules("function C(){ const handleSave = () => save(new Date()); return null; }")).toEqual([]);
    expect(rules("function C(){ setTimeout(() => tick(Date.now()), 10); return null; }")).toEqual([]);
    expect(rules("function C(){ requestAnimationFrame(() => tick(Date.now())); return null; }")).toEqual([]);
    expect(rules("function C(){ queueMicrotask(() => tick(Date.now())); return null; }")).toEqual([]);
    expect(rules("function C(){ load().then(() => setAt(Date.now())); return null; }")).toEqual([]);
    expect(rules("const t = new Date(2020, 1, 1);", "x.ts")).toEqual([]);
    expect(rules("// now-ok: id seed only\nconst id = Date.now();", "x.ts")).toEqual([]);
  });
});

describe("R5 jsx-literal", () => {
  it("fails text children and literal labels, passes labels, punctuation and entities", () => {
    expect(rules("const a = <span>Close</span>;")).toEqual(["jsx-literal"]);
    expect(rules('const a = <button aria-label="Close" />;')).toEqual(["jsx-literal"]);
    expect(rules("const a = <button aria-label={labels.close} />;")).toEqual([]);
    expect(rules('const a = <span>{" "}·{"…"}</span>;')).toEqual([]);
    expect(rules("const a = <span>&nbsp;&times;&#8230;</span>;")).toEqual([]);
    expect(rules('const a = <div className="text-sm font-medium" />;')).toEqual([]);
  });

  it("covers every labelled attribute", () => {
    for (const attr of ["aria-description", "aria-roledescription", "aria-valuetext", "title", "placeholder", "alt", "label"]) {
      expect(rules(`const a = <x ${attr}="Words" />;`), attr).toEqual(["jsx-literal"]);
    }
  });

  it("fails literals in branches, concatenation and templates of a labelled attribute or a child", () => {
    expect(rules('const a = <b aria-label={open ? "Collapse sidebar" : "Expand sidebar"} />;')).toEqual([
      "jsx-literal",
      "jsx-literal",
    ]);
    expect(rules('const a = <p>{empty && "No results"}</p>;')).toEqual(["jsx-literal"]);
    expect(rules('const a = <p>{name || "Anonymous"}</p>;')).toEqual(["jsx-literal"]);
    expect(rules('const a = <p>{name ?? "Anonymous"}</p>;')).toEqual(["jsx-literal"]);
    expect(rules("const a = <b aria-label={`Close ${name}`} />;")).toEqual(["jsx-literal"]);
    expect(rules("const a = <b aria-label={'Close ' + name} />;")).toEqual(["jsx-literal"]);
    expect(rules('const a = <>{"Fallback"}</>;')).toEqual(["jsx-literal"]);
    expect(rules("const a = <p>{format(value)}</p>;")).toEqual([]);
  });

  it("accepts a JSX-comment escape on the line above", () => {
    expect(rules("const a = (\n  <p>\n    {/* literal-ok: brand name */}\n    Acme\n  </p>\n);")).toEqual([]);
  });
});

describe("R8 keydown", () => {
  it("fails window/document keydown listeners however reached or cast", () => {
    expect(rules('window.addEventListener("keydown", h);', "x.ts")).toEqual(["keydown"]);
    expect(rules('el.ownerDocument.addEventListener("keydown", h);', "x.ts")).toEqual(["keydown"]);
    expect(rules('document.body.addEventListener("keydown", h);', "x.ts")).toEqual(["keydown"]);
    expect(rules('(window as Window).addEventListener("keydown", h);', "x.ts")).toEqual(["keydown"]);
    expect(rules("globalThis.addEventListener(`keydown`, h);", "x.ts")).toEqual(["keydown"]);
    expect(rules('el.ownerDocument.defaultView!.addEventListener("keydown", h);', "x.ts")).toEqual(["keydown"]);
  });

  it("passes element listeners, keydown-ok and the hook itself", () => {
    expect(rules('ref.current.addEventListener("keydown", h);', "x.ts")).toEqual([]);
    expect(rules('// keydown-ok: Escape only\ndocument.addEventListener("keydown", h);', "x.ts")).toEqual([]);
    expect(rules('window.addEventListener("keydown", h);', "lib/use-global-keydown.ts")).toEqual([]);
  });
});

describe("baseline (a multiset of violations per file)", () => {
  const P = "src/registry/components/data/thing/thing.tsx";
  const Q = "src/registry/components/data/done/done.tsx";
  const cur = (texts: string[]) => collectByRule([{ path: P, violations: texts.map((text) => ({ rule: "palette", text })) }]);

  it("fails a new violation, a fixed-but-unrecorded one, and any row for a closed component", () => {
    expect(compare(cur(["bg-red-500", "bg-red-500"]), { rules: { palette: { [P]: ["bg-red-500"] } } }).fresh).toHaveLength(1);
    expect(compare(cur(["bg-red-500"]), { rules: { palette: { [P]: ["bg-red-500", "bg-zinc-100"] } } }).shrunk).toHaveLength(1);
    expect(compare(cur(["bg-red-500"]), { rules: { palette: { [P]: ["bg-red-500"] } } })).toEqual({ fresh: [], shrunk: [], closedRows: [] });
    expect(compare(collectByRule([]), { closed: ["done"], rules: { palette: { [Q]: ["x"] } } }).closedRows).toHaveLength(1);
  });

  it("fixing one violation and adding a different one is caught, not a silent swap", () => {
    const r = compare(cur(["bg-blue-500"]), { rules: { palette: { [P]: ["bg-red-500"] } } });
    expect(r.fresh).toHaveLength(1);
    expect(r.shrunk).toHaveLength(1);
  });

  it("a rule with no baseline section treats every violation as new", () => {
    expect(compare(cur(["bg-red-500"]), { rules: {} }).fresh).toHaveLength(1);
  });

  it("--update-baseline only ever drops entries", () => {
    const base = { rules: { palette: { [P]: ["a", "b", "b"], [Q]: ["c"] } } };
    expect(lowered(base, cur(["b", "z", "z"])).rules.palette).toEqual({ [P]: ["b"] });
  });
});

describe("CLI", () => {
  function fixture(src: string, baseline: unknown) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contract-"));
    tmpDirs.push(dir);
    const file = "src/registry/components/data/thing/thing.tsx";
    fs.mkdirSync(path.join(dir, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), src);
    fs.writeFileSync(
      path.join(dir, "registry.json"),
      JSON.stringify({ items: [{ name: "thing", files: [{ path: file, target: "components/thing/thing.tsx" }] }] }),
    );
    fs.writeFileSync(path.join(dir, "baseline.json"), JSON.stringify(baseline));
    return dir;
  }
  const run = (dir: string, ...extra: string[]) =>
    spawnSync(
      process.execPath,
      [SCRIPT, "--root", dir, "--registry", path.join(dir, "registry.json"), "--baseline", path.join(dir, "baseline.json"), ...extra],
      { encoding: "utf8" },
    );
  const readBaseline = (dir: string) => JSON.parse(fs.readFileSync(path.join(dir, "baseline.json"), "utf8"));

  it("exits 1 on a new violation and names it", () => {
    const dir = fixture('export const A = () => <div className="bg-red-500" />;', { closed: [], rules: { palette: {} } });
    const r = run(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("bg-red-500");
  });

  it("exits 1 for a closed component even with no row", () => {
    const dir = fixture('export const A = () => <div className="ml-2" />;', { closed: ["thing"], rules: { physical: {} } });
    expect(run(dir).status).toBe(1);
  });

  it("--seed-rule writes a missing rule once, never over an existing one, and skips closed components", () => {
    const dir = fixture('export const A = () => <div className="bg-red-500" />;', { closed: [], rules: {} });
    expect(run(dir, "--seed-rule", "palette").status).toBe(0);
    expect(Object.values(readBaseline(dir).rules.palette)).toEqual([["bg-red-500"]]);
    expect(run(dir, "--seed-rule", "palette").status).toBe(1);
    expect(run(dir).status).toBe(0);
    const closed = fixture('export const A = () => <div className="bg-red-500" />;', { closed: ["thing"], rules: {} });
    run(closed, "--seed-rule", "palette");
    expect(readBaseline(closed).rules.palette).toEqual({});
  });

  it("--update-baseline records a fix and never adds a new violation", () => {
    const dir = fixture('export const A = () => <div className="bg-blue-500" />;', {
      closed: [],
      rules: { palette: { "src/registry/components/data/thing/thing.tsx": ["bg-red-500"] } },
    });
    expect(run(dir, "--update-baseline").status).toBe(0);
    expect(readBaseline(dir).rules.palette).toEqual({});
    expect(run(dir).status).toBe(1);
  });
});

describe("wiring + catalog", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };

  it("runs in registry:build before shadcn build, and in lint", () => {
    const chain = pkg.scripts["registry:build"] ?? "";
    expect(chain.indexOf("validate-contract.mjs")).toBeGreaterThan(-1);
    expect(chain.indexOf("validate-contract.mjs")).toBeLessThan(chain.indexOf("shadcn build"));
    expect(pkg.scripts.lint).toContain("validate-contract.mjs");
  });

  it("scans shipped files only (no demo/usage/meta, no fixtures data)", () => {
    const files = shippedFiles(JSON.parse(fs.readFileSync(path.join(ROOT, "registry.json"), "utf8")));
    expect(files.length).toBeGreaterThan(1000);
    expect(files.some((f: string) => /\/(demo|usage)\.tsx$|\/meta\.ts$|\/dummy-data\.ts$/.test(f))).toBe(false);
  });

  it("is green against the checked-in baseline, and the closed components have no rows", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: ROOT, encoding: "utf8" });
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
    const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "contract-baseline.json"), "utf8"));
    expect(baseline.closed).toEqual(expect.arrayContaining(["story-rail", "app-sidebar"]));
  });
});
