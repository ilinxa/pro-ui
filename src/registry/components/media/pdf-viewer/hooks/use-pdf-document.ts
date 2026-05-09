"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { NormalizedPdfSource } from "../lib/normalize-source";

export type PdfDocumentStatus =
  | "idle"
  | "loading"
  | "password"
  | "ready"
  | "error";

export interface UsePdfDocumentArgs {
  source: NormalizedPdfSource | null;
  password?: string;
}

export interface PdfDocumentCallbacks {
  onLoadSuccess: (pdf: PDFDocumentProxy) => void;
  onLoadError: (error: Error) => void;
  onSourceError: (error: Error) => void;
  onPassword: (callback: (password: string) => void, reason: number) => void;
}

export interface UsePdfDocumentReturn {
  status: PdfDocumentStatus;
  pdfDocument: PDFDocumentProxy | null;
  error: Error | null;
  numPages: number;
  passwordAttempts: number;
  documentCallbacks: PdfDocumentCallbacks;
  submitPassword: (password: string) => void;
  cancelPassword: () => void;
  retry: () => void;
}

/**
 * Tracks the load lifecycle of a PDF document. The actual loading is done by
 * react-pdf's <Document> component (which natively handles all source shapes
 * — string URL / File / Blob / ArrayBuffer / { data } / { url } objects).
 * This hook returns callbacks to wire into <Document> and exposes the
 * resulting status as a discriminated state.
 */
export function usePdfDocument(args: UsePdfDocumentArgs): UsePdfDocumentReturn {
  const { source, password } = args;

  const [status, setStatus] = useState<PdfDocumentStatus>(
    source == null ? "idle" : "loading",
  );
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [retryToken, setRetryToken] = useState(0);
  const passwordCallbackRef = useRef<((password: string) => void) | null>(null);

  // React 19 pattern — reset state when source or retryToken changes.
  // setState during render is the recommended way to derive state from props.
  // See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [trackedKey, setTrackedKey] = useState<{
    source: NormalizedPdfSource | null;
    retryToken: number;
  }>({ source, retryToken });
  if (trackedKey.source !== source || trackedKey.retryToken !== retryToken) {
    setTrackedKey({ source, retryToken });
    setPdfDocument(null);
    setError(null);
    setPasswordAttempts(0);
    setStatus(source == null ? "idle" : "loading");
  }

  // Clear the password callback ref when the tracked key changes — the old
  // callback belongs to a stale loadingTask and should not be invoked.
  useEffect(() => {
    passwordCallbackRef.current = null;
  }, [trackedKey]);

  const handleLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    setPdfDocument(pdf);
    setError(null);
    setStatus("ready");
  }, []);

  const handleLoadError = useCallback((err: Error) => {
    setError(err);
    setStatus("error");
  }, []);

  const handleSourceError = useCallback((err: Error) => {
    setError(err);
    setStatus("error");
  }, []);

  const handlePassword = useCallback(
    (callback: (password: string) => void, reason: number) => {
      passwordCallbackRef.current = callback;
      // pdf.js PasswordResponses: NEED_PASSWORD = 1, INCORRECT_PASSWORD = 2
      const isIncorrect = reason === 2;
      if (password && !isIncorrect) {
        callback(password);
        passwordCallbackRef.current = null;
        return;
      }
      if (isIncorrect) {
        setPasswordAttempts((n) => n + 1);
        setError(new Error("Incorrect password"));
      } else {
        setError(null);
      }
      setStatus("password");
    },
    [password],
  );

  const submitPassword = useCallback((p: string) => {
    const cb = passwordCallbackRef.current;
    if (cb) {
      cb(p);
      passwordCallbackRef.current = null;
    }
  }, []);

  const cancelPassword = useCallback(() => {
    passwordCallbackRef.current = null;
    setError(new Error("Password required to view this PDF."));
    setStatus("error");
  }, []);

  const retry = useCallback(() => {
    setRetryToken((n) => n + 1);
  }, []);

  return {
    status,
    pdfDocument,
    error,
    numPages: pdfDocument?.numPages ?? 0,
    passwordAttempts,
    documentCallbacks: {
      onLoadSuccess: handleLoadSuccess,
      onLoadError: handleLoadError,
      onSourceError: handleSourceError,
      onPassword: handlePassword,
    },
    submitPassword,
    cancelPassword,
    retry,
  };
}
