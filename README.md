# indian-number-kit

> Format, convert and parse numbers in the Indian numbering system — lakhs and crores — in one tiny, type-safe package.

[![npm version](https://img.shields.io/npm/v/indian-number-kit.svg)](https://www.npmjs.com/package/indian-number-kit)
[![npm downloads](https://img.shields.io/npm/dm/indian-number-kit.svg)](https://www.npmjs.com/package/indian-number-kit)
[![CI](https://github.com/pallav/indian-number-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/pallav/indian-number-kit/actions/workflows/ci.yml)
[![licence](https://img.shields.io/npm/l/indian-number-kit.svg)](./LICENSE)
[![bundle size](https://img.shields.io/badge/gzip-2.4%20kB-brightgreen.svg)](#bundle-size)

Indian readers group digits as `12,34,567`, not `1,234,567`, and they say
"Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven". This package does
both, plus rupees, paise, compact forms and parsing. No dependencies, no
runtime surprises.

## Install

```bash
npm install indian-number-kit
```

Works in Node.js 18+ and every modern browser. Ships ESM, CommonJS and
TypeScript types.

## Quick start

```ts
import {
  formatIndian,
  toCurrency,
  toWords,
  toCurrencyWords,
  toCompact,
  parseIndian,
} from 'indian-number-kit';

formatIndian(1234567);                    // "12,34,567"
toCurrency(1234567.5);                    // "₹12,34,567.50"
toWords(1234567);                         // "Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven"
toCurrencyWords(150.5);                   // "One Hundred Fifty Rupees and Fifty Paise Only"
toCompact(12500000);                      // "1.25 Cr"
parseIndian('₹12,34,567.50');             // 1234567.5
```

CommonJS works too:

```js
const { formatIndian } = require('indian-number-kit');
```

## API

Every function accepts `number | string`. Strings may contain grouping commas,
whitespace and a `₹` / `Rs` / `INR` marker, so values copied straight from the
screen are fine. Invalid input (`NaN`, `Infinity`, `null`, `"abc"`, an empty
string) throws a `TypeError` that names the value it received.

### `formatIndian(value, options?)`

Indian digit grouping: last three digits, then groups of two.

```ts
formatIndian(1234567);                              // "12,34,567"
formatIndian(-1234567.891);                         // "-12,34,567.891"
formatIndian(-1234567.891, { decimals: 2 });        // "-12,34,567.89"
formatIndian(1234567, { separator: ' ' });          // "12 34 567"
formatIndian('₹12,34,567.50');                      // "12,34,567.50"
formatIndian(1234, { decimals: 2 });                // "1,234.00"
```

| Option      | Type     | Default           | Meaning                                                           |
| ----------- | -------- | ----------------- | ----------------------------------------------------------------- |
| `decimals`  | `number` | keep input digits | Digits after the point, rounded half away from zero               |
| `separator` | `string` | `","`             | Group separator                                                    |

### `toCurrency(value, options?)`

Rupee symbol, two decimals by default.

```ts
toCurrency(1234567.5);                    // "₹12,34,567.50"
toCurrency(0);                            // "₹0.00"
toCurrency(-42.5);                        // "-₹42.50"
toCurrency(1234567.5, { symbol: false }); // "12,34,567.50"
toCurrency(1234567.5, { symbol: 'Rs. ' });// "Rs. 12,34,567.50"
toCurrency(1234567.5, { decimals: 0 });   // "₹12,34,568"
```

Options: `symbol` (`string | false`, default `"₹"`), plus `decimals` (default
`2`) and `separator` from `formatIndian`.

### `toWords(value, options?)`

English words using lakh and crore.

```ts
toWords(1234567);                 // "Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven"
toWords(-42);                     // "Minus Forty-Two"
toWords(0);                       // "Zero"
toWords(12.5);                    // "Twelve Point Five"
toWords(42, { casing: 'lower' }); // "forty-two"
toWords(42, { suffix: 'Only' });  // "Forty-Two Only"
```

| Option   | Type                              | Default   | Meaning                        |
| -------- | --------------------------------- | --------- | ------------------------------ |
| `casing` | `'title' \| 'lower' \| 'upper'`   | `'title'` | Letter casing of the output    |
| `suffix` | `string`                          | none      | Text appended, e.g. `"Only"`   |

Values above `Number.MAX_SAFE_INTEGER` are supported when passed as strings:

```ts
toWords('10000000000000'); // "Ten Lakh Crore"
```

### `toCurrencyWords(value, options?)`

Amounts in words, for invoices and cheques. Paise are rounded to two digits and
dropped when zero.

```ts
toCurrencyWords(150.5);  // "One Hundred Fifty Rupees and Fifty Paise Only"
toCurrencyWords(1);      // "One Rupee Only"
toCurrencyWords(1.01);   // "One Rupee and One Paisa Only"
toCurrencyWords(0);      // "Zero Rupees Only"
toCurrencyWords(1, { suffix: '' }); // "One Rupee"
```

Options are the same as `toWords`; the default suffix is `"Only"`.

### `toCompact(value, options?)`

Short forms for cards, charts and dashboards.

```ts
toCompact(999);                       // "999"
toCompact(1500);                      // "1.5 K"
toCompact(150000);                    // "1.5 L"
toCompact(12500000);                  // "1.25 Cr"
toCompact(12500000, { style: 'long' });// "1.25 Crore"
toCompact(12500000, { decimals: 0 }); // "1 Cr"
toCompact(-12500000);                 // "-1.25 Cr"
```

| Option     | Type                  | Default   | Meaning                                  |
| ---------- | --------------------- | --------- | ---------------------------------------- |
| `decimals` | `number`              | `2`       | Digits kept, trailing zeros trimmed      |
| `style`    | `'short' \| 'long'`   | `'short'` | `"Cr"` vs `"Crore"`                      |

### `parseIndian(input)`

Turns formatted text back into a number.

```ts
parseIndian('₹12,34,567.50'); // 1234567.5
parseIndian('12,34,567');     // 1234567
parseIndian('Rs 1,000');      // 1000
parseIndian('1.5 Cr');        // 15000000
parseIndian('25 lakh');       // 2500000
```

Throws a `TypeError` when the string is not a number.

### Extras

```ts
import { groupIndian, integerToWords } from 'indian-number-kit';

groupIndian('1234567');       // "12,34,567"
integerToWords(1234567n);     // "Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven"
```

## Accuracy notes

- Formatting works on **digit strings and `BigInt`**, never on floating-point
  arithmetic, so `1.005` at two decimals rounds to `1.01` and
  `99.999` rounds to `100.00` as a person would expect.
- `number` inputs must be safe integers. Pass a **string** for anything larger;
  integer strings up to 100 characters are accepted.
- Exponent notation (`1e21`) is expanded to plain digits first, up to 400
  digits, so `1e308` formats correctly while `1e999` throws a clear
  `TypeError` instead of allocating a huge string.
- A value that rounds to zero never carries a minus sign: `-0.001` at two
  decimals is `0.00`, and `toCurrencyWords(-0.001)` is `"Zero Rupees Only"`.
- Options are type-checked: a non-string `separator`/`suffix` or a `symbol`
  that is not a string or `false` throws rather than producing odd output.

## Bundle size

| Build            | Size    |
| ---------------- | ------- |
| Minified ESM     | 5.6 kB  |
| Minified + gzip  | 2.4 kB  |
| Runtime deps     | 0       |

`npm run size` enforces the budget in CI (3 kB gzipped, 6 kB minified).

## Development

```bash
npm install
npm test          # run the test suite
npm run coverage  # tests with a 95% coverage gate (currently 100%)
                  # includes fuzz/property tests checked against Intl and
                  # independent reference implementations
npm run lint
npm run typecheck
npm run build     # dist/index.js, dist/index.cjs, dist/index.d.ts
```

## Contributing

Issues and pull requests are welcome. Please run `npm run coverage && npm run
lint` before opening a pull request — `prepublishOnly` runs the same checks.

## Licence

[MIT](./LICENSE)
