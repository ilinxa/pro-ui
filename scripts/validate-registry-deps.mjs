#!/usr/bin/env node
/**
 * validate-registry-deps.mjs — Part 1 R11 / consumer contract C10.
 *
 *   A. Every `dependencies` entry in registry.json is pinned (`name@range`), and the range is
 *      the one in this repo's package.json — the version pro-ui installs and tests against.
 *      A bare name lets the CLI install whatever is latest.
 *   B. No item reaches a HEAVY item (`heavy: true` in its meta.ts — editors, media-editor,
 *      pdf-viewer…) through a `registryDependencies` entry or a static import. Heavy
 *      composition goes through a slot or render prop, so the consumer chooses (locked
 *      decision 5: an optional feature-slice add-on). Exempt: an item's own fixtures and
 *      feature slices, and a feature slice's own edges — the slice IS the opt-in route
 *      (`carousel-composer-editing` → media-editor); a slice that reaches a heavy item is
 *      heavy itself, so an edge INTO it still counts. Transitive: an item that reaches a heavy item (even through a
 *      baselined edge) counts as heavy for edges INTO it — depending on json-form pulls Plate. Edges present when the rule landed are listed in
 *      scripts/heavy-edges-baseline.json — `[{ from, to, via }]`, shrink-only (a row that no
 *      longer occurs fails, so it must be deleted).
 *
 * Usage:
 *   node scripts/validate-registry-deps.mjs            # gate
 *   node scripts/validate-registry-deps.mjs --pin      # rewrite bare names to package.json ranges
 *   --registry <f> --root <dir> --baseline <f> --package <f>   # tests
 *
 * Exit: 0 clean · 1 a bare / drifted dependency, a new heavy edge, or a stale baseline row
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PREFIX = "src/registry/components/";

/** `"@scope/name@^1.2.3"` → { name, range } (range undefined when bare). */
export function parseDep(spec) {
  const m = spec.match(/^(@?[^@]+)(?:@(.+))?$/);
  return { name: m[1], range: m[2] };
}

/** Problems with item dependencies → [{ item, dep, problem }]. */
export function depProblems(items, declared) {
  const out = [];
  for (const item of items) {
    for (const spec of item.dependencies ?? []) {
      const { name, range } = parseDep(spec);
      if (!range) out.push({ item: item.name, dep: spec, problem: `bare name — pin it (${name}@${declared[name] ?? "?"})` });
      else if (!declared[name]) out.push({ item: item.name, dep: spec, problem: "not in package.json — pro-ui never tests it" });
      else if (declared[name] !== range) {
        out.push({ item: item.name, dep: spec, problem: `range differs from package.json (${declared[name]})` });
      }
    }
  }
  return out;
}

/** Items with bare names rewritten to `name@<package.json range>`. */
export function pinned(items, declared) {
  return items.map((item) => {
    if (!item.dependencies) return item;
    const deps = item.dependencies.map((spec) => {
      const { name, range } = parseDep(spec);
      return range || !declared[name] ? spec : `${name}@${declared[name]}`;
    });
    return { ...item, dependencies: deps };
  });
}

/** Slugs whose meta.ts says `heavy: true` (two-space top-level field, like the other meta readers). */
export function heavySlugs(componentsDir) {
  const out = new Set();
  for (const cat of readdirSync(componentsDir)) {
    if (cat.startsWith("_") || !statSync(join(componentsDir, cat)).isDirectory()) continue;
    for (const slug of readdirSync(join(componentsDir, cat))) {
      const meta = join(componentsDir, cat, slug, "meta.ts");
      if (existsSync(meta) && /^ {2}heavy:\s*true\b/m.test(readFileSync(meta, "utf8"))) out.add(slug);
    }
  }
  return out;
}

const ownerOf = (item) => item.meta?.featureOf ?? (item.name.endsWith("-fixtures") ? item.name.slice(0, -9) : item.name);

