"use client";

import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Table as TableIcon,
  TerminalSquare,
  Underline as UnderlineIcon,
} from "lucide-react";
import {
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import { type ComponentType, type ReactNode, useCallback } from "react";
import { CodeBlockPlugin } from "@platejs/code-block/react";
import { LinkPlugin } from "@platejs/link/react";
import { ListPlugin } from "@platejs/list/react";
import { ImagePlugin } from "@platejs/media/react";
import { TablePlugin } from "@platejs/table/react";
import { ParagraphPlugin, useEditorRef } from "platejs/react";
import { cn } from "@/lib/utils";
import type { ImageUploader } from "../types";
import { BlockButton, MarkButton, useBlockToggle } from "./toolbar-buttons";

function HeadingButton({
  blockType,
  icon,
  label,
}: {
  blockType: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  const { isActive, toggle } = useBlockToggle(blockType);
  return <BlockButton isActive={isActive} onActivate={toggle} icon={icon} label={label} />;
}

function InsertHrButton() {
  const editor = useEditorRef();
  const handleClick = useCallback(() => {
    editor.tf.insertNodes({
      type: HorizontalRulePlugin.key,
      children: [{ text: "" }],
    });
    editor.tf.focus();
  }, [editor]);
  return (
    <BlockButton
      isActive={false}
      onActivate={handleClick}
      icon={Minus}
      label="Insert horizontal rule"
    />
  );
}

function InsertListButton({ ordered }: { ordered: boolean }) {
  const editor = useEditorRef();
  const handleClick = useCallback(() => {
    editor.tf.insertNodes({
      type: ListPlugin.key,
      listStyleType: ordered ? "decimal" : "disc",
      indent: 1,
      children: [{ text: "" }],
    });
    editor.tf.focus();
  }, [editor, ordered]);
  return (
    <BlockButton
      isActive={false}
      onActivate={handleClick}
      icon={ordered ? ListOrdered : List}
      label={ordered ? "Insert ordered list" : "Insert bullet list"}
    />
  );
}

function InsertTableButton() {
  const editor = useEditorRef();
  const handleClick = useCallback(() => {
    const cell = (text = "") => ({
      type: "td",
      children: [{ type: ParagraphPlugin.key, children: [{ text }] }],
    });
    const headerCell = (text = "") => ({
      type: "th",
      children: [{ type: ParagraphPlugin.key, children: [{ text }] }],
    });
    editor.tf.insertNodes({
      type: TablePlugin.key,
      children: [
        { type: "tr", children: [headerCell("Column 1"), headerCell("Column 2"), headerCell("Column 3")] },
        { type: "tr", children: [cell(), cell(), cell()] },
        { type: "tr", children: [cell(), cell(), cell()] },
      ],
    });
    editor.tf.focus();
  }, [editor]);
  return (
    <BlockButton
      isActive={false}
      onActivate={handleClick}
      icon={TableIcon}
      label="Insert table"
    />
  );
}

function InsertImageButton({ onImageUpload }: { onImageUpload?: ImageUploader }) {
  const editor = useEditorRef();

  const handleClick = useCallback(async () => {
    if (onImageUpload) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const result = await onImageUpload(file);
          editor.tf.insertNodes({
            type: ImagePlugin.key,
            url: result.src,
            alt: result.alt ?? file.name,
            width: result.width,
            height: result.height,
            children: [{ text: "" }],
          });
          editor.tf.focus();
        } catch (err) {
          console.error("Image upload failed", err);
        }
      };
      input.click();
      return;
    }

    const url = window.prompt("Image URL");
    if (!url) return;
    editor.tf.insertNodes({
      type: ImagePlugin.key,
      url,
      children: [{ text: "" }],
    });
    editor.tf.focus();
  }, [editor, onImageUpload]);

  return (
    <BlockButton
      isActive={false}
      onActivate={handleClick}
      icon={ImageIcon}
      label="Insert image"
    />
  );
}

