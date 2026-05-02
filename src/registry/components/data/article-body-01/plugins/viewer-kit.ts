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
  StaticBlockquote,
  StaticCodeBlock,
  StaticCodeLeaf,
  StaticCodeLine,
  StaticH1,
  StaticH2,
  StaticH3,
  StaticH4,
  StaticHighlightLeaf,
  StaticHr,
  StaticImage,
  StaticKbdLeaf,
  StaticLink,
  StaticList,
  StaticMediaEmbed,
  StaticParagraph,
  StaticTable,
  StaticTableCell,
  StaticTableCellHeader,
  StaticTableRow,
} from "../static-elements/static-element-renderers";

/**
 * Plugin set for the static (RSC) viewer side.
 * Mirrors editor-kit.ts but binds Slate{Element,Leaf}-based renderers
 * — those don't use client-only hooks, so the viewer is server-renderable.
 */
export const articleBodyViewerPlugins = [
  // Blocks
  ParagraphPlugin.withComponent(StaticParagraph),
  H1Plugin.withComponent(StaticH1),
  H2Plugin.withComponent(StaticH2),
  H3Plugin.withComponent(StaticH3),
  H4Plugin.withComponent(StaticH4),
  BlockquotePlugin.withComponent(StaticBlockquote),
  HorizontalRulePlugin.withComponent(StaticHr),

  // Lists
  ListPlugin.withComponent(StaticList),

  // Code blocks
  CodeBlockPlugin.withComponent(StaticCodeBlock),
  CodeLinePlugin.withComponent(StaticCodeLine),
  CodeSyntaxPlugin,

  // Tables
  TablePlugin.withComponent(StaticTable),
  TableRowPlugin.withComponent(StaticTableRow),
  TableCellPlugin.withComponent(StaticTableCell),
  TableCellHeaderPlugin.withComponent(StaticTableCellHeader),

  // Media
  ImagePlugin.withComponent(StaticImage),
  MediaEmbedPlugin.withComponent(StaticMediaEmbed),

  // Inline
  LinkPlugin.withComponent(StaticLink),

  // Marks
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin.withComponent(StaticCodeLeaf),
  HighlightPlugin.withComponent(StaticHighlightLeaf),
  SubscriptPlugin,
  SuperscriptPlugin,
  KbdPlugin.withComponent(StaticKbdLeaf),

  // Styles
  FontFamilyPlugin,
  FontSizePlugin,
  FontColorPlugin,
  FontBackgroundColorPlugin,
];
