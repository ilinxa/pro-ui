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
  /**
   * INITIAL-ONLY (v0.1.2): applied when the editor is created; later changes
   * are not re-applied. Remount the editor (e.g. via a React `key`) to change
   * it after mount. Making it reactive needs a dedicated compartment — noted
   * for a future minor.
   */
  tabSize: number;
  showLineNumbers: boolean;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  /**
   * INITIAL-ONLY (v0.1.2): the array captured at editor creation is baked into
   * the EditorState; identity or content changes after mount are ignored.
   * Remount (React `key`) to swap extensions.
   */
  editorExtensions?: Extension[];
}

interface UseCodeMirrorResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  view: EditorView | null;
  focus: () => void;
  getValue: () => string;
  /**
   * Editor construction failed (grammar chunk fetch, EditorView throw).
   * v0.2.0: previously this could only manifest as an unhandled rejection and
   * a blank editor; the edit body now renders a recovery affordance from it.
   */
  error: Error | null;
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

  // v0.1.2 (review 5.8) — refs mirroring the reactive props. The mount effect
  // awaits a dynamic lang import; props can change during that window. The
  // editor is created from THESE refs (current at creation time), not the
  // mount closure's stale first-render values; the per-prop sync effects
  // below additionally re-run once `view` flips non-null, so nothing that
  // changed mid-window is lost.
  const valueRef = useRef(value);
  const wrapRef = useRef(wrap);
  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    wrapRef.current = wrap;
  }, [wrap]);
  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  const [view, setView] = useState<EditorView | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Mount (once per container)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    setError(null);

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
        // tabSize + editorExtensions are INITIAL-ONLY by contract (see the
        // args JSDoc) — closure capture here is deliberate.
        EditorState.tabSize.of(tabSize),
        EditorState.allowMultipleSelections.of(true),
        // Reactive props read from refs — current at creation time even when
        // they changed while the lang import above was in flight (5.8).
        wrapCompartmentRef.current.of(
          wrapRef.current === "wrap" ? EditorView.lineWrapping : [],
        ),
        langCompartmentRef.current.of(langExt),
        readOnlyCompartmentRef.current.of([
          EditorView.editable.of(!readOnlyRef.current),
          EditorState.readOnly.of(readOnlyRef.current),
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
        state: EditorState.create({ doc: valueRef.current, extensions }),
        parent: container,
      });
      viewRef.current = v;
      if (!cancelled) setView(v);
    };

    // v0.2.0 — this used to be a bare `void mount();`. `mount()` awaits a
    // dynamic grammar import and then constructs an EditorView; either can
    // reject (a failed chunk fetch is the same class of failure that takes the
    // Shiki engine down under a strict CSP). The result was an unhandled
    // rejection plus a permanently empty editor — the soft-failure policy
    // documented an inline error + "Reload as view-only" here, and nothing
    // implemented it.
    void mount().catch((err: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[CodeBlock] Editor initialization failed.", err);
      }
      if (!cancelled) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    });
    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
      setView(null);
    };
    // Intentionally only depend on `showLineNumbers` for mount — value sync
    // happens in its own effect below; mid-mount prop changes are covered by
    // the prop refs above (5.8).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLineNumbers]);

  // Controlled value sync. Keyed on `view` too (5.8): when the async mount
  // resolves, this re-runs against the fresh view and applies any value that
  // changed while the editor was still being created.
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current === value) return;
    v.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value, view]);

  // Wrap reconfigure (view-keyed for the async-mount window, 5.8)
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    v.dispatch({
      effects: wrapCompartmentRef.current.reconfigure(
        wrap === "wrap" ? EditorView.lineWrapping : [],
      ),
    });
  }, [wrap, view]);

  // Lang reconfigure (async — load lang package on change; view-keyed, 5.8)
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
  }, [lang, view]);

  // Read-only reconfigure (view-keyed for the async-mount window, 5.8)
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    v.dispatch({
      effects: readOnlyCompartmentRef.current.reconfigure([
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
      ]),
    });
  }, [readOnly, view]);

  const focus = useCallback(() => viewRef.current?.focus(), []);
  const getValue = useCallback(
    () => viewRef.current?.state.doc.toString() ?? "",
    [],
  );

  return { containerRef, view, focus, getValue, error };
}
