#!/usr/bin/env node
/**
 * validate-no-control-chars.mjs — no RAW control characters in source.
 * Established 2026-08-18 (card-tree F2, integrator report).
 *
 * card-tree v0.6.0 shipped a memo signature built from literal U+0001 / U+0000
 * bytes. Runtime-correct, but a NUL makes git classify the file as BINARY: the
 * single most-reviewed file in the component stopped rendering as a diff, and
 * `git blame` / `git log -p` / ripgrep all went opaque with it. Vendored
 * distribution makes the diff the review surface, so this is a shipping defect
 * even though nothing misbehaves at runtime.
 *
 * ESLint's `no-control-regex` does NOT cover this — it inspects regular
 * expressions only, and this was a string literal (verified: it reports nothing
 * on the offending shape). Hence a dedicated gate.
 *
 * The fix is always the same: write the escape ("\u0000"), not the raw byte.
 * Identical at runtime, and the source stays plain ASCII.
 *
 * Two zones, because the rule is not identical everywhere:
 *   - src/registry — ships to consumers. Only tab / LF / CR.
 *   - scripts      — never vendored, and legitimately uses raw ESC (U+001B) for
 *                    terminal colour. ESC allowed; NUL and friends still banned.
 * The scripts zone exists because the FIRST version of this very file shipped a
 * raw NUL in its own header comment and went binary — a guard that cannot see
 * itself is not a guard.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTS = /\.(ts|tsx|mjs|css|json|md)$/;

const BASE_ALLOWED = [9, 10, 13]; // tab, LF, CR
const ESC = 27;

/** @type {{dir: string, label: string, allowed: Set<number>}[]} */
const ZONES = [
  {
    dir: path.join("src", "registry"),
    label: "registry (shipped to consumers)",
    allowed: new Set(BASE_ALLOWED),
  },
  {
    dir: "scripts",
    label: "build scripts (raw ESC permitted for colour)",
    allowed: new Set([...BASE_ALLOWED, ESC]),
  },
];

const NAMES = { 0: "NUL", 1: "SOH", 8: "BS", 11: "VT", 12: "FF", 27: "ESC", 127: "DEL" };
const describe = (c) =>
  `U+${c.toString(16).toUpperCase().padStart(4, "0")}${NAMES[c] ? ` (${NAMES[c]})` : ""}`;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (EXTS.test(entry.name)) acc.push(p);
  }
  return acc;
}

let scanned = 0;
const offenders = [];

for (const zone of ZONES) {
  const abs = path.join(root, zone.dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    scanned++;
    const buf = fs.readFileSync(file);
    let line = 1;
    let col = 1;
    const hits = [];
    for (let i = 0; i < buf.length; i++) {
      const c = buf[i];
      if ((c < 32 || c === 127) && !zone.allowed.has(c)) hits.push({ offset: i, line, col, c });
      if (c === 10) {
        line++;
        col = 1;
      } else col++;
    }
    if (hits.length) {
      offenders.push({
        file: path.relative(root, file).split(path.sep).join("/"),
        zone: zone.label,
        hits,
      });
    }
  }
}

if (offenders.length === 0) {
  console.log(`✓ no-control-chars: ${scanned} files clean (${ZONES.length} zones).`);
  process.exit(0);
}

for (const { file, zone, hits } of offenders) {
  const nul = hits.some((h) => h.c === 0);
  console.error(
    `✗ ${file} [${zone}]: ${hits.length} raw control character(s)` +
      `${nul ? " — git will treat this file as BINARY" : ""}`,
  );
  for (const h of hits) {
    console.error(`    line ${h.line}:${h.col} (byte ${h.offset}) — ${describe(h.c)}`);
  }
}
console.error(
  `\n  Write the escape instead of the byte (e.g. "\\u0000"). Identical at runtime;\n` +
    `  keeps the file diffable. See scripts/validate-no-control-chars.mjs for why.`,
);
process.exit(1);
