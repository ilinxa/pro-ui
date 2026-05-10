import type { Extension } from "@codemirror/state";
import { normalizeLang } from "./shiki-bundle";

type LangLoader = () => Promise<Extension | null>;

const CM_LANG_LOADERS: Record<string, LangLoader> = {
  ts: async () =>
    (await import("@codemirror/lang-javascript")).javascript({
      typescript: true,
      jsx: false,
    }),
  tsx: async () =>
    (await import("@codemirror/lang-javascript")).javascript({
      typescript: true,
      jsx: true,
    }),
  js: async () =>
    (await import("@codemirror/lang-javascript")).javascript({ jsx: false }),
  jsx: async () =>
    (await import("@codemirror/lang-javascript")).javascript({ jsx: true }),
  json: async () => (await import("@codemirror/lang-json")).json(),
  python: async () => (await import("@codemirror/lang-python")).python(),
  html: async () => (await import("@codemirror/lang-html")).html(),
  css: async () => (await import("@codemirror/lang-css")).css(),
  markdown: async () => (await import("@codemirror/lang-markdown")).markdown(),
};

export async function loadCodeMirrorLang(
  lang: string,
): Promise<Extension | null> {
  const normalized = normalizeLang(lang);
  const loader = CM_LANG_LOADERS[normalized];
  if (!loader) return null;
  try {
    return await loader();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[CodeBlock] CodeMirror lang package for "${lang}" failed to load:`,
        err,
      );
    }
    return null;
  }
}
