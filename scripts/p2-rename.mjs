/**
 * P2.2 — the great rename, one-shot scripted sweep (canon: docs/naming-canon.md, LOCKED 2026-08-11).
 *
 * Does, in order:
 *   A. Folder + file renames (component folders, docs/procomps folders, embedded basenames)
 *   B. Content sweep — ordered longest-first token replacement:
 *        kebab slugs → new slugs (letter-boundary guards, so derived tokens like
 *        `todo-tree-row` / `rich-card-viewer` follow their component)
 *        identifier families (Pascal/camel/SCREAMING) per the canon scope note
 *        Title-space forms in markdown
 *      Scoped rules: `workspace` (bare English word — path/quoted/Pascal contexts only)
 *      and `registration→signup` (confined to the signup-form folder + its docs).
 *   C. registry.json JSON transform (names, titles, paths, targets, regDeps) + 52
 *      deprecated alias items (P2.3).
 *   D. manifest.ts regeneration (same REGISTRY order, new identifiers/paths).
 *   E. meta.ts version bumps — minor for renamed, patch for unchanged — + updatedAt.
 *
 * History zones are excluded (reviews, decisions, migrations, archives,
 * component-versions.md, consumer_order) — old names stay accurate there.
 *
 * Usage: node scripts/p2-rename.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import { RENAMES, pascal, camel, titleCase } from "./p2-rename-map.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const DRY = process.argv.includes("--dry");
const TODAY = "2026-08-11";

const log = (...a) => console.log(...a);
const stats = { filesChanged: 0, replacements: 0, renamedPaths: 0 };

// ---------------------------------------------------------------- token rules
const kebabPairs = Object.entries(RENAMES)
  .filter(([o]) => o !== "workspace")
  .sort((a, b) => b[0].length - a[0].length);

// explicit identifier family rules (ordered — longest/most-specific first)
const ID_PAIRS = [
  ["TodoRichCard", "TaskCard"], ["todoRichCard", "taskCard"],
  ["RichCardInFlow", "CardTreeNode"], ["richCardInFlow", "cardTreeNode"],
  ["MediaCarouselEditor01", "CarouselComposer"], ["mediaCarouselEditor01", "carouselComposer"],
  ["ContentCardNews01", "NewsCard"], ["contentCardNews01", "newsCard"],
  ["ContentCardNews", "NewsCard"], ["contentCardNews", "newsCard"],
  ["ContentCard", "NewsCard"], ["contentCard", "newsCard"],
  ["CooperativeChallenge01", "TeamChallenge"], ["cooperativeChallenge01", "teamChallenge"],
  ["CooperativeChallenge", "TeamChallenge"], ["cooperativeChallenge", "teamChallenge"],
  ["TaskChoiceControl01", "TeamTaskClaim"], ["taskChoiceControl01", "teamTaskClaim"],
  ["TaskChoiceControl", "TeamTaskClaim"], ["taskChoiceControl", "teamTaskClaim"],
  ["TaskChoice", "TaskClaim"], ["taskChoice", "taskClaim"],
  ["GridLayoutNews01", "MagazineLayout"], ["gridLayoutNews01", "magazineLayout"],
  ["GridLayoutNews", "MagazineLayout"], ["gridLayoutNews", "magazineLayout"],
  ["GridLayout", "MagazineLayout"], ["gridLayout", "magazineLayout"],
  ["RegistrationForm01", "SignupForm"], ["registrationForm01", "signupForm"],
  ["NewsletterCard01", "NewsletterSignup"], ["newsletterCard01", "newsletterSignup"],
  ["NewsletterCard", "NewsletterSignup"], ["newsletterCard", "newsletterSignup"],
  ["PageHeroNews01", "PageHero"], ["pageHeroNews01", "pageHero"],
  ["PageHeroNews", "PageHero"], ["pageHeroNews", "pageHero"],
  ["GanttTimeline01", "GanttTimeline"], ["ganttTimeline01", "ganttTimeline"],
  ["Calendar01", "EventCalendar"], ["calendar01", "eventCalendar"],
  ["ArticleBody01", "RichTextEditor"], ["articleBody01", "richTextEditor"],
  ["ARTICLE_BODY_", "RICH_TEXT_"],
  ["ArticleBody", "RichText"], ["articleBody", "richText"],
  ["THUMB_LIST_", "THUMBNAIL_LIST_"],
  ["ThumbList01", "ThumbnailList"], ["thumbList01", "thumbnailList"],
  ["ThumbList", "ThumbnailList"], ["thumbList", "thumbnailList"],
  ["TodoTree", "TaskTree"], ["todoTree", "taskTree"],
  ["FilterStack", "FilterPanel"], ["filterStack", "filterPanel"],
  ["RichSidebar", "AppSidebar"], ["richSidebar", "appSidebar"],
  ["RichCard", "CardTree"], ["richCard", "cardTree"],
];
// auto Xxx01→Xxx for remaining suffix-drops not covered above
const covered = new Set(ID_PAIRS.map(([o]) => o));
for (const [o, n] of kebabPairs) {
  const [po, pn] = [pascal(o), pascal(n)];
  if (po !== pn && !covered.has(po)) ID_PAIRS.push([po, pn], [camel(o), camel(n)]);
}
// generic Todo-family → Task-family (after all explicit rules)
const GENERIC_ID = [
  [/(?<![A-Za-z0-9_$])TODO_(?=[A-Z])/g, "TASK_"],
  [/(?<![A-Za-z0-9_$])Todo(?=[A-Z])/g, "Task"],
  [/(?<![A-Za-z0-9_$])todo(?=[A-Z])/g, "task"],
];

// Title-space forms (markdown + meta name prose). Longest-first.
const TITLE_PAIRS = [
  ["Media Carousel Editor 01", "Carousel Composer"],
  ["Content Card (News 01)", "News Card"], ["Content Card News 01", "News Card"],
  ["Grid Layout (News 01)", "Magazine Layout"], ["Grid Layout News 01", "Magazine Layout"],
  ["Page Hero (News 01)", "Page Hero"], ["Page Hero News 01", "Page Hero"],
  ["Cooperative Challenge 01", "Team Challenge"], ["Cooperative Challenge", "Team Challenge"],
  ["Task Choice Control 01", "Team Task Claim"], ["Task Choice Control", "Team Task Claim"],
  ["Registration Form 01", "Signup Form"],
  ["Newsletter Card 01", "Newsletter Signup"],
  ["Article Body 01", "Rich Text Editor"],
  ["Thumb List 01", "Thumbnail List"],
  ["Todo Rich Card", "Task Card"],
  ["Rich Card in Flow", "Card Tree Node"], ["Rich Card In Flow", "Card Tree Node"],
  ["Calendar 01", "Event Calendar"],
  ["Rich Sidebar", "App Sidebar"],
  ["Filter Stack", "Filter Panel"],
  ["Todo Tree", "Task Tree"],
  ["Rich Card", "Card Tree"],
];
for (const [o, n] of kebabPairs) {
  const [to, tn] = [titleCase(o), titleCase(n)];
  if (to !== tn && !TITLE_PAIRS.some(([x]) => x === to)) TITLE_PAIRS.push([to, tn]);
}
TITLE_PAIRS.sort((a, b) => b[0].length - a[0].length);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const kebabRe = (t) => new RegExp(`(?<![a-z0-9])${esc(t)}(?![a-z0-9])`, "g");
const idRe = (t) => new RegExp(`(?<![A-Za-z0-9_$])${esc(t)}(?![a-z0-9])`, "g");
const wordRe = (t) => new RegExp(`(?<![A-Za-z0-9])${esc(t)}(?![A-Za-z0-9])`, "g");

// ---------------------------------------------------------------- scopes
// NOTE: predicates accept BOTH pre-move and post-move path forms — the content
// sweep runs after Phase A has already renamed the folders.
const isWorkspaceScope = (p) =>
  /\/layout\/(split-)?workspace\//.test(p) || /(split-)?workspace-procomp/.test(p);
const isRegistrationScope = (p) =>
  /\/forms\/(registration-form-01|signup-form)\//.test(p) || /(registration-form-01|signup-form)-procomp/.test(p);

const EXCLUDE = [
  /node_modules|\.next|\.git\b/,
  /source-map\.generated\.ts$/,
  /public[\\/]/,
  /docs[\\/]procomps[\\/][^\\/]+[\\/]reviews[\\/]/,
  /docs[\\/]reviews[\\/]/,
  /docs[\\/]migrations[\\/]/,
  /docs[\\/]archive[\\/]/,
  /docs[\\/]consumer_order[\\/]/,
  /docs[\\/]component-versions\.md$/,
  /docs[\\/]naming-canon\.md$/,
  /docs[\\/]production-readiness-plan\.md$/,
  /\.claude[\\/]decisions[\\/]/,
  /\.claude[\\/]handoffs-archive[\\/]/,
  /\.claude[\\/]STATUS-archive\.md$/,
  /\.claude[\\/]HANDOFF-/,
  /scripts[\\/]p2-rename/,
  /registry\.json$/,
];
const excluded = (p) => EXCLUDE.some((re) => re.test(p.replace(/\\/g, "/")));

const CODE_EXT = new Set([".ts", ".tsx", ".mjs", ".js", ".css", ".json"]);
const SWEEP_EXT = new Set([...CODE_EXT, ".md", ".txt"]);

function* walk(p) {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    if (/node_modules|\.next|^\.git$/.test(path.basename(p))) return;
    for (const e of fs.readdirSync(p)) yield* walk(path.join(p, e));
  } else yield p;
}

// ---------------------------------------------------------------- A. renames
function renamePaths() {
  const moves = [];
  // component folders
  for (const [o, n] of Object.entries(RENAMES)) {
    const hits = fs.readdirSync(path.join(ROOT, "src/registry/components"));
    for (const cat of hits) {
      const from = path.join(ROOT, "src/registry/components", cat, o);
      if (fs.existsSync(from)) moves.push([from, path.join(ROOT, "src/registry/components", cat, n)]);
    }
    const dFrom = path.join(ROOT, "docs/procomps", `${o}-procomp`);
    if (fs.existsSync(dFrom)) moves.push([dFrom, path.join(ROOT, "docs/procomps", `${n}-procomp`)]);
  }
  for (const [from, to] of moves) {
    log(`  mv ${path.relative(ROOT, from)} -> ${path.relative(ROOT, to)}`);
    if (!DRY) fs.renameSync(from, to);
    stats.renamedPaths++;
  }
  // file basenames inside moved trees (and anywhere in src/docs)
  const renameBase = (b, rel) => {
    let nb = b;
    for (const [o, n] of kebabPairs) nb = nb.replace(kebabRe(o), n);
    nb = nb.replace(/workspace-procomp/g, "split-workspace-procomp");
    if (isWorkspaceScope(rel)) nb = nb.replace(/(?<![a-z0-9-])workspace(?![a-z0-9-])/g, "split-workspace");
    if (isRegistrationScope(rel)) nb = nb.replace(/registration/g, "signup");
    return nb;
  };
  for (const root of ["src/registry", "src/app", "docs/procomps"]) {
    for (const f of [...walk(path.join(ROOT, root))]) {
      const rel = f.replace(/\\/g, "/");
      if (excluded(rel)) continue;
      const nb = renameBase(path.basename(f), rel);
      if (nb !== path.basename(f)) {
        const to = path.join(path.dirname(f), nb);
        log(`  mv ${path.relative(ROOT, f)} -> ${nb}`);
        if (!DRY) fs.renameSync(f, to);
        stats.renamedPaths++;
      }
    }
  }
}

// ---------------------------------------------------------------- B. content
function sweepContent() {
  const roots = [
    "src", "scripts", "docs", "README.md",
    ".claude/STATUS.md", ".claude/CLAUDE.md", ".claude/rules", ".claude/skills",
  ];
  for (const r of roots) {
    for (const f of [...walk(path.join(ROOT, r))]) {
      const rel = f.replace(/\\/g, "/");
      if (excluded(rel)) continue;
      if (!SWEEP_EXT.has(path.extname(f))) continue;
      let c = fs.readFileSync(f, "utf8");
      const orig = c;
      let n = 0;
      const rep = (re, to) => { c = c.replace(re, (m) => { n++; return typeof to === "function" ? to(m) : to; }); };

      const regScope = isRegistrationScope(rel);
      const wsScope = isWorkspaceScope(rel);
      const isMd = f.endsWith(".md");

      // protect registration-card inside signup-form scope
      if (regScope) c = c.replaceAll("registration-card", "\x00RC\x00");

      // kebab slugs (workspace excluded; path/quoted contexts handled globally)
      for (const [o, nw] of kebabPairs) rep(kebabRe(o), nw);
      rep(/components\/layout\/workspace/g, "components/layout/split-workspace");
      rep(/@ilinxa\/workspace(?![a-z0-9-])/g, "@ilinxa/split-workspace");
      rep(/workspace-procomp/g, "split-workspace-procomp");

      // identifier families
      for (const [o, nw] of ID_PAIRS) rep(idRe(o), nw);
      for (const [re, to] of GENERIC_ID) rep(new RegExp(re.source, "g"), to);

      if (wsScope) {
        // relative imports of the main file: "./workspace", "../workspace"
        rep(/((["'])\.{1,2}(?:\/[\w-]+)*\/)workspace(?![a-z0-9-])/g, "$1split-workspace");
        rep(/(?<![A-Za-z0-9_$])Workspace(?=[A-Z0-9_])/g, "SplitWorkspace"); // compound ids
        if (isMd) {
          rep(/<\/?Workspace(?![A-Za-z0-9])/g, (m) => m.replace("Workspace", "SplitWorkspace"));
          rep(/`Workspace`/g, "`SplitWorkspace`");
          rep(/\{\s*Workspace\s*\}/g, "{ SplitWorkspace }");
          rep(wordRe("Workspace"), "Split Workspace");
        } else {
          rep(wordRe("Workspace"), "SplitWorkspace");
        }
        rep(/"workspace"/g, '"split-workspace"');
      }

      if (regScope) {
        rep(idRe("Registration"), "Signup");
        rep(wordRe("registration"), "signup");
        c = c.replaceAll("\x00RC\x00", "registration-card");
      }

      // Title-space forms (markdown prose + string labels in code)
      if (isMd || /meta\.ts$|demo\.tsx$|usage\.tsx$|dummy-data\.ts$/.test(rel)) {
        for (const [o, nw] of TITLE_PAIRS) rep(wordRe(o), nw);
      }

      if (c !== orig) {
        log(`  ~ ${path.relative(ROOT, f)} (${n})`);
        if (!DRY) fs.writeFileSync(f, c);
        stats.filesChanged++; stats.replacements += n;
      }
    }
  }
}

// ---------------------------------------------------------------- C. registry.json
function transformRegistry() {
  const p = path.join(ROOT, "registry.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const mapSlug = (s) => RENAMES[s] ?? s;
  const mapPath = (s) => {
    let out = s;
    for (const [o, n] of kebabPairs) out = out.replace(kebabRe(o), n);
    out = out
      .replace("components/layout/workspace/", "components/layout/split-workspace/")
      .replace("components/workspace/", "components/split-workspace/")
      .replace(/\/workspace\.(tsx|ts|css)$/, "/split-workspace.$1");
    return out;
  };
  for (const item of j.items) {
    const base = item.name.endsWith("-fixtures") ? item.name.slice(0, -"-fixtures".length) : item.name;
    const suffix = item.name.endsWith("-fixtures") ? "-fixtures" : "";
    if (RENAMES[base]) {
      item.name = RENAMES[base] + suffix;
      item.title = titleCase(RENAMES[base]) + (suffix ? " — fixtures" : "");
    }
    if (item.files) for (const f of item.files) { f.path = mapPath(f.path); f.target = mapPath(f.target); }
    if (item.registryDependencies) item.registryDependencies = item.registryDependencies.map((d) =>
      d.startsWith("@ilinxa/") ? `@ilinxa/${mapSlug(d.slice("@ilinxa/".length))}` : d);
  }
  // P2.3 — deprecated alias items (base slugs only)
  for (const [o, n] of Object.entries(RENAMES)) {
    j.items.push({
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: o,
      type: "registry:block",
      title: `${titleCase(n)} (deprecated alias)`,
      description: `Deprecated alias — renamed to ${n} in the 2026-08 naming canon. Install @ilinxa/${n} instead; this alias will be removed after a grace window.`,
      author: "ilinxa",
      categories: ["deprecated"],
      registryDependencies: [`@ilinxa/${n}`],
      meta: { deprecated: true, replacedBy: n },
    });
  }
  if (!DRY) fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  log(`  registry.json: ${j.items.length} items (incl. ${Object.keys(RENAMES).length} aliases)`);
}

// ---------------------------------------------------------------- D. manifest
function regenManifest(orderSlugs, slugCat) {
  const lines = [];
  const entries = [];
  for (const old of orderSlugs) {
    const slug = RENAMES[old] ?? old;
    const cat = slugCat.get(old);
    const P = pascal(slug), c = camel(slug);
    lines.push(
      `import ${P}Demo from "./components/${cat}/${slug}/demo";`,
      `import ${P}Usage from "./components/${cat}/${slug}/usage";`,
      `import { meta as ${c}Meta } from "./components/${cat}/${slug}/meta";`,
      "",
    );
    entries.push(`  {\n    meta: ${c}Meta,\n    Demo: ${P}Demo,\n    Usage: ${P}Usage,\n  },`);
  }
  const tail = `
export function getEntry(slug: string): RegistryEntry | undefined {
  return REGISTRY.find((e) => e.meta.slug === slug);
}

export function getEntriesByCategory(
  category: ComponentCategorySlug,
): RegistryEntry[] {
  return REGISTRY.filter((e) => e.meta.category === category);
}

export function getAllSlugs(): string[] {
  return REGISTRY.map((e) => e.meta.slug);
}

export type GroupedRegistry = Array<{
  category: CategoryMeta;
  entries: RegistryEntry[];
}>;

export function getGroupedRegistry(): GroupedRegistry {
  return ORDERED_CATEGORIES.map((category) => ({
    category,
    entries: getEntriesByCategory(category.slug),
  })).filter((group) => group.entries.length > 0);
}

export function getMetaList(): ComponentMeta[] {
  return REGISTRY.map((e) => e.meta);
}

export { CATEGORIES, ORDERED_CATEGORIES };
`;
  const out = `${lines.join("\n")}
import { CATEGORIES, ORDERED_CATEGORIES } from "./categories";
import type {
  CategoryMeta,
  ComponentCategorySlug,
  ComponentMeta,
  RegistryEntry,
} from "./types";

export const REGISTRY: RegistryEntry[] = [
${entries.join("\n")}
];
${tail}`;
  if (!DRY) fs.writeFileSync(path.join(ROOT, "src/registry/manifest.ts"), out);
  log(`  manifest.ts regenerated (${orderSlugs.length} entries)`);
}

// ---------------------------------------------------------------- E. version bumps
function bumpVersions() {
  const compRoot = path.join(ROOT, "src/registry/components");
  for (const cat of fs.readdirSync(compRoot)) {
    if (cat.startsWith("_")) continue;
    for (const slug of fs.readdirSync(path.join(compRoot, cat))) {
      const mp = path.join(compRoot, cat, slug, "meta.ts");
      if (!fs.existsSync(mp)) continue;
      let c = fs.readFileSync(mp, "utf8");
      const renamed = Object.values(RENAMES).includes(slug);
      c = c.replace(/version:\s*"(\d+)\.(\d+)\.(\d+)"/, (_, a, b, z) =>
        renamed ? `version: "${a}.${Number(b) + 1}.0"` : `version: "${a}.${b}.${Number(z) + 1}"`);
      c = c.replace(/updatedAt:\s*"[^"]*"/, `updatedAt: "${TODAY}"`);
      if (!DRY) fs.writeFileSync(mp, c);
    }
  }
  log("  meta.ts versions bumped (minor for renamed, patch for unchanged) + updatedAt");
}

// ---------------------------------------------------------------- run
// capture manifest order BEFORE anything moves
const manifestSrc = fs.readFileSync(path.join(ROOT, "src/registry/manifest.ts"), "utf8");
const importMap = new Map(); // metaVar -> {slug, cat}
for (const m of manifestSrc.matchAll(/import \{ meta as (\w+) \} from "\.\/components\/([^/]+)\/([^/]+)\/meta"/g))
  importMap.set(m[1], { cat: m[2], slug: m[3] });
const orderSlugs = [];
const slugCat = new Map();
for (const m of manifestSrc.matchAll(/meta: (\w+Meta),/g)) {
  const e = importMap.get(m[1]);
  if (!e) throw new Error(`manifest parse: unknown meta var ${m[1]}`);
  orderSlugs.push(e.slug); slugCat.set(e.slug, e.cat);
}
if (orderSlugs.length !== 63) throw new Error(`expected 63 manifest entries, got ${orderSlugs.length}`);

log(DRY ? "== DRY RUN ==" : "== EXECUTING ==");
log("A. path renames");
renamePaths();
log("B. content sweep");
sweepContent();
log("C. registry.json transform + aliases");
transformRegistry();
log("D. manifest regeneration");
regenManifest(orderSlugs, slugCat);
log("E. version bumps");
bumpVersions();
log(`DONE. files changed: ${stats.filesChanged}, replacements: ${stats.replacements}, paths renamed: ${stats.renamedPaths}`);