function InsertLinkButton() {
  const editor = useEditorRef();
  const handleClick = useCallback(() => {
    const url = window.prompt("Link URL");
    if (!url) return;
    const text = window.getSelection()?.toString() || url;
    editor.tf.insertNodes({
      type: LinkPlugin.key,
      url,
      children: [{ text }],
    });
    editor.tf.focus();
  }, [editor]);
  return (
    <BlockButton
      isActive={false}
      onActivate={handleClick}
      icon={LinkIcon}
      label="Insert link"
    />
  );
}

function FontFamilySelect() {
  const editor = useEditorRef();
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "default") {
        editor.tf.removeMark("fontFamily");
      } else {
        editor.tf.addMark("fontFamily", value);
      }
      editor.tf.focus();
    },
    [editor]
  );
  return (
    <select
      onMouseDown={(e) => e.preventDefault()}
      onChange={handleChange}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
      title="Font family"
      aria-label="Font family"
      defaultValue="default"
    >
      <option value="default">Default font</option>
      <option value="var(--font-serif)">Serif</option>
      <option value="var(--font-sans)">Sans</option>
      <option value="var(--font-mono)">Mono</option>
    </select>
  );
}

function FontSizeSelect() {
  const editor = useEditorRef();
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "default") {
        editor.tf.removeMark("fontSize");
      } else {
        editor.tf.addMark("fontSize", value);
      }
      editor.tf.focus();
    },
    [editor]
  );
  return (
    <select
      onMouseDown={(e) => e.preventDefault()}
      onChange={handleChange}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
      title="Font size"
      aria-label="Font size"
      defaultValue="default"
    >
      <option value="default">Size</option>
      <option value="12px">12</option>
      <option value="14px">14</option>
      <option value="16px">16</option>
      <option value="18px">18</option>
      <option value="20px">20</option>
      <option value="24px">24</option>
      <option value="32px">32</option>
    </select>
  );
}

function FontColorInput() {
  const editor = useEditorRef();
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      editor.tf.addMark("color", e.target.value);
      editor.tf.focus();
    },
    [editor]
  );
  return (
    <input
      type="color"
      onMouseDown={(e) => e.preventDefault()}
      onChange={handleChange}
      className="h-8 w-8 cursor-pointer rounded-md border border-input bg-background"
      title="Text color"
      aria-label="Text color"
      defaultValue="#000000"
    />
  );
}

function ToolbarSeparator() {
  return <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />;
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

interface EditorToolbarProps {
  className?: string;
  onImageUpload?: ImageUploader;
}

export function EditorToolbar({ className, onImageUpload }: EditorToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Article body editor toolbar"
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border bg-card px-2 py-1.5",
        className
      )}
    >
      <ToolbarGroup>
        <MarkButton nodeType={BoldPlugin.key} icon={Bold} label="Bold" />
        <MarkButton nodeType={ItalicPlugin.key} icon={Italic} label="Italic" />
        <MarkButton nodeType={UnderlinePlugin.key} icon={UnderlineIcon} label="Underline" />
        <MarkButton nodeType={StrikethroughPlugin.key} icon={Strikethrough} label="Strikethrough" />
        <MarkButton nodeType={CodePlugin.key} icon={Code} label="Inline code" />
        <MarkButton nodeType={HighlightPlugin.key} icon={Highlighter} label="Highlight" />
        <MarkButton nodeType={SubscriptPlugin.key} icon={SubIcon} label="Subscript" />
        <MarkButton nodeType={SuperscriptPlugin.key} icon={SupIcon} label="Superscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingButton blockType={H1Plugin.key} icon={Heading1} label="Heading 1" />
        <HeadingButton blockType={H2Plugin.key} icon={Heading2} label="Heading 2" />
        <HeadingButton blockType={H3Plugin.key} icon={Heading3} label="Heading 3" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingButton blockType="blockquote" icon={Quote} label="Blockquote" />
        <HeadingButton blockType={CodeBlockPlugin.key} icon={TerminalSquare} label="Code block" />
        <InsertHrButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <InsertListButton ordered={false} />
        <InsertListButton ordered />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <InsertLinkButton />
        <InsertImageButton onImageUpload={onImageUpload} />
        <InsertTableButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <FontFamilySelect />
        <FontSizeSelect />
        <FontColorInput />
      </ToolbarGroup>
    </div>
  );
}
