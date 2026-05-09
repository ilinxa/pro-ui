"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type HTMLAttributes,
} from "react";
import { isPdfFile } from "../lib/normalize-source";

interface UsePdfDropArgs {
  enabled: boolean;
  onPdfDropped: (file: File) => void;
  onNonPdfDropped?: () => void;
}

export interface UsePdfDropReturn {
  isDragging: boolean;
  dropProps: Pick<
    HTMLAttributes<HTMLElement>,
    "onDragEnter" | "onDragOver" | "onDragLeave" | "onDrop"
  >;
}

/**
 * Drag-drop a PDF onto the viewer. Tracks an `isDragging` flag with
 * counter-based dragenter/leave so nested children don't flicker the overlay.
 *
 * `isDragging` is gated by `enabled` at read time, so flipping `enabled` to
 * false while a drag is in progress hides the overlay without needing to
 * imperatively reset state in an effect.
 */
export function usePdfDrop(args: UsePdfDropArgs): UsePdfDropReturn {
  const { enabled, onPdfDropped, onNonPdfDropped } = args;
  const [isDraggingState, setIsDragging] = useState(false);
  const counterRef = useRef(0);
  const isDragging = enabled && isDraggingState;

  const onDragEnter = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!e.dataTransfer.types.includes("Files")) return;
      counterRef.current += 1;
      if (counterRef.current === 1) setIsDragging(true);
    },
    [enabled],
  );

  const onDragOver = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [enabled],
  );

  const onDragLeave = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!e.dataTransfer.types.includes("Files")) return;
      counterRef.current = Math.max(0, counterRef.current - 1);
      if (counterRef.current === 0) setIsDragging(false);
    },
    [enabled],
  );

  const onDrop = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      e.preventDefault();
      counterRef.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      const pdf = files.find(isPdfFile);
      if (pdf) {
        onPdfDropped(pdf);
      } else if (files.length > 0) {
        onNonPdfDropped?.();
      }
    },
    [enabled, onPdfDropped, onNonPdfDropped],
  );

  return useMemo(
    () => ({
      isDragging,
      dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
    }),
    [isDragging, onDragEnter, onDragOver, onDragLeave, onDrop],
  );
}
