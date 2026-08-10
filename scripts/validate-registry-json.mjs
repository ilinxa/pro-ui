#!/usr/bin/env node
/**
 * validate-registry-json — registry.json vs disk vs imports (plan P1C, review 3.4).
 *
 * registry.json is hand-maintained; nothing previously verified it. This exact
 * gap shipped a todo-tree item missing a runtime registryDependency and two
 * items with undeclared npm deps that survived only via transitive installs.
 *
 * Per BASE item (non `-fixtures`, non `_shared`):
 *   (1) every files[].path exists on disk
 *   (2) every shipped file on disk (excl. demo/usage/meta/dummy-data) is listed
 *   (3) no demo.tsx / usage.tsx / meta.ts / dummy-data.* in the item
 *   (4) every target follows components/<slug>/<same-sub-path>
 *   (5) a `<slug>-fixtures` sibling exists: depends on the base, ships exactly
 *       one dummy-data.(ts|tsx) into the base folder
 *   (6) npm imports across listed files ⊆ dependencies+devDependencies (high);
 *       declared-but-unimported npm dep (warn)
 *   (7) cross-procomp imports (relative sibling or @/registry/... or @ilinxa/...)
 *       each have an @ilinxa/<slug> registryDependency (high); phantom @ilinxa
 *       regDep with no matching import (warn — may be an intentional pin)
 *
 * Exit: 0 clean (warns allowed) · 1 any high · 2 script error.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));

const ALWAYS_OK = new Set(["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"]);
const NON_SHIPPED = /(^|[\\/])(demo\.tsx|usage\.tsx|meta\.ts|dummy-data\.tsx?)$/;

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:\*(?:\s+as\s+[\w$]+)?|[\w$]+)?\s*,?\s*(?:\{[^}]*\})?\s*from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s+["']([^"']+)["']/gm;

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}
function findImports(content) {
  const out = new Set();
  const s = stripComments(content);
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(s)) !== null) out.add(m[1] || m[2] || m[3]);
  out.delete(undefined);
  return out;
}
function npmPkg(p) {
  if (!p || p.startsWith(".") || p.startsWith("@/") || p.startsWith("/")) return null;
  if (p.startsWith("@ilinxa/")) return null;
  if (p.startsWith("@")) { const parts = p.split("/"); return parts.length >= 2 ? parts.slice(0, 2).join("/") : null; }
  return p.split("/")[0];
}
function crossSlug(p, importerFile, ownSlug) {
  const c = p?.match(/^@ilinxa\/([\w-]+)/); if (c) return c[1] === ownSlug ? null : c[1];
  const a = p?.match(/^@\/registry\/components\/[\w-]+\/([\w-]+)/); if (a) return a[1] === ownSlug ? null : a[1];
  if (!p?.startsWith(".")) return null;
  const dir = importerFile.replace(/\\/g, "/").replace(/\/[^/]+$/, "");
  const res = [...dir.split("/")];
  for (const seg of p.split("/")) { if (seg === "..") res.pop(); else if (seg !== "." && seg !== "") res.push(seg); }
  const m = res.join("/").match(/\/registry\/components\/[\w-]+\/([\w-]+)/);
  if (!m || m[1] === ownSlug || m[1].startsWith("_")) return null;
  return m[1];
}
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|m?js|css)$/.test(name)) out.push(full);
  }
  return out;
}

const items = registry.items;
const byName = new Map(items.map((i) => [i.name, i]));
const baseItems = items.filter(
  (i) => !i.name.endsWith("-fixtures") && !(i.files?.[0]?.target ?? "").startsWith("components/_shared"),
);

let highs = 0, warns = 0;
const report = (sev, item, msg) => {
  console[sev === "high" ? "error" : "log"](`  [${sev === "high" ? "⚠️ high" : "🔸 warn"}] ${item}: ${msg}`);
  if (sev === "high") highs++; else warns++;
};

for (const item of baseItems) {
  const files = item.files ?? [];
  const first = files[0]?.path ?? "";
  const m = first.match(/^src\/registry\/components\/([\w-]+)\/([\w-]+)\//);
  if (!m) { report("high", item.name, `cannot derive folder from first file path "${first}"`); continue; }
  const [, cat, slug] = m;
  const slugDir = join(ROOT, "src", "registry", "components", cat, slug);

  const listed = new Set(files.map((f) => f.path.replace(/\\/g, "/")));

  // (1) listed files exist + (3) no docs files + (4) target convention
  for (const f of files) {
    if (!existsSync(join(ROOT, f.path))) report("high", item.name, `listed file missing on disk: ${f.path}`);
    if (NON_SHIPPED.test(f.path)) report("high", item.name, `docs-only/fixture file listed in BASE item: ${f.path}`);
    const sub = f.path.replace(/\\/g, "/").replace(`src/registry/components/${cat}/${slug}/`, "");
    const expected = `components/${slug}/${sub}`;
    if (f.target !== expected) report("high", item.name, `target "${f.target}" ≠ locked convention "${expected}"`);
  }

  // (2) on-disk shipped files all listed
  if (existsSync(slugDir)) {
    for (const abs of walk(slugDir)) {
      const rel = abs.replace(/\\/g, "/").split("/src/registry/")[1];
      const relPath = `src/registry/${rel}`;
      if (NON_SHIPPED.test(relPath)) continue;
      if (!listed.has(relPath)) report("high", item.name, `shipped file on disk NOT in registry.json files[]: ${relPath}`);
    }
  } else {
    report("high", item.name, `component folder missing: ${slugDir}`);
  }

  // (5) fixtures sibling
  const fx = byName.get(`${slug}-fixtures`);
  if (!fx) report("high", item.name, `no ${slug}-fixtures sibling item`);
  else {
    if (!(fx.registryDependencies ?? []).some((d) => d === `@ilinxa/${slug}`))
      report("high", `${slug}-fixtures`, `must depend on @ilinxa/${slug}`);
    const fxFiles = fx.files ?? [];
    if (fxFiles.length !== 1 || !/dummy-data\.tsx?$/.test(fxFiles[0].path))
      report("high", `${slug}-fixtures`, `must ship exactly one dummy-data.ts(x)`);
  }

  // (6) + (7) imports vs declarations
  // registry.json deps may carry version pins ("react-hook-form@^7.75.0",
  // "@hookform/resolvers@^5.2.2") — normalize to the bare package name.
  const stripPin = (d) => {
    const at = d.indexOf("@", 1);
    return at === -1 ? d : d.slice(0, at);
  };
  const declaredNpm = new Set(
    [...(item.dependencies ?? []), ...(item.devDependencies ?? [])].map(stripPin),
  );
  const declaredReg = new Set((item.registryDependencies ?? []).filter((d) => d.startsWith("@ilinxa/")).map((d) => d.slice("@ilinxa/".length)));
  const usedNpm = new Set();
  const usedCross = new Set();
  // Scan the base item's files AND the fixtures item's dummy-data — fixtures
  // declare no deps of their own, so anything dummy-data imports must be
  // declared on the base (counts as "used" for the over-declaration warn).
  const scanFiles = [...files, ...((byName.get(`${slug}-fixtures`)?.files) ?? [])];
  for (const f of scanFiles) {
    const p = join(ROOT, f.path);
    if (!existsSync(p) || /\.css$/.test(p)) continue;
    const content = readFileSync(p, "utf8");
    for (const imp of findImports(content)) {
      const n = npmPkg(imp);
      if (n && !ALWAYS_OK.has(n)) usedNpm.add(n);
      const x = crossSlug(imp, p, slug);
      if (x && byName.has(x)) usedCross.add(x);
      // `../_shared/<name>` relative imports resolve to the standalone
      // `<name>` support item (e.g. file-clipboard) — count as a used regDep.
      const sh = imp?.match(/_shared\/([\w-]+)/);
      if (sh && byName.has(sh[1])) usedCross.add(sh[1]);
    }
  }
  for (const n of usedNpm) {
    // @types/* only matter at tsc time; either bucket is fine (checked together above)
    if (!declaredNpm.has(n)) report("high", item.name, `imports npm "${n}" but item declares no dependency on it`);
  }
  for (const n of declaredNpm) {
    if (!usedNpm.has(n) && !n.startsWith("@types/")) report("warn", item.name, `declares npm "${n}" with no matching import (over-declaration)`);
  }
  for (const x of usedCross) {
    if (!declaredReg.has(x)) report("high", item.name, `imports sibling procomp "${x}" but registryDependencies lacks @ilinxa/${x}`);
  }
  for (const x of declaredReg) {
    if (!usedCross.has(x)) report("warn", item.name, `registryDependencies pins @ilinxa/${x} with no matching import (intentional pin? document it)`);
  }
}

console.log(`\nvalidate:registry-json — ${baseItems.length} base items audited: ${highs} high · ${warns} warn.`);
process.exit(highs > 0 ? 1 : 0);
