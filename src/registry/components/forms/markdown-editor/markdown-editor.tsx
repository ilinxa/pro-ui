"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { Extension } from "@codemirror/state";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useCodeMirror } from "./hooks/use-codemirror";
import { useViewMode } from "./hooks/use-view-mode";
import {
  useToolbarStore,
  useToolbarVersion,
} from "./hooks/use-toolbar-state";
import { useMarkdownEditorHandle } from "./hooks/use-imperative-handle";
import { Toolbar } from "./parts/toolbar";
import { ViewToggle } from "./parts/view-toggle";
import { EditorPane } from "./parts/editor-pane";
import { PreviewPane } from "./parts/preview-pane";
import { defaultMarkdownToolbar } from "./default-toolbar";
import { parseMarkdown } from "./lib/parse-markdown";
import {
  insertText as insertTextAction,
  toggleLinePrefix as toggleLinePrefixAction,
  wrapSelection as wrapSelectionAction,
} from "./lib/toolbar-actions";
import type {
  KindMeta,
  MarkdownEditorProps,
  ToolbarCtx,
  WikilinkCandidate,
} from "./types";

const EMPTY_EXTENSIONS: ReadonlyArray<Extension> = [];

export function MarkdownEditor<TCandidate extends WikilinkCandidate = WikilinkCandidate>(
  props: MarkdownEditorProps<TCandidate>,
) {
  const {
    value,
    onChange,
    readOnly = false,
    view: viewProp,
    onViewChange,
    initialView = "edit",
    showPreviewToggle = true,
    wikilinkCandidates,
    onWikilinkClick,
    kinds,
    toolbar,
    extensions,
    onSave,
    ariaLabel,
    className,
    minHeight,
    maxHeight,
    ref,
    id,
  } = props;

  // Stable refs holding latest callbacks (post-commit update — read by CM6 extensions
  // captured at mount time so prop changes flow through without reconfiguring the stack).
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef<typeof onSave>(onSave);
  const kindsRef = useRef<Record<string, KindMeta> | undefined>(kinds);
  const onWikilinkClickRef = useRef<typeof onWikilinkClick>(onWikilinkClick);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
    kindsRef.current = kinds;
    onWikilinkClickRef.current = onWikilinkClick;
  });

  // Toolbar external store — bumped by CM6 update listener on selection or doc changes.
  const toolbarStore = useToolbarStore();
  const onRelevantUpdateRef = useRef<(() => void) | undefined>(toolbarStore.notify);
  useEffect(() => {
    onRelevantUpdateRef.current = toolbarStore.notify;
  }, [toolbarStore]);

  const userExtensions = extensions ?? EMPTY_EXTENSIONS;

  const { view, setContainer } = useCodeMirror({
    value,
    readOnly,
    wikilinkCandidates,
    userExtensions,
    onChangeRef,
    onSaveRef,
    kindsRef,
    onRelevantUpdateRef,
    ariaLabel,
  });

  const { viewValue, handleViewChange, toggleHidden } = useViewMode({
    view: viewProp,
    onViewChange,
    initialView,
    showPreviewToggle,
  });

  // Subscribe to toolbar updates — re-renders toolbar buttons on selection/doc changes.
  useToolbarVersion(toolbarStore);

  // Preview HTML — useDeferredValue keeps typing fluid; parse runs at low priority.
  const deferredValue = useDeferredValue(value);
  const hasClickHandler = Boolean(onWikilinkClick);
  const html = useMemo(
    () =>
      parseMarkdown(deferredValue, {
        wikilinkCandidates,
        kinds,
        hasClickHandler,
      }),
    [deferredValue, wikilinkCandidates, kinds, hasClickHandler],
  );

  // Build ToolbarCtx from current view — recomputed on render (cheap; closures over view).
  const ctx: ToolbarCtx | null = view
    ? {
        view,
        value: view.state.doc.toString(),
        insertText: (text) => insertTextAction(view, text),
        wrapSelection: (before, after) => wrapSelectionAction(view, before, after),
        toggleLinePrefix: (prefix) => toggleLinePrefixAction(view, prefix),
      }
    : null;

  const showToolbar = toolbar !== false;
  const items = toolbar === undefined || toolbar === false ? defaultMarkdownToolbar : toolbar;
  const showEditor = viewValue !== "preview";
  const showPreview = viewValue !== "edit";

  // Imperative handle wiring (Q-P10 ref-as-prop pattern).
  useMarkdownEditorHandle({ ref, view });

  // Onclick handler for preview wikilinks reads onWikilinkClickRef so prop changes
  // flow through without re-binding the stable click delegation.
  const handlePreviewWikilinkClick = useMemo(
    () => (target: string) => {
      onWikilinkClickRef.current?.(target);
    },
    [],
  );

  return (
    <TooltipProvider>
      <div
        id={id}
        role="group"
        aria-label={ariaLabel ?? "Markdown editor"}
        className={cn("markdown-editor flex flex-col", className)}
      >
        {(showToolbar || !toggleHidden) && (
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-2",
              showToolbar
                ? "rounded-t-md border border-b-0 border-border bg-card px-2 py-1.5"
                : null,
            )}
          >
            {showToolbar && ctx ? (
              <Toolbar
                items={items}
                ctx={ctx}
                disabled={readOnly || viewValue === "preview"}
                className="border-0 bg-transparent p-0"
              />
            ) : showToolbar ? (
              // Pre-mount placeholder so layout doesn't shift when CM6 attaches.
              <div className="h-7" aria-hidden />
            ) : null}
            {!toggleHidden && (
              <ViewToggle value={viewValue} onChange={handleViewChange} />
            )}
          </div>
        )}

        <div
          className={cn(
            "@container flex min-h-0 overflow-hidden rounded-b-md border border-border",
            !showToolbar && toggleHidden && "rounded-t-md",
            viewValue === "split"
              ? "flex-col @[480px]:flex-row @[480px]:gap-0"
              : "flex-col",
          )}
        >
          {showEditor && (
            <EditorPane
              setContainer={setContainer}
              minHeight={minHeight}
              maxHeight={maxHeight}
              className={cn(
                viewValue === "split" && "@[480px]:border-r @[480px]:border-border",
              )}
            />
          )}
          {showPreview && (
            <PreviewPane
              html={html}
              onWikilinkClick={hasClickHandler ? handlePreviewWikilinkClick : undefined}
              minHeight={minHeight}
              maxHeight={maxHeight}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
