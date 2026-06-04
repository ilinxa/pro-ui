"use client";

import { useCallback, useEffect, useRef } from "react";
import { ARTICLE_BODY_EMPTY_VALUE } from "@/registry/components/data/article-body-01/article-body-01";
import type { BodySlotConfig, BodySlotValue } from "../types";

/**
 * Stable content key for a body value. `<ArticleBodyEditor>` (Plate) exposes NO
 * dirty signal, so the shell derives bodySlot dirty by baseline JSON-compare
 * over this key. Plate JSON has no functions/cycles, so `JSON.stringify` is
 * adequate; over-sync (never skip) on the cycle edge.
 */
export function bodyContentKey(v: BodySlotValue): string {
  try {
    return v.kind === "plaintext" ? `p:${v.value}` : `r:${JSON.stringify(v.value)}`;
  } catch {
    return `x:${Math.random()}`;
  }
}

/** Flattened plain text of a body value (Plate node tree → text, or the raw string). */
export function flattenPlainText(v: BodySlotValue): string {
  if (v.kind === "plaintext") return v.value;
  let out = "";
  const walk = (n: unknown) => {
    if (n && typeof n === "object") {
      const node = n as { text?: unknown; children?: unknown };
      if (typeof node.text === "string") out += node.text;
      if (Array.isArray(node.children)) node.children.forEach(walk);
    }
  };
  if (Array.isArray(v.value)) v.value.forEach(walk);
  return out;
}

/** Empty = no non-whitespace flattened text (covers both substrates + the empty sentinel). */
export function isBodyEmpty(v: BodySlotValue): boolean {
  return flattenPlainText(v).trim().length === 0;
}

/** The CONFIGURED minLength gate (used shell-side in evaluateStepGate). */
export function bodyMinLengthValid(v: BodySlotValue, minLength: number): boolean {
  return flattenPlainText(v).trim().length >= minLength;
}

/** The empty value for a body slot, per its substrate. */
export function defaultBodyValue(slotConfig: BodySlotConfig): BodySlotValue {
  return slotConfig.substrate === "plaintext"
    ? { kind: "plaintext", value: "" }
    : {
        kind: "richtext",
        value: slotConfig.emptyValue ?? ARTICLE_BODY_EMPTY_VALUE,
      };
}

/**
 * Baseline-compare dirty tracking for a body slot (#1 implementation trap).
 *
 * The `baselineRef` MUST reset after every successful save/autosave AND on
 * `loadValue()` — otherwise the body reports permanently-dirty, the aggregate
 * dirty stays true, and autosave loops forever. `rebaseline()` is the reset.
 */
export function useBodyDirty(current: BodySlotValue) {
  const valueRef = useRef(current);
  useEffect(() => {
    valueRef.current = current;
  });

  const baselineRef = useRef(bodyContentKey(current));

  const getIsDirty = useCallback(
    () => bodyContentKey(valueRef.current) !== baselineRef.current,
    [],
  );
  const rebaseline = useCallback((v?: BodySlotValue) => {
    baselineRef.current = bodyContentKey(v ?? valueRef.current);
  }, []);

  return { valueRef, getIsDirty, rebaseline };
}
