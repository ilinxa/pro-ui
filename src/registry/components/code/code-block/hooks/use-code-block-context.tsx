"use client";
import { createContext, useContext, type ReactNode } from "react";
import type {
  CodeBlockHandle,
  CodeBlockLabels,
  CodeBlockWrap,
} from "../types";

interface CodeBlockContextValue {
  value: string;
  filename: string | undefined;
  lang: string;
  resolvedLang: string;
  mode: "view" | "edit" | "terminal";
  streaming: boolean;
  wrap: CodeBlockWrap;
  showLineNumbers: boolean;
  expanded: boolean;
  setExpanded: (next: boolean) => void;
  setWrap: (next: CodeBlockWrap) => void;
  modalOpen: boolean;
  setModalOpen: (next: boolean) => void;
  labels: Required<CodeBlockLabels>;
  copy: () => Promise<boolean>;
  copied: boolean;
  copyFailed: boolean;
  download: () => void;
  handle: CodeBlockHandle;
}

const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

export function CodeBlockProvider({
  value,
  children,
}: {
  value: CodeBlockContextValue;
  children: ReactNode;
}) {
  return (
    <CodeBlockContext.Provider value={value}>{children}</CodeBlockContext.Provider>
  );
}

export function useCodeBlock(): CodeBlockContextValue {
  const ctx = useContext(CodeBlockContext);
  if (!ctx) {
    throw new Error(
      "[CodeBlock] useCodeBlock must be called inside <CodeBlock>. " +
        "Header parts (<CodeBlockHeader>, <CodeBlockCopyButton>, etc.) must " +
        "be composed inside a <CodeBlock> or its renderHeader slot.",
    );
  }
  return ctx;
}
