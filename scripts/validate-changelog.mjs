#!/usr/bin/env node
/**
 * validate-changelog.mjs — every component's current `meta.ts` version must
 * have a CHANGELOG.md entry. R10 / C10; CONTRIBUTING.md already required the
 * entry, nothing enforced it.
 *
 * An entry is a CHANGELOG bullet that OPENS with the backticked slug and the
 * version, e.g.  `- \`story-rail\` 0.4.0 — optional preview image …`
 *
 * Versions current when this gate landed (2026-10-23) are grandfathered in
 * scripts/changelog-baseline.json ({ "<slug>": "<version>" }). A baseline row
 * whose version no longer equals meta.ts FAILS — so the first bump after landing
 * forces a real entry and the baseline can only shrink. A row for a slug that no
 * longer exists fails too.
 *
 * CHANGELOG.md is the per-version history; docs/component-versions.md stays the
 * generated snapshot of current versions.
 *
 * Usage:
 *   node scripts/validate-changelog.mjs
 *   node scripts/validate-changelog.mjs --changelog <f> --baseline <f> --components <dir>   # tests
 *
 * Exit: 0 every version has an entry · 1 otherwise
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readComponentVersions } from "./sync-registry-versions.mjs";

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * True when a CHANGELOG bullet OPENS with the backticked slug followed by the version:
 *   - `story-rail` 0.4.0 — …        - `story-rail` **0.4.0** — …
 * Anchoring to the bullet's start means a passing mention ("Needs `media-editor` 0.4.0 or
 * later" inside another component's entry) never counts as media-editor's own entry.
 */
export function hasEntry(changelog, slug, version) {
  const re = new RegExp(
    "^\\s*[-*]\\s+`" + escape(slug) + "`\\s+\\*{0,2}v?" + escape(version) + "(?![0-9.]*[0-9]|-)",
  );
  return changelog.split(/\r?\n/).some((line) => re.test(line));
}

/** Returns a list of problems (empty = green). */
export function check({ changelog, baseline, versions }) {
  const problems = [];
  for (const [slug, { version }] of versions) {
    if (hasEntry(changelog, slug, version)) continue;
    if (baseline[slug] === version) continue;
    problems.push(
      baseline[slug]
        ? `${slug} ${version}: no CHANGELOG entry, and its baseline row (${baseline[slug]}) is stale — ` +
            "add an entry and delete the row"
        : `${slug} ${version}: no CHANGELOG entry (a line naming \`${slug}\` and ${version})`,
    );
  }
  for (const [slug, version] of Object.entries(baseline)) {
    const current = versions.get(slug);
    if (!current) problems.push(`baseline row "${slug}" names no component — delete it`);
    else if (hasEntry(changelog, slug, current.version)) {
      // The entry exists, so the row is dead weight (stale or redundant) — the baseline only shrinks.
      problems.push(`baseline row "${slug}" (${version}) is no longer needed — delete it`);
    }
  }
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const arg = (f, d) => {
    const i = args.indexOf(f);
    return resolve(i >= 0 ? args[i + 1] : d);
  };
  const root = process.cwd();
  const changelogFile = arg("--changelog", join(root, "CHANGELOG.md"));
  const baselineFile = arg("--baseline", join(root, "scripts", "changelog-baseline.json"));
  const componentsDir = arg("--components", join(root, "src", "registry", "components"));

  const changelog = readFileSync(changelogFile, "utf8");
  const baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : {};
  const versions = readComponentVersions(componentsDir);
  const problems = check({ changelog, baseline, versions });
  if (problems.length > 0) {
    console.error(`✗ validate-changelog — ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  const grandfathered = Object.keys(baseline).length;
  console.log(
    `validate-changelog — ${versions.size} component versions have an entry ` +
      `(${versions.size - grandfathered} in CHANGELOG.md, ${grandfathered} grandfathered).`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
