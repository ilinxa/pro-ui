import type { CSSProperties, ReactNode, Ref } from "react";
import type { Extension } from "@codemirror/state";

// ─── Core enums ──────────────────────────────────────────────────────────────

export type CodeBlockMode = "view" | "edit" | "terminal";

/**
 * Regex engine for the Shiki highlighter (v0.2.0).
 *
 * `"oniguruma"` is WebAssembly-backed and requires `'wasm-unsafe-eval'` in the
 * host's CSP `script-src`; `"javascript"` needs no wasm at all.
 */
export type CodeBlockRegexEngine = "oniguruma" | "javascript";
export type CodeBlockWrap = "wrap" | "scroll";
export type CodeBlockAnnotationType = "info" | "warn" | "error";
export type TerminalLineKind = "input" | "output" | "error";

// ─── Value-shaped types ──────────────────────────────────────────────────────

export interface CodeBlockLineRange {
  from: number;
  to: number;
}

export interface TerminalLine {
  kind: TerminalLineKind;
  text: string;
}

export interface CodeBlockAnnotation {
  line: number;
  type: CodeBlockAnnotationType;
  message: string;
}

export type ShikiThemeObject = {
  name: string;
  type: "light" | "dark";
  [key: string]: unknown;
};

export interface CodeBlockThemes {
  light: string | ShikiThemeObject;
  dark: string | ShikiThemeObject;
}

// ─── Imperative handle ───────────────────────────────────────────────────────

export interface CodeBlockHandle {
  copy: () => Promise<boolean>;
  focus: () => void;
  getValue: () => string;
  scrollToLine: (line: number) => void;
}

// ─── Callback arg shapes (object-shape per F-cross-12) ───────────────────────

export interface CodeBlockChangeArgs {
  value: string;
}
export interface CodeBlockCopyArgs {
  value: string;
}
export interface CodeBlockSaveArgs {
  value: string;
}
export interface CodeBlockDownloadArgs {
  value: string;
  filename: string;
}
export interface CodeBlockLineClickArgs {
  line: number;
}
export interface CodeBlockExpandedChangeArgs {
  expanded: boolean;
}
export interface CodeBlockWrapChangeArgs {
  wrap: CodeBlockWrap;
}
export interface CodeBlockFilenameToLangArgs {
  filename: string;
}

// ─── Slot contexts ───────────────────────────────────────────────────────────

export interface CodeBlockHeaderContext {
  filename: string | undefined;
  lang: string;
  /** `null` when `showCopy` is false (v0.1.2 — widened; was an unsound `null as never`). */
  copyButton: ReactNode | null;
  expandButton: ReactNode | null;
  wrapButton: ReactNode | null;
  downloadButton: ReactNode | null;
  trafficLights: ReactNode | null;
  actions: ReactNode | null;
}

export interface CodeBlockAnnotationRenderArgs {
  annotation: CodeBlockAnnotation;
  defaultMarker: ReactNode;
}

export interface CodeBlockExpandModalContext {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  code: ReactNode;
}

// ─── i18n labels ─────────────────────────────────────────────────────────────

export type CodeBlockLabels = Partial<{
  copy: string;
  copied: string;
  copyFailed: string;
  expand: string;
  wrap: string;
  download: string;
  showMore: string;
  showLess: string;
  streamingCursor: string;
  closeModal: string;
  emptyDefault: string;
  /** Shown when CodeMirror fails to initialise in edit mode (v0.2.0). */
  editorFailed: string;
  /** Recovery control rendered beside `editorFailed` (v0.2.0). */
  reloadAsViewOnly: string;
}>;

export const DEFAULT_LABELS: Required<CodeBlockLabels> = {
  copy: "Copy code",
  copied: "Copied",
  copyFailed: "Copy failed — select and copy manually",
  expand: "Expand",
  wrap: "Toggle wrap",
  download: "Download",
  showMore: "Show all",
  showLess: "Show less",
  streamingCursor: "Streaming",
  closeModal: "Close",
  emptyDefault: "",
  editorFailed: "The editor could not be loaded.",
  reloadAsViewOnly: "Reload as view-only",
};

// ─── Top-level props (client variant) ────────────────────────────────────────

