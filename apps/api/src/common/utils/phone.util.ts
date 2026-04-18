/**
 * Normalize an Indian mobile phone number to its 10-digit form.
 * - Strips spaces, dashes, parentheses, dots, and "+" signs
 * - Removes a leading "91" country code (e.g. +91 6300852812 -> 6300852812)
 * - Removes a leading "0" (e.g. 06300852812 -> 6300852812)
 * - Returns the last 10 digits if longer
 *
 * Returns null if the input is empty/invalid (less than 10 digits after cleanup).
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  let digits = String(input).replace(/\D+/g, "");
  if (!digits) return null;

  // Strip leading country code "91" if present and length > 10
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Strip leading "0" if present and length > 10
  if (digits.length > 10 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Take the last 10 digits as the canonical form
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  if (digits.length < 10) return null;
  return digits;
}
