import type { EditorView, KeyBinding } from "@codemirror/view";

// Standard markdown keymap (description Q2; plan §5.4).
// Mod-B / Mod-I / Mod-E / Mod-K wrap selection; Mod-Shift-period toggles blockquote.

function wrap(view: EditorView, before: string, after: string = before): boolean {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: { from, to, insert: `${before}${selectedText}${after}` },
    selection:
      from === to
        ? { anchor: from + before.length }
        : { anchor: from + before.length, head: from + before.length + selectedText.length },
  });
  view.focus();
  return true;
}

function wrapLink(view: EditorView): boolean {
  // [[selection]](url) with cursor placed inside the (url) slot per §8.5 #1.
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  const before = `[${selectedText}](`;
  const after = ")";
  const cursor = from + before.length;
  view.dispatch({
    changes: { from, to, insert: `${before}${after}` },
    selection: { anchor: cursor },
  });
  view.focus();
  return true;
}

function toggleBlockquote(view: EditorView): boolean {
  const prefix = "> ";
  const { from, to } = view.state.selection.main;
  const startLine = view.state.doc.lineAt(from).number;
  const endLine = view.state.doc.lineAt(to).number;
  const lines: { from: number; to: number; text: string }[] = [];
  for (let n = startLine; n <= endLine; n++) {
    const line = view.state.doc.line(n);
    lines.push({ from: line.from, to: line.to, text: line.text });
  }
  const allHavePrefix = lines.every((l) => l.text.startsWith(prefix));
  const changes = lines.map((l) =>
    allHavePrefix
      ? { from: l.from, to: l.from + prefix.length, insert: "" }
      : { from: l.from, insert: prefix },
  );
  view.dispatch({ changes });
  view.focus();
  return true;
}

export function markdownKeymap(): KeyBinding[] {
  return [
    { key: "Mod-b", run: (view) => wrap(view, "**") },
    { key: "Mod-i", run: (view) => wrap(view, "*") },
    { key: "Mod-e", run: (view) => wrap(view, "`") },
    { key: "Mod-k", run: (view) => wrapLink(view) },
    { key: "Mod-Shift-.", run: (view) => toggleBlockquote(view) },
  ];
}
