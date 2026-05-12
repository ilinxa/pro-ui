"use client";

import type { FieldRenderer } from "../types";

/**
 * `divider` — see `field-section.tsx`. Routed through the layout primitive
 * in `<JsonForm>`. This renderer is kept for symmetry; never invoked at
 * runtime under normal flow.
 */
export const FieldDivider: FieldRenderer = () => null;

export default FieldDivider;
