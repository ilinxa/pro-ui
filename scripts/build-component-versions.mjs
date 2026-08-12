#!/usr/bin/env node
/**
 * build-component-versions.mjs — regenerates docs/component-versions.md as a
 * pure, deterministic snapshot derived from two sources of truth:
 *
 *   1. Every `src/registry/components/<category>/<slug>/meta.ts` — slug,
 *      name, version, status, updatedAt (category from the folder path).
 *   2. `.claude/decisions/*.md` frontmatter `components:` lists — cross-
 *      referenced against (1) to build a slug → [decision files] index.
 *
 * The hand-maintained predecessor of this file drifted constantly (stale
 * counts, stale versions) because nothing forced it to track meta.ts. This
 * script replaces hand-editing entirely — the file it produces carries a
 * GENERATED banner and should never be hand-edited again.
 *
 * Naming caution: 52 slugs were renamed 2026-08-11 (P2 — see
 * docs/naming-canon.md). Decision files older than that date use OLD slugs
 * in their `components:` frontmatter. This script parses naming-canon.md's
 * rename tables (§3a re-stems, §3b suffix-drops, §3c unchanged) into an
 * old→new map and applies it when indexing decision files. That table only
 * covers the 2026-08-11 rename — any earlier ad-hoc internal renames are out
 * of scope and will simply not resolve (documented in the generated header).
 *
 * Determinism: output must be byte-identical across runs on unchanged
 * inputs. No wall-clock timestamps — the "snapshot" line uses the MAX
 * `updatedAt` across all component meta.ts files instead. Stable sort
 * (category, then slug); decision-file links sorted by filename.
 *
 * Usage:
 *   node scripts/build-component-versions.mjs
 *
 * Exit:
 *   0 — generated (file written or already current)
 *   1 — a meta.ts could not be parsed (fail loud, like the other validators)
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const COMPONENTS_DIR = join(ROOT, "src", "registry", "components");
const DECISIONS_DIR = join(ROOT, ".claude", "decisions");
const NAMING_CANON_FILE = join(ROOT, "docs", "naming-canon.md");
const OUT_FILE = join(ROOT, "docs", "component-versions.md");

const GENERATED_BANNER =
  "<!-- GENERATED — do not hand-edit; run `pnpm build:component-versions` -->";

// ───────────────────────────────────────────────────────────────────────
// 1. Walk components/<category>/<slug>/meta.ts
// ───────────────────────────────────────────────────────────────────────
function findAllComponentDirs() {
  const out = [];
  for (const cat of readdirSync(COMPONENTS_DIR)) {
    if (cat === "_template") continue;
    const catDir = join(COMPONENTS_DIR, cat);
    if (!statSync(catDir).isDirectory()) continue;
    for (const slug of readdirSync(catDir)) {
      if (slug.startsWith("_")) continue; // _shared support folders — no meta.ts, not a component
      const slugDir = join(catDir, slug);
      if (!statSync(slugDir).isDirectory()) continue;
      const metaPath = join(slugDir, "meta.ts");
      if (!existsSync(metaPath)) continue;
      out.push({ slug, category: cat, metaPath });
    }
  }
  return out;
}

// Extract a top-level `field: "value"` line from meta.ts. Anchored to
// EXACTLY two spaces of indentation — the top level inside
// `export const meta = {` as scaffolded from _template — so nested
// occurrences (`author: { name: ... }` on one line, `slices: [{ name: ... }]`
// at 4+ spaces) can never match regardless of where they appear in the file.
// This makes extraction order-independent rather than relying on the
// template's field order (P4 R4 finding F-5).
function extractField(text, field) {
  const re = new RegExp(`^ {2}${field}\\s*:\\s*["']([^"']+)["']`, "m");
  const m = text.match(re);
  return m ? m[1] : null;
}

function parseComponentMeta({ slug, category, metaPath }) {
  const text = readFileSync(metaPath, "utf8");
  const name = extractField(text, "name");
  const version = extractField(text, "version");
  const status = extractField(text, "status");
  const updatedAt = extractField(text, "updatedAt");
  const missing = [];
  if (!name) missing.push("name");
  if (!version) missing.push("version");
  if (!status) missing.push("status");
  if (!updatedAt) missing.push("updatedAt");
  if (missing.length > 0) {
    console.error(
      `✗ ${relative(ROOT, metaPath)}: could not extract field(s) [${missing.join(", ")}] — ` +
        "either the meta.ts shape changed or the field is missing. Fix the source or update " +
        "extractField's regex in build-component-versions.mjs.",
    );
    process.exit(1);
  }
  return { slug, category, name, version, status, updatedAt };
}

// ───────────────────────────────────────────────────────────────────────
// 2. Parse docs/naming-canon.md's rename tables into an old→new map.
//    Falls back to an empty map (with a noted limitation) if the file is
//    missing or its tables don't match the expected shape — this script
//    must never crash because a docs file's prose shifted.
// ───────────────────────────────────────────────────────────────────────
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseNamingCanon() {
  const oldToNew = new Map(); // exact old slug -> new (canonical) slug
  const fuzzySuffixRules = []; // { newSlug, regex } for §3b's "-NN" mechanical drop, any digit count
  let parsedOk = false;
  let reStemCount = 0;
  let suffixDropCount = 0;
  let unchangedCount = 0;

  if (!existsSync(NAMING_CANON_FILE)) {
    return { oldToNew, fuzzySuffixRules, parsedOk, reStemCount, suffixDropCount, unchangedCount };
  }
  const text = readFileSync(NAMING_CANON_FILE, "utf8");

  // §3a Re-stems: markdown table, first two backtick-wrapped cells per row are Old | New.
  const sectionA = text.match(
    /###\s*3a\.\s*Re-stems([\s\S]*?)(?=###\s*3b\.)/,
  );
  if (sectionA) {
    const rowRe = /^\|\s*`([a-z0-9-]+)`\s*\|\s*`([a-z0-9-]+)`\s*\|/gm;
    let m;
    while ((m = rowRe.exec(sectionA[1])) !== null) {
      oldToNew.set(m[1], m[2]);
      reStemCount++;
    }
  }

  // §3b Suffix-drops: flat backtick-wrapped slug list. Old form is the
  // mechanical `<slug>-01` (verified against decision-file evidence);
  // registered both as an exact alias and as a fuzzy `-\d{1,2}` rule so any
  // other numeric suffix still resolves.
  const sectionB = text.match(
    /###\s*3b\.\s*Suffix-drops([\s\S]*?)(?=###\s*3c\.)/,
  );
  if (sectionB) {
    const slugRe = /`([a-z0-9-]+)`/g;
    let m;
    while ((m = slugRe.exec(sectionB[1])) !== null) {
      const newSlug = m[1];
      oldToNew.set(`${newSlug}-01`, newSlug);
      fuzzySuffixRules.push({
        newSlug,
        regex: new RegExp(`^${escapeRegExp(newSlug)}-\\d{1,2}$`),
      });
      suffixDropCount++;
    }
  }

  // §3c Unchanged: flat backtick-wrapped slug list. Old === new (identity);
  // included for completeness though canonical-slug exact-match already
  // covers these.
  const sectionC = text.match(
    /###\s*3c\.\s*Unchanged([\s\S]*?)(?=\n---|\n##(?!#)|$)/,
  );
  if (sectionC) {
    const slugRe = /`([a-z0-9-]+)`/g;
    let m;
    while ((m = slugRe.exec(sectionC[1])) !== null) {
      oldToNew.set(m[1], m[1]);
      unchangedCount++;
    }
  }

  parsedOk = reStemCount > 0 || suffixDropCount > 0 || unchangedCount > 0;
  return { oldToNew, fuzzySuffixRules, parsedOk, reStemCount, suffixDropCount, unchangedCount };
}

// ───────────────────────────────────────────────────────────────────────
// 3. Parse .claude/decisions/*.md frontmatter `components:` lists and
//    resolve every token against the known-slug universe (canonical slugs,
//    naming-canon old→new map, fuzzy suffix rules, "prefix-*" wildcards).
//    Anything that doesn't resolve is silently dropped — this is a
//    whitelist match, not a blacklist, so descriptive prose in the
//    frontmatter ("all 63", "catalog-wide", "minor-bump", version numbers)
//    never produces a false positive.
// ───────────────────────────────────────────────────────────────────────
function findDecisionFiles() {
  if (!existsSync(DECISIONS_DIR)) return [];
  return readdirSync(DECISIONS_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();
}

// Pull the raw text of the `components:` frontmatter field — either an
// inline value (`components: [a, b]`, `components: []`, or free prose) or a
// YAML block list (`components:\n  - a\n  - b\n`). Frontmatter here is not
// strict YAML (see decisions/README.md — human+grep readability wins over a
// parser), so this reads it the way the other loose fields in this project
// are read: line-scan, not a YAML library.
function extractComponentsFieldRaw(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return "";
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return "";
  const fm = lines.slice(1, end);

  const startIdx = fm.findIndex((l) => /^components\s*:/.test(l));
  if (startIdx === -1) return "";

  const inlineValue = fm[startIdx].replace(/^components\s*:/, "").trim();
  const collected = [inlineValue];
  for (let i = startIdx + 1; i < fm.length; i++) {
    const line = fm[i];
    // Stop at the next top-level key (no leading whitespace, `key:` shape).
    if (/^[A-Za-z][\w-]*\s*:/.test(line)) break;
    // Only collect indented continuation/list lines.
    if (/^\s+\S/.test(line)) collected.push(line);
  }
  return collected.join("\n");
}

// [a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:-\*)? — kebab tokens, optionally ending in
// a literal `-*` wildcard marker (e.g. `team-*`).
const TOKEN_RE = /[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:-\*)?/g;

function resolveToken(token, canonicalSlugs, oldToNew, fuzzySuffixRules) {
  if (token.endsWith("-*")) {
    const prefix = token.slice(0, -1); // keep trailing "-"
    return canonicalSlugs.filter((s) => s.startsWith(prefix));
  }
  if (oldToNew.has(token)) return [oldToNew.get(token)];
  if (canonicalSlugs.includes(token)) return [token];
  for (const rule of fuzzySuffixRules) {
    if (rule.regex.test(token)) return [rule.newSlug];
  }
  return [];
}

function buildDecisionIndex(canonicalSlugs, oldToNew, fuzzySuffixRules) {
  const index = new Map(); // slug -> Set<filename>
  for (const slug of canonicalSlugs) index.set(slug, new Set());

  for (const file of findDecisionFiles()) {
    const text = readFileSync(join(DECISIONS_DIR, file), "utf8");
    const raw = extractComponentsFieldRaw(text);
    if (!raw) continue;
    const tokens = raw.match(TOKEN_RE) ?? [];
    const matchedSlugs = new Set();
    for (const token of tokens) {
      for (const slug of resolveToken(token, canonicalSlugs, oldToNew, fuzzySuffixRules)) {
        matchedSlugs.add(slug);
      }
    }
    for (const slug of matchedSlugs) index.get(slug).add(file);
  }
  return index;
}

// ───────────────────────────────────────────────────────────────────────
// 4. Emit docs/component-versions.md
// ───────────────────────────────────────────────────────────────────────
function main() {
  // Ordinal comparison, NOT localeCompare — locale/ICU-dependent collation
  // would violate the byte-identical-output determinism contract (F-6).
  const ord = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const components = findAllComponentDirs()
    .map(parseComponentMeta)
    .sort((a, b) => ord(a.category, b.category) || ord(a.slug, b.slug));

  const canonicalSlugs = components.map((c) => c.slug).sort();
  const { oldToNew, fuzzySuffixRules, parsedOk, reStemCount, suffixDropCount, unchangedCount } =
    parseNamingCanon();
  const decisionIndex = buildDecisionIndex(canonicalSlugs, oldToNew, fuzzySuffixRules);

  // Deterministic "snapshot" marker: max updatedAt across all components,
  // NOT wall-clock — keeps output byte-stable across reruns.
  const maxUpdatedAt = components.reduce(
    (max, c) => (c.updatedAt > max ? c.updatedAt : max),
    "0000-00-00",
  );

  const categoriesInOrder = [...new Set(components.map((c) => c.category))];
  const summaryRows = categoriesInOrder.map(
    (cat) => `| \`${cat}\` | ${components.filter((c) => c.category === cat).length} |`,
  );

  const lines = [];
  lines.push(GENERATED_BANNER);
  lines.push("");
  lines.push("# Component Versions");
  lines.push("");
  lines.push(
    `> Generated snapshot — pure data view derived from every \`meta.ts\` under \`src/registry/components/\`. **Do not hand-edit** — regenerate with \`pnpm build:component-versions\`.`,
  );
  lines.push(
    `> Snapshot marker: **${maxUpdatedAt}** (max \`updatedAt\` across all component meta.ts files — not wall-clock; keeps this file byte-stable across reruns on unchanged inputs).`,
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Category | Count |");
  lines.push("|---|---|");
  lines.push(...summaryRows);
  lines.push(`| **Total** | **${components.length}** |`);
  lines.push("");
  lines.push("## Components");
  lines.push("");

  for (const cat of categoriesInOrder) {
    const rows = components.filter((c) => c.category === cat);
    lines.push(`### ${cat} (${rows.length})`);
    lines.push("");
    lines.push("| Slug | Name | Version | Status | Updated |");
    lines.push("|---|---|---|---|---|");
    for (const c of rows) {
      lines.push(
        `| \`${c.slug}\` | ${c.name} | ${c.version} | ${c.status} | ${c.updatedAt} |`,
      );
    }
    lines.push("");
  }

  lines.push("## How history works");
  lines.push("");
  lines.push(
    "User-facing changes are recorded in [`CHANGELOG.md`](../CHANGELOG.md). This document is a pure generated index: version / status / updatedAt pulled straight from each component's `meta.ts`. Regenerate with `pnpm build:component-versions` whenever a `meta.ts` bumps.",
  );
  lines.push("");

  const next = lines.join("\n");
  // \r\n-normalize the on-disk copy before comparing: with core.autocrlf a
  // fresh checkout materializes CRLF, and a byte compare would rewrite the
  // file on every run despite unchanged inputs (P4 R4 finding F-4 — same
  // class as the validate-doc-drift.mjs hardening).
  const prev = existsSync(OUT_FILE)
    ? readFileSync(OUT_FILE, "utf8").replace(/\r\n/g, "\n")
    : null;
  const stale = next !== prev;

  if (CHECK_MODE) {
    if (stale) {
      console.error(
        "✗ docs/component-versions.md is stale — run `pnpm build:component-versions` and commit the result.",
      );
      process.exit(1);
    }
    console.log(`✓ docs/component-versions.md current (${components.length} components).`);
    return;
  }

  if (stale) {
    writeFileSync(OUT_FILE, next);
    console.log(`✓ docs/component-versions.md regenerated (${components.length} components).`);
  } else {
    console.log(`✓ docs/component-versions.md already current (${components.length} components).`);
  }
}

// --check: validate freshness of the committed file without writing —
// wired into the doc-validator gate so a meta.ts bump can't ship a stale
// committed snapshot (P4 R4 finding F-7).
const CHECK_MODE = process.argv.includes("--check");

main();
