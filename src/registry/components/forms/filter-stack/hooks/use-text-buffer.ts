"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TextBufferApi {
  buffer: Record<string, string>;
  setBuffer: (id: string, value: string, debounceMs: number) => void;
  flush: (id: string) => void;
  cancel: (id: string) => void;
  flushAll: () => void;
  cancelAll: () => void;
}

type CommitText = (id: string, value: string) => void;

export function useTextBuffer(commitText: CommitText): TextBufferApi {
  const [buffer, setBufferState] = useState<Record<string, string>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingRef = useRef<Record<string, string>>({});
  const commitTextRef = useRef(commitText);

  useEffect(() => {
    commitTextRef.current = commitText;
  });

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of Object.keys(timers)) clearTimeout(timers[id]);
    };
  }, []);

  const clearBufferEntry = useCallback((id: string) => {
    setBufferState((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const cancel = useCallback(
    (id: string) => {
      const timer = timersRef.current[id];
      if (timer) {
        clearTimeout(timer);
        delete timersRef.current[id];
      }
      delete pendingRef.current[id];
      clearBufferEntry(id);
    },
    [clearBufferEntry],
  );

  const flush = useCallback((id: string) => {
    const timer = timersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timersRef.current[id];
    }
    const value = pendingRef.current[id];
    if (value !== undefined) {
      delete pendingRef.current[id];
      commitTextRef.current(id, value);
    }
  }, []);

  const setBuffer = useCallback(
    (id: string, value: string, debounceMs: number) => {
      pendingRef.current[id] = value;
      setBufferState((prev) => ({ ...prev, [id]: value }));
      const existing = timersRef.current[id];
      if (existing) clearTimeout(existing);
      timersRef.current[id] = setTimeout(() => {
        delete timersRef.current[id];
        const pending = pendingRef.current[id];
        if (pending === undefined) return;
        delete pendingRef.current[id];
        commitTextRef.current(id, pending);
      }, debounceMs);
    },
    [],
  );

  const flushAll = useCallback(() => {
    for (const id of Object.keys(timersRef.current)) flush(id);
  }, [flush]);

  const cancelAll = useCallback(() => {
    for (const id of Object.keys(timersRef.current)) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    pendingRef.current = {};
    setBufferState({});
  }, []);

  return { buffer, setBuffer, flush, cancel, flushAll, cancelAll };
}
