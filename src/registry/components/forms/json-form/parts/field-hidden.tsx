"use client";

import type { FieldRenderer } from "../types";

/**
 * Hidden field — renders `null`. Registration + value tracking happens in
 * `FieldWrapper`'s effect; FieldWrapper returns null for `type: 'hidden'`
 * before this renderer is reached. This renderer exists for completeness
 * (and consumer registry lookups) but is effectively unused at runtime.
 */
export const FieldHidden: FieldRenderer = () => null;

export default FieldHidden;
