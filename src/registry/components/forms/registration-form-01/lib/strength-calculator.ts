import type { StrengthCalculator } from "../types";

/**
 * Built-in password-strength heuristic. Returns 0 for an empty string,
 * 1–4 for non-empty inputs based on length + character-class diversity.
 *
 * Algorithm:
 * - length 0 → 0 (empty / unrated)
 * - score = floor(length / 4) + characterClassCount − 1, clamped to [1, 4]
 *   - length 4 contributes +1; length 12 contributes +3
 *   - character classes = { has-lowercase, has-uppercase, has-digit,
 *     has-symbol } — each adds +1
 *   - then subtract 1 so a single-class short password lands at "weak"
 *
 * This is intentionally not a zxcvbn-style dictionary check — that would
 * pull a ~400KB peer dep for marginal value at v0.1. Consumers with
 * corporate password policies (or who want zxcvbn) plug a different
 * calculator via the `strengthCalculator` prop on `<RegistrationForm01>`.
 */
export const defaultStrengthCalculator: StrengthCalculator = (password) => {
  if (!password) return 0;

  let classes = 0;
  if (/[a-z]/.test(password)) classes++;
  if (/[A-Z]/.test(password)) classes++;
  if (/[0-9]/.test(password)) classes++;
  if (/[^A-Za-z0-9]/.test(password)) classes++;

  const lengthScore = Math.floor(password.length / 4);
  const raw = lengthScore + classes - 1;

  if (raw <= 1) return 1;
  if (raw === 2) return 2;
  if (raw === 3) return 3;
  return 4;
};
