/**
 * P2.2b — residual sweep for the great rename (verify-pass findings).
 *
 * Pass 1 (p2-rename.mjs) guarded identifier matches with a LEFT word-boundary,
 * so mid-identifier occurrences survived (useTodoTreeState, serializeArticleBodyToHtml,
 * resolveContentCardPermissions, …), as did suffixless kebab stems in basenames
 * (article-body-viewer.tsx, cooperative-challenge-*.tsx), SCREAMING forms
 * (THUMB_LIST_01_*, RICH_CARD), sentence-case UI strings ("Rich card"), and the
 * task-family wire MIME. This pass relaxes the guards for stems verified unique
 * to their families and fixes the specific string/file findings.
 *
 * Usage: node scripts/p2-rename-residual.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolveRoot();
const DRY = process.argv.includes("--dry");
function resolveRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

// ordered, longest-first; matched ANYWHERE (stems verified unique to their family)
const ID_ANYWHERE = [
  ["TodoRichCard", "TaskCard"],
  ["RichCardInFlow", "CardTreeNode"],
  ["RichCardTree", "CardTree"], // "new RichCard tree" compounds — avoid CardTreeTree stutter
  ["MediaCarouselEditor01", "CarouselComposer"],
  ["MediaCarouselEditor", "CarouselComposer"],
  ["ContentCardNews01", "NewsCard"],
  ["ContentCardNews", "NewsCard"],
  ["ContentCard", "NewsCard"],
  ["CooperativeChallenge", "TeamChallenge"],
  ["TaskChoiceControl01", "TeamTaskClaim"],
  ["TaskChoiceControl", "TeamTaskClaim"],
  ["TaskChoice", "TaskClaim"],
  ["GridLayoutNews01", "MagazineLayout"],
  ["GridLayoutNews", "MagazineLayout"],
  ["GridLayout", "MagazineLayout"],
  ["RegistrationForm01", "SignupForm"],
  ["NewsletterCard", "NewsletterSignup"],
  ["PageHeroNews", "PageHero"],
  ["GanttTimeline01", "GanttTimeline"],
  ["Calendar01", "EventCalendar"],
  ["ArticleBody", "RichText"],
  ["ThumbList", "ThumbnailList"],
  ["TodoTree", "TaskTree"],
  ["FilterStack", "FilterPanel"],
  ["RichSidebar", "AppSidebar"],
  ["RichCard", "CardTree"],
];
const SCREAMING = [
  ["TODO_RICH_CARD", "TASK_CARD"],
  ["THUMB_LIST_01", "THUMBNAIL_LIST"],
  ["THUMB_LIST", "THUMBNAIL_LIST"],
  ["CONTENT_CARD_NEWS", "NEWS_CARD"],
  ["CONTENT_CARD", "NEWS_CARD"],
  ["RICH_CARD", "CARD_TREE"],
  ["ARTICLE_BODY", "RICH_TEXT"],
  ["COOPERATIVE_CHALLENGE", "TEAM_CHALLENGE"],
  ["TASK_CHOICE", "TASK_CLAIM"],
  ["RICH_SIDEBAR", "APP_SIDEBAR"],
  ["TODO_TREE", "TASK_TREE"],
  ["GRID_LAYOUT_NEWS", "MAGAZINE_LAYOUT"],
  ["NEWSLETTER_CARD", "NEWSLETTER_SIGNUP"],
  ["PAGE_HERO_NEWS", "PAGE_HERO"],
  ["MEDIA_CAROUSEL_EDITOR", "CAROUSEL_COMPOSER"],
  ["FILTER_STACK", "FILTER_PANEL"],
];
// suffixless kebab stems that pass 1 only mapped in their -01 form
const KEBAB2 = [
  ["media-carousel-editor", "carousel-composer"],
  ["cooperative-challenge", "team-challenge"],
  ["task-choice-control", "team-task-claim"],
  ["content-card-news", "news-card"],
  ["grid-layout-news", "magazine-layout"],
  ["registration-form", "signup-form"],
  ["newsletter-card", "newsletter-signup"],
  ["page-hero-news", "page-hero"],
  ["article-body", "rich-text"],
  ["content-card", "news-card"],
  ["task-choice", "task-claim"],
  ["thumb-list", "thumbnail-list"],
];
// sentence-case / UI-string prose
const PROSE = [
  ["Rich card", "Card tree"],
  ["Article body", "Rich text"],
  ["Todo kanban", "Task kanban"],
  ["Todo (rich)", "Task card"],
  ["Cooperative challenge", "Team challenge"],
  ["Task choice", "Task claim"],
  ["Content card", "News card"],
  ["Newsletter card", "Newsletter signup"],
  ["Thumb list", "Thumbnail list"],
  ["Todo tree", "Task tree"],
  ["Todo rich card", "Task card"],
  ["Rich sidebar", "App sidebar"],
  ["Filter stack", "Filter panel"],
];
const LITERALS = [
  ["application/x-ilinxa-todo+json", "application/x-ilinxa-task+json"],
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const kebabRe = (t) => new RegExp(`(?<![a-z0-9])${esc(t)}(?![a-z0-9])`, "g");
const wordRe = (t) => new RegExp(`(?<![A-Za-z0-9])${esc(t)}(?![A-Za-z0-9])`, "g");

const EXCLUDE = [
  /node_modules|\.next|\.git\b/,
  /source-map\.generated\.ts$/,
  /public[\\/]/,
  /docs[\\/]procomps[\\/][^\\/]+[\\/]reviews[\\/]/,
  /docs[\\/]reviews[\\/]/,
  /docs[\\/]migrations[\\/]/, /docs[\\/]archive[\\/]/, /docs[\\/]consumer_order[\\/]/,
  /docs[\\/]component-versions\.md$/, /docs[\\/]naming-canon\.md$/, /docs[\\/]production-readiness-plan\.md$/,
  /\.claude[\\/]decisions[\\/]/, /\.claude[\\/]handoffs-archive[\\/]/, /\.claude[\\/]STATUS-archive\.md$/, /\.claude[\\/]HANDOFF-/,
  /scripts[\\/]p2-rename/, /registry\.json$/,
];
const excluded = (p) => EXCLUDE.some((re) => re.test(p.replace(/\\/g, "/")));
const SWEEP_EXT = new Set([".ts", ".tsx", ".mjs", ".js", ".css", ".json", ".md", ".txt"]);

function* walk(p) {
  if (!fs.existsSync(p)) return;
  if (fs.statSync(p).isDirectory()) {
    if (/node_modules|\.next|^\.git$/.test(path.basename(p))) return;
    for (const e of fs.readdirSync(p)) yield* walk(path.join(p, e));
  } else yield p;
}

const isRegScope = (p) => /\/forms\/signup-form\/|signup-form-procomp/.test(p);

let files = 0, reps = 0, moves = 0;

// A. file basenames with suffixless stems
for (const root of ["src/registry", "src/app", "docs/procomps"]) {
  for (const f of [...walk(path.join(ROOT, root))]) {
    const rel = f.replace(/\\/g, "/");
    if (excluded(rel)) continue;
    let nb = path.basename(f);
    for (const [o, n] of KEBAB2) nb = nb.replace(kebabRe(o), n);
    if (nb !== path.basename(f)) {
      console.log(`  mv ${path.relative(ROOT, f)} -> ${nb}`);
      if (!DRY) fs.renameSync(f, path.join(path.dirname(f), nb));
      moves++;
    }
  }
}

// B. content
for (const root of ["src", "docs", "scripts", "README.md", ".claude/STATUS.md", ".claude/skills", ".claude/rules"]) {
  for (const f of [...walk(path.join(ROOT, root))]) {
    const rel = f.replace(/\\/g, "/");
    if (excluded(rel) || !SWEEP_EXT.has(path.extname(f))) continue;
    let c = fs.readFileSync(f, "utf8");
    const orig = c;
    let n = 0;
    const rep = (re, to) => { c = c.replace(re, () => { n++; return to; }); };

    for (const [o, t] of LITERALS) rep(new RegExp(esc(o), "g"), t);
    for (const [o, t] of SCREAMING) rep(new RegExp(`${esc(o)}(?![A-Z])`, "g"), t);
    for (const [o, t] of ID_ANYWHERE) rep(new RegExp(esc(o), "g"), t);
    rep(/TODO_(?=[A-Z0-9])/g, "TASK_");
    rep(/Todo(?=[A-Z])/g, "Task");
    rep(/todo(?=[A-Z])/g, "task");
    for (const [o, t] of KEBAB2) rep(kebabRe(o), t);
    for (const [o, t] of PROSE) rep(wordRe(o), t);
    if (isRegScope(rel)) {
      rep(/Registration/g, "Signup");
      rep(/REGISTRATION/g, "SIGNUP");
      rep(wordRe("registration"), "signup");
    }

    if (c !== orig) {
      console.log(`  ~ ${path.relative(ROOT, f)} (${n})`);
      if (!DRY) fs.writeFileSync(f, c);
      files++; reps += n;
    }
  }
}

// C. registry.json paths/targets for the renamed basenames
{
  const p = path.join(ROOT, "registry.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  let n = 0;
  for (const item of j.items) for (const fl of item.files ?? []) {
    for (const [o, t] of KEBAB2) {
      const before = fl.path;
      fl.path = fl.path.replace(kebabRe(o), t);
      fl.target = fl.target.replace(kebabRe(o), t);
      if (fl.path !== before) n++;
    }
  }
  if (!DRY) fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log(`  registry.json paths remapped: ${n}`);
}

console.log(`DONE residual: ${files} files, ${reps} replacements, ${moves} renames`);
