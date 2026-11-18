import type { IndianNumberInput, WordsOptions } from './types.js';
import { roundDigits } from './format.js';
import { assertStringOption, invalidOption, normalize } from './validate.js';

const ONES = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

const TEN_MILLION = 10_000_000n;
const HUNDRED_THOUSAND = 100_000n;
const THOUSAND = 1_000n;

/** Words for 0–99, hyphenated from twenty upwards. */
/** Word for a single number 0–19. */
const one = (n: number): string => ONES[n]!;

/** Word for a ten 20–90. */
const ten = (n: number): string => TENS[n]!;

function belowHundred(n: number): string {
  if (n < 20) return one(n);
  const tens = ten(Math.floor(n / 10));
  const ones = n % 10;
  return ones ? `${tens}-${one(ones)}` : tens;
}

/** Words for 0–999. */
function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${one(hundreds)} Hundred`);
  if (rest) parts.push(belowHundred(rest));
  return parts.join(' ');
}

/** Words for a whole number, recursing so 1e12 becomes "One Lakh Crore". */
export function integerToWords(value: bigint): string {
  if (value === 0n) return 'Zero';

  const crore = value / TEN_MILLION;
  const afterCrore = value % TEN_MILLION;
  const lakh = afterCrore / HUNDRED_THOUSAND;
  const afterLakh = afterCrore % HUNDRED_THOUSAND;
  const thousand = afterLakh / THOUSAND;
  const rest = afterLakh % THOUSAND;

  const parts: string[] = [];
  if (crore > 0n) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh > 0n) parts.push(`${belowHundred(Number(lakh))} Lakh`);
  if (thousand > 0n) parts.push(`${belowHundred(Number(thousand))} Thousand`);
  if (rest > 0n) parts.push(belowThousand(Number(rest)));

  return parts.join(' ');
}

/** Add the suffix, then apply the requested casing to the finished sentence. */
function finish(text: string, { casing, suffix }: WordsOptions, fallback = ''): string {
  const tail = assertStringOption('suffix', suffix, fallback);
  const sentence = tail ? `${text} ${tail}` : text;
  if (casing === undefined || casing === 'title') return sentence;
  if (casing === 'lower') return sentence.toLowerCase();
  if (casing === 'upper') return sentence.toUpperCase();
  throw invalidOption('casing', 'must be "title", "lower" or "upper"', casing);
}

/** Read a fraction digit by digit: `"56"` becomes "Five Six". */
function fractionToWords(fracPart: string): string {
  return [...fracPart].map((digit) => one(Number(digit))).join(' ');
}

/**
 * Convert a number to English words in the Indian system.
 *
 * ```ts
 * toWords(1234567);   // "Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven"
 * toWords(-42);       // "Minus Forty-Two"
 * toWords(12.5);      // "Twelve Point Five"
 * ```
 */
export function toWords(value: IndianNumberInput, options: WordsOptions = {}): string {
  const { negative, intPart, fracPart } = normalize(value);

  let text = integerToWords(BigInt(intPart));
  if (fracPart) text += ` Point ${fractionToWords(fracPart)}`;
  if (negative) text = `Minus ${text}`;

  return finish(text, options);
}

/**
 * Convert a value to rupees and paise in words.
 *
 * ```ts
 * toCurrencyWords(150.5);  // "One Hundred Fifty Rupees and Fifty Paise Only"
 * toCurrencyWords(1);      // "One Rupee Only"
 * ```
 */
export function toCurrencyWords(value: IndianNumberInput, options: WordsOptions = {}): string {
  const { negative, intPart, fracPart } = normalize(value);
  const rounded = roundDigits(intPart, fracPart, 2);
  const rupees = BigInt(rounded.intPart);
  const paise = Number(rounded.fracPart.padEnd(2, '0').slice(0, 2));

  const parts = [`${integerToWords(rupees)} ${rupees === 1n ? 'Rupee' : 'Rupees'}`];
  if (paise > 0) parts.push(`and ${belowHundred(paise)} ${paise === 1 ? 'Paisa' : 'Paise'}`);

  // An amount that rounds to zero is never read as negative: -0.001 is not
  // "Minus Zero Rupees".
  const amount = parts.join(' ');
  const text = negative && (rupees > 0n || paise > 0) ? `Minus ${amount}` : amount;
  return finish(text, options, 'Only');
}
