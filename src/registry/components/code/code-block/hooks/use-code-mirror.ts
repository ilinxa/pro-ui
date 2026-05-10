"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers as cmLineNumbers } from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentLess,
  indentMore,
} from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { buildCodeMirrorTheme } from "../lib/codemirror-theme";
import { loadCodeMirrorLang } from "../lib/codemirror-langs";
import { normalizeLang } from "../lib/shiki-bundle";

interface UseCodeMirrorArgs {
  value: string;
  lang: string;
  readOnly: boolean;
  wrap: "wrap" | "scroll";
  tabSize: number;
  showLineNumbers: boolean;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  editorExtensions?: Extension[];
}

interface UseCodeMirrorResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  view: EditorView | null;
  focus: () => void;
  getValue: () => string;
}

export function useCodeMirror({
  value,
  lang,
  readOnly,
  wrap,
  tabSize,
  showLineNumbers,
  onChange,
  onSave,
  editorExtensions,
}: UseCodeMirrorArgs): UseCodeMirrorResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const wrapCompartmentRef = useRef(new Compartment());
  const langCompartmentRef = useRef(new Compartment());
  const readOnlyCompartmentRef = useRef(new Compartment());

  // Refs for callbacks so the editor doesn't remount on identity changes.
  // Synced via useEffect to avoid setting refs during render (React 19 rule).
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const [view, setView] = useState<EditorView | null>(null);

  // Mount (once per container)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const mount = async () => {
      const normalizedLang = normalizeLang(lang);
      const langExt = (await loadCodeMirrorLang(normalizedLang)) ?? [];
      if (cancelled) return;

      const extensions: Extension[] = [
        history(),
        bracketMatching(),
        indentOnInput(),
        closeBrackets(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          { key: "Tab", run: indentMore, shift: indentLess },
          {
            key: "Mod-s",
            preventDefault: true,
            run: (v) => {
              const text = v.state.doc.toString();
              if (onSaveRef.current) {
                onSaveRef.current(text);
              } else if (process.env.NODE_ENV !== "production") {
                console.warn(
                  "[CodeBlock] Cmd+S pressed in edit mode but `onSave` is not wired — no-op.",
                );
              }
              return true;
            },
          },
        ]),
        EditorState.tabSize.of(tabSize),
        EditorState.allowMultipleSelections.of(true),
        wrapCompartmentRef.current.of(wrap === "wrap" ? EditorView.lineWrapping : []),
        langCompartmentRef.current.of(langExt),
        readOnlyCompartmentRef.current.of([
          EditorView.editable.of(!readOnly),
          EditorState.readOnly.of(readOnly),
        ]),
        ...(showLineNumbers ? [cmLineNumbers()] : []),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            onChangeRef.current?.(u.state.doc.toString());
          }
        }),
        buildCodeMirrorTheme(),
        ...(editorExtensions ?? []),
      ];

      const v = new EditorView({
        state: EditorState.create({ doc: value, extensions }),
        parent: container,
      });
      viewRef.current = v;
      if (!cancelled) setView(v);
    };

    void mount();
    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
      setView(null);
    };
    // Intentionally only depend on `showLineNumbers` for mount — value sync
    // happens in its own effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLineNumbers]);

  // Controlled value sync
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current === value) return;
    v.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  // Wrap reconfigure
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    v.dispatch({
      effects: wrapCompartmentRef.current.reconfigure(
        wrap === "wrap" ? EditorView.lineWrapping : [],
      ),
    });
  }, [wrap]);

  // Lang reconfigure (async — load lang package on change)
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    let cancelled = false;
    const apply = async () => {
      const normalizedLang = normalizeLang(lang);
      const langExt = (await loadCodeMirrorLang(normalizedLang)) ?? [];
      if (cancelled || !viewRef.current) return;
      viewRef.current.dispatch({
        effects: langCompartmentRef.current.reconfigure(langExt),
      });
    };
    void apply();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Read-only reconfigure
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    v.dispatch({
      effects: readOnlyCompartmentRef.current.reconfigure([
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
      ]),
    });
  }, [readOnly]);

  const focus = useCallback(() => viewRef.current?.focus(), []);
  const getValue = useCallback(
    () => viewRef.current?.state.doc.toString() ?? "",
    [],
  );

  return { containerRef, view, focus, getValue };
}
