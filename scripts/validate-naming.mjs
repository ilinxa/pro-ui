#!/usr/bin/env node
/**
 * validate:naming — enforces the naming canon (docs/naming-canon.md, LOCKED 2026-08-11)
 * so slug/copy drift cannot re-enter via the scaffolder or hand edits. Plan P2.4.
 *
 * Checks:
 *  (1) slug pattern: kebab, no numeric version suffix (-NN) unless registered in VARIANTS
 *  (2) slug uniqueness + meta.slug === folder name
 *  (3) display name = canonical Title Case (acronym-aware)
 *  (4) catalog copy: description ≤160 chars, no decision IDs (D-NN), no version
 *      archaeology (vX.Y), no @ilinxa/ refs, no backticked slug tokens, no live
 *      slug used as a kebab token
 *  (5) registry.json base-item description/title in sync with meta.ts
 *  (6) three-way roster equality: disk folders == manifest == registry.json base
 *      items (deprecated aliases + _shared support items exempt)
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VARIANTS = new Set(); // true second variants may register "-2" style slugs here
const { RENAMES, UNCHANGED } = await import("./p2-rename-map.mjs");
const CANON_SLUGS = new Set([...Object.values(RENAMES), ...UNCHANGED]);

const ACRONYMS = { pdf: "PDF", json: "JSON", crud: "CRUD" };
const title = (slug) =>
  slug.split("-").map((w) => ACRONYMS[w] ?? w[0].toUpperCase() + w.slice(1)).join(" ");

let highs = 0;
const report = (item, msg) => { console.error(`  [naming] ${item}: ${msg}`); highs++; };

// string-literal-aware field extractor
const field = (src, name) => {
  const m = src.match(new RegExp(`${name}:\\s*("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`[^\`]*\`)`));
  if (!m) return null;
  const q = m[1][0];
  return q === "`" ? m[1].slice(1, -1) : JSON.parse(q === "'" ? `"${m[1].slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"')}"` : m[1]);
};

// (1)(2)(3)(4) — disk + meta
const compRoot = join(ROOT, "src/registry/components");
const disk = [];
for (const cat of readdirSync(compRoot)) {
  if (cat.startsWith("_")) continue;
  if (!statSync(join(compRoot, cat)).isDirectory()) continue;
  for (const slug of readdirSync(join(compRoot, cat))) {
    if (!existsSync(join(compRoot, cat, slug, "meta.ts"))) continue;
    disk.push({ cat, slug });
  }
}
const diskSlugs = disk.map((d) => d.slug);
const dupes = diskSlugs.filter((s, i) => diskSlugs.indexOf(s) !== i);
for (const d of dupes) report(d, "duplicate slug across categories");

for (const { cat, slug } of disk) {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) report(slug, "slug is not kebab-case");
  if (/-\d+$/.test(slug) && !VARIANTS.has(slug)) report(slug, "numeric version suffix (-NN) — version belongs in the version field (canon N4)");
  const src = readFileSync(join(compRoot, cat, slug, "meta.ts"), "utf8");
  const metaSlug = field(src, "slug");
  const metaName = field(src, "name");
  const desc = field(src, "description");
  if (metaSlug !== slug) report(slug, `meta.slug "${metaSlug}" ≠ folder name`);
  if (metaName !== title(slug)) report(slug, `meta.name "${metaName}" ≠ canonical "${title(slug)}"`);
  if (desc == null) { report(slug, "no description"); continue; }
  if (desc.length > 160) report(slug, `description ${desc.length} chars > 160 cap`);
  if (/D-\d+/.test(desc)) report(slug, "description contains a decision ID");
  if (/\bv\d+\.\d+/.test(desc)) report(slug, "description contains version archaeology");
  if (/@ilinxa\//.test(desc)) report(slug, "description contains an @ilinxa/ ref");
  if (/`[a-z0-9][a-z0-9-]*`/.test(desc)) report(slug, "description contains a backticked slug token");
  for (const other of diskSlugs) {
    if (other.includes("-") && new RegExp(`(?<![a-z0-9-])${other}(?![a-z0-9-])`).test(desc))
      report(slug, `description references slug "${other}" — copy must be self-contained`);
  }
}

// (5)(6) — registry.json + manifest rosters
const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));
const metaBySlug = new Map(disk.map(({ cat, slug }) => [slug, readFileSync(join(compRoot, cat, slug, "meta.ts"), "utf8")]));
const regBase = registry.items.filter(
  (i) => !i.name.endsWith("-fixtures") && !i.meta?.deprecated && !(i.files?.[0]?.target ?? "").startsWith("components/_shared"),
);
for (const item of regBase) {
  const src = metaBySlug.get(item.name);
  if (!src) { report(item.name, "registry.json base item has no disk component"); continue; }
  if (item.description !== field(src, "description")) report(item.name, "registry.json description out of sync with meta.ts");
  if (item.title !== title(item.name)) report(item.name, `registry.json title "${item.title}" ≠ canonical "${title(item.name)}"`);
}
// copy canon applies to EVERY served description, incl. _shared support items + fixtures
for (const item of registry.items) {
  if (item.meta?.deprecated) continue;
  const d = item.description ?? "";
  if (d.length > 160) report(item.name, `registry description ${d.length} chars > 160 cap`);
  if (/D-\d+/.test(d)) report(item.name, "registry description contains a decision ID");
  if (/\bv\d+\.\d+/.test(d)) report(item.name, "registry description contains version archaeology");
}

const regSet = new Set(regBase.map((i) => i.name));
for (const s of diskSlugs) if (!regSet.has(s)) report(s, "on disk but missing from registry.json");
for (const a of registry.items.filter((i) => i.meta?.deprecated))
  if (diskSlugs.includes(a.name)) report(a.name, "deprecated alias name collides with a live slug");

// canon roster: every slug the LOCKED canon promises must exist on disk
for (const s of CANON_SLUGS) if (!diskSlugs.includes(s)) report(s, "canon slug (naming-canon.md) missing on disk");

const manifestSrc = readFileSync(join(ROOT, "src/registry/manifest.ts"), "utf8");
const manifestSlugs = new Set([...manifestSrc.matchAll(/from "\.\/components\/[^/]+\/([^/]+)\/meta"/g)].map((m) => m[1]));
for (const s of diskSlugs) if (!manifestSlugs.has(s)) report(s, "on disk but not registered in manifest.ts");
for (const s of manifestSlugs) if (!diskSlugs.includes(s)) report(s, "in manifest.ts but not on disk");

console.log(`validate:naming — ${disk.length} components checked: ${highs} finding(s).`);
process.exit(highs > 0 ? 1 : 0);
