#!/usr/bin/env node
/**
 * sync-registry-versions.mjs — copies each component's `version` and `status`
 * from its `meta.ts` into the matching `registry.json` items' `meta`, so the
 * served item (`public/r/<item>.json`, written by `shadcn build`, which passes
 * item `meta` through) says which version it is. Contract rule C10 / R10.
 *
 * `meta.ts` stays the single source of truth: this script owns the two keys
 * and merges them into an existing `meta` (`featureOf`, `budgetKB`, … are kept).
 *
 * Which items get a version:
 *   - base item `<slug>`             → src/registry/components/<cat>/<slug>/meta.ts
 *   - fixtures item `<slug>-fixtures` → the base's meta.ts
 *   - feature item (`meta.featureOf`) → the base's meta.ts (features ship from it)
 * Which never do (asserted, so a new item class cannot slip through unversioned):
 *   - deprecated aliases (`meta.deprecated`) — no files; installing one installs
 *     the versioned target
 *   - `_shared` support items (every file targets `components/_shared/…`) — no meta.ts
 * Any other item is an error.
 *
 * Usage:
 *   node scripts/sync-registry-versions.mjs            # write registry.json if it drifted
 *   node scripts/sync-registry-versions.mjs --check    # exit 1 on drift, write nothing
 *   node scripts/sync-registry-versions.mjs --registry <file> --components <dir>   # tests
 *
 * Exit: 0 in sync (or written) · 1 drift under --check, or an unmappable item / unreadable meta.ts
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const ROOT = process.cwd();
const REGISTRY_FILE = resolve(argValue("--registry") ?? join(ROOT, "registry.json"));
const COMPONENTS_DIR = resolve(argValue("--components") ?? join(ROOT, "src", "registry", "components"));

// Same extraction rule as build-component-versions.mjs: a top-level field sits at
// exactly two spaces inside `export const meta = {`, so nested `name:` / `version:`
// keys can never match.
function extractField(text, field) {
  const m = text.match(new RegExp(`^ {2}${field}\\s*:\\s*["']([^"']+)["']`, "m"));
  return m ? m[1] : null;
}

/** slug → { version, status, metaPath } for every component folder with a meta.ts. */
export function readComponentVersions(componentsDir) {
  const out = new Map();
  for (const cat of readdirSync(componentsDir)) {
    if (cat.startsWith("_")) continue; // _template
    const catDir = join(componentsDir, cat);
    if (!statSync(catDir).isDirectory()) continue;
    for (const slug of readdirSync(catDir)) {
      if (slug.startsWith("_")) continue; // _shared support folders
      const metaPath = join(catDir, slug, "meta.ts");
      if (!existsSync(metaPath)) continue;
      const text = readFileSync(metaPath, "utf8");
      const version = extractField(text, "version");
      const status = extractField(text, "status");
      if (!version || !status) {
        throw new Error(`${metaPath}: could not read a top-level version/status`);
      }
      out.set(slug, { version, status, metaPath });
    }
  }
  return out;
}

/** The slug whose meta.ts versions this item, or a reason it carries no version. */
export function owningSlug(item) {
  if (item.meta?.deprecated) return { skip: "alias" };
  const files = item.files ?? [];
  if (files.length > 0 && files.every((f) => String(f.target ?? "").startsWith("components/_shared/"))) {
    return { skip: "shared" };
  }
  if (item.meta?.featureOf) return { slug: item.meta.featureOf };
  if (item.name.endsWith("-fixtures")) return { slug: item.name.slice(0, -"-fixtures".length) };
  return { slug: item.name };
}

/** Returns { items, changed, errors } — items is a new array; inputs are not mutated. */
export function syncItems(items, versions) {
  const errors = [];
  let changed = 0;
  const next = items.map((item) => {
    const owner = owningSlug(item);
    if (owner.skip) {
      // A versionless class must stay versionless: strip a stale stamp if one exists.
      if (item.meta && ("version" in item.meta || "status" in item.meta)) {
        const rest = { ...item.meta };
        delete rest.version;
        delete rest.status;
        changed++;
        return { ...item, meta: rest };
      }
      return item;
    }
    const v = versions.get(owner.slug);
    if (!v) {
      errors.push(`item "${item.name}": no meta.ts for owning slug "${owner.slug}"`);
      return item;
    }
    const meta = item.meta ?? {};
    if (meta.version === v.version && meta.status === v.status) return item;
    changed++;
    return { ...item, meta: { ...meta, version: v.version, status: v.status } };
  });
  return { items: next, changed, errors };
}

/** A component folder with a meta.ts but no base item would ship no version — report it. */
export function unregisteredComponents(items, versions) {
  const names = new Set(items.map((i) => i.name));
  return [...versions.keys()]
    .filter((slug) => !names.has(slug))
    .map((slug) => `component "${slug}" has a meta.ts but no registry.json item`);
}

function main() {
  const text = readFileSync(REGISTRY_FILE, "utf8");
  const registry = JSON.parse(text);
  const versions = readComponentVersions(COMPONENTS_DIR);
  const { items, changed, errors } = syncItems(registry.items, versions);
  errors.push(...unregisteredComponents(registry.items, versions));
  if (errors.length > 0) {
    for (const e of errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  const rel = relative(ROOT, REGISTRY_FILE) || REGISTRY_FILE;
  if (changed === 0) {
    console.log(`sync-registry-versions — ${rel} in sync (${versions.size} components).`);
    return;
  }
  if (CHECK) {
    console.error(
      `✗ sync-registry-versions — ${changed} item(s) in ${rel} disagree with meta.ts. ` +
        "Run `node scripts/sync-registry-versions.mjs` (or `pnpm registry:build`) and commit.",
    );
    process.exit(1);
  }
  writeFileSync(REGISTRY_FILE, JSON.stringify({ ...registry, items }, null, 2) + "\n");
  console.log(`sync-registry-versions — updated ${changed} item(s) in ${rel}.`);
}

// Run only as a CLI, so tests can import the pure functions.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
