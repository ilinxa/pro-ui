#!/usr/bin/env node
/**
 * validate:inert-surfaces — catalog-wide scan for public surfaces that EXIST but DO NOTHING.
 *
 * THE DEFECT CLASS. A prop, handle method, or slot-context field that is declared in `types.ts`,
 * exported, documented, callable — and wired to nothing. It compiles. It appears in the docs
 * site. A consumer passes it, calls it, and silently gets no behaviour.
 *
 * No other gate in the battery can see this. `tsc`, `lint`, `validate:meta-deps`,
 * `validate:barrel-exports`, the vitest tiers and even a 126-test adversarial review each check
 * that a symbol EXISTS — never that it DOES something. Every prior instance was found by a human
 * or a consumer, never by CI:
 *
 *   2026-08-17  card-tree `customPredefinedKeys`  — declared + documented + inert since v0.3,
 *               reported by an integrator.
 *   2026-08-18  code-block CodeMirror soft-failure fallback — documented as "recoverable",
 *               never existed; found only by re-validating the report.
 *   2026-08-18  code-block `CodeBlockServerProps` + `scrollToLine()` — exported and advertised in
 *               `meta.ts` since v0.1.0; found only because someone finally wrote the guide doc.
 *
 * THE RULE THIS ENFORCES
 *
 *   A public surface must be IMPLEMENTED, or SELF-DISCLOSING — it warns at runtime when used
 *   AND is marked `@notImplemented` in its JSDoc. "Silent and advertised" is the defect.
 *
 * The disclosure half is deliberately not a bare ignore-comment. The repo already had the right
 * pattern before this gate existed — `media-editor`'s imperative capture methods dev-warn and
 * `meta.ts` says so; `team-feedback-loop`'s `onEvent` is documented as "accepted for symmetry,
 * emits nothing". Both are honest. This gate makes that the only alternative to working code,
 * and because disclosure costs a user-visible dev warning, silencing the gate is never cheaper
 * than fixing it. That asymmetry is the whole design: an escape hatch nobody wants to reach for.
 *
 * PROBES
 *
 *   A  dead-prop      A member of the component's public `<Name>Props` that appears nowhere in
 *                     the slug's implementation files. Fixing it by wiring it OR by reading it to
 *                     emit a dev-warn both clear the probe — the prop becomes referenced either
 *                     way. `@notImplemented` additionally REQUIRES a warn mentioning the name, so
 *                     the tag cannot launder a silently-ignored prop.
 *   B  noop-method    An object-literal member whose name matches a method declared in a public
 *                     `types.ts` interface, implemented with an empty or comment-only body. Tied
 *                     to the public contract on purpose: internal empty callbacks are not a
 *                     defect, and a disclosed stub has a non-empty body because it warns.
 *   C  phantom-file   A source comment or type referencing a `.ts`/`.tsx` file inside its own slug
 *                     that does not exist (code-block's `types.ts` cited "the runtime guard in
 *                     code-block.server.tsx" — a file that was never written).
 *   D  stale-deferral A `deferred/reserved to vN` marker in a shipped file where `meta.version`
 *                     has already REACHED vN. A deferral is a debt with a due date; when the
 *                     version ships, the promise is either kept or restated. Left alone, these
 *                     become lies that outlive their own intent.
 *
 * SEVERITY
 *   high — all four probes.
 *
 *   D shipped `warn` for exactly one run. That was a holding position for a pre-existing backlog
 *   of 11, not the intended end state — the same shape `validate:barrel-exports` used while its
 *   own 16-high backlog was burned down. Once the catalog reached zero, D was promoted, because a
 *   deferral is a debt with a due date and the whole point of this gate is that the debt cannot
 *   quietly come due again. Every one of those 11 had already outlived its promised version:
 *   `media-editor` still said "deferred to v0.2" at v0.3.1, and `carousel-composer`'s demo said
 *   video edit was deferred to v0.2 when v0.2.0 had shipped it.
 *
 *   The fix is never to bump the number. State the limitation WITHOUT a version pin — an unpinned
 *   "not implemented" stays true until the feature lands; a pinned one becomes a lie on release
 *   day, silently, in consumer-facing docs.
 *
 * MODES
 *   node scripts/validate-inert-surfaces.mjs            # report-only, exit 0
 *   node scripts/validate-inert-surfaces.mjs --strict   # exit 1 on high
 *   node scripts/validate-inert-surfaces.mjs --json     # machine output
 *   node scripts/validate-inert-surfaces.mjs <slug>     # single slug
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";

const ROOT = process.cwd();
const COMPONENTS = join(ROOT, "src/registry/components");

const args = process.argv.slice(2);
const strict = args.includes("--strict") || args.includes("--check");
const asJson = args.includes("--json");
const onlySlug = args.find((a) => !a.startsWith("--"));

/** Files that are documentation/demo surfaces, not implementation. */
const NON_IMPL = new Set(["demo.tsx", "usage.tsx", "meta.ts", "dummy-data.ts"]);

/* ────────────────────────── fs helpers ────────────────────────── */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === "__tests__") continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

