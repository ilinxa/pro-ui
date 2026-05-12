"use client";

import type { FieldRenderer } from "../types";

/**
 * `section` — renders `<fieldset>` chrome via the wrapper. Returns null here
 * because section is handled at the form layout level (it groups subsequent
 * fields visually, it doesn't render an input). The resolver in `<JsonForm>`
 * routes `section`/`divider` types through dedicated layout primitives,
 * bypassing this renderer. Kept in the registry for completeness so the
 * fallback path doesn't trip.
 */
export const FieldSection: FieldRenderer = () => null;

export default FieldSection;
