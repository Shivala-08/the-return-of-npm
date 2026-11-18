import { MAX_INPUT_LENGTH, invalidInput, tooLong } from './validate.js';

/** Multipliers understood by {@link parseIndian}, keyed by lower-case suffix. */
const COMPACT_SUFFIXES: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  thousands: 1_000,
  l: 100_000,
  lakh: 100_000,
  lakhs: 100_000,
  cr: 10_000_000,
  crore: 10_000_000,
  crores: 10_000_000,
};

const COMPACT = /(k|thousand|thousands|lakhs|lakh|l|crores|crore|cr)$/i;
const PLAIN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

/**
 * Parse a formatted Indian number back into a `number`.
 *
 * Accepts commas, the `₹` / `Rs` / `INR` marker, whitespace and — as a bonus —
 * compact suffixes (`"1.5 Cr"` → `15000000`).
 *
 * ```ts
 * parseIndian('₹12,34,567.50'); // 1234567.5
 * parseIndian('1.5 Cr');        // 15000000
 * ```
 */
export function parseIndian(input: string): number {
  if (typeof input !== 'string') throw invalidInput(input);
  if (input.length > MAX_INPUT_LENGTH) throw tooLong();

  let text = input
    .trim()
    .replace(/\s+/g, '')
    .replace(/₹/g, '')
    .replace(/^(?:rs\.?|inr)/i, '')
    .replace(/(?:rs\.?|inr)$/i, '')
    .replace(/,/g, '');

  let multiplier = 1;
  const compact = COMPACT.exec(text);
  if (compact) {
    text = text.slice(0, compact.index);
    multiplier = COMPACT_SUFFIXES[compact[1]!.toLowerCase()]!;
  }

  if (!PLAIN.test(text)) throw invalidInput(input);

  // `MAX_INPUT_LENGTH` bounds the digit count, so this can never overflow to Infinity.
  const result = Number(text) * multiplier;
  return result === 0 ? 0 : result;
}