function listSlugs() {
  const out = [];
  for (const cat of readdirSync(COMPONENTS)) {
    const catDir = join(COMPONENTS, cat);
    if (!statSync(catDir).isDirectory()) continue;
    for (const slug of readdirSync(catDir)) {
      if (slug.startsWith("_")) continue;
      const dir = join(catDir, slug);
      if (!statSync(dir).isDirectory()) continue;
      if (onlySlug && slug !== onlySlug) continue;
      out.push({ cat, slug, dir });
    }
  }
  return out;
}

/* ───────────────────── declaration extraction ───────────────────── */

/**
 * Brace-balanced extraction of `export interface X { … }` / `export type X = { … }`.
 * Regex-based like the rest of this repo's validators — a missed finding beats a false positive.
 */
function extractInterfaces(src) {
  const out = [];
  const re = /export\s+(?:interface|type)\s+([A-Za-z0-9_]+)\s*(?:extends\s+[^{]+)?(?:=\s*)?\{/g;
  let m;
  while ((m = re.exec(src))) {
    let depth = 0;
    let i = re.lastIndex - 1;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push({ name: m[1], body: src.slice(m.index, i + 1), start: m.index });
  }
  return out;
}

/**
 * Members of an interface body, with the JSDoc block that immediately precedes each.
 * Only top-level (2-space indented) members — nested object literals are not public members.
 */
function membersOf(body) {
  const out = [];
  const lines = body.split("\n");
  let pendingDoc = [];
  let inBlock = false;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("/*")) {
      inBlock = true;
      pendingDoc = [t];
      if (t.includes("*/")) inBlock = false;
      continue;
    }
    if (inBlock) {
      pendingDoc.push(t);
      if (t.includes("*/")) inBlock = false;
      continue;
    }
    if (t.startsWith("//")) {
      pendingDoc.push(t);
      continue;
    }
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\??\s*:/.exec(t);
    if (m && /^\s{2}\S/.test(line)) {
      out.push({ name: m[1], doc: pendingDoc.join("\n"), decl: t });
      pendingDoc = [];
    } else if (t !== "") {
      pendingDoc = [];
    }
  }
  return out;
}

