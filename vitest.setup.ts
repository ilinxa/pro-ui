// Setup for the `components` vitest project (jsdom environment).
// Adds jest-dom's DOM-specific matchers (toBeInTheDocument, etc.) to `expect`.
import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Unmount between tests, globally.
 *
 * Testing Library only self-registers its auto-cleanup when a global `afterEach`
 * exists — which it doesn't here, because this project deliberately runs without
 * `test.globals: true` (globals pollute every file to save a one-line import).
 * Without this, DOM from a previous test leaks into the next one and queries
 * like `getByRole("tree")` start failing with "found multiple elements" —
 * a confusing failure that looks like a product bug and isn't.
 *
 * Registering it once here means test authors don't each have to remember an
 * `afterEach(cleanup)` in every file.
 */
afterEach(() => {
  cleanup();
});
