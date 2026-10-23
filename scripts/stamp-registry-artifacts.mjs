#!/usr/bin/env node
/**
 * stamp-registry-artifacts.mjs — runs after `shadcn build` and appends
 * `// @ilinxa/<item> <version>` as the LAST line of the served entry file of
 * every versioned item in public/r/, so vendored code can say which version it
 * is. R10 / C10.
 *
 * Why the last line and not the first: shadcn CLI 3.8.5 and 4.18.0 both strip
 * every LEADING comment of an installed file (line, block or JSDoc, even one
 * above "use client"), and keep a trailing one — measured 2026-10-24 with a
 * probe item of nine comment placements on each CLI. A header would be served
 * and then silently removed on install.
 *
 * The stamp lives in the served JSON only — source files stay version-free,
 * so a version is written in exactly one place (meta.ts; see
 * sync-registry-versions.mjs, which puts it on the item's `meta`).
 *
 * Entry file, by item class:
 *   - base item     → the file targeting `components/<slug>/index.ts`
 *   - feature item  → the file targeting `components/<base>/features/<name>/index.ts`
 *   - fixtures item → its single file (`dummy-data.ts`)
 * An item with `meta.version` but no entry file is an error.
 *
 * Idempotent: a last line already shaped `// @ilinxa/<item> <x.y.z>` is replaced, never doubled.
 *
 * Usage:
 *   node scripts/stamp-registry-artifacts.mjs                # stamp public/r/*.json
 *   node scripts/stamp-registry-artifacts.mjs --dir <path>   # tests
 *
 * Exit: 0 stamped · 1 a versioned artifact without an entry file
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Strict shape, so a source comment that merely mentions `// @ilinxa/…` is never taken for a stamp.
const STAMP_LINE_RE = /^\/\/ @ilinxa\/([a-z0-9-]+) (\d+\.\d+\.\d+\S*)$/;

export function stampFor(item) {
  return `// @ilinxa/${item.name} ${item.meta.version}`;
}

/** The stamp on a file's last non-empty line → { name, version }, or null. Tolerates CRLF. */
export function readStamp(text) {
  const lines = String(text ?? "").split(/\r?\n/);
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  const m = (lines[lines.length - 1] ?? "").match(STAMP_LINE_RE);
  return m ? { name: m[1], version: m[2] } : null;
}

/** Index into item.files of the entry file, or -1. */
export function entryFileIndex(item) {
  const files = item.files ?? [];
  if (item.name.endsWith("-fixtures")) return files.length === 1 ? 0 : -1;
  if (item.meta?.featureOf) {
    return files.findIndex((f) =>
      new RegExp(`^components/${item.meta.featureOf}/features/[^/]+/index\\.ts$`).test(f.target ?? ""),
    );
  }
  return files.findIndex((f) => f.target === `components/${item.name}/index.ts`);
}

/**
 * `content` with its stamp (if any) replaced by `stamp` as the last line, separated
 * by one blank line. Keeps the file's own line ending (CRLF stays CRLF).
 */
export function withStamp(content, stamp) {
  const text = String(content ?? "");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const trimEnd = () => {
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  };
  trimEnd();
  if (lines.length > 0 && STAMP_LINE_RE.test(lines[lines.length - 1])) lines.pop();
  trimEnd();
  return lines.length === 0 ? stamp + eol : [...lines, "", stamp, ""].join(eol);
}

/** Returns { item, stamped, error } — never mutates the input. */
export function stampItem(item) {
  if (!item.meta?.version) return { item, stamped: false };
  const idx = entryFileIndex(item);
  if (idx < 0) return { item, stamped: false, error: `${item.name}: versioned item has no entry file` };
  const files = item.files.map((f, i) => (i === idx ? { ...f, content: withStamp(f.content, stampFor(item)) } : f));
  return { item: { ...item, files }, stamped: true };
}

function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--dir");
  const dir = resolve(i >= 0 ? args[i + 1] : join(process.cwd(), "public", "r"));
  const errors = [];
  let stamped = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json") || name === "registry.json") continue;
    const path = join(dir, name);
    const raw = readFileSync(path, "utf8");
    const result = stampItem(JSON.parse(raw));
    if (result.error) errors.push(result.error);
    if (!result.stamped) continue;
    // shadcn build writes 2-space JSON without a trailing newline — keep that shape.
    const out = JSON.stringify(result.item, null, 2);
    if (out !== raw) writeFileSync(path, out);
    stamped++;
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.log(`stamp-registry-artifacts — ${stamped} entry file(s) end with their version stamp.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
