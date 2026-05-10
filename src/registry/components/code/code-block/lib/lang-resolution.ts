import type { CodeBlockFilenameToLangArgs } from "../types";

export const FILENAME_TO_LANG_MAP: Record<string, string> = {
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  mjs: "js",
  cjs: "js",
  json: "json",
  jsonc: "json",
  json5: "json",
  py: "python",
  pyw: "python",
  rb: "ruby",
  rake: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cxx: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  ini: "ini",
  md: "markdown",
  mdx: "markdown",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  graphql: "graphql",
  gql: "graphql",
  sql: "sql",
  diff: "diff",
  patch: "diff",
  txt: "plaintext",
  log: "plaintext",
};

const FILENAME_OVERRIDES: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
};

export function resolveLang(
  lang: string | undefined,
  filename: string | undefined,
  override: ((args: CodeBlockFilenameToLangArgs) => string | undefined) | undefined,
): string {
  if (lang) return lang;
  if (!filename) return "plaintext";

  const lowered = filename.toLowerCase();
  const exact = FILENAME_OVERRIDES[lowered];
  if (exact) return exact;

  if (override) {
    const overridden = override({ filename });
    if (overridden) return overridden;
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FILENAME_TO_LANG_MAP[ext] ?? "plaintext";
}
