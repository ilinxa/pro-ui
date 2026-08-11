#!/usr/bin/env node
/**
 * validate-registry-json — registry.json vs disk vs imports (plan P1C, review 3.4).
 *
 * registry.json is hand-maintained; nothing previously verified it. This exact
 * gap shipped a task-tree item missing a runtime registryDependency and two
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
 * FEATURE items (P3 feature-slicing, plan docs/plans/p3-feature-slicing-plan.md,
 * R1 VERDICT: injection surface, strategy b) — marked by `meta.featureOf:
 * "<base-slug>"` — are excluded from the BASE-item battery above (4th predicate
 * alongside -fixtures / meta.deprecated / _shared) and instead audited by rules
 * F1-F7 below: F1 featureOf names a live non-deprecated base item · F2 name
 * starts `${featureOf}-` · F3 every file target is `components/${featureOf}/
 * features/...` and path/target sub-paths mirror (same convention as base rule
 * 4) · F4 no file target collides with the base item, its `-fixtures` sibling,
 * or any sibling feature item of the same base (plan invariant 3) · F5
 * registryDependencies includes `@ilinxa/<featureOf>` · F6 `meta.budgetKB` is a
 * positive number · F7 every files[].path exists on disk. Feature items also
 * run the (6)/(7) npm-import + cross-procomp-import cross-check against their
 * OWN files/dependencies (not unioned with the base's).
 *
 * The base disk-coverage rule (2) is extended to union in feature-item files
 * shipped under the same slug folder (so `features/<name>/...` files on disk
 * don't false-positive as "shipped but unlisted" under the base item) and to
 * flag a file listed in BOTH a feature item and the base item's files[].
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
// Deprecated alias items (P2.3 — thin registryDependencies-only redirects from
// pre-canon slugs) carry meta.deprecated and ship no files; validate their shape
// separately below and skip the base-item battery for them.
const aliasItems = items.filter((i) => i.meta?.deprecated);
const baseItems = items.filter(
  (i) =>
    !i.name.endsWith("-fixtures") &&
    !(i.files?.[0]?.target ?? "").startsWith("components/_shared") &&
    !i.meta?.deprecated &&
    !i.meta?.featureOf,
);
// Feature items (P3): meta.featureOf names the base slug they layer onto.
const featureItems = items.filter(
  (i) => typeof i.meta?.featureOf === "string" && i.meta.featureOf.length > 0,
);
const featureItemsByBase = new Map();
for (const fi of featureItems) {
  const arr = featureItemsByBase.get(fi.meta.featureOf) ?? [];
  arr.push(fi);
  featureItemsByBase.set(fi.meta.featureOf, arr);
}
const baseItemNames = new Set(baseItems.map((i) => i.name));

let highs = 0, warns = 0;
const report = (sev, item, msg) => {
  console[sev === "high" ? "error" : "log"](`  [${sev === "high" ? "⚠️ high" : "🔸 warn"}] ${item}: ${msg}`);
  if (sev === "high") highs++; else warns++;
};

// registry.json npm dep strings may carry version pins ("react-hook-form@^7.75.0")
// — normalize to the bare package name. Shared by base + feature dep checks.
const stripPin = (d) => {
  const at = d.indexOf("@", 1);
  return at === -1 ? d : d.slice(0, at);
};

/**
 * (6)+(7) npm-import + cross-procomp-import cross-check, shared by base items
 * (scanned against their own files ∪ fixtures dummy-data) and feature items
 * (scanned against their own files only). `ownSlug` is the folder-identity
 * used to exclude same-folder relative imports from the cross-procomp check
 * (for feature items this is the BASE slug, since feature files physically
 * live inside the base's folder — F5 already enforces the @ilinxa/<featureOf>
 * registryDependency structurally, independent of whether any file literally
 * imports back into the base).
 */
