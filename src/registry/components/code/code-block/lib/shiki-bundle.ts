/**
 * Shiki bundle setup with fine-grained imports + on-demand grammar loading.
 *
 * Default ships ~10 common grammars synchronously (ts/tsx/js/jsx/json/python/
 * bash/markdown/html/css). Other grammars dynamic-import on first use.
 *
 * Themes default to GitHub Light + GitHub Dark Default (small, sync-loaded).
 */
import {
  createHighlighterCore,
  type HighlighterCore,
  type LanguageRegistration,
  type ThemeRegistrationAny,
} from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import type { CodeBlockRegexEngine } from "../types";

/**
 * Highlighter cache, **keyed by engine** (v0.2.0).
 *
 * This used to be a single module-level promise with no key. Once the engine
 * became selectable that would have been a silent bug: the first block to
 * mount would win, and every later block asking for the other engine would get
 * the cached one instead. Keying is what makes the option real.
 */
const cachedHighlighters = new Map<CodeBlockRegexEngine, Promise<HighlighterCore>>();

const LAZY_LANG_LOADERS: Record<string, () => Promise<unknown>> = {
  rust: () => import("shiki/langs/rust.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  csharp: () => import("shiki/langs/csharp.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  swift: () => import("shiki/langs/swift.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  graphql: () => import("shiki/langs/graphql.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  scss: () => import("shiki/langs/scss.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
  makefile: () => import("shiki/langs/makefile.mjs"),
  patch: () => import("shiki/langs/diff.mjs"),
};

const LANG_ALIASES: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  py: "python",
  rb: "ruby",
  rs: "rust",
  yml: "yaml",
  sh: "bash",
  zsh: "bash",
  md: "markdown",
  mdx: "markdown",
};

export function normalizeLang(lang: string | undefined): string {
  if (!lang) return "plaintext";
  const lower = lang.toLowerCase();
  return LANG_ALIASES[lower] ?? lower;
}

async function loadCoreGrammars(): Promise<LanguageRegistration[]> {
  const [ts, tsx, js, jsx, json, bash, python, markdown, html, css] = await Promise.all([
    import("shiki/langs/ts.mjs"),
    import("shiki/langs/tsx.mjs"),
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/jsx.mjs"),
    import("shiki/langs/json.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/python.mjs"),
    import("shiki/langs/markdown.mjs"),
    import("shiki/langs/html.mjs"),
    import("shiki/langs/css.mjs"),
  ]);
  const out = [ts, tsx, js, jsx, json, bash, python, markdown, html, css]
    .map((m) => (m as { default: unknown }).default)
    .flat() as LanguageRegistration[];
  // No bookkeeping needed: these are passed to `createHighlighterCore`, so
  // each instance reports them from `getLoadedLanguages()` itself.
  return out;
}

async function loadCoreThemes(): Promise<ThemeRegistrationAny[]> {
  const [light, dark] = await Promise.all([
    import("shiki/themes/github-light.mjs"),
    import("shiki/themes/github-dark-default.mjs"),
  ]);
  return [
    (light as { default: ThemeRegistrationAny }).default,
    (dark as { default: ThemeRegistrationAny }).default,
  ];
}

/**
 * Build the regex engine.
 *
 * `oniguruma` (default) is WebAssembly and needs `'wasm-unsafe-eval'` in the
 * host's `script-src` under a strict CSP — without it Chrome refuses the
 * compile outright and highlighting can never work. `javascript` uses no wasm
 * at all, so it is the escape hatch for CSP-restricted hosts; it supports
 * slightly fewer grammar constructs, which is the trade being offered.
 */
async function buildEngine(engine: CodeBlockRegexEngine) {
  if (engine === "javascript") {
    const { createJavaScriptRegexEngine } = await import("shiki/engine/javascript");
    return createJavaScriptRegexEngine();
  }
  // shiki/wasm exports the wasm-loader function as `default`.
  const wasmMod = await import("shiki/wasm");
  return createOnigurumaEngine(wasmMod.default);
}

export function getHighlighter(
  engine: CodeBlockRegexEngine = "oniguruma",
): Promise<HighlighterCore> {
  const cached = cachedHighlighters.get(engine);
  if (cached) return cached;
  const created = (async () => {
    const [langs, themes, regexEngine] = await Promise.all([
      loadCoreGrammars(),
      loadCoreThemes(),
      buildEngine(engine),
    ]);
    return createHighlighterCore({ engine: regexEngine, langs, themes });
  })();
  // Evict on failure so the cache cannot pin a permanent rejection. Without
  // this, one failed wasm compile poisons every block for the page's lifetime
  // and the hook's retry-on-new-input can never actually retry.
  created.catch(() => {
    if (cachedHighlighters.get(engine) === created) cachedHighlighters.delete(engine);
  });
  cachedHighlighters.set(engine, created);
  return created;
}

export async function ensureLangLoaded(
  highlighter: HighlighterCore,
  lang: string,
): Promise<string> {
  const normalized = normalizeLang(lang);
  if (normalized === "plaintext") return normalized;
  /*
   * Ask the HIGHLIGHTER what it has loaded — never a module-global set.
   *
   * Until v0.2.0 there was exactly one highlighter, so a shared
   * `loadedLangs` Set was a harmless shortcut. Making the engine selectable
   * created a second instance and turned that Set into a cross-instance lie:
   * once the oniguruma highlighter loaded `rust`, the javascript one would
   * short-circuit here, never call `loadLanguage`, and then throw
   * "Language `rust` not found" on the very next `codeToHtml` — surfacing as
   * a permanent plaintext fallback on a perfectly healthy engine.
   * `getLoadedLanguages()` is per-instance and cannot drift.
   */
  if (highlighter.getLoadedLanguages().includes(normalized)) return normalized;
  const loader = LAZY_LANG_LOADERS[normalized];
  if (!loader) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[CodeBlock] Unknown lang "${lang}" — falling back to plaintext.`);
    }
    return "plaintext";
  }
  const mod = (await loader()) as { default: LanguageRegistration | LanguageRegistration[] };
  const reg = Array.isArray(mod.default) ? mod.default : [mod.default];
  await highlighter.loadLanguage(...reg);
  return normalized;
}

export async function ensureThemeLoaded(
  highlighter: HighlighterCore,
  themeName: string,
): Promise<void> {
  if (highlighter.getLoadedThemes().includes(themeName)) return;
  // Attempt dynamic import from shiki/themes/<name>.mjs
  try {
    const mod = (await import(/* @vite-ignore */ `shiki/themes/${themeName}.mjs`)) as {
      default: ThemeRegistrationAny;
    };
    await highlighter.loadTheme(mod.default);
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[CodeBlock] Theme "${themeName}" not found in shiki/themes/.`);
    }
  }
}

export const DEFAULT_THEME_NAMES = {
  light: "github-light",
  dark: "github-dark-default",
} as const;
