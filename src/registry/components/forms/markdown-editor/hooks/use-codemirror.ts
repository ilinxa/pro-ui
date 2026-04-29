import { useEffect, useRef, useState } from "react";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";

import { markdownEditorTheme } from "../lib/extensions/theme";
import {
  buildCandidatesMap,
  setCandidatesEffect,
  wikilinkExtension,
} from "../lib/extensions/wikilink";
import { createWikilinkCompletionSource } from "../lib/extensions/wikilink-autocomplete";
import { saveKeymap } from "../lib/extensions/save-keymap";
import { markdownKeymap } from "../lib/extensions/markdown-keymap";
import { readOnlyCompartment, userExtensionsCompartment } from "../lib/extensions/compartments";
import { SyncAnnotation } from "../lib/sync-annotation";
import type { KindMeta, WikilinkCandidate } from "../types";
import type { RefObject } from "react";

interface UseCodeMirrorOpts {
  value: string;
  readOnly: boolean;
  wikilinkCandidates: ReadonlyArray<WikilinkCandidate> | undefined;
  userExtensions: ReadonlyArray<Extension>;
  onChangeRef: RefObject<(value: string) => void>;
  onSaveRef: RefObject<((value: string) => void) | undefined>;
  kindsRef: RefObject<Record<string, KindMeta> | undefined>;
  // Notified on selection-set or doc-change CM6 updates so dependent surfaces
  // (toolbar active state) can re-render without reconfiguring extensions.
  onRelevantUpdateRef: RefObject<(() => void) | undefined>;
  ariaLabel: string | undefined;
}

interface UseCodeMirrorResult {
  // React-state view — null until CM6 mounts; safe to read during render.
  view: EditorView | null;
  setContainer: (node: HTMLDivElement | null) => void;
}

export function useCodeMirror(opts: UseCodeMirrorOpts): UseCodeMirrorResult {
  const {
    value,
    readOnly,
    wikilinkCandidates,
    userExtensions,
    onChangeRef,
    onSaveRef,
    kindsRef,
    onRelevantUpdateRef,
    ariaLabel,
  } = opts;

  const [view, setView] = useState<EditorView | null>(null);
  const lastSyncedValueRef = useRef<string>(value);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Mount-time prop snapshot via refs — read by mount effect; updated post-commit so
  // the snapshot stays fresh if a parent re-renders between hook call and mount.
  const valueAtMountRef = useRef(value);
  const readOnlyAtMountRef = useRef(readOnly);
  const candidatesAtMountRef = useRef(wikilinkCandidates);
  const userExtensionsAtMountRef = useRef(userExtensions);
  const ariaLabelAtMountRef = useRef(ariaLabel);

  useEffect(() => {
    valueAtMountRef.current = value;
    readOnlyAtMountRef.current = readOnly;
    candidatesAtMountRef.current = wikilinkCandidates;
    userExtensionsAtMountRef.current = userExtensions;
    ariaLabelAtMountRef.current = ariaLabel;
  });

  // Mount effect — keyed only on container; subsequent prop changes flow through
  // the sync effects below. Mount-time prop reads come from the refs above.
  useEffect(() => {
    if (!container) return;

    const initialDoc = valueAtMountRef.current;
    const initialReadOnly = readOnlyAtMountRef.current;
    const initialCandidates = candidatesAtMountRef.current;
    const initialUserExtensions = userExtensionsAtMountRef.current;
    const initialAriaLabel = ariaLabelAtMountRef.current;

    const extensions: Extension[] = [
      EditorView.lineWrapping,
      EditorState.tabSize.of(2),
      drawSelection(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      closeBrackets(),

      markdown({ base: markdownLanguage, extensions: [GFM], addKeymap: true }),

      history(),
      search({ top: true }),

      ...wikilinkExtension,

      autocompletion({
        override: [createWikilinkCompletionSource(kindsRef)],
      }),

      markdownEditorTheme,

      // Keymap — most-specific first; each binding's `run: () => true` stops further keymaps.
      keymap.of([
        ...saveKeymap(onSaveRef),
        ...markdownKeymap(),
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),

      readOnlyCompartment.of(EditorState.readOnly.of(initialReadOnly)),

      // Echo-guard updateListener (Q-P9) — skip onChange when transaction carries SyncAnnotation.
      EditorView.updateListener.of((update) => {
        if (
          update.docChanged &&
          !update.transactions.some((t) => t.annotation(SyncAnnotation))
        ) {
          onChangeRef.current(update.state.doc.toString());
        }
        if (update.selectionSet || update.docChanged) {
          onRelevantUpdateRef.current?.();
        }
      }),

      EditorView.contentAttributes.of(
        initialAriaLabel ? { "aria-label": initialAriaLabel } : {},
      ),

      // User extensions LAST — earlier-in-array = HIGHER CM6 default precedence (Q-P8 lock).
      // Our defaults win conflicts; users escalate via Prec.high(...).
      userExtensionsCompartment.of([...initialUserExtensions]),
    ];

    const editorView = new EditorView({
      state: EditorState.create({ doc: initialDoc, extensions }),
      parent: container,
    });

    // Seed initial candidates via dispatch (StateField starts empty).
    if (initialCandidates && initialCandidates.length > 0) {
      editorView.dispatch({
        effects: setCandidatesEffect.of(buildCandidatesMap(initialCandidates)),
      });
    }

    setView(editorView);
    lastSyncedValueRef.current = initialDoc;

    return () => {
      editorView.destroy();
      setView(null);
    };
    // Mount only on container change. All prop changes flow through sync effects below.
  }, [container, kindsRef, onChangeRef, onSaveRef, onRelevantUpdateRef]);

  // Value sync (Q-P9 echo-guarded).
  useEffect(() => {
    if (!view) return;
    if (
      value !== lastSyncedValueRef.current &&
      value !== view.state.doc.toString()
    ) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
        annotations: SyncAnnotation.of(true),
      });
    }
    lastSyncedValueRef.current = value;
  }, [view, value]);

  // ReadOnly sync.
  useEffect(() => {
    view?.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [view, readOnly]);

  // wikilinkCandidates sync (validate-pass refinement #2).
  useEffect(() => {
    if (!view) return;
    view.dispatch({
      effects: setCandidatesEffect.of(buildCandidatesMap(wikilinkCandidates ?? [])),
    });
  }, [view, wikilinkCandidates]);

  // User extensions sync (full reconfigure on reference change).
  useEffect(() => {
    view?.dispatch({
      effects: userExtensionsCompartment.reconfigure([...userExtensions]),
    });
  }, [view, userExtensions]);

  return { view, setContainer };
}
