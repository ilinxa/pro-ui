"use client";

import { useCallback, useState } from "react";

const MAX_HISTORY = 50;

interface UseNavigationHistoryArgs {
  enableHistory: boolean;
  controlledBack?: string[];
  controlledForward?: string[];
}

export interface UseNavigationHistoryResult {
  backIds: string[];
  forwardIds: string[];
  /** Push the *previous* folder onto the back stack when a fresh navigation happens. */
  pushVisit: (previousFolderId: string | null) => void;
  /** Pop the back stack; returns the destination id (or `undefined` if empty). */
  popBack: (currentFolderId: string | null) => string | null | undefined;
  /** Pop the forward stack; returns the destination id (or `undefined` if empty). */
  popForward: (currentFolderId: string | null) => string | null | undefined;
}

const ROOT_SENTINEL = "__root__";
const encode = (id: string | null): string =>
  id === null ? ROOT_SENTINEL : id;
const decode = (s: string | undefined): string | null | undefined =>
  s === undefined ? undefined : s === ROOT_SENTINEL ? null : s;

export function useNavigationHistory(
  args: UseNavigationHistoryArgs,
): UseNavigationHistoryResult {
  const { enableHistory, controlledBack, controlledForward } = args;

  const [internalBack, setInternalBack] = useState<string[]>([]);
  const [internalForward, setInternalForward] = useState<string[]>([]);

  const backIds =
    controlledBack ?? (enableHistory ? internalBack : []);
  const forwardIds =
    controlledForward ?? (enableHistory ? internalForward : []);

  const pushVisit = useCallback(
    (previousFolderId: string | null) => {
      if (!enableHistory) return;
      if (controlledBack) return;
      setInternalBack((prev) => {
        const next = [...prev, encode(previousFolderId)];
        if (next.length > MAX_HISTORY)
          next.splice(0, next.length - MAX_HISTORY);
        return next;
      });
      setInternalForward([]);
    },
    [enableHistory, controlledBack],
  );

  const popBack = useCallback(
    (currentFolderId: string | null): string | null | undefined => {
      if (!enableHistory) return undefined;
      if (controlledBack) return undefined;
      if (internalBack.length === 0) return undefined;
      const previous = decode(internalBack[internalBack.length - 1]);
      setInternalBack(internalBack.slice(0, -1));
      setInternalForward([...internalForward, encode(currentFolderId)]);
      return previous;
    },
    [enableHistory, controlledBack, internalBack, internalForward],
  );

  const popForward = useCallback(
    (currentFolderId: string | null): string | null | undefined => {
      if (!enableHistory) return undefined;
      if (controlledForward) return undefined;
      if (internalForward.length === 0) return undefined;
      const next = decode(internalForward[internalForward.length - 1]);
      setInternalForward(internalForward.slice(0, -1));
      setInternalBack([...internalBack, encode(currentFolderId)]);
      return next;
    },
    [enableHistory, controlledForward, internalBack, internalForward],
  );

  return { backIds, forwardIds, pushVisit, popBack, popForward };
}
