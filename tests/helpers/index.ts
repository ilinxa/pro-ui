/**
 * Shared test helpers for registry components (consumer contract C11 / Part 1 R9). They live
 * outside `src/registry/` on purpose: a new file class under `src/registry` once broke every
 * folder-walking validator. Component tests import them relatively.
 */
export { contractChecks, describeContract, type ContractCheck, type ContractSpec, type NotApplicable } from "./contract-kit";
export { createEmblaApi, mockIntersectionObserver, mockLayout, mockMatchMedia, mockResizeObserver } from "./mocks";
export { fireMedia, installMediaElementStubs } from "./media";
export { expectNoAxeViolations, renderWithContext } from "./render";
