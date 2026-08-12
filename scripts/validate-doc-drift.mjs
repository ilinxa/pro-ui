#!/usr/bin/env node
/**
 * validate-doc-drift.mjs — public docs vs registry truth (plan P0.6).
 *
 * Fails when the generated catalog sections in public/llms.txt and README.md
 * don't match registry.json's base-item set — i.e. someone changed the
 * registry without running `pnpm build:llms`, or hand-edited between the
 * markers. This is the validator that prevents the "docs claim 8, library
 * has 63" class (review findings 4.2 / 10.1) from ever returning.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const START = "<!-- GENERATED CATALOG — do not edit; run `pnpm build:llms` -->";
const END = "<!-- END GENERATED CATALOG -->";

const registry = JSON.parse(
  fs.readFileSync(path.join(root, "registry.json"), "utf8"),
);
const expected = new Set(
  registry.items
    .filter((i) => !i.name.endsWith("-fixtures"))
    .filter(
      (i) => !(i.files?.[0]?.target ?? "").startsWith("components/_shared"),
    )
    .filter((i) => !i.meta?.deprecated) // P2.3 alias redirects are not catalog entries
    .filter((i) => !i.meta?.featureOf) // P3 feature items render as ↳ sub-lines, not entries
    .map((i) => i.name),
);
// P3 feature items must be PRESENT (as sub-line mentions) in both surfaces,
// but never counted as standalone catalog entries.
const expectedFeatures = registry.items
  .filter((i) => typeof i.meta?.featureOf === "string" && i.meta.featureOf.length > 0)
  .map((i) => i.name);

let failed = false;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}

function checkFile(file, slugRe) {
  // \r-normalize: on CRLF files the ↳-strip regex (`.*$`, non-multiline) stops
  // matching before the trailing \r and slice mentions leak through as phantom
  // slugs (P4 finding, 2026-08-12). Validate content, not line endings.
  const src = fs
    .readFileSync(path.join(root, file), "utf8")
    .replace(/\r\n/g, "\n");
  const s = src.indexOf(START);
  const e = src.indexOf(END);
  if (s === -1 || e === -1 || e < s) {
    fail(`${file}: generated-catalog markers missing.`);
    return;
  }
  const section = src.slice(s, e);
  // Feature-slice sub-lines ("↳ optional slice: …") are mentions, not entries —
  // strip before entry-matching so features never register as phantom slugs.
  const entrySection = section
    .split("\n")
    .map((l) => l.replace(/↳ optional slice:.*$/g, ""))
    .join("\n");
  const found = new Set(
    [...entrySection.matchAll(slugRe)].map((m) => m[1]),
  );
  for (const feat of expectedFeatures) {
    if (!section.includes(feat))
      fail(`${file}: feature slice "${feat}" not mentioned under its base entry.`);
  }
  // Reverse check (R4 finding): a ↳ mention whose slug is NOT a current
  // feature item is stale generated output — regenerate.
  const mentionRe = /↳ optional slice:[^`\n]*`(?:@ilinxa\/)?([a-z0-9-]+)`/g;
  for (const m of section.matchAll(mentionRe)) {
    if (!expectedFeatures.includes(m[1]))
      fail(`${file}: stale feature-slice mention "${m[1]}" (not a registry feature item).`);
  }
  const missing = [...expected].filter((x) => !found.has(x));
  const phantom = [...found].filter((x) => !expected.has(x));
  if (missing.length)
    fail(`${file}: catalog missing ${missing.length} slug(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", …" : ""}`);
  if (phantom.length)
    fail(`${file}: catalog lists ${phantom.length} unknown slug(s): ${phantom.slice(0, 5).join(", ")}${phantom.length > 5 ? ", …" : ""}`);
  const countClaim = section.match(/(\d+) components across (\d+) categor/);
  if (countClaim && Number(countClaim[1]) !== expected.size)
    fail(`${file}: count line says ${countClaim[1]}, registry has ${expected.size}.`);
  if (!missing.length && !phantom.length)
    console.log(`✓ ${file}: catalog matches registry (${expected.size} components).`);
}

checkFile("public/llms.txt", /@ilinxa\/([a-z0-9-]+)/g);
checkFile("README.md", /\| `([a-z0-9-]+)` \|/g);

if (failed) {
  console.error("\nFix: run `pnpm build:llms` and commit the result.");
  process.exit(1);
}