/** Members whose declared type is a function (candidates for probe B). */
function isFunctionMember(decl) {
  return /:\s*(\(|\s*async\s*\()/.test(decl) || /=>/.test(decl);
}

function metaVersion(dir) {
  const p = join(dir, "meta.ts");
  if (!existsSync(p)) return null;
  const m = /version:\s*["']([0-9]+)\.([0-9]+)\.([0-9]+)["']/.exec(readFileSync(p, "utf8"));
  return m ? { major: +m[1], minor: +m[2], patch: +m[3], raw: `${m[1]}.${m[2]}.${m[3]}` } : null;
}

/* ─────────────────────────── the scan ─────────────────────────── */

const results = [];

for (const { cat, slug, dir } of listSlugs()) {
  const typesPath = join(dir, "types.ts");
  if (!existsSync(typesPath)) continue;

  const typesSrc = readFileSync(typesPath, "utf8");
  const files = walk(dir);
  const implFiles = files.filter((f) => !NON_IMPL.has(basename(f)) && basename(f) !== "types.ts");
  const implSources = implFiles.map((f) => ({ f, src: readFileSync(f, "utf8") }));
  /*
   * Probe A matches identifiers in CODE, so comments are stripped first.
   *
   * Found while fixing story-viewer: `reactors` is as dead as `onLoadReactors`,
   * but one comment in `index.ts` reading "owner overlay + reactors" made the
   * prop look referenced and hid it. Left uncorrected, ANY prop could be
   * silenced by mentioning its name in a comment — which is precisely the
   * "documented but not wired" failure this gate exists to catch.
   */
  const stripComments = (src) =>
    src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
  const implSrc = implSources.map((s) => stripComments(s.src)).join(" ");

  const interfaces = extractInterfaces(typesSrc);
  const findings = [];
  const warnings = [];

  /* ── Probe A — dead props ───────────────────────────────────── */
  const pascal = slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
  const propsIface = interfaces.find((i) => i.name === `${pascal}Props`);
  if (propsIface) {
    for (const mem of membersOf(propsIface.body)) {
      const referenced = new RegExp(`\\b${mem.name}\\b`).test(implSrc);
      const disclosed = /@notImplemented/.test(mem.doc);
      if (!referenced) {
        findings.push({
          probe: "dead-prop",
          detail: `${propsIface.name}.${mem.name} is declared but never referenced in any implementation file`,
          fix: "wire it, or read it and emit a dev-warn (and tag the JSDoc @notImplemented)",
        });
      } else if (disclosed) {
        // Tag present: it must be backed by a real runtime warning, or the tag is laundering.
        const warns = new RegExp(
          `(console\\.warn|devWarn|warnOnce)[\\s\\S]{0,400}?\\b${mem.name}\\b|\\b${mem.name}\\b[\\s\\S]{0,200}?(console\\.warn|devWarn|warnOnce)`,
        ).test(implSrc);
        if (!warns) {
          findings.push({
            probe: "undisclosed-tag",
            detail: `${propsIface.name}.${mem.name} is tagged @notImplemented but nothing warns at runtime`,
            fix: "emit a dev-only console.warn naming the prop, or remove the tag and implement it",
          });
        }
      }
    }
  }

  /* ── Probe B — no-op methods on public contracts ────────────── */
  const publicFnMembers = new Map(); // name -> { iface, doc }
  for (const iface of interfaces) {
    for (const mem of membersOf(iface.body)) {
      if (isFunctionMember(mem.decl)) {
        publicFnMembers.set(mem.name, { iface: iface.name, doc: mem.doc });
      }
    }
  }
  for (const { f, src } of implSources) {
    // `name: () => {}` / `name: async () => {}` / `name: (a, b) => { /* only comments */ }`
    const re = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*\{([\s\S]{0,600}?)\}/g;
    let m;
    while ((m = re.exec(src))) {
      const [, name, , rawBody] = m;
      if (!publicFnMembers.has(name)) continue;
      const stripped = rawBody
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .trim();
      if (stripped !== "") continue;
      findings.push({
        probe: "noop-method",
        detail: `${publicFnMembers.get(name).iface}.${name}() is implemented as an empty body at ${relative(ROOT, f).replace(/\\/g, "/")}`,
        fix: "implement it, or make it dev-warn (a disclosed stub has a non-empty body by definition)",
      });
    }
  }

  /* ── Probe C — phantom file references ──────────────────────── */
  const present = new Set(files.map((f) => basename(f)));
  const allSrc = files.map((f) => readFileSync(f, "utf8")).join("\n");
  const phantom = new Set();
  const fileRe = /\b([a-z0-9-]+(?:\.[a-z]+)?\.tsx?)\b/g;
  let fm;
  while ((fm = fileRe.exec(allSrc))) {
    const name = fm[1];
    if (present.has(name)) continue;
    // Only names that clearly belong to THIS slug — avoids flagging third-party paths.
    if (!name.startsWith(slug)) continue;
    phantom.add(name);
  }
  for (const name of phantom) {
    findings.push({
      probe: "phantom-file",
      detail: `source references \`${name}\`, which does not exist in this slug`,
      fix: "create the file, or correct/remove the reference",
    });
  }

  /* ── Probe D — stale deferrals ──────────────────────────────── */
  const version = metaVersion(dir);
  if (version) {
    const defRe = /(?:deferred?\s+(?:to|until)|reserved\s+for|defers?\s+to)\s+v?([0-9]+)\.([0-9]+)/gi;
    for (const { f, src } of [...implSources, ...files.filter((f) => NON_IMPL.has(basename(f))).map((f) => ({ f, src: readFileSync(f, "utf8") }))]) {
      let dm;
      const seen = new Set();
      while ((dm = defRe.exec(src))) {
        const key = `${dm[1]}.${dm[2]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const tgtMajor = +dm[1];
        const tgtMinor = +dm[2];
        const reached =
          version.major > tgtMajor || (version.major === tgtMajor && version.minor >= tgtMinor);
        if (reached) {
          findings.push({
            probe: "stale-deferral",
            detail: `${relative(ROOT, f).replace(/\\/g, "/")} promises work "deferred to v${key}" but this component already ships v${version.raw}`,
            fix: "ship it, or restate the deferral against a version that has not shipped",
          });
        }
      }
    }
  }

  if (findings.length || warnings.length) results.push({ cat, slug, findings, warnings });
}

/* ─────────────────────────── report ─────────────────────────── */

const totalHigh = results.reduce((n, r) => n + r.findings.length, 0);
const totalWarn = results.reduce((n, r) => n + r.warnings.length, 0);
const scanned = listSlugs().length;

if (asJson) {
  console.log(JSON.stringify({ totalHigh, totalWarn, results }, null, 2));
} else {
  console.log("");
  console.log("validate:inert-surfaces — declared-but-does-nothing audit");
  console.log("=========================================================\n");
  for (const r of results) {
    const counts = [
      r.findings.length ? `${r.findings.length} high` : null,
      r.warnings.length ? `${r.warnings.length} warn` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    console.log(`▸ ${r.cat}/${r.slug}  (${counts})`);
    for (const f of r.findings) console.log(`  [⚠️ high  ] ${f.probe}: ${f.detail}\n              → ${f.fix}`);
    for (const w of r.warnings) console.log(`  [· warn  ] ${w.probe}: ${w.detail}\n              → ${w.fix}`);
    console.log("");
  }
  console.log("──────────────────────────────────────");
  console.log(`Scanned ${scanned} slugs — ${scanned - results.length} clean, ${results.length} with findings.`);
  console.log(`Findings: ${totalHigh} high · ${totalWarn} warn.`);
  console.log(
    strict
      ? "(--strict — gates on any finding)"
      : "(report-only — exits 0 regardless; pass --strict to gate)",
  );
  console.log("");
}

process.exit(strict && totalHigh > 0 ? 1 : 0);
