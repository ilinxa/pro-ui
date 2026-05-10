"use client";
import { useEffect, useRef, useState } from "react";
import type { HighlighterCore } from "shiki/core";
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
import type { CodeBlockLineRange, CodeBlockThemes } from "../types";

interface UseShikiHighlighterArgs {
  value: string;
  lang: string;
  themes: CodeBlockThemes | undefined;
  highlightedLines?: Array<number | CodeBlockLineRange>;
  streaming?: boolean;
}

interface UseShikiHighlighterResult {
  html: string;
  ready: boolean;
  resolvedLang: string;
}

function resolveThemeName(
  themes: CodeBlockThemes | undefined,
  variant: "light" | "dark",
): string {
  const entry = themes?.[variant];
  if (!entry) return DEFAULT_THEME_NAMES[variant];
  if (typeof entry === "string") return entry;
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
}: UseShikiHighlighterArgs): UseShikiHighlighterResult {
  const [html, setHtml] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [resolvedLang, setResolvedLang] = useState<string>(normalizeLang(lang));
  const cacheRef = useRef<StreamingCache>(emptyCache());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const lightTheme = resolveThemeName(themes, "light");
    const darkTheme = resolveThemeName(themes, "dark");
    const highlightedSet = rangeToLines(highlightedLines);

    const run = async () => {
      const highlighter = await getHighlighter();
      if (cancelled) return;
      const langForRender = await ensureLangLoaded(highlighter, lang);
      if (cancelled) return;
      await Promise.all([
        ensureThemeLoaded(highlighter, lightTheme),
        ensureThemeLoaded(highlighter, darkTheme),
      ]);
      if (cancelled) return;
      setResolvedLang(langForRender);

      // v0.1.0 streaming strategy: full re-tokenize per update, but batched
      // to a single rAF (suppresses thrash from rapid char-level updates).
      // Shiki caches grammars + themes, so warm-state tokenization is cheap
      // (<5 ms for typical view-mode blocks). Pure append-only diff path
      // is locked at lib/streaming-cache.ts and wired in for v0.2.
      const full = highlight(
        highlighter,
        value,
        langForRender,
        lightTheme,
        darkTheme,
        highlightedSet,
      );
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
      void run();
    });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, lang, themes, highlightedLines, streaming]);

  return { html, ready, resolvedLang };
}
