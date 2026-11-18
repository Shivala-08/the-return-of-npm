import type { IndianNumberInput } from './types.js';

/** Deepest input we agree to look at. Keeps every regex linear and bounded. */
export const MAX_INPUT_LENGTH = 100;

/** Largest number of decimal places any function will produce. */
export const MAX_DECIMALS = 20;

/** Most digits we will expand exponent notation into (covers 1e308 safely). */
export const MAX_EXPANSION_DIGITS = 400;

/** A decimal number split into exact digit strings. */
export interface NormalizedNumber {
  /** `true` when the value is strictly below zero (`-0` counts as positive). */
  negative: boolean;
  /** Integer digits without leading zeros, or `"0"`. */
  intPart: string;
  /** Fraction digits exactly as supplied, e.g. `"50"` for `"1.50"`. */
  fracPart: string;
  /** `true` when the value is exactly zero. */
  isZero: boolean;
}

const EXPONENTIAL = /^(-?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/i;
const NUMERIC = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

const PREFIX = 'indian-number-kit: ';

/** Render an unknown value for an error message without ever throwing. */
function describe(value: unknown): string {
  return typeof value === 'string' ? `"${value.slice(0, 40)}"` : String(value);
}

/** The single error type the package throws for unusable input. */
export function invalidInput(value: unknown): TypeError {
  return new TypeError(`${PREFIX}expected a finite number, received ${describe(value)}`);
}

/** The single error type the package throws for unusable options. */
export function invalidOption(name: string, expected: string, value: unknown): RangeError {
  return new RangeError(`${PREFIX}option "${name}" ${expected}, received ${describe(value)}`);
}

/** The single error type for input longer than we are willing to look at. */
export function tooLong(): TypeError {
  return new TypeError(`${PREFIX}input is limited to ${MAX_INPUT_LENGTH} characters`);
}

/** The single error type for values too large to expand safely. */
export function tooLarge(): TypeError {
  return new TypeError(`${PREFIX}number is too large (limit: ${MAX_EXPANSION_DIGITS} digits)`);
}

/**
 * `String(number)` can return exponent notation (`1e21`, `1.5e-7`). Rewrite it
 * as plain digits so downstream code only ever sees a digit string.
 */
export function expandExponential(input: string): string {
  if (!/e/i.test(input)) return input;
  const match = EXPONENTIAL.exec(input);
  if (!match) return input;

  const [, sign = '', whole = '0', fraction = '', exponentText = '0'] = match;
  const digits = whole + fraction;
  const shift = Number(exponentText) - fraction.length;

  // `"1e999999999"` is 10 characters but would expand to a gigantic string.
  if (!Number.isFinite(shift) || digits.length + Math.abs(shift) > MAX_EXPANSION_DIGITS) {
    throw tooLarge();
  }

  let plain: string;
  if (shift >= 0) {
    plain = digits + '0'.repeat(shift);
  } else {
    const point = digits.length + shift;
    plain =
      point > 0
        ? `${digits.slice(0, point)}.${digits.slice(point)}`
        : `0.${'0'.repeat(-point)}${digits}`;
  }

  return sign === '-' ? `-${plain}` : plain;
}

/** Validate a `decimals` option. */
export function assertDecimals(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 0 || value > MAX_DECIMALS) {
    throw invalidOption('decimals', `must be an integer between 0 and ${MAX_DECIMALS}`, value);
  }
  return value;
}

/** Reject an option whose runtime type does not match the documented one. */
export function assertStringOption(name: string, value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') throw invalidOption(name, 'must be a string', value);
  return value;
}

/**
 * Turn any accepted input into sign + exact digit strings.
 *
 * Accepts `number` and `string`. Strings may carry whitespace, grouping
 * commas and a `₹` / `Rs` / `INR` marker. Everything else (NaN, Infinity,
 * empty strings, `"abc"`, `null`, objects) throws a `TypeError`.
 */
export function normalize(input: IndianNumberInput): NormalizedNumber {
  let text: string;

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw invalidInput(input);
    text = expandExponential(String(input));
  } else if (typeof input === 'string') {
    if (input.length > MAX_INPUT_LENGTH) throw tooLong();
    text = expandExponential(input);
  } else {
    throw invalidInput(input);
  }

  // Strip everything a human might type around the digits.
  let cleaned = text
    .replace(/\s+/g, '')
    .replace(/₹/g, '')
    .replace(/^(?:rs\.?|inr)/i, '')
    .replace(/(?:rs\.?|inr)$/i, '')
    .replace(/,/g, '');

  let negative = false;
  if (cleaned.startsWith('-')) {
    negative = true;
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  if (!NUMERIC.test(cleaned)) throw invalidInput(input);

  const dot = cleaned.indexOf('.');
  const rawInt = dot === -1 ? cleaned : cleaned.slice(0, dot);
  const rawFrac = dot === -1 ? '' : cleaned.slice(dot + 1);

  const intPart = rawInt.replace(/^0+(?=\d)/, '') || '0';
  const fracPart = rawFrac;
  const isZero = intPart === '0' && /^0*$/.test(fracPart);

  return {
    negative: negative && !isZero,
    intPart,
    fracPart,
    isZero,
  };
}
