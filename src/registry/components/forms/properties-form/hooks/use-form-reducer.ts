import { useReducer } from "react";
import type { FormAction, FormState } from "../types";

function pruneToKeys<T>(
  source: Record<string, T>,
  keys: ReadonlySet<string>,
): Record<string, T> {
  let changed = false;
  const next: Record<string, T> = {};
  for (const k of Object.keys(source)) {
    if (keys.has(k)) next[k] = source[k];
    else changed = true;
  }
  return changed ? next : source;
}

export function makeInitialState(
  cleanSnapshot: Record<string, unknown>,
): FormState {
  return {
    errors: {},
    formError: undefined,
    pending: false,
    showSpinner: false,
    version: 0,
    cleanVersion: 0,
    cleanSnapshot,
    submitAttempted: false,
    blurredWithError: {},
  };
}

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "field-changed": {
      const liveKeys = new Set(Object.keys(action.nextValues));
      const prunedErrors = pruneToKeys(state.errors, liveKeys);
      const prunedBlurred = pruneToKeys(state.blurredWithError, liveKeys);
      const nextErrors = { ...prunedErrors };
      if (action.error) nextErrors[action.key] = action.error;
      else delete nextErrors[action.key];
      return {
        ...state,
        errors: nextErrors,
        blurredWithError: prunedBlurred,
        version: state.version + 1,
      };
    }
    case "field-blurred": {
      if (!action.error) return state;
      if (state.blurredWithError[action.key]) {
        if (state.errors[action.key] === action.error) return state;
        return {
          ...state,
          errors: { ...state.errors, [action.key]: action.error },
        };
      }
      return {
        ...state,
        errors: { ...state.errors, [action.key]: action.error },
        blurredWithError: { ...state.blurredWithError, [action.key]: true },
      };
    }
    case "submit-started":
      return {
        ...state,
        pending: true,
        showSpinner: false,
        formError: undefined,
        submitAttempted: true,
      };
    case "submit-spinner-show":
      if (!state.pending) return state;
      return { ...state, showSpinner: true };
    case "submit-succeeded":
      return {
        ...state,
        pending: false,
        showSpinner: false,
        errors: {},
        formError: undefined,
        blurredWithError: {},
        cleanSnapshot: action.cleanSnapshot,
        cleanVersion: state.version,
      };
    case "submit-failed":
      return {
        ...state,
        pending: false,
        showSpinner: false,
        errors: action.errors,
        formError: action.formError,
      };
    case "mark-clean":
      return {
        ...state,
        cleanSnapshot: action.cleanSnapshot,
        cleanVersion: state.version,
      };
    case "reset":
      return {
        ...state,
        pending: false,
        showSpinner: false,
        errors: {},
        formError: undefined,
        blurredWithError: {},
        submitAttempted: false,
        cleanSnapshot: action.cleanSnapshot,
        cleanVersion: state.version + 1,
        version: state.version + 1,
      };
  }
}

export function useFormReducer(initialSnapshot: Record<string, unknown>) {
  return useReducer(reducer, initialSnapshot, makeInitialState);
}

export { reducer as formReducer };
