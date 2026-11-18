import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  formatIndian,
  groupIndian,
  parseIndian,
  toCompact,
  toCurrency,
  toCurrencyWords,
  toWords,
} from '../src/index.js';

describe('formatIndian — grouping', () => {
  it.each([
    [0, '0'],
    [5, '5'],
    [99, '99'],
    [100, '100'],
    [999, '999'],
    [1000, '1,000'],
    [9999, '9,999'],
    [12345, '12,345'],
    [99999, '99,999'],
    [100000, '1,00,000'],
    [1234567, '12,34,567'],
    [12345678, '1,23,45,678'],
    [1234567890, '1,23,45,67,890'],
    [10000000, '1,00,00,000'],
  ])('formatIndian(%i) === %s', (input, expected) => {
    expect(formatIndian(input)).toBe(expected);
  });

  it('handles Number.MAX_SAFE_INTEGER', () => {
    expect(formatIndian(Number.MAX_SAFE_INTEGER)).toBe('9,00,71,99,25,47,40,991');
  });

  it('handles numbers far beyond the safe integer range when given as strings', () => {
    expect(formatIndian('1234567890123456789012')).toBe('1,23,45,67,89,01,23,45,67,89,012');
  });

  it('accepts numeric strings, commas, currency markers and whitespace', () => {
    expect(formatIndian('1234567')).toBe('12,34,567');
    expect(formatIndian('12,34,567')).toBe('12,34,567');
    expect(formatIndian('₹12,34,567.50')).toBe('12,34,567.50');
    expect(formatIndian('Rs 12,34,567')).toBe('12,34,567');
    expect(formatIndian('Rs. 12,34,567')).toBe('12,34,567');
    expect(formatIndian('INR 1,000')).toBe('1,000');
    expect(formatIndian(' 1 234 567 ')).toBe('12,34,567');
    expect(formatIndian('+1234567')).toBe('12,34,567');
  });

  it('formats negatives', () => {
    expect(formatIndian(-1234567)).toBe('-12,34,567');
    expect(formatIndian('-1234567')).toBe('-12,34,567');
    expect(formatIndian(-0)).toBe('0');
    expect(formatIndian(-0.5)).toBe('-0.5');
  });

  it('keeps input decimals by default', () => {
    expect(formatIndian(1234567.891)).toBe('12,34,567.891');
    expect(formatIndian(1.5)).toBe('1.5');
    expect(formatIndian('1.50')).toBe('1.50');
    expect(formatIndian(0.5)).toBe('0.5');
    expect(formatIndian('.5')).toBe('0.5');
    expect(formatIndian('1.')).toBe('1');
  });

  it('expands exponent notation', () => {
    expect(formatIndian(1e21)).toBe('1,00,00,00,00,00,00,00,00,00,000');
    expect(formatIndian(1.5e-7)).toBe('0.00000015');
    expect(formatIndian(-1.5e22)).toBe('-15,00,00,00,00,00,00,00,00,00,000');
  });

  it('respects the separator option', () => {
    expect(formatIndian(1234567.5, { separator: ' ' })).toBe('12 34 567.5');
    expect(formatIndian(1234567, { separator: '' })).toBe('1234567');
    expect(formatIndian(1234567, { separator: '_' })).toBe('12_34_567');
  });
});

describe('formatIndian — rounding', () => {
  it.each([
    [1234567.891, 2, '12,34,567.89'],
    [-1234567.891, 2, '-12,34,567.89'],
    [1.005, 2, '1.01'],
    [1.004, 2, '1.00'],
    [99.999, 2, '100.00'],
    [0.1 + 0.2, 2, '0.30'],
    [0.1 + 0.2, 20, '0.30000000000000004000'],
    [1.5, 0, '2'],
    [2.5, 0, '3'],
    [-2.5, 0, '-3'],
    [1234, 2, '1,234.00'],
    [0.999, 0, '1'],
    [9.99, 1, '10.0'],
  ])('formatIndian(%s, { decimals: %i }) === %s', (input, decimals, expected) => {
    expect(formatIndian(input, { decimals })).toBe(expected);
  });

  it('rounds large values without float drift', () => {
    expect(formatIndian('9007199254740991.999', { decimals: 2 })).toBe(
      '9,00,71,99,25,47,40,992.00',
    );
  });
});

