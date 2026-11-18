/**
 * Property and fuzz tests. Each one compares a public function against an
 * independent reference implementation or a different tool (`Intl`), so a
 * regression in the core algorithms fails loudly instead of passing by
 * coincidence.
 *
 * The generator is a fixed-seed LCG, so failures are reproducible.
 */
import { describe, expect, it } from 'vitest';
import { formatIndian, parseIndian, toCompact, toCurrency, toCurrencyWords, toWords } from '../src/index.js';

/** Deterministic pseudo-random generator (same numbers on every run). */
function makeRandom(seed = 12345): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

const ONE = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TY = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/** Independent number-to-words implementation used as an oracle. */
function refWords(value: number | bigint): string {
  let n = BigInt(value);
  if (n === 0n) return 'Zero';

  const belowHundred = (x: bigint): string => {
    const v = Number(x);
    if (v < 20) return ONE[v]!;
    return TY[Math.floor(v / 10)]! + (v % 10 ? `-${ONE[v % 10]}` : '');
  };
  const belowThousand = (x: bigint): string => {
    const v = Number(x);
    const hundreds = Math.floor(v / 100);
    const rest = v % 100;
    return [hundreds ? `${ONE[hundreds]} Hundred` : '', rest ? belowHundred(BigInt(rest)) : '']
      .filter(Boolean)
      .join(' ');
  };

  const crore = n / 10_000_000n;
  n %= 10_000_000n;
  const lakh = n / 100_000n;
  n %= 100_000n;
  const thousand = n / 1000n;
  n %= 1000n;

  return [
    crore ? `${refWords(crore)} Crore` : '',
    lakh ? `${belowHundred(lakh)} Lakh` : '',
    thousand ? `${belowHundred(thousand)} Thousand` : '',
    n ? belowThousand(n) : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Independent half-away-from-zero rounding of a decimal digit string. */
function refRound(intDigits: string, fracDigits: string, decimals: number): string {
  const padded = fracDigits.padEnd(decimals + 1, '0').slice(0, decimals + 1);
  const scaled = BigInt(intDigits) * 10n ** BigInt(decimals + 1) + BigInt(padded || '0');
  const rounded = (scaled + 5n) / 10n;
  const digits = rounded.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals);
  return decimals === 0 ? whole : `${whole}.${fraction}`;
}

describe('grouping matches Intl en-IN', () => {
  const intl = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  it('agrees on 20000 random integers up to 10^15', () => {
    const random = makeRandom();
    for (let i = 0; i < 20000; i += 1) {
      const value = Math.floor(random() * 10 ** (1 + Math.floor(random() * 15)));
      expect(formatIndian(value), `value ${value}`).toBe(intl.format(value));
    }
  });

  it('agrees on the boundaries of every group', () => {
    for (const value of [
      0, 1, 9, 99, 100, 999, 1000, 9999, 99999, 100000, 999999, 1000000, 9999999,
      10000000, 100000000, 1000000000, 1e12, 1e15,
    ]) {
      expect(formatIndian(value), `value ${value}`).toBe(intl.format(value));
    }
  });
});

describe('rounding matches an independent implementation', () => {
  it('agrees on 20000 random decimal strings', () => {
    const random = makeRandom(777);
    for (let i = 0; i < 20000; i += 1) {
      const intLength = 1 + Math.floor(random() * 6);
      const fracLength = Math.floor(random() * 6);
      let intDigits = String(1 + Math.floor(random() * 9));
      for (let d = 1; d < intLength; d += 1) intDigits += Math.floor(random() * 10);
      if (random() < 0.4) intDigits = '0';
      const fracDigits = Array.from({ length: fracLength }, () => Math.floor(random() * 10)).join('');
      const decimals = Math.floor(random() * 5);
      const value = Number(`${intDigits}${fracDigits ? `.${fracDigits}` : ''}`);

      const expected = refRound(intDigits, fracDigits, decimals);
      expect(formatIndian(value, { decimals }).replace(/,/g, ''), `value ${value} @${decimals}`).toBe(
        expected,
      );
    }
  });
});

describe('number to words matches an independent implementation', () => {
  it('agrees on 5000 random integers up to 10^12', () => {
    const random = makeRandom(4242);
    for (let i = 0; i < 5000; i += 1) {
      const value = Math.floor(random() * 10 ** (1 + Math.floor(random() * 12)));
      expect(toWords(value), `value ${value}`).toBe(refWords(value));
    }
  });

  it('agrees on the word boundaries', () => {
    for (const value of [
      0, 1, 9, 10, 19, 20, 21, 99, 100, 101, 115, 999, 1000, 1001, 99999, 100000,
      100001, 999999, 1000000, 9999999, 10000000, 10000001,
    ]) {
      expect(toWords(value), `value ${value}`).toBe(refWords(value));
    }
  });

  it('agrees on 1000 random rupee amounts', () => {
    const random = makeRandom(99);
    for (let i = 0; i < 1000; i += 1) {
      const amount = Math.floor(random() * 1_000_000) / 100;
      const rupees = Math.floor(amount + 1e-9);
      const paise = Math.round((amount - rupees) * 100);
      const expected =
        `${refWords(rupees)} ${rupees === 1 ? 'Rupee' : 'Rupees'}` +
        (paise ? ` and ${refWords(paise)} ${paise === 1 ? 'Paisa' : 'Paise'}` : '') +
        ' Only';
      expect(toCurrencyWords(amount), `amount ${amount}`).toBe(expected);
    }
  });
});

describe('round trips', () => {
  it('parseIndian(formatIndian(x, { decimals: 2 })) === x', () => {
    const random = makeRandom(31337);
    for (let i = 0; i < 2000; i += 1) {
      const value = Math.round((random() * 2 - 1) * 1e7 * 100) / 100;
      expect(Math.abs(parseIndian(formatIndian(value, { decimals: 2 })) - value)).toBeLessThanOrEqual(
        0.005,
      );
    }
  });

  it('parseIndian(toCurrency(x)) === x', () => {
    const random = makeRandom(2024);
    for (let i = 0; i < 1000; i += 1) {
      const value = Math.round((random() * 2 - 1) * 1e9 * 100) / 100;
      expect(Math.abs(parseIndian(toCurrency(value)) - value)).toBeLessThanOrEqual(0.005);
    }
  });

  it('exponent notation keeps the original value', () => {
    const random = makeRandom(555);
    for (let i = 0; i < 500; i += 1) {
      const mantissa = (1 + Math.floor(random() * 9000)) / 1000;
      const exponent = -9 + Math.floor(random() * 30);
      const value = Number(`${mantissa}e${exponent}`);
      const text = formatIndian(value).replace(/,/g, '');
      expect(Math.abs(Number(text) - value)).toBeLessThanOrEqual(Math.abs(value) * 1e-12);
    }
  });
});

describe('compact boundaries', () => {
  it('rounds before picking a unit, so 999.999 becomes 1 K', () => {
    expect(toCompact(999.999)).toBe('1 K');
    expect(toCompact(999.4)).toBe('999.4');
    expect(toCompact(99999.999)).toBe('1 L');
    expect(toCompact(999999.9)).toBe('10 L');
    expect(toCompact(99999999.9)).toBe('10 Cr');
  });

  it('agrees with itself in long form', () => {
    const random = makeRandom(8080);
    for (let i = 0; i < 1000; i += 1) {
      const value = Math.floor(random() * 1e12);
      const short = toCompact(value, { style: 'short' });
      const long = toCompact(value, { style: 'long' });
      expect(short.split(' ')[0]).toBe(long.split(' ')[0]);
      const unit = short.split(' ')[1] ?? '';
      const longForm: Record<string, string> = { K: 'Thousand', L: 'Lakh', Cr: 'Crore' };
      expect(long.split(' ')[1] ?? '').toBe(longForm[unit] ?? '');
    }
  });
});
