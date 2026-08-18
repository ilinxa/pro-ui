import type { ReactNode, Ref } from "react";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

export interface WikilinkCandidate {
  id: string;
  label: string;
  kind?: string;
  alias?: string;
}

export interface KindMeta {
  label: string;
  color?: string;
}

export type ViewMode = "edit" | "preview" | "split";

export interface ToolbarCtx {
  view: EditorView;
  value: string;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after?: string) => void;
  toggleLinePrefix: (prefix: string) => void;
}

export interface ToolbarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  isActive?: (ctx: ToolbarCtx) => boolean;
  /*
   * Optional since v0.2.1. A separator (`label: ""`) is a real `ToolbarItem`
   * that the renderer draws as a divider and never invokes — but `run` was
   * required, so the documented separator idiom told consumers to write
   * `run: () => {}`. That taught the codebase to author empty-bodied public
   * methods, which is the exact shape being eliminated everywhere else.
   * Separators now simply omit it.
   */
  run?: (ctx: ToolbarCtx) => void;
}

export interface MarkdownEditorProps<TCandidate extends WikilinkCandidate = WikilinkCandidate> {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;

  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  initialView?: ViewMode;
  showPreviewToggle?: boolean;

  wikilinkCandidates?: ReadonlyArray<TCandidate>;
  onWikilinkClick?: (target: string) => void;
  kinds?: Record<string, KindMeta>;

  toolbar?: false | ReadonlyArray<ToolbarItem>;

  extensions?: ReadonlyArray<Extension>;

  onSave?: (value: string) => void;

  ariaLabel?: string;
  className?: string;
  placeholder?: string;
  minHeight?: string | number;
  maxHeight?: string | number;

  ref?: Ref<MarkdownEditorHandle>;

  id?: string;
}

export interface MarkdownEditorHandle {
  focus(): void;
  undo(): void;
  redo(): void;
  insertText(text: string): void;
  getSelection(): { from: number; to: number; text: string };
  getValue(): string;
  getView(): EditorView | null;
}
