"use client";

import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  KbdPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
  FontFamilyPlugin,
  FontSizePlugin,
} from "@platejs/basic-styles/react";
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from "@platejs/code-block/react";
import { IndentPlugin } from "@platejs/indent/react";
import { LinkPlugin } from "@platejs/link/react";
import { ListPlugin } from "@platejs/list/react";
import { ImagePlugin, MediaEmbedPlugin } from "@platejs/media/react";
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@platejs/table/react";
import { ParagraphPlugin } from "platejs/react";

import {
  BlockquoteElement,
  CodeBlockElement,
  CodeLineElement,
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  HrElement,
  ImageElement,
  LinkElement,
  ListElement,
  MediaEmbedElement,
  ParagraphElement,
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from "../parts/element-renderers";
import {
  CodeLeaf,
  HighlightLeaf,
  KbdLeaf,
} from "../parts/leaf-renderers";

/**
 * The plugin set for the editor side.
 * The viewer reuses these plugin definitions via createSlateEditor + components map
 * (see article-body-viewer.tsx) so element/leaf rendering stays consistent.
 */
export const articleBodyPlugins = [
  // Blocks
  ParagraphPlugin.withComponent(ParagraphElement),
  H1Plugin.withComponent(H1Element),
  H2Plugin.withComponent(H2Element),
  H3Plugin.withComponent(H3Element),
  H4Plugin.withComponent(H4Element),
  BlockquotePlugin.withComponent(BlockquoteElement),
  HorizontalRulePlugin.withComponent(HrElement),

  // Lists
  ListPlugin.withComponent(ListElement),

  // Code blocks
  CodeBlockPlugin.withComponent(CodeBlockElement),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin,

  // Tables
  TablePlugin.withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),

  // Media
  ImagePlugin.withComponent(ImageElement),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),

  // Inline
  LinkPlugin.withComponent(LinkElement),

  // Marks
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin.withComponent(CodeLeaf),
  HighlightPlugin.withComponent(HighlightLeaf),
  SubscriptPlugin,
  SuperscriptPlugin,
  KbdPlugin.withComponent(KbdLeaf),

  // Styles (text-level attributes — no element component)
  FontFamilyPlugin,
  FontSizePlugin,
  FontColorPlugin,
  FontBackgroundColorPlugin,

  // Layout
  IndentPlugin.configure({
    inject: {
      targetPlugins: [
        ParagraphPlugin.key,
        H1Plugin.key,
        H2Plugin.key,
        H3Plugin.key,
        H4Plugin.key,
        BlockquotePlugin.key,
        CodeBlockPlugin.key,
      ],
    },
  }),
];
