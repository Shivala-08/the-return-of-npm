import type { CompactOptions, CurrencyOptions, FormatOptions, IndianNumberInput } from './types.js';
import {
  assertDecimals,
  assertStringOption,
  invalidOption,
  normalize,
} from './validate.js';

/** Separator character used between Indian digit groups. */
const DEFAULT_SEPARATOR = ',';

/**
 * Group `intPart` the Indian way: last 3 digits, then groups of 2.
 *
 * The separator is inserted through a replacer function so characters such as
 * `$&` or `$1` are treated literally instead of as replacement patterns.
 */
export function groupIndian(intPart: string, separator: string = DEFAULT_SEPARATOR): string {
  const digits = intPart.replace(/^0+(?=\d)/, '');
  if (digits.length <= 3) return digits;
  const tail = digits.slice(-3);
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, () => separator);
  return `${head}${separator}${tail}`;
}

/** `BigInt` + 1 on a digit string, returned without a sign. */
function incrementDigits(digits: string): string {
  return (BigInt(digits) + 1n).toString();
}

/**
 * Round sign-less digit strings half away from zero to `decimals` places.
 * Works on strings so `1.005` behaves like a human expects.
 */
export function roundDigits(
  intPart: string,
  fracPart: string,
  decimals: number,
): { intPart: string; fracPart: string } {
  if (decimals >= fracPart.length) {
    return { intPart, fracPart: fracPart.padEnd(decimals, '0') };
  }

  const kept = fracPart.slice(0, decimals);
  const next = fracPart.charAt(decimals);

  if (next < '5') return { intPart, fracPart: kept };

  // `padStart` matters: bumping "000" must give "001", not "1", so the
  // integer part keeps a digit and the fraction keeps its width.
  const combined = intPart + kept;
  const bumped = incrementDigits(combined).padStart(combined.length, '0');
  if (decimals === 0) return { intPart: bumped, fracPart: '' };

  return {
    intPart: bumped.slice(0, bumped.length - decimals),
    fracPart: bumped.slice(-decimals),
  };
}

/** `true` when the digit strings represent exactly zero. */
function isZeroDigits(intPart: string, fracPart: string): boolean {
  return intPart === '0' && !/[1-9]/.test(fracPart);
}

/**
 * Assemble the final string from already-prepared parts. A value that rounds
 * to zero never carries a minus sign, so `-0.001` at two decimals is `0.00`.
 */
function compose(
  negative: boolean,
  intPart: string,
  fracPart: string,
  separator: string,
  prefix = '',
): string {
  const body = groupIndian(intPart, separator) + (fracPart ? `.${fracPart}` : '');
  const sign = negative && !isZeroDigits(intPart, fracPart) ? '-' : '';
  return `${sign}${prefix}${body}`;
}

/**
 * Format a number using Indian digit grouping.
 *
 * ```ts
 * formatIndian(1234567);                              // "12,34,567"
 * formatIndian(-1234567.891, { decimals: 2 });        // "-12,34,567.89"
 * formatIndian(1234567.891, { separator: ' ' });      // "12 34 567.891"
 * ```
 */
export function formatIndian(value: IndianNumberInput, options: FormatOptions = {}): string {
  const separator = assertStringOption('separator', options.separator, DEFAULT_SEPARATOR);
  const { negative, intPart, fracPart } = normalize(value);

  if (options.decimals === undefined) return compose(negative, intPart, fracPart, separator);

  const rounded = roundDigits(intPart, fracPart, assertDecimals(options.decimals, 0));
  return compose(negative, rounded.intPart, rounded.fracPart, separator);
}

/**
 * Format a value as Indian rupees, with the symbol and paise.
 *
 * ```ts
 * toCurrency(1234567.5);                 // "₹12,34,567.50"
 * toCurrency(1234567.5, { symbol: false }); // "12,34,567.50"
 * toCurrency(1234567.5, { symbol: 'Rs. ' }); // "Rs. 12,34,567.50"
 * ```
 */
export function toCurrency(value: IndianNumberInput, options: CurrencyOptions = {}): string {
  const decimals = assertDecimals(options.decimals, 2);
  const separator = assertStringOption('separator', options.separator, DEFAULT_SEPARATOR);
  const { symbol } = options;
  if (symbol !== undefined && symbol !== false && typeof symbol !== 'string') {
    throw invalidOption('symbol', 'must be a string or false', symbol);
  }

  const { negative, intPart, fracPart } = normalize(value);
  const rounded = roundDigits(intPart, fracPart, decimals);
  const prefix = symbol === undefined ? '₹' : symbol === false ? '' : symbol;

  return compose(negative, rounded.intPart, rounded.fracPart, separator, prefix);
}

const SHORT_UNITS: readonly (readonly [bigint, string, string])[] = [
  [10_000_000n, 'Cr', 'Crore'],
  [100_000n, 'L', 'Lakh'],
  [1_000n, 'K', 'Thousand'],
];

/** Drop trailing zeros from a fraction, keeping at least one integer digit. */
function trimFraction(intPart: string, fracPart: string): string {
  const trimmed = fracPart.replace(/0+$/, '');
  return trimmed ? `${intPart}.${trimmed}` : intPart;
}

/**
 * Shorten a large number using K / L / Cr (or Thousand / Lakh / Crore).
 *
 * ```ts
 * toCompact(12500000);                          // "1.25 Cr"
 * toCompact(12500000, { style: 'long' });       // "1.25 Crore"
 * toCompact(12500000, { decimals: 0 });         // "1 Cr"
 * ```
 */
export function toCompact(value: IndianNumberInput, options: CompactOptions = {}): string {
  const decimals = assertDecimals(options.decimals, 2);
  const style = options.style ?? 'short';
  if (style !== 'short' && style !== 'long') {
    throw invalidOption('style', 'must be "short" or "long"', style);
  }

  const { negative, intPart, fracPart } = normalize(value);

  // Round first, then pick the unit: `999.999` must become "1 K", not "1000".
  const rounded = roundDigits(intPart, fracPart, decimals);
  const unit = SHORT_UNITS.find((entry) => BigInt(rounded.intPart) >= entry[0]);
  if (!unit) {
    const plain = trimFraction(rounded.intPart, rounded.fracPart);
    return `${negative && !isZeroDigits(rounded.intPart, rounded.fracPart) ? '-' : ''}${plain}`;
  }

  // value * 10^decimals as an integer, so no float drift sneaks in.
  const scaled = BigInt(rounded.intPart + rounded.fracPart);
  const divisor = unit[0];
  const quotient = (scaled * 2n + divisor) / (divisor * 2n);

  const digits = quotient.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals);
  const label = style === 'short' ? unit[1] : unit[2];
  const sign = negative && !isZeroDigits(whole, fraction) ? '-' : '';

  return `${sign}${trimFraction(whole, fraction)} ${label}`;
}
