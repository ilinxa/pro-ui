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
    .map((i) => i.name),
);

let failed = false;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}

function checkFile(file, slugRe) {
  const src = fs.readFileSync(path.join(root, file), "utf8");
  const s = src.indexOf(START);
  const e = src.indexOf(END);
  if (s === -1 || e === -1 || e < s) {
    fail(`${file}: generated-catalog markers missing.`);
    return;
  }
  const section = src.slice(s, e);
  const found = new Set(
    [...section.matchAll(slugRe)].map((m) => m[1]),
  );
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
