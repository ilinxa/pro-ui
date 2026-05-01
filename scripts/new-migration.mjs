#!/usr/bin/env node
/**
 * Scaffolder for ilinxa-ui-pro component migrations.
 *
 * Usage:
 *   pnpm new:migration <slug> [--title="Display Title"]
 *
 * Examples:
 *   pnpm new:migration stat-card
 *   pnpm new:migration post-card --title="Post Card"
 *
 * Creates docs/migrations/<slug>/ from docs/migrations/_template/, with:
 *   • original/        ← drop the source files here (any structure)
 *   • source-notes.md  ← intake doc — you fill
 *   • analysis.md      ← extraction pass — assistant fills
 *
 * Slug must match the eventual registry slug (kebab-case, no -procomp/-migration suffix).
 * See docs/migrations/README.md for the full pipeline.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_DIR = path.join(ROOT, "docs/migrations/_template");
const MIGRATIONS_DIR = path.join(ROOT, "docs/migrations");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function fail(msg) {
  console.error(`${RED}error${RESET} ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let positional = null;
  let title = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--title=")) {
      title = a.slice("--title=".length);
    } else if (a === "--title") {
      title = args[++i];
    } else if (!positional) {
      positional = a;
    } else {
      fail(`unexpected arg: ${a}`);
    }
  }
  if (!positional) {
    fail('usage: pnpm new:migration <slug> [--title="Display Title"]');
  }
  return { slug: positional, title };
}

function toTitle(slug) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function copyAndReplace(srcDir, destDir, replacements) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      copyAndReplace(
        path.join(srcDir, e.name),
        path.join(destDir, e.name),
        replacements,
      );
      continue;
    }
    let content = fs.readFileSync(path.join(srcDir, e.name), "utf8");
    for (const [from, to] of replacements) {
      content = content.split(from).join(to);
    }
    fs.writeFileSync(path.join(destDir, e.name), content);
  }
}

function writeAnalysisStub(destDir, { slug, title }) {
  const content = `# ${title} — migration analysis

> Extraction pass for [\`docs/migrations/${slug}/\`](./). Filled by the assistant after reading \`original/\` and \`source-notes.md\`. Reviewed and signed off by you before the procomp gate begins.
>
> Pipeline: [\`docs/migrations/README.md\`](../README.md).

_Awaiting extraction pass — \`source-notes.md\` not yet filled, or analysis not yet started._

<!--
Sections to fill (mirror docs/migrations/README.md "What each artifact contains"):

## Design DNA to PRESERVE
## Structural debt to REWRITE
## Dependency audit
## Dynamism gaps
## Optimization gaps
## Accessibility gaps
## Proposed procomp scope
## Recommendation
-->
`;
  fs.writeFileSync(path.join(destDir, "analysis.md"), content);
}

function main() {
  const { slug, title: titleArg } = parseArgs(process.argv);

  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) {
    fail(`invalid slug "${slug}". use lowercase kebab-case (e.g. stat-card)`);
  }
  if (slug === "_template") {
    fail(`"_template" is reserved`);
  }
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fail(`template not found at ${path.relative(ROOT, TEMPLATE_DIR)}`);
  }

  const destDir = path.join(MIGRATIONS_DIR, slug);
  if (fs.existsSync(destDir)) {
    fail(`folder already exists: ${path.relative(ROOT, destDir)}`);
  }

  const title = titleArg ?? toTitle(slug);
  const replacements = [
    ["{{slug}}", slug],
    ["{{Title}}", title],
  ];

  copyAndReplace(TEMPLATE_DIR, destDir, replacements);
  writeAnalysisStub(destDir, { slug, title });

  const rel = path.relative(ROOT, destDir).replaceAll(path.sep, "/");
  console.log(`${GREEN}✔${RESET} created ${rel}/`);
  console.log("");
  console.log(`${DIM}Next steps:${RESET}`);
  console.log(`  1. Drop the source files into ${rel}/original/`);
  console.log(`  2. Fill ${rel}/source-notes.md`);
  console.log(`  3. Ask the assistant to run the extraction pass`);
  console.log("");
  console.log(
    `${DIM}Pipeline reference: docs/migrations/README.md${RESET}`,
  );
}

main();