describe('formatIndian — invalid input', () => {
  it.each([
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
    [Number.NEGATIVE_INFINITY],
    [null],
    [undefined],
    ['abc'],
    [''],
    ['   '],
    ['12,34,567abc'],
    ['1.2.3'],
    ['--5'],
    [{}],
    [[]],
    [true],
  ])('throws TypeError for %s', (input) => {
    expect(() => formatIndian(input as never)).toThrow(TypeError);
    expect(() => formatIndian(input as never)).toThrow(/expected a finite number/);
  });

  it('describes the bad value in the error message', () => {
    expect(() => formatIndian('abc')).toThrow(
      'indian-number-kit: expected a finite number, received "abc"',
    );
    expect(() => formatIndian(null as never)).toThrow('received null');
    expect(() => formatIndian(undefined as never)).toThrow('received undefined');
  });

  it('truncates long strings and survives circular objects in error messages', () => {
    expect(() => formatIndian('a'.repeat(50))).toThrow(`received "${'a'.repeat(40)}"`);
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => formatIndian(circular as never)).toThrow('received [object Object]');
  });

  it('rejects malformed exponent notation', () => {
    expect(() => formatIndian('1e' as never)).toThrow(TypeError);
    expect(() => formatIndian('1e999999999999999999999')).toThrow(TypeError);
    expect(() => formatIndian('1e500')).toThrow(/too large/);
    expect(() => formatIndian('1e500')).toThrow(TypeError);
    const huge = formatIndian('1e50').replace(/,/g, '');
    expect(huge).toBe(`1${'0'.repeat(50)}`);
    expect(formatIndian('1e50')).toMatch(/^10,00,00,/);
  });

  it('expands exponent notation given as a string', () => {
    expect(formatIndian('12345e-2')).toBe('123.45');
    expect(formatIndian('15e2')).toBe('1,500');
  });

  it('rejects oversized input', () => {
    expect(() => formatIndian('1'.repeat(101))).toThrow(/limited to 100 characters/);
  });

  it('rejects impossible decimals', () => {
    expect(() => formatIndian(1, { decimals: -1 })).toThrow(RangeError);
    expect(() => formatIndian(1, { decimals: 1.5 })).toThrow(RangeError);
    expect(() => formatIndian(1, { decimals: 21 })).toThrow(RangeError);
  });
});

describe('groupIndian', () => {
  it('groups digit strings', () => {
    expect(groupIndian('1234567')).toBe('12,34,567');
    expect(groupIndian('123')).toBe('123');
    expect(groupIndian('1234567', '.')).toBe('12.34.567');
  });
});

describe('toCurrency', () => {
  it('adds the rupee symbol and two decimals', () => {
    expect(toCurrency(1234567.5)).toBe('₹12,34,567.50');
    expect(toCurrency(0)).toBe('₹0.00');
    expect(toCurrency(1)).toBe('₹1.00');
    expect(toCurrency(12.345)).toBe('₹12.35');
    expect(toCurrency(-42.5)).toBe('-₹42.50');
    expect(toCurrency('₹12,34,567.50')).toBe('₹12,34,567.50');
  });

  it('supports symbol and decimal options', () => {
    expect(toCurrency(1234567.5, { symbol: false })).toBe('12,34,567.50');
    expect(toCurrency(1234567.5, { symbol: 'Rs. ' })).toBe('Rs. 12,34,567.50');
    expect(toCurrency(1234567.5, { decimals: 0 })).toBe('₹12,34,568');
    expect(toCurrency(1234567.5, { decimals: 4 })).toBe('₹12,34,567.5000');
    expect(toCurrency(1234567.5, { separator: ',' })).toBe('₹12,34,567.50');
  });
});

describe('toCompact', () => {
  it.each([
    [0, '0'],
    [1, '1'],
    [999, '999'],
    [1000, '1 K'],
    [1500, '1.5 K'],
    [999999, '10 L'],
    [100000, '1 L'],
    [1250000, '12.5 L'],
    [12500000, '1.25 Cr'],
    [100000000, '10 Cr'],
    [99999999, '10 Cr'],
    [123456789012, '12345.68 Cr'],
  ])('toCompact(%i) === %s', (input, expected) => {
    expect(toCompact(input)).toBe(expected);
  });

  it('supports long style, custom decimals and negatives', () => {
    expect(toCompact(12500000, { style: 'long' })).toBe('1.25 Crore');
    expect(toCompact(1500, { style: 'long' })).toBe('1.5 Thousand');
    expect(toCompact(150000, { style: 'long' })).toBe('1.5 Lakh');
    expect(toCompact(12500000, { decimals: 0 })).toBe('1 Cr');
    expect(toCompact(12500000, { decimals: 4 })).toBe('1.25 Cr');
    expect(toCompact(-12500000)).toBe('-1.25 Cr');
    expect(toCompact(12.5)).toBe('12.5');
    expect(toCompact(-999)).toBe('-999');
    expect(toCompact(-999.555, { decimals: 2 })).toBe('-999.56');
  });

  it('rejects an unknown style', () => {
    expect(() => toCompact(1000, { style: 'tiny' as never })).toThrow(/must be "short" or "long"/);
  });
});

