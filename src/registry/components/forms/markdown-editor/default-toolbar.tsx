import { Bold, Code, Heading, Italic, Link, List, ListOrdered, Quote } from "lucide-react";
import { cycleHeading, isInlineMarkActive } from "./lib/toolbar-actions";
import type { ToolbarItem } from "./types";

// Default markdown toolbar — 8 built-in items + 1 separator between link and lists (Q-P4 + §13.5 #7).
// Hosts spread + extend per description §6.2.
export const defaultMarkdownToolbar: ReadonlyArray<ToolbarItem> = [
  {
    id: "bold",
    label: "Bold",
    icon: <Bold />,
    shortcut: "⌘B",
    isActive: (ctx) => isInlineMarkActive(ctx.view, "**"),
    run: (ctx) => ctx.wrapSelection("**", "**"),
  },
  {
    id: "italic",
    label: "Italic",
    icon: <Italic />,
    shortcut: "⌘I",
    run: (ctx) => ctx.wrapSelection("*", "*"),
  },
  {
    id: "code",
    label: "Inline code",
    icon: <Code />,
    shortcut: "⌘E",
    isActive: (ctx) => isInlineMarkActive(ctx.view, "`"),
    run: (ctx) => ctx.wrapSelection("`", "`"),
  },
  {
    id: "link",
    label: "Link",
    icon: <Link />,
    shortcut: "⌘K",
    run: (ctx) => {
      const { from, to } = ctx.view.state.selection.main;
      const selectedText = ctx.view.state.sliceDoc(from, to);
      const before = `[${selectedText}](`;
      const placeholder = "url";
      const after = ")";
      const insertStart = from + before.length;
      ctx.view.dispatch({
        changes: { from, to, insert: `${before}${placeholder}${after}` },
        selection: { anchor: insertStart, head: insertStart + placeholder.length },
      });
      ctx.view.focus();
    },
  },
  { id: "sep-1", label: "", run: () => {} },
  {
    id: "bullet-list",
    label: "Bullet list",
    icon: <List />,
    run: (ctx) => ctx.toggleLinePrefix("- "),
  },
  {
    id: "numbered-list",
    label: "Numbered list",
    icon: <ListOrdered />,
    run: (ctx) => ctx.toggleLinePrefix("1. "),
  },
  {
    id: "blockquote",
    label: "Blockquote",
    icon: <Quote />,
    run: (ctx) => ctx.toggleLinePrefix("> "),
  },
  {
    id: "heading",
    label: "Heading",
    icon: <Heading />,
    run: (ctx) => cycleHeading(ctx.view),
  },
];