function checkDepsAndImports(item, scanFiles, ownSlug, alwaysUsedReg = []) {
  // Schema shape guard: registry-item dependencies are STRING ARRAYS ("pkg" or
  // "pkg@pin"), never the meta.ts object form — report instead of crashing.
  for (const key of ["dependencies", "devDependencies"]) {
    if (item[key] != null && !Array.isArray(item[key])) {
      report("high", item.name, `${key} must be a string array (registry-item schema), got ${typeof item[key]}`);
    }
  }
  const depArr = (v) => (Array.isArray(v) ? v : []);
  const declaredNpm = new Set(
    [...depArr(item.dependencies), ...depArr(item.devDependencies)].map(stripPin),
  );
  const declaredReg = new Set((item.registryDependencies ?? []).filter((d) => d.startsWith("@ilinxa/")).map((d) => d.slice("@ilinxa/".length)));
  const usedNpm = new Set();
  const usedCross = new Set();
  // shadcn primitives (R5 finding, 2026-08-11: button/popover/alert-dialog/
  // slider all shipped undeclared at some point) — every `@/components/ui/x`
  // import must be a bare regDep on THIS item.
  const usedPrimitives = new Set();
  for (const f of scanFiles) {
    const p = join(ROOT, f.path);
    if (!existsSync(p) || /\.css$/.test(p)) continue;
    const content = readFileSync(p, "utf8");
    for (const imp of findImports(content)) {
      const n = npmPkg(imp);
      if (n && !ALWAYS_OK.has(n)) usedNpm.add(n);
      // R1-VERDICT enforcement (R4 finding #1): a base/fixtures file (i.e. any
      // scanned file NOT itself under features/) must never statically import
      // its OWN slug's features/ code — crossSlug treats own-slug as null, so
      // this class needs its own check.
      if (!p.replace(/\\/g, "/").includes("/features/") && imp) {
        let hitsOwnFeatures = false;
        if (imp.startsWith("@/")) {
          hitsOwnFeatures = new RegExp(`^@/registry/components/[\\w-]+/${ownSlug}/features/`).test(imp);
        } else if (imp.startsWith(".")) {
          const dir = p.replace(/\\/g, "/").replace(/\/[^/]+$/, "");
          const res = [...dir.split("/")];
          for (const seg of imp.split("/")) { if (seg === "..") res.pop(); else if (seg !== "." && seg !== "") res.push(seg); }
          hitsOwnFeatures = res.join("/").includes(`/registry/components/`) && res.join("/").includes(`/${ownSlug}/features/`);
        }
        if (hitsOwnFeatures)
          report("high", item.name, `base file "${f.path}" statically imports its own features/ code ("${imp}") — base must never import feature files (P3 injection contract)`);
      }
      const ui = imp?.match(/^@\/components\/ui\/([\w-]+)/);
      if (ui) usedPrimitives.add(ui[1]);
      let x = crossSlug(imp, p, ownSlug);
      if (x) {
        // Imports landing inside a base's features/<name>/ folder belong to
        // the owning FEATURE item, not the base (P3 slicing) — refine.
        const fm = imp.match(/\/features\/([\w-]+)/);
        if (fm) {
          const owner = (featureItemsByBase.get(x) ?? []).find((cand) =>
            (cand.files ?? []).some((ff) => ff.path.replace(/\\/g, "/").includes(`/${x}/features/${fm[1]}/`)),
          );
          if (owner) x = owner.name;
        }
        if (byName.has(x)) usedCross.add(x);
      }
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
  // Structurally-required regDeps (e.g. a feature item's F5 base dep) are
  // "used" by definition — exempt from the unused-pin warn.
  for (const x of alwaysUsedReg) usedCross.add(x);
  const declaredPrim = new Set(
    (item.registryDependencies ?? []).filter((d) => !d.startsWith("@") && !d.startsWith("http")),
  );
  for (const u of usedPrimitives) {
    if (!declaredPrim.has(u)) report("high", item.name, `imports @/components/ui/${u} but registryDependencies lacks "${u}"`);
  }
  for (const d of declaredPrim) {
    if (!usedPrimitives.has(d)) report("warn", item.name, `registryDependencies lists primitive "${d}" with no matching @/components/ui import`);
  }
  for (const x of usedCross) {
    if (!declaredReg.has(x)) report("high", item.name, `imports sibling procomp "${x}" but registryDependencies lacks @ilinxa/${x}`);
  }
  for (const x of declaredReg) {
    if (!usedCross.has(x)) report("warn", item.name, `registryDependencies pins @ilinxa/${x} with no matching import (intentional pin? document it)`);
  }
}

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

  // (2) on-disk shipped files all listed — expected set is the base item's
  // OWN files ∪ files of every feature item with meta.featureOf === slug
  // (feature files physically live under the same slug folder, at
  // features/<name>/..., so they must not false-positive as "unlisted").
  const featuresOfSlug = featureItemsByBase.get(slug) ?? [];
  const featureFiles = featuresOfSlug.flatMap((fi) => fi.files ?? []);
  const featureListedPaths = new Set(featureFiles.map((f) => f.path.replace(/\\/g, "/")));
  if (existsSync(slugDir)) {
    for (const abs of walk(slugDir)) {
      const rel = abs.replace(/\\/g, "/").split("/src/registry/")[1];
      const relPath = `src/registry/${rel}`;
      if (NON_SHIPPED.test(relPath)) continue;
      if (!listed.has(relPath) && !featureListedPaths.has(relPath)) report("high", item.name, `shipped file on disk NOT in registry.json files[] (base or a feature item): ${relPath}`);
    }
  } else {
    report("high", item.name, `component folder missing: ${slugDir}`);
  }
  // A file shipped by a feature item must not ALSO be listed in the base
  // item's own files[] — each file ships from exactly one item.
  for (const p of featureListedPaths) {
    if (listed.has(p)) {
      const owner = featuresOfSlug.find((fi) => (fi.files ?? []).some((f) => f.path.replace(/\\/g, "/") === p));
      report("high", item.name, `file "${p}" is shipped by feature item "${owner?.name}" but ALSO listed in this BASE item's files[]`);
    }
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

  // (6) + (7) imports vs declarations — scan the base item's files AND the
  // fixtures item's dummy-data (fixtures declare no deps of their own, so
  // anything dummy-data imports must be declared on the base).
  const scanFiles = [...files, ...((byName.get(`${slug}-fixtures`)?.files) ?? [])];
  checkDepsAndImports(item, scanFiles, slug);
}

// FEATURE items (F1-F7, P3 feature-slicing) — meta.featureOf marks a slice
// layered on a base item's folder (injection surface, R1 VERDICT strategy b).
for (const fi of featureItems) {
  const featureOf = fi.meta.featureOf;

  // F1: featureOf names an existing non-deprecated base item.
  const baseItem = baseItemNames.has(featureOf) ? byName.get(featureOf) : null;
  if (!baseItem) {
    report("high", fi.name, `meta.featureOf "${featureOf}" does not name an existing non-deprecated base item`);
    continue;
  }

  // F2: item name starts with `${featureOf}-`.
  if (!fi.name.startsWith(`${featureOf}-`)) report("high", fi.name, `item name must start with "${featureOf}-" (featureOf convention)`);

  const files = fi.files ?? [];
  if (files.length === 0) report("high", fi.name, "feature item ships no files");

  // F3 + F7: target convention (components/<featureOf>/features/<name>/...,
  // mirroring the same path→target convention as base rule 4) + files exist.
  for (const f of files) {
    if (!existsSync(join(ROOT, f.path))) report("high", fi.name, `listed file missing on disk: ${f.path}`);
    const expectedPrefix = `components/${featureOf}/features/`;
    const target = f.target ?? "";
    if (!target.startsWith(expectedPrefix)) {
      report("high", fi.name, `target "${target}" does not start with the locked convention "${expectedPrefix}"`);
      continue;
    }
    const pm = f.path.replace(/\\/g, "/").match(/^src\/registry\/components\/([\w-]+)\/([\w-]+)\/(features\/[\w-]+\/.+)$/);
    if (!pm) {
      report("high", fi.name, `cannot derive locked-convention sub-path from "${f.path}" (expected .../components/<cat>/${featureOf}/features/<name>/...)`);
      continue;
    }
    const [, , pathSlug, sub] = pm;
    if (pathSlug !== featureOf) report("high", fi.name, `file path folder "${pathSlug}" ≠ featureOf "${featureOf}": ${f.path}`);
    const expectedTarget = `components/${featureOf}/${sub}`;
    if (target !== expectedTarget) report("high", fi.name, `target "${target}" ≠ locked convention "${expectedTarget}"`);
  }

  // F4: no file target collides with the base item, its fixtures sibling, or
  // any sibling feature item of the same base (plan invariant 3).
  const baseTargets = new Set((baseItem.files ?? []).map((f) => f.target));
  const fixturesItem = byName.get(`${featureOf}-fixtures`);
  const fixturesTargets = new Set((fixturesItem?.files ?? []).map((f) => f.target));
  const siblingTargets = new Set(
    (featureItemsByBase.get(featureOf) ?? [])
      .filter((x) => x.name !== fi.name)
      .flatMap((x) => (x.files ?? []).map((f) => f.target)),
  );
  for (const f of files) {
    if (baseTargets.has(f.target)) report("high", fi.name, `target "${f.target}" collides with base item "${featureOf}"`);
    if (fixturesTargets.has(f.target)) report("high", fi.name, `target "${f.target}" collides with fixtures item "${featureOf}-fixtures"`);
    if (siblingTargets.has(f.target)) report("high", fi.name, `target "${f.target}" collides with a sibling feature item of "${featureOf}"`);
  }

  // F5: registryDependencies pulls the base (headline fresh-install DX).
  if (!(fi.registryDependencies ?? []).includes(`@ilinxa/${featureOf}`))
    report("high", fi.name, `registryDependencies must include "@ilinxa/${featureOf}"`);

  // F6: meta.budgetKB is a positive number (consumed by validate:artifact-size).
  const budgetKB = fi.meta?.budgetKB;
  if (typeof budgetKB !== "number" || !(budgetKB > 0))
    report("high", fi.name, `meta.budgetKB must be a positive number (got ${JSON.stringify(budgetKB)})`);

  // (6)+(7) imports vs declarations, scoped to the feature item's own files.
  // The F5 base regDep is structurally required — never an unused-pin warn.
  checkDepsAndImports(fi, files, featureOf, [featureOf]);
}

// (8) deprecated alias shape (P2.3): no files, exactly one @ilinxa regDep
// pointing at a live base item, meta.replacedBy consistent with it.
for (const a of aliasItems) {
  if ((a.files ?? []).length > 0) report("high", a.name, "deprecated alias must not ship files");
  const regs = (a.registryDependencies ?? []).filter((d) => d.startsWith("@ilinxa/"));
  const target = regs[0]?.slice("@ilinxa/".length);
  if (regs.length !== 1) report("high", a.name, "alias must have exactly one @ilinxa registryDependency");
  else if (!byName.has(target)) report("high", a.name, `alias redirect target "${target}" is not a registry item`);
  if (a.meta?.replacedBy && a.meta.replacedBy !== target)
    report("high", a.name, `meta.replacedBy "${a.meta.replacedBy}" ≠ registryDependency target "${target}"`);
}

console.log(`\nvalidate:registry-json — ${baseItems.length} base items + ${featureItems.length} feature items + ${aliasItems.length} aliases audited: ${highs} high · ${warns} warn.`);
process.exit(highs > 0 ? 1 : 0);