describe('parseIndian', () => {
  it.each([
    ['₹12,34,567.50', 1234567.5],
    ['12,34,567', 1234567],
    ['1234567', 1234567],
    ['Rs 1,000', 1000],
    ['Rs. 500.25', 500.25],
    ['INR 42', 42],
    ['-₹500', -500],
    ['1.5 Cr', 15000000],
    ['25 lakh', 2500000],
    ['3 L', 300000],
    ['4 Crore', 40000000],
    ['5 crore', 50000000],
    ['7 k', 7000],
    ['2 thousand', 2000],
    ['2 lakhs', 200000],
  ])('parseIndian(%s) === %i', (input, expected) => {
    expect(parseIndian(input)).toBe(expected);
  });

  it('round-trips formatIndian for integers', () => {
    for (let i = 0; i < 200; i += 1) {
      const value = Math.floor(Math.random() * 1e9);
      expect(parseIndian(formatIndian(value))).toBe(value);
    }
  });

  it('round-trips currency strings', () => {
    const values = [0, 1, 99, 1234.56, 1234567.5, 987654321.12];
    for (const value of values) {
      expect(parseIndian(toCurrency(value))).toBeCloseTo(value, 2);
    }
  });

  it.each([
    ['abc'],
    [''],
    ['  '],
    ['1.2.3'],
    ['12,34,567.5.5'],
    ['1'.repeat(101)],
    ['1e5'],
  ])(
    'throws for %s',
    (input) => {
      expect(() => parseIndian(input)).toThrow(TypeError);
    },
  );

  it('throws for non-string input', () => {
    expect(() => parseIndian(123 as never)).toThrow(TypeError);
    expect(() => parseIndian(null as never)).toThrow(TypeError);
  });
});

describe('types', () => {
  it('every public function is fully typed', () => {
    expectTypeOf(formatIndian).returns.toBeString();
    expectTypeOf(toWords).parameters.toEqualTypeOf<
      [number | string, { casing?: 'title' | 'lower' | 'upper'; suffix?: string }?]
    >();
    expectTypeOf(parseIndian).returns.toBeNumber();
    expectTypeOf(toCurrencyWords).toBeFunction();
    expectTypeOf(toCompact).toBeFunction();
    expectTypeOf(toCurrency).toBeFunction();
  });
});

describe('words', () => {
  it.each([
    [0, 'Zero'],
    [1, 'One'],
    [9, 'Nine'],
    [10, 'Ten'],
    [19, 'Nineteen'],
    [20, 'Twenty'],
    [34, 'Thirty-Four'],
    [99, 'Ninety-Nine'],
    [100, 'One Hundred'],
    [101, 'One Hundred One'],
    [999, 'Nine Hundred Ninety-Nine'],
    [1000, 'One Thousand'],
    [1234, 'One Thousand Two Hundred Thirty-Four'],
    [99999, 'Ninety-Nine Thousand Nine Hundred Ninety-Nine'],
    [100000, 'One Lakh'],
    [1234567, 'Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven'],
    [9999999, 'Ninety-Nine Lakh Ninety-Nine Thousand Nine Hundred Ninety-Nine'],
    [10000000, 'One Crore'],
    [100000000, 'Ten Crore'],
    [1000000000, 'One Hundred Crore'],
    [1000000000000, 'One Lakh Crore'],
  ])('toWords(%i) === %s', (input, expected) => {
    expect(toWords(input)).toBe(expected);
  });

  it('handles negatives, decimals and huge strings', () => {
    expect(toWords(-1234567)).toBe('Minus Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven');
    expect(toWords(12.5)).toBe('Twelve Point Five');
    expect(toWords(0.05)).toBe('Zero Point Zero Five');
    expect(toWords(-0.5)).toBe('Minus Zero Point Five');
    expect(toWords('10000000000000')).toBe('Ten Lakh Crore');
    expect(() => toWords(10n as never)).toThrow(TypeError);
  });

  it('supports casing and suffix options', () => {
    expect(toWords(42, { casing: 'lower' })).toBe('forty-two');
    expect(toWords(42, { casing: 'upper' })).toBe('FORTY-TWO');
    expect(toWords(42, { casing: 'title' })).toBe('Forty-Two');
    expect(toWords(42, { suffix: 'Only' })).toBe('Forty-Two Only');
    expect(toWords(42, { suffix: '' })).toBe('Forty-Two');
  });

  it('rejects an unknown casing', () => {
    expect(() => toWords(42, { casing: 'noCase' as never })).toThrow(/must be "title"/);
  });
});

