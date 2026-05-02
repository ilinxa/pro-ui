"use client";

import {
  Bold,
  Code,
  Highlighter,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import {
  BoldPlugin,
  CodePlugin,
  HighlightPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import { LinkPlugin } from "@platejs/link/react";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useEditorRef, useEditorSelection } from "platejs/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkButton } from "./toolbar-buttons";

function getSelectionRect(): DOMRect | null {
  if (typeof window === "undefined") return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  // Selection-near-empty case (collapsed-but-not-collapsed): width 0
  if (rect.width === 0 && rect.height === 0) return null;
  return rect;
}

export function FloatingToolbar() {
  const editor = useEditorRef();
  const selection = useEditorSelection();
  const [visible, setVisible] = useState(false);

  const isCollapsed = useMemo(() => {
    if (!selection) return true;
    const a = selection.anchor;
    const f = selection.focus;
    if (a.offset !== f.offset) return false;
    if (JSON.stringify(a.path) !== JSON.stringify(f.path)) return false;
    return true;
  }, [selection]);

  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // Sync the floating-UI reference with the live window selection.
  // setVisible() inside an effect is unavoidable here: the source of truth is
  // a DOM-level Selection that React doesn't track. The rule is meant for
  // derived-state sync; this is genuine external-system subscription.
  useEffect(() => {
    if (isCollapsed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }
    const update = () => {
      const rect = getSelectionRect();
      if (!rect) {
        setVisible(false);
        return;
      }
      refs.setReference({
        getBoundingClientRect: () => rect,
        contextElement: undefined,
      });
      setVisible(true);
    };
    update();

    // Re-poll on scroll / resize so the toolbar stays attached to selection.
    document.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isCollapsed, refs, selection]);

  const handleAddLink = useCallback(() => {
    const url = window.prompt("Link URL");
    if (!url) return;
    editor.tf.insertNodes({
      type: LinkPlugin.key,
      url,
      children: [{ text: window.getSelection()?.toString() || url }],
    });
    editor.tf.focus();
  }, [editor]);

  if (!visible || isCollapsed) return null;

  return (
    <div
      // floating-ui's setFloating is a stable ref-callback, not a `.current`
      // access. Lint can't tell the difference.
      // eslint-disable-next-line react-hooks/refs
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-50 flex items-center gap-0.5 rounded-md border border-border bg-card px-1 py-0.5 shadow-lg"
      role="toolbar"
      aria-label="Selection actions"
      onMouseDown={(e) => e.preventDefault()}
    >
      <MarkButton nodeType={BoldPlugin.key} icon={Bold} label="Bold" size="sm" />
      <MarkButton nodeType={ItalicPlugin.key} icon={Italic} label="Italic" size="sm" />
      <MarkButton nodeType={UnderlinePlugin.key} icon={UnderlineIcon} label="Underline" size="sm" />
      <MarkButton nodeType={StrikethroughPlugin.key} icon={Strikethrough} label="Strikethrough" size="sm" />
      <MarkButton nodeType={CodePlugin.key} icon={Code} label="Inline code" size="sm" />
      <MarkButton nodeType={HighlightPlugin.key} icon={Highlighter} label="Highlight" size="sm" />
      <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title="Insert link"
        aria-label="Insert link"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleAddLink}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

