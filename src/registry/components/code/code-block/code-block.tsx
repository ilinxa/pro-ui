"use client";
import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  CodeBlockProvider,
} from "./hooks/use-code-block-context";
import { useControllableState } from "./hooks/use-controllable-state";
import { useCopyToClipboard } from "./hooks/use-copy-to-clipboard";
import { resolveLang } from "./lib/lang-resolution";
import { joinTerminalLines } from "./lib/terminal-utils";
import { CodeBlockBodyEdit } from "./parts/code-block-body-edit";
import { CodeBlockBodyTerminal } from "./parts/code-block-body-terminal";
import { CodeBlockBodyView } from "./parts/code-block-body-view";
import { CodeBlockCopyButton } from "./parts/code-block-copy-button";
import { CodeBlockDownloadButton } from "./parts/code-block-download-button";
import { CodeBlockExpandButton } from "./parts/code-block-expand-button";
import { CodeBlockExpandModal } from "./parts/code-block-expand-modal";
import { CodeBlockFooter } from "./parts/code-block-footer";
import { CodeBlockHeader } from "./parts/code-block-header";
import { CodeBlockTrafficLights } from "./parts/code-block-traffic-lights";
import { CodeBlockWrapButton } from "./parts/code-block-wrap-button";
import {
  DEFAULT_LABELS,
  type CodeBlockHandle,
  type CodeBlockProps,
} from "./types";

const DEFAULT_THEMES = {
  light: "github-light",
  dark: "github-dark-default",
} as const;