/** Edges into heavy items → [{ from, to, via }]; `read(path)` returns a shipped file's text. */
export function heavyEdges(items, heavy, read) {
  const out = [];
  const seen = new Set();
  const add = (e) => {
    const k = `${e.from}|${e.to}|${e.via}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(e);
  };
  for (const item of items) {
    if (item.meta?.deprecated) continue;
    // A feature slice is the sanctioned way to reach a heavy item; see sliceCarriesWeight.
    if (item.meta?.featureOf) continue;
    const owner = ownerOf(item);
    for (const dep of item.registryDependencies ?? []) {
      const to = dep.replace(/^@ilinxa\//, "");
      if (dep.startsWith("@ilinxa/") && heavy.has(to) && to !== owner) add({ from: item.name, to, via: "registryDependencies" });
    }
    for (const f of item.files ?? []) {
      if (!f.path.startsWith(PREFIX) || !/\.(tsx?)$/.test(f.path)) continue;
      const text = read(f.path);
      for (const m of text.matchAll(/^\s*import\s+(?!type\b)[^;]*?\bfrom\s*["']@\/registry\/components\/[^/"']+\/([^/"']+)[/"']/gm)) {
        if (heavy.has(m[1]) && m[1] !== owner) add({ from: item.name, to: m[1], via: "static import" });
      }
    }
  }
  return out;
}

/**
 * Heavy edges, transitively: an item that reaches a heavy item (even through a baselined edge)
 * carries that weight, so an edge INTO it is a heavy edge too. Grows `heavy` in place until
 * nothing new is reached; returns the final edge list.
 */
export function transitiveHeavyEdges(items, heavy, read) {
  const grow = () => {
    for (const item of items) if (sliceCarriesWeight(item, heavy)) heavy.add(item.name);
  };
  let edges = heavyEdges(items, heavy, read);
  for (let size = -1; heavy.size !== size; ) {
    size = heavy.size;
    for (const e of edges) heavy.add(e.from.replace(/-fixtures$/, ""));
    grow();
    edges = heavyEdges(items, heavy, read);
  }
  return edges;
}

/** A feature slice that depends on a heavy item (other than its own base) carries that weight. */
export function sliceCarriesWeight(item, heavy) {
  if (!item.meta?.featureOf || item.meta?.deprecated) return false;
  return (item.registryDependencies ?? []).some((dep) => {
    const to = dep.replace(/^@ilinxa\//, "");
    return dep.startsWith("@ilinxa/") && heavy.has(to) && to !== item.meta.featureOf;
  });
}

const key = (e) => `${e.from}|${e.to}|${e.via}`;

function main() {
  const args = process.argv.slice(2);
  const arg = (f, d) => {
    const i = args.indexOf(f);
    return resolve(i >= 0 ? args[i + 1] : d);
  };
  const root = arg("--root", process.cwd());
  const registryFile = arg("--registry", join(root, "registry.json"));
  const pkgFile = arg("--package", join(root, "package.json"));
  const baselineFile = arg("--baseline", join(root, "scripts", "heavy-edges-baseline.json"));
  const registry = JSON.parse(readFileSync(registryFile, "utf8"));
  const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
  const declared = { ...pkg.devDependencies, ...pkg.dependencies };

  if (args.includes("--pin")) {
    const items = pinned(registry.items, declared);
    writeFileSync(registryFile, JSON.stringify({ ...registry, items }, null, 2) + "\n");
    console.log("validate-registry-deps — bare dependency names pinned to package.json ranges.");
    return;
  }

  const problems = depProblems(registry.items, declared);
  const heavy = heavySlugs(join(root, "src", "registry", "components"));
  // A feature slice of a heavy item is heavy too (media-editor-capture).
  for (const item of registry.items) if (heavy.has(item.meta?.featureOf)) heavy.add(item.name);
  const flagged = [...heavy].sort();
  const edges = transitiveHeavyEdges(registry.items, heavy, (p) => readFileSync(join(root, p), "utf8"));
  const baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : [];
  const allowed = new Set(baseline.map(key));
  const present = new Set(edges.map(key));
  const fresh = edges.filter((e) => !allowed.has(key(e)));
  const stale = baseline.filter((b) => !present.has(key(b)));

  if (problems.length + fresh.length + stale.length > 0) {
    console.error(`✗ validate-registry-deps — ${problems.length} dependency problem(s), ${fresh.length} new heavy edge(s), ${stale.length} stale baseline row(s):`);
    for (const p of problems) console.error(`  - ${p.item}: "${p.dep}" — ${p.problem}`);
    for (const e of fresh) console.error(`  - ${e.from} → heavy ${e.to} via ${e.via}: reach it through a slot / render prop instead`);
    for (const s of stale) console.error(`  - stale baseline row (no longer occurs — delete it): ${s.from} → ${s.to} via ${s.via}`);
    process.exit(1);
  }
  console.log(
    `validate-registry-deps — every dependency pinned to package.json; heavy [${flagged.join(", ")}]; ` +
      `${heavy.size - flagged.length} more reach one; ${edges.length} baselined heavy edge(s).`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
