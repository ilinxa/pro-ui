import type { EditorView } from "@codemirror/view";

export function wrapSelection(view: EditorView, before: string, after: string = before): void {
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
}

export function toggleLinePrefix(view: EditorView, prefix: string): void {
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
}

export function insertText(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}

// Heading cycle: H1 → H2 → H3 → no-prefix → H1 (§13.5 #8).
const HEADING_PREFIXES = ["# ", "## ", "### "] as const;

export function cycleHeading(view: EditorView): void {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const text = line.text;

  let currentIdx = -1;
  for (let i = 0; i < HEADING_PREFIXES.length; i++) {
    if (text.startsWith(HEADING_PREFIXES[i])) {
      currentIdx = i;
      break;
    }
  }

  const stripLen = currentIdx >= 0 ? HEADING_PREFIXES[currentIdx].length : 0;
  const nextIdx = currentIdx + 1;
  const nextPrefix = nextIdx < HEADING_PREFIXES.length ? HEADING_PREFIXES[nextIdx] : "";

  view.dispatch({
    changes: { from: line.from, to: line.from + stripLen, insert: nextPrefix },
  });
  view.focus();
}

// Detect if the inline mark (e.g. "**" for bold) wraps the current cursor or selection.
export function isInlineMarkActive(view: EditorView, mark: string): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const before = text.slice(Math.max(0, from - mark.length), from);
  const after = text.slice(to, to + mark.length);
  return before === mark && after === mark;
}
