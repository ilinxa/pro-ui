import { useImperativeHandle, useMemo, type Ref } from "react";
import { undo as cmUndo, redo as cmRedo } from "@codemirror/commands";
import type { EditorView } from "@codemirror/view";
import { insertText as insertTextAction } from "../lib/toolbar-actions";
import type { MarkdownEditorHandle } from "../types";

interface UseHandleOpts {
  ref: Ref<MarkdownEditorHandle> | undefined;
  view: EditorView | null;
}

const DEV = process.env.NODE_ENV !== "production";
let warnedGetViewBeforeMount = false;

export function useMarkdownEditorHandle({ ref, view }: UseHandleOpts): void {
  const handle = useMemo<MarkdownEditorHandle>(
    () => ({
      focus() {
        view?.focus();
      },
      undo() {
        if (!view) return;
        cmUndo(view);
      },
      redo() {
        if (!view) return;
        cmRedo(view);
      },
      insertText(text: string) {
        if (!view) return;
        insertTextAction(view, text);
      },
      getSelection() {
        if (!view) return { from: 0, to: 0, text: "" };
        const { from, to } = view.state.selection.main;
        return { from, to, text: view.state.sliceDoc(from, to) };
      },
      getValue() {
        return view?.state.doc.toString() ?? "";
      },
      getView() {
        if (!view && DEV && !warnedGetViewBeforeMount) {
          warnedGetViewBeforeMount = true;
          console.warn(
            "[markdown-editor] getView() called before mount or after unmount; returned null.",
          );
        }
        return view;
      },
    }),
    [view],
  );

  useImperativeHandle(ref, () => handle, [handle]);
}
