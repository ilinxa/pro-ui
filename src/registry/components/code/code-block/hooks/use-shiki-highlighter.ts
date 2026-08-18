"use client";
import { useEffect, useRef, useState } from "react";
import type { HighlighterCore, ThemeRegistrationAny } from "shiki/core";
import {
  DEFAULT_THEME_NAMES,
  ensureLangLoaded,
  ensureThemeLoaded,
  getHighlighter,
  normalizeLang,
} from "../lib/shiki-bundle";
import { rangeToLines } from "../lib/line-utils";
import {
  diffForRetokenize,
  emptyCache,
  type StreamingCache,
} from "../lib/streaming-cache";
import type {
  CodeBlockLineRange,
  CodeBlockRegexEngine,
  CodeBlockThemes,
} from "../types";

interface UseShikiHighlighterArgs {
  value: string;
  lang: string;
  themes: CodeBlockThemes | undefined;
  highlightedLines?: Array<number | CodeBlockLineRange>;
  streaming?: boolean;
  /** v0.2.0 — see `CodeBlockProps.regexEngine`. Undefined = oniguruma. */
  regexEngine?: CodeBlockRegexEngine;
}

interface UseShikiHighlighterResult {
  html: string;
  ready: boolean;
  /**
   * The highlighter gave up for this input — engine unavailable (e.g. a strict
   * CSP with no `wasm-unsafe-eval`), grammar chunk failed to load, or the
   * default-theme retry itself threw.
   *
   * v0.2.0: exists so the view body can degrade to plain text instead of
   * rendering an empty panel. Distinct from `!ready`, which is also true while
   * highlighting is merely still in flight.
   */
  failed: boolean;
  resolvedLang: string;
}

// v0.1.2 (review 5.9) — resolve AND register a theme entry. String entries
// keep the ensureThemeLoaded dynamic-import path; OBJECT entries (the declared
// `ShikiThemeObject` support) are registered directly via
// `highlighter.loadTheme(entry)` — previously the object was dropped, a
// `shiki/themes/<name>.mjs` import was attempted, and the subsequent
// `codeToHtml` threw as an unhandled rejection, leaving the block blank.
async function ensureThemeEntry(
  highlighter: HighlighterCore,
  themes: CodeBlockThemes | undefined,
  variant: "light" | "dark",
): Promise<string> {
  const entry = themes?.[variant];
  if (!entry) return DEFAULT_THEME_NAMES[variant];
  if (typeof entry === "string") {
    await ensureThemeLoaded(highlighter, entry);
    return entry;
  }
  if (!highlighter.getLoadedThemes().includes(entry.name)) {
    // ShikiThemeObject is a structural subset of shiki's own registration
    // shape; the cast hands the full object through.
    await highlighter.loadTheme(entry as unknown as ThemeRegistrationAny);
  }
  return entry.name;
}

function highlight(
  highlighter: HighlighterCore,
  value: string,
  lang: string,
  lightTheme: string,
  darkTheme: string,
  highlightedSet: Set<number>,
): string {
  const html = highlighter.codeToHtml(value, {
    lang,
    themes: { light: lightTheme, dark: darkTheme },
    defaultColor: false,
    cssVariablePrefix: "--shiki-",
    transformers: [
      {
        name: "code-block-highlighted-lines",
        line(node, lineNumber) {
          if (highlightedSet.has(lineNumber)) {
            node.properties = node.properties ?? {};
            node.properties["data-highlighted"] = "true";
          }
        },
      },
    ],
  });
  return html;
}

export function useShikiHighlighter({
  value,
  lang,
  themes,
  highlightedLines,
  streaming,
  regexEngine,
}: UseShikiHighlighterArgs): UseShikiHighlighterResult {
  const [html, setHtml] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [resolvedLang, setResolvedLang] = useState<string>(normalizeLang(lang));
  const cacheRef = useRef<StreamingCache>(emptyCache());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const highlightedSet = rangeToLines(highlightedLines);

    const run = async () => {
      const highlighter = await getHighlighter(regexEngine);
      if (cancelled) return;
      const langForRender = await ensureLangLoaded(highlighter, lang);
      if (cancelled) return;

      // v0.1.2 (review 5.9) — theme resolution + tokenization are fallible
      // (unknown theme name, malformed theme object). Fall back to the
      // always-loaded defaults instead of throwing an unhandled rejection
      // and leaving the block permanently blank.
      let lightTheme: string;
      let darkTheme: string;
      try {
        [lightTheme, darkTheme] = await Promise.all([
          ensureThemeEntry(highlighter, themes, "light"),
          ensureThemeEntry(highlighter, themes, "dark"),
        ]);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[CodeBlock] Failed to load custom theme(s) — falling back to defaults.",
            err,
          );
        }
        lightTheme = DEFAULT_THEME_NAMES.light;
        darkTheme = DEFAULT_THEME_NAMES.dark;
      }
      if (cancelled) return;
      setResolvedLang(langForRender);

      // v0.1.0 streaming strategy: full re-tokenize per update, but batched
      // to a single rAF (suppresses thrash from rapid char-level updates).
      // Shiki caches grammars + themes, so warm-state tokenization is cheap
      // (<5 ms for typical view-mode blocks). Pure append-only diff path
      // is locked at lib/streaming-cache.ts and wired in for v0.2.
      let full: string;
      try {
        full = highlight(
          highlighter,
          value,
          langForRender,
          lightTheme,
          darkTheme,
          highlightedSet,
        );
      } catch (err) {
        // Theme registered but unusable at tokenize time — retry once on the
        // default pair (loaded with the highlighter core, cannot miss).
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[CodeBlock] Highlighting failed with the configured themes — retrying with defaults.",
            err,
          );
        }
        full = highlight(
          highlighter,
          value,
          langForRender,
          DEFAULT_THEME_NAMES.light,
          DEFAULT_THEME_NAMES.dark,
          highlightedSet,
        );
      }
      if (streaming) {
        // Surface the cache helper so it isn't tree-shaken; v0.2 will diff
        // against it for the pure append optimisation.
        diffForRetokenize(cacheRef.current, value);
      }
      cacheRef.current = { prevValue: value, prevHtmlLines: [full] };
      if (!cancelled) setHtml(full);
      if (!cancelled) setReady(true);
    };

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      // Fresh inputs get a fresh verdict — a block that failed once should
      // retry rather than stay degraded forever, and a stale `failed` would
      // mislabel a subsequently successful render. Reset here rather than in
      // the effect body: a synchronous setState there is a cascading-render
      // hazard the React Compiler lint (correctly) rejects.
      if (!cancelled) setFailed(false);

      // Final safety net (5.9): any residual rejection (network-failed wasm /
      // grammar import, malformed default retry) must never surface as an
      // unhandled rejection.
      run().catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[CodeBlock] Highlighter initialization failed.", err);
        }
        // v0.2.0 — the warning above is dev-only, so in production this was
        // previously a completely silent death: `html` stayed "" and the body
        // rendered an empty panel. Flag it so the view can show the raw code.
        if (!cancelled) setFailed(true);
      });
    });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, lang, themes, highlightedLines, streaming, regexEngine]);

  return { html, ready, failed, resolvedLang };
}