export interface CodeBlockProps {
  // Content
  value?: string;
  lines?: TerminalLine[];
  defaultValue?: string;

  // Language
  lang?: string;
  filename?: string;
  filenameToLang?: (args: CodeBlockFilenameToLangArgs) => string | undefined;

  // Mode
  mode?: CodeBlockMode;
  readOnly?: boolean;
  streaming?: boolean;

  // Edit
  onChange?: (args: CodeBlockChangeArgs) => void;
  onSave?: (args: CodeBlockSaveArgs) => void;
  /**
   * Editor tab size. INITIAL-ONLY (v0.1.2): applied when the CodeMirror
   * editor is created; later changes are not re-applied. Remount the block
   * (React `key`) to change it after mount.
   */
  tabSize?: number;
  /**
   * Extra CodeMirror extensions for edit mode. INITIAL-ONLY (v0.1.2): the
   * array captured at editor creation is baked into the EditorState; identity
   * or content changes after mount are ignored. Remount (React `key`) to swap.
   */
  editorExtensions?: Extension[];

  // Header
  header?: boolean;
  showLanguage?: boolean;
  showCopy?: boolean;
  showExpand?: boolean;
  showWrap?: boolean;
  showDownload?: boolean;
  showTrafficLights?: boolean;
  actions?: ReactNode;
  renderHeader?: (ctx: CodeBlockHeaderContext) => ReactNode;
  renderExpandModal?: (ctx: CodeBlockExpandModalContext) => ReactNode;

  // Footer
  footer?: ReactNode;

  // Body
  showLineNumbers?: boolean;
  wrap?: CodeBlockWrap;
  highlightedLines?: Array<number | CodeBlockLineRange>;
  annotations?: CodeBlockAnnotation[];
  renderAnnotation?: (args: CodeBlockAnnotationRenderArgs) => ReactNode;

  // Collapse
  maxLines?: number;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (args: CodeBlockExpandedChangeArgs) => void;

  // Wrap toggle
  onWrapChange?: (args: CodeBlockWrapChangeArgs) => void;

  // Line click
  onLineClick?: (args: CodeBlockLineClickArgs) => void;

  // Copy + download
  onCopy?: (args: CodeBlockCopyArgs) => void;
  onDownload?: (args: CodeBlockDownloadArgs) => void;

  // Theme
  themes?: CodeBlockThemes;

  /**
   * Regex engine backing the view-mode highlighter (v0.2.0).
   *
   * - `"oniguruma"` (default) — Shiki's WebAssembly engine. Widest grammar
   *   support, and what every 0.1.x consumer already gets.
   * - `"javascript"` — pure-JS engine, **no WebAssembly**. Use it when the host
   *   serves a strict `Content-Security-Policy` without `'wasm-unsafe-eval'`,
   *   where the wasm engine cannot compile at all. Slightly narrower grammar
   *   coverage is the trade.
   *
   * Highlighters are cached per engine, so mixing both on one page is safe.
   */
  regexEngine?: CodeBlockRegexEngine;

  // Sizing
  maxHeight?: number | string;

  // Empty
  emptyMessage?: string;

  // Polymorphic
  className?: string;
  style?: CSSProperties;

  // ARIA
  ariaLabel?: string;

  // i18n
  labels?: CodeBlockLabels;

  // Imperative handle
  ref?: Ref<CodeBlockHandle>;
}

// ─── RSC variant props (typed narrowing) ─────────────────────────────────────

/**
 * RSC-variant props. Compile-time narrowing of CodeBlockProps that removes
 * fields requiring client interactivity. TypeScript rejects mode='edit' and
 * streaming at compile time; the runtime guard in code-block.server.tsx is
 * a backstop for JS consumers.
 */
export type CodeBlockServerProps = Omit<
  CodeBlockProps,
  | "mode"
  | "readOnly"
  | "streaming"
  | "editorExtensions"
  | "onChange"
  | "onSave"
  | "tabSize"
  | "onWrapChange"
  | "showWrap"
  | "expanded"
  | "defaultExpanded"
  | "onExpandedChange"
  | "ref"
> & {
  mode?: "view" | "terminal";
};