export function CodeBlock(props: CodeBlockProps) {
  const {
    value: valueProp,
    defaultValue,
    lines,
    lang: langProp,
    filename,
    filenameToLang,
    mode = "view",
    readOnly = false,
    streaming = false,
    onChange,
    onSave,
    tabSize = 4,
    editorExtensions,
    header = true,
    showLanguage = true,
    showCopy = true,
    showExpand = false,
    showWrap = false,
    showDownload = false,
    showTrafficLights = false,
    actions,
    renderHeader,
    renderExpandModal,
    footer,
    showLineNumbers,
    wrap: wrapProp,
    highlightedLines,
    annotations,
    renderAnnotation,
    maxLines,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    onWrapChange,
    onLineClick,
    onCopy,
    onDownload,
    themes,
    maxHeight,
    emptyMessage,
    className,
    style,
    ariaLabel,
    labels: labelsProp,
    ref,
  } = props;

  // Resolved values
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...(labelsProp ?? {}) }),
    [labelsProp],
  );
  const themesResolved = themes ?? DEFAULT_THEMES;
  const lang = useMemo(
    () => resolveLang(langProp, filename, filenameToLang),
    [langProp, filename, filenameToLang],
  );

  const lineDerivedValue = useMemo(() => {
    if (mode === "terminal" && lines) return joinTerminalLines(lines);
    return undefined;
  }, [mode, lines]);

  // Controlled/uncontrolled value for edit mode.
  const [editValue, setEditValueInternal] = useControllableState<string>({
    prop: mode === "edit" ? valueProp : undefined,
    defaultProp: defaultValue ?? valueProp ?? "",
    onChange: (next) => onChange?.({ value: next }),
  });

  const displayValue =
    mode === "edit"
      ? editValue
      : lineDerivedValue !== undefined
        ? lineDerivedValue
        : (valueProp ?? "");

  // Wrap state (controlled or local)
  const [wrap, setWrapInternal] = useControllableState<"wrap" | "scroll">({
    prop: wrapProp,
    defaultProp: wrapProp ?? "scroll",
    onChange: (next) => onWrapChange?.({ wrap: next }),
  });

  // Expanded (collapse) state
  const [expanded, setExpandedInternal] = useControllableState<boolean>({
    prop: expandedProp,
    defaultProp: defaultExpanded ?? false,
    onChange: (next) => onExpandedChange?.({ expanded: next }),
  });

  const [modalOpen, setModalOpen] = useState(false);

  // Line numbers default per mode
  const resolvedShowLineNumbers =
    showLineNumbers !== undefined
      ? showLineNumbers
      : mode === "edit"
        ? true
        : false;

  // Copy
  const { copy: copyToClipboard, copied, failed: copyFailed } = useCopyToClipboard();
  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(displayValue);
    if (ok) onCopy?.({ value: displayValue });
    return ok;
  }, [copyToClipboard, displayValue, onCopy]);

  // Download
  const handleDownload = useCallback(() => {
    const resolvedFilename = filename ?? `code.${lang === "plaintext" ? "txt" : lang}`;
    if (onDownload) {
      onDownload({ value: displayValue, filename: resolvedFilename });
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const blob = new Blob([displayValue], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resolvedFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Soft-fail; download is best-effort.
    }
  }, [displayValue, filename, lang, onDownload]);

  // Imperative handle wired to body refs
  const editorImperativeRef = useRef<{
    focus: () => void;
    getValue: () => string;
  } | null>(null);

  const handle = useMemo<CodeBlockHandle>(
    () => ({
      copy: handleCopy,
      focus: () => editorImperativeRef.current?.focus(),
      getValue: () =>
        mode === "edit"
          ? (editorImperativeRef.current?.getValue() ?? editValue)
          : displayValue,
      scrollToLine: () => {
        // v0.1.0: best-effort no-op; reserved for v0.2 CodeMirror integration.
      },
    }),
    [handleCopy, displayValue, editValue, mode],
  );

  useImperativeHandle(ref, () => handle, [handle]);

  // Context value
  const ctxValue = useMemo(
    () => ({
      value: displayValue,
      filename,
      lang,
      resolvedLang: lang,
      mode,
      streaming,
      wrap,
      showLineNumbers: resolvedShowLineNumbers,
      expanded,
      setExpanded: setExpandedInternal,
      setWrap: setWrapInternal,
      modalOpen,
      setModalOpen,
      labels,
      copy: handleCopy,
      copied,
      copyFailed,
      download: handleDownload,
      handle,
    }),
    [
      displayValue,
      filename,
      lang,
      mode,
      streaming,
      wrap,
      resolvedShowLineNumbers,
      expanded,
      setExpandedInternal,
      setWrapInternal,
      modalOpen,
      labels,
      handleCopy,
      copied,
      copyFailed,
      handleDownload,
      handle,
    ],
  );

  // Resolved aria-label
  const resolvedAriaLabel =
    ariaLabel ??
    (filename
      ? `Code block — ${filename}`
      : `Code block — ${lang === "plaintext" ? "text" : lang}`);

  const body = (() => {
    if (mode === "edit") {
      return (
        <CodeBlockBodyEdit
          value={editValue}
          lang={lang}
          readOnly={readOnly}
          wrap={wrap}
          tabSize={tabSize}
          showLineNumbers={resolvedShowLineNumbers}
          onChange={(v) => setEditValueInternal(v)}
          onSave={onSave ? (v) => onSave({ value: v }) : undefined}
          editorExtensions={editorExtensions}
          maxHeight={maxHeight}
          registerImperative={(h) => {
            editorImperativeRef.current = h;
          }}
        />
      );
    }
    if (mode === "terminal") {
      return (
        <CodeBlockBodyTerminal
          value={valueProp ?? ""}
          lines={lines}
          wrap={wrap}
          streaming={streaming}
          emptyMessage={emptyMessage}
          maxHeight={maxHeight}
        />
      );
    }
    return (
      <CodeBlockBodyView
        value={valueProp ?? ""}
        lang={lang}
        themes={themesResolved}
        highlightedLines={highlightedLines}
        annotations={annotations}
        renderAnnotation={renderAnnotation}
        showLineNumbers={resolvedShowLineNumbers}
        wrap={wrap}
        streaming={streaming}
        expanded={expanded}
        maxLines={maxLines}
        emptyMessage={emptyMessage}
        maxHeight={maxHeight}
        onLineClick={onLineClick}
      />
    );
  })();

  // Header — either the default orchestrator or the renderHeader slot.
  const headerNode = (() => {
    if (header === false) return null;
    if (renderHeader) {
      const headerCtx = {
        filename,
        lang,
        copyButton: showCopy ? <CodeBlockCopyButton /> : (null as never),
        expandButton: showExpand ? <CodeBlockExpandButton /> : null,
        wrapButton: showWrap ? <CodeBlockWrapButton /> : null,
        downloadButton: showDownload ? <CodeBlockDownloadButton /> : null,
        trafficLights: showTrafficLights ? <CodeBlockTrafficLights /> : null,
        actions: actions ?? null,
      };
      return <>{renderHeader(headerCtx)}</>;
    }
    return (
      <CodeBlockHeader
        showLanguage={showLanguage}
        showCopy={showCopy}
        showExpand={showExpand}
        showWrap={showWrap}
        showDownload={showDownload}
        showTrafficLights={showTrafficLights}
        actions={actions}
      />
    );
  })();

  // Modal body — same instance with expand off + maxLines undefined.
  const expandedInner = (
    <CodeBlock
      {...props}
      header={true}
      showExpand={false}
      maxLines={undefined}
      maxHeight={undefined}
      className="rounded-none border-0 shadow-none"
    />
  );

  const modalNode = (() => {
    if (!showExpand) return null;
    if (renderExpandModal) {
      return renderExpandModal({
        open: modalOpen,
        onOpenChange: setModalOpen,
        code: expandedInner,
      });
    }
    return (
      <CodeBlockExpandModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={filename ?? lang}
      >
        {expandedInner}
      </CodeBlockExpandModal>
    );
  })();

  return (
    <CodeBlockProvider value={ctxValue}>
      <TooltipProvider delayDuration={300}>
        <section
          role="region"
          aria-label={resolvedAriaLabel}
          className={cn(
            "code-block group relative overflow-hidden rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm",
            className,
          )}
          style={style}
        >
          {headerNode}
          {body}
          {footer ? <CodeBlockFooter>{footer}</CodeBlockFooter> : null}
        </section>
        {modalNode}
      </TooltipProvider>
    </CodeBlockProvider>
  );
}

CodeBlock.displayName = "CodeBlock";
