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
function membersOf(body, { methods = false } = {}) {
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
    const m = (methods ? /^([A-Za-z_][A-Za-z0-9_]*)\??\s*(?::|\(|<)/ : /^([A-Za-z_][A-Za-z0-9_]*)\??\s*:/).exec(t);
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
  return /:\s*(\(|\s*async\s*\()/.test(decl) || /=>/.test(decl) || /^[A-Za-z_]\w*\??\s*[(<]/.test(decl);
}

function metaVersion(dir) {
  const p = join(dir, "meta.ts");
  if (!existsSync(p)) return null;
  const m = /version:\s*["']([0-9]+)\.([0-9]+)\.([0-9]+)["']/.exec(readFileSync(p, "utf8"));
  return m ? { major: +m[1], minor: +m[2], patch: +m[3], raw: `${m[1]}.${m[2]}.${m[3]}` } : null;
}

/* ─────────────── scanning helpers (brace-balanced, comment-aware) ─────────────── */

/** Index of the bracket closing the one at `open`, skipping strings and comments. -1 if unbalanced. */
function matchClose(src, open) {
  const pairs = { "(": ")", "{": "}", "[": "]" };
  const stack = [pairs[src[open]]];
  for (let i = open + 1; i < src.length; i++) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      if (nl === -1) return -1;
      i = nl;
    } else if (c === "/" && src[i + 1] === "*") {
      const e = src.indexOf("*/", i + 2);
      if (e === -1) return -1;
      i = e + 1;
    } else if (c === '"' || c === "'" || c === "`") {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
    } else if (pairs[c]) {
      stack.push(pairs[c]);
    } else if (c === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

/**
 * Implementations of the named functions inside object literals / classes:
 * `name: (a) => { … }`, `name: async (a): T => expr`, `name(a) { … }`.
 * Bodies are brace-balanced (the old probe B stopped at the first `}`).
 */
function extractImpls(src, names) {
  const out = [];
  const re = /(?<![.\w$])([A-Za-z_$][\w$]*)\s*(\??:\s*(?:async\s+)?)?\(/g;
  let m;
  while ((m = re.exec(src))) {
    if (!names.has(m[1])) continue;
    const open = re.lastIndex - 1;
    const close = matchClose(src, open);
    if (close === -1) continue;
    const tail = /^\s*(?::\s*[^=;{]*?)?\s*(=>|\{)/.exec(src.slice(close + 1, close + 200));
    if (!tail) continue;
    if (m[2] && tail[1] !== "=>") continue; // `name: foo(x) {` is not a function value
    let p = close + 1 + tail[0].length;
    let body;
    let isBlock;
    if (tail[1] === "{") {
      const end = matchClose(src, p - 1);
      if (end === -1) continue;
      body = src.slice(p, end);
      isBlock = true;
    } else {
      while (/\s/.test(src[p] ?? "")) p++;
      if (src[p] === "{") {
        const end = matchClose(src, p);
        if (end === -1) continue;
        body = src.slice(p + 1, end);
        isBlock = true;
      } else {
        let q = p;
        for (; q < src.length; q++) {
          const c = src[q];
          if ("([{".includes(c)) {
            const e = matchClose(src, q);
            if (e === -1) break;
            q = e;
          } else if (c === "," || c === ";" || c === ")" || c === "}" || c === "]") break;
        }
        body = src.slice(p, q);
        isBlock = false;
      }
    }
    out.push({ name: m[1], body, isBlock, index: m.index });
  }
  return out;
}

const stripCommentsStr = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const WARN_FN = String.raw`(?:console\.warn|[A-Za-z_$][\w$]*[wW]arn[\w$]*)`;

/** Remove every `warnFn( … )` call (balanced). Returns { text, count }. */
function removeWarnCalls(s) {
  const re = new RegExp(`(?<![\\w$.])${WARN_FN}\\s*\\(`, "g");
  let count = 0;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(s))) {
    const close = matchClose(s, re.lastIndex - 1);
    if (close === -1) break;
    out += s.slice(last, m.index);
    last = close + 1;
    re.lastIndex = close + 1;
    count++;
  }
  return { text: out + s.slice(last), count };
}

/** True when the body does nothing but dev-warn (optionally NODE_ENV-gated, optional bare return). */
function isWarnOnly(rawBody) {
  let { text, count } = removeWarnCalls(stripCommentsStr(rawBody));
  if (count === 0) return false;
  text = text
    .replace(/process\.env\.NODE_ENV\s*[!=]==?\s*["'][a-z]+["']\s*&&?/g, " ")
    .replace(/if\s*\([^)]*NODE_ENV[^)]*\)/g, " ")
    .replace(/\breturn\b\s*(?:undefined|null|true|false|-?\d+|""|''|\[\]|\{\}|Promise\.resolve\([^)]*\))?/g, " ")
    .replace(/\b(?:await|void|else)\b/g, " ")
    .replace(/[{};\s]/g, "");
  return text === "";
}
const hasWarn = (rawBody) => removeWarnCalls(stripCommentsStr(rawBody)).count > 0;

/* ─────────────── probe D: pending-version marker scanning ─────────────── */

const maskKeep = (s) => s.replace(/[^\n]/g, " ");

/** Blank out text that must never be matched: dates, fences, changelog/history sections & entries. */
function maskForDeferral(src, { isMd, isMeta }) {
  let s = src.replace(/\r\n/g, "\n").replace(/\b\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+Z?)?/g, (x) => maskKeep(x));
  if (isMd) {
    const lines = s.split("\n");
    let fence = false;
    let maskLevel = 0;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (/^(```|~~~)/.test(t)) {
        fence = !fence;
        lines[i] = maskKeep(lines[i]);
        continue;
      }
      if (fence) {
        lines[i] = maskKeep(lines[i]);
        continue;
      }
      const h = /^(#{1,6})\s+(.*)$/.exec(t);
      if (h) {
        const level = h[1].length;
        if (maskLevel && level <= maskLevel) maskLevel = 0;
        if (!maskLevel && /changelog|history/i.test(h[2])) maskLevel = level;
      }
      if (maskLevel) lines[i] = maskKeep(lines[i]);
    }
    s = lines.join("\n");
  }
  if (isMeta) {
    // `"0.3.1 — …"` / `"v0.2.0: …"` string entries are history, not promises.
    s = s.replace(/^([ \t]*[`"'])v?\d+\.\d+(?:\.\d+)?\s*(?:[—–:-]|\s).*$/gm, (x) => maskKeep(x));
    // anything inside a `changelog: [ … ]` / `history: [ … ]` array
    const re = /\b\w*(?:changelog|history)\w*\s*[:=]\s*\[/gi;
    let m;
    while ((m = re.exec(s))) {
      const close = matchClose(s, re.lastIndex - 1);
      if (close === -1) break;
      s = s.slice(0, m.index) + maskKeep(s.slice(m.index, close + 1)) + s.slice(close + 1);
      re.lastIndex = close + 1;
    }
  }
  return s;
}

/**
 * Join comment/prose-wrapped lines into one (newline + indent + optional `*` / `//` / `>` leader -> a
 * single space) so "are deferred\n * to v0.2" reads as a sentence. Returns the joined text plus the
 * ORIGINAL line number of every joined character. Never joins across a blank line.
 */
function joinWrapped(src, isMd) {
  let out = "";
  const lineAt = [];
  let line = 1;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\n" && i > 0 && src[i - 1] !== "\n") {
      const rest = src.slice(i + 1, i + 400);
      const lead = /^[ \t]*(?:\*(?!\/)|\/\/+|>)?[ \t]*/.exec(rest)[0];
      const after = rest.slice(lead.length);
      const hadLeader = lead.trim() !== "";
      const ok =
        after !== "" &&
        !after.startsWith("\n") &&
        !after.startsWith("*/") &&
        (hadLeader || (isMd && !/^(#|[-*+]\s|\d+\.\s|\||```|~~~)/.test(after)));
      if (ok) {
        out += " ";
        lineAt.push(line);
        line++;
        i += lead.length;
        continue;
      }
    }
    out += ch;
    lineAt.push(line);
    if (ch === "\n") line++;
  }
  return { text: out, lineAt };
}

const PAST_RE =
  /\b(?:shipped|added\s+in|landed|fixed|introduced|released|since|removed\s+in|removal\s+in)\b|@since|@version|@deprecated/i;
const WIN = String.raw`(?:[^.!?;|\n]|\.(?!\s|$)){0,60}?`;
// Status words: any ≤60-char same-sentence distance to the version is enough.
const PENDING = String.raw`(?:deferred?|reserved|postponed|planned|slated|scheduled|not\s+wired|not\s+implemented|not\s+supported|not\s+available|will\s+(?:be\s+)?(?:added|ship|land)|to\s+come)`;
// Motion verbs are ambiguous ("ships the v0.1 fixtures"): they only count when the version follows a
// preposition. Bare ships/ship/shipping are omitted on purpose — "ships in v0.1" is provenance.
const MOTION = String.raw`(?:arrives?|arriving|lands?|landing|coming|comes)`;
const MOTION_TAIL = String.raw`(?:\s+[\w-]+){0,4}?\s+(?:in|with|for|by|until|on|as\s+part\s+of)\s+(?:the\s+)?`;

function sentenceAround(text, from, to) {
  let a = from;
  for (let n = 0; a > 0 && n < 160; a--, n++) {
    if (text[a - 1] === "\n" || (/[.!?;]/.test(text[a - 1]) && /\s/.test(text[a] ?? ""))) break;
  }
  let b = to;
  for (let n = 0; b < text.length && n < 100; b++, n++) {
    if (text[b] === "\n" || (/[.!?;]/.test(text[b]) && /\s/.test(text[b + 1] ?? ""))) break;
  }
  return text.slice(a, b);
}

/** All pending-version markers in one file: [{ line, major, minor, phrase, form }]. */
function findPendingMarkers(rawSrc, { isMd, isMeta }) {
  const masked = maskForDeferral(rawSrc, { isMd, isMeta });
  const { text, lineAt } = joinWrapped(masked, isMd);
  const hits = [];
  const add = (m, major, minor, form, guard) => {
    if (guard && PAST_RE.test(sentenceAround(text, m.index, m.index + m[0].length))) return;
    hits.push({
      line: lineAt[m.index] ?? 1,
      major: +major,
      minor: +minor,
      phrase: m[0].replace(/\s+/g, " ").trim().slice(0, 90),
      form,
    });
  };
  // 1. original triggers — bare `0.2` allowed, no provenance guard (unchanged behaviour)
  for (const m of text.matchAll(/(?:deferred?\s+(?:to|until)|reserved\s+for|defers?\s+to)\s+v?([0-9]+)\.([0-9]+)/gi))
    add(m, m[1], m[2], "deferral", false);
  // 2. widened future-tense / pending triggers — strict `v` prefix
  // `from vN.M` / `from \`other-slug\` vN.M` names where something came FROM (often another
  // component's version), not a pending target.
  for (const m of text.matchAll(new RegExp(`\\b${PENDING}\\b${WIN}(?<!\\bfrom\\s+(?:\`[^\`]+\`\\s+)?)(?<![@\\w])v(\\d+)\\.(\\d+)`, "gi")))
    add(m, m[1], m[2], "pending", true);
  for (const m of text.matchAll(new RegExp(`\\b${MOTION}\\b${MOTION_TAIL}(?<![@\\w])v(\\d+)\\.(\\d+)`, "gi")))
    add(m, m[1], m[2], "pending", true);
  // 3. reverse forms. Two-part versions only: `v0.2.0 addition` names a release that exists.
  for (const m of text.matchAll(/(?<![@\w])v(\d+)\.(\d+)(?!\.\d)\s+(?:candidate|addition|follow-?up|TODO)\b/gi))
    add(m, m[1], m[2], "pending", true);
  // `v0.2: <label>` is a planned-work section label in guides; in source comments it is a release note.
  if (isMd)
    for (const m of text.matchAll(/(?<![@\w])v(\d+)\.(\d+)(?!\.\d)\*{0,2}\s*:\*{0,2}\s*(?=[A-Za-z])/gi))
      add(m, m[1], m[2], "pending", true);
  // 4. markdown headings that pin a limitations list to a version
  if (isMd) {
    masked.split("\n").forEach((l, i) => {
      const h = /^#{1,6}\s.*(?:known\s+(?:gaps|limitations|issues)|limitations|roadmap|deferred|future\s+work).*?\bv(\d+)\.(\d+)/i.exec(l);
      if (h) hits.push({ line: i + 1, major: +h[1], minor: +h[2], phrase: l.trim().slice(0, 90), form: "pinned-heading" });
    });
  }
  return hits;
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
    for (const mem of membersOf(iface.body, { methods: true })) {
      if (isFunctionMember(mem.decl)) {
        publicFnMembers.set(mem.name, { iface: iface.name, doc: mem.doc });
      }
    }
  }
  const rel = (f) => relative(ROOT, f).replace(/[\\]/g, "/");
  const implsByFile = implSources.map(({ f, src }) => ({
    f,
    impls: extractImpls(src, new Set(publicFnMembers.keys())),
  }));
  for (const { f, impls } of implsByFile) {
    // `name: () => {}` / `name: async () => {}` / `name: (a, b) => { /* only comments */ }`
    for (const { name, body, isBlock } of impls) {
      if (!isBlock || stripCommentsStr(body).trim() !== "") continue;
      findings.push({
        probe: "noop-method",
        detail: `${publicFnMembers.get(name).iface}.${name}() is implemented as an empty body at ${rel(f)}`,
        fix: "implement it, or make it dev-warn (a disclosed stub has a non-empty body by definition)",
      });
    }
  }

  /* ── Probe B2 — handle stubs must carry @notImplemented (and vice versa) ── */
  const handleNames = new Set(interfaces.filter((i) => /Handle$/.test(i.name)).map((i) => i.name));
  for (const { src } of implSources) {
    for (const m of src.matchAll(/forwardRef\s*<\s*([A-Za-z0-9_]+)\s*,/g)) handleNames.add(m[1]);
    for (const m of src.matchAll(/useImperativeHandle\s*\(\s*[\w$.]+\s*,\s*\(\s*\)\s*:\s*([A-Za-z0-9_]+)/g)) handleNames.add(m[1]);
  }
  const handleMembers = new Map(); // name -> { iface, doc }
  for (const iface of interfaces) {
    if (!handleNames.has(iface.name)) continue;
    for (const mem of membersOf(iface.body, { methods: true })) {
      if (isFunctionMember(mem.decl)) handleMembers.set(mem.name, { iface: iface.name, doc: mem.doc });
    }
  }
  if (handleMembers.size) {
    const hNames = new Set(handleMembers.keys());
    const byName = new Map(); // name -> [{ f, body }]
    for (const { f, src } of implSources) {
      for (const im of extractImpls(src, hNames)) {
        if (!byName.has(im.name)) byName.set(im.name, []);
        byName.get(im.name).push({ f, body: im.body });
      }
    }
    for (const [name, { iface, doc }] of handleMembers) {
      const impls = byName.get(name) ?? [];
      if (!impls.length) continue; // delegated / referenced function: not analysable here
      const tagged = /@notImplemented/.test(doc);
      const stub = impls.find((i) => isWarnOnly(i.body));
      if (stub && !tagged) {
        findings.push({
          probe: "undisclosed-stub",
          detail: `${iface}.${name}() only dev-warns at ${rel(stub.f)} but its type member has no @notImplemented tag`,
          fix: "add @notImplemented to the member's JSDoc in types.ts (the warn alone is invisible to consumers reading the types), or implement it",
        });
      } else if (tagged && !impls.some((i) => hasWarn(i.body)) && !new RegExp(`${WARN_FN}[\\s\\S]{0,400}?\\b${name}\\b`).test(implSrc)) {
        findings.push({
          probe: "undisclosed-tag",
          detail: `${iface}.${name}() is tagged @notImplemented but its implementation never warns at runtime`,
          fix: "emit a dev-only console.warn naming the method, or remove the tag and implement it",
        });
      }
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
    const sources = [
      ...implSources,
      ...files.filter((f) => NON_IMPL.has(basename(f))).map((f) => ({ f, src: readFileSync(f, "utf8") })),
      { f: typesPath, src: typesSrc },
    ];
    // Consumer-facing planning docs: docs/procomps/<slug>-procomp/*-guide*.md + *-description*.md.
    // Version-named files (e.g. `*-description-v0.2.0.md`) are frozen snapshots of a past release's
    // planning — history, not current claims — so they are excluded.
    const docsDir = join(ROOT, "docs/procomps", `${slug}-procomp`);
    if (existsSync(docsDir)) {
      for (const e of readdirSync(docsDir).sort()) {
        const p = join(docsDir, e);
        if (/-v\d+\.\d+(?:\.\d+)?\b/i.test(e)) continue;
        if (/-(?:guide|description)[^/\\]*\.md$/i.test(e) && statSync(p).isFile()) {
          sources.push({ f: p, src: readFileSync(p, "utf8") });
        }
      }
    }
    for (const { f, src } of sources) {
      const seen = new Set();
      const isMd = /\.md$/i.test(f);
      for (const h of findPendingMarkers(src, { isMd, isMeta: basename(f) === "meta.ts" })) {
        const reached = version.major > h.major || (version.major === h.major && version.minor >= h.minor);
        if (!reached) continue;
        const key = `${h.line}:${h.major}.${h.minor}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          probe: "stale-deferral",
          detail: `${rel(f)}:${h.line} promises work "${h.phrase}" (v${h.major}.${h.minor}) but this component already ships v${version.raw}`,
          fix: "ship it, or state the limitation WITHOUT a version pin (\"not implemented\")",
        });
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