describe('toCurrencyWords', () => {
  it.each([
    [150.5, 'One Hundred Fifty Rupees and Fifty Paise Only'],
    [1, 'One Rupee Only'],
    [1.01, 'One Rupee and One Paisa Only'],
    [0, 'Zero Rupees Only'],
    [0.5, 'Zero Rupees and Fifty Paise Only'],
    [-5.5, 'Minus Five Rupees and Fifty Paise Only'],
    [1234, 'One Thousand Two Hundred Thirty-Four Rupees Only'],
    [150.505, 'One Hundred Fifty Rupees and Fifty-One Paise Only'],
    [99.999, 'One Hundred Rupees Only'],
    [1234567.89, 'Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven Rupees and Eighty-Nine Paise Only'],
  ])('toCurrencyWords(%s) === %s', (input, expected) => {
    expect(toCurrencyWords(input)).toBe(expected);
  });

  it('supports casing and a custom suffix', () => {
    expect(toCurrencyWords(1, { casing: 'upper' })).toBe('ONE RUPEE ONLY');
    expect(toCurrencyWords(1, { suffix: '' })).toBe('One Rupee');
    expect(toCurrencyWords(1, { suffix: 'in total' })).toBe('One Rupee in total');
  });

  it('accepts formatted input', () => {
    expect(toCurrencyWords('₹12,34,567.50')).toBe(
      'Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven Rupees and Fifty Paise Only',
    );
  });
});

describe('regressions', () => {
  it('never prints a negative zero after rounding', () => {
    expect(formatIndian('-0.001', { decimals: 2 })).toBe('0.00');
    expect(formatIndian('-0.004', { decimals: 2 })).toBe('0.00');
    expect(formatIndian('-0.006', { decimals: 2 })).toBe('-0.01');
    expect(toCurrency('-0.001')).toBe('₹0.00');
    expect(toCompact('-0.4', { decimals: 0 })).toBe('0');
    expect(toCurrencyWords(-0.001)).toBe('Zero Rupees Only');
  });

  it('keeps the fraction width when a carry starts from zero', () => {
    expect(formatIndian(0.006, { decimals: 2 })).toBe('0.01');
    expect(formatIndian(0.006, { decimals: 4 })).toBe('0.0060');
    expect(formatIndian(0.0009, { decimals: 3 })).toBe('0.001');
    expect(toCurrency(0.005)).toBe('₹0.01');
  });

  it('treats separators literally instead of as replacement patterns', () => {
    for (const separator of ['$&', '$1', '$$', "$'", '$`', '$<x>']) {
      expect(formatIndian(1234567, { separator })).toBe(`12${separator}34${separator}567`);
    }
  });

  it('picks a compact unit after rounding, not before', () => {
    expect(toCompact(999.999)).toBe('1 K');
    expect(toCompact(99999.999)).toBe('1 L');
  });

  it('strips leading zeros when grouping bare digit strings', () => {
    expect(groupIndian('0012345')).toBe('12,345');
    expect(groupIndian('000')).toBe('0');
  });

  it('reports oversized values as too large, not as non-finite', () => {
    expect(() => formatIndian('1e999')).toThrow('indian-number-kit: number is too large');
    expect(formatIndian(1e308).replace(/,/g, '')).toHaveLength(309);
  });

  it('rejects options of the wrong type instead of printing them', () => {
    expect(() => toCurrency(1, { symbol: null as never })).toThrow(RangeError);
    expect(() => toCurrency(1, { symbol: 5 as never })).toThrow(/must be a string or false/);
    expect(() => formatIndian(1, { separator: 5 as never })).toThrow(/must be a string/);
    expect(() => toWords(1, { suffix: 5 as never })).toThrow(/must be a string/);
  });

  it('parseIndian never returns negative zero', () => {
    expect(Object.is(parseIndian('-0'), -0)).toBe(false);
    expect(parseIndian('-0')).toBe(0);
  });
});
