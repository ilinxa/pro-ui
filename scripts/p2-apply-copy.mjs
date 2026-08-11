/**
 * P2.5 — catalog copy apply: writes the canon descriptions (scripts/p2-descriptions.json,
 * one sentence ≤160 chars, capability-first) and canonical display names into every
 * meta.ts and registry.json item (base description/title + standardized fixtures copy).
 * One-shot; validate:naming enforces the canon afterward.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESCRIPTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/p2-descriptions.json"), "utf8"));

const ACRONYMS = { pdf: "PDF", json: "JSON", crud: "CRUD" };
const title = (slug) =>
  slug.split("-").map((w) => ACRONYMS[w] ?? w[0].toUpperCase() + w.slice(1)).join(" ");

// string-literal-aware matcher for a meta field
const FIELD = (name) =>
  new RegExp(`(${name}:\\s*)("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`[^\`]*\`)`);

let errors = 0;
for (const [slug, desc] of Object.entries(DESCRIPTIONS)) {
  if (desc.length > 160) { console.error(`✗ ${slug}: description ${desc.length} > 160`); errors++; }
}

// meta.ts
const compRoot = path.join(ROOT, "src/registry/components");
const seen = new Set();
for (const cat of fs.readdirSync(compRoot)) {
  if (cat.startsWith("_")) continue;
  for (const slug of fs.readdirSync(path.join(compRoot, cat))) {
    const mp = path.join(compRoot, cat, slug, "meta.ts");
    if (!fs.existsSync(mp)) continue;
    const desc = DESCRIPTIONS[slug];
    if (!desc) { console.error(`✗ no canon description for ${slug}`); errors++; continue; }
    seen.add(slug);
    let c = fs.readFileSync(mp, "utf8");
    if (!FIELD("description").test(c)) { console.error(`✗ ${slug}: description field not found`); errors++; continue; }
    c = c.replace(FIELD("description"), `$1${JSON.stringify(desc)}`);
    c = c.replace(FIELD("name"), `$1${JSON.stringify(title(slug))}`);
    fs.writeFileSync(mp, c);
  }
}
for (const slug of Object.keys(DESCRIPTIONS)) if (!seen.has(slug)) { console.error(`✗ canon slug not on disk: ${slug}`); errors++; }

// registry.json
const rp = path.join(ROOT, "registry.json");
const j = JSON.parse(fs.readFileSync(rp, "utf8"));
for (const item of j.items) {
  if (item.meta?.deprecated) continue;
  const isFx = item.name.endsWith("-fixtures");
  const base = isFx ? item.name.slice(0, -"-fixtures".length) : item.name;
  const desc = DESCRIPTIONS[base];
  if (!desc) continue; // _shared support items keep their copy
  if (isFx) {
    item.title = `${title(base)} — fixtures`;
    item.description = `${title(base)} plus the dummy-data fixtures used by the docs-site demo.`;
  } else {
    item.title = title(base);
    item.description = desc;
  }
}
fs.writeFileSync(rp, JSON.stringify(j, null, 2) + "\n");
console.log(`✓ applied ${Object.keys(DESCRIPTIONS).length} canon descriptions to meta.ts + registry.json${errors ? ` — ${errors} ERRORS` : ""}`);
process.exit(errors ? 1 : 0);
