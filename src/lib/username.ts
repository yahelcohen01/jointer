// Pure-logic username validation. No IO, no Supabase. The reserved list is
// passed in as a dependency so the same function works in server and client
// contexts.

export type ValidationFailure =
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "leading_or_trailing_separator"
  | "reserved";

export type ValidationResult = { ok: true } | { ok: false; reason: ValidationFailure };

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

const ALLOWED_CHARS = /^[a-z0-9_-]+$/;

/**
 * Lowercase + trim. Collapses any run of `_` or `-` into a single character.
 * Does not strip or otherwise mangle invalid input — that's `validate`'s job.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[_-]{2,}/g, (match) => match[0] ?? "");
}

/**
 * Validate against the rules. Caller is responsible for normalizing first.
 * The reserved list should be lowercase (it's matched against the input
 * after the caller normalizes).
 */
export function validate(input: string, reservedList: readonly string[]): ValidationResult {
  if (input.length < USERNAME_MIN_LENGTH) {
    return { ok: false, reason: "too_short" };
  }
  if (input.length > USERNAME_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  if (!ALLOWED_CHARS.test(input)) {
    return { ok: false, reason: "invalid_chars" };
  }
  if (
    input.startsWith("-") ||
    input.startsWith("_") ||
    input.endsWith("-") ||
    input.endsWith("_")
  ) {
    return { ok: false, reason: "leading_or_trailing_separator" };
  }
  if (reservedList.includes(input)) {
    return { ok: false, reason: "reserved" };
  }
  return { ok: true };
}
