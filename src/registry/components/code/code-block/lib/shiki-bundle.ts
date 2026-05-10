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

let cachedHighlighter: Promise<HighlighterCore> | null = null;
const loadedLangs = new Set<string>();

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
  for (const reg of out) {
    if (reg && typeof reg === "object" && "name" in reg && typeof reg.name === "string") {
      loadedLangs.add(reg.name);
    }
  }
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

export function getHighlighter(): Promise<HighlighterCore> {
  if (cachedHighlighter) return cachedHighlighter;
  cachedHighlighter = (async () => {
    const [langs, themes, wasmMod] = await Promise.all([
      loadCoreGrammars(),
      loadCoreThemes(),
      import("shiki/wasm"),
    ]);
    // shiki/wasm exports the wasm-loader function as `default`.
    const wasm = wasmMod.default;
    return createHighlighterCore({
      engine: createOnigurumaEngine(wasm),
      langs,
      themes,
    });
  })();
  return cachedHighlighter;
}

export async function ensureLangLoaded(
  highlighter: HighlighterCore,
  lang: string,
): Promise<string> {
  const normalized = normalizeLang(lang);
  if (normalized === "plaintext") return normalized;
  if (loadedLangs.has(normalized)) return normalized;
  if (highlighter.getLoadedLanguages().includes(normalized)) {
    loadedLangs.add(normalized);
    return normalized;
  }
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
  loadedLangs.add(normalized);
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
