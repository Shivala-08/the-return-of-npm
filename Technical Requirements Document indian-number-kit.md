# Technical Requirements Document: indian-number-kit

*Version 1.0 · Status: Draft · Author: \[Your name\] · Date: November 18, 2026 · Companion to the PRD*

## 1. Purpose

This document describes how **indian-number-kit** will be built: the architecture, public API, algorithms, tooling, testing strategy and release process. It implements the requirements F1 to F7 in the PRD.

## 2. Technology Stack

| Area | Choice | Reason |
| --- | --- | --- |
| Language | TypeScript 5.x | Types ship with the package; fewer bugs |
| Runtime | Node.js 18+ and modern browsers | Matches current LTS |
| Build | `tsup` | Produces ESM, CJS and `.d.ts` in one command |
| Tests | Vitest | Fast, TypeScript-friendly, built-in coverage |
| Lint and format | ESLint and Prettier | Consistent style |
| CI | GitHub Actions | Free, runs tests on every push |
| Runtime dependencies | None | Keeps the package tiny |

If you prefer plain JavaScript, drop TypeScript and `tsup`, write JSDoc comments, and add a hand-written `index.d.ts`.

## 3. Project Structure

```
indian-number-kit/
├── src/
│   ├── index.ts          # public exports
│   ├── format.ts         # digit grouping, currency, compact
│   ├── words.ts          # number to words
│   ├── parse.ts          # string to number
│   ├── validate.ts       # input normalisation and errors
│   └── types.ts          # option and return types
├── test/
│   ├── format.test.ts
│   ├── words.test.ts
│   └── parse.test.ts
├── .github/workflows/ci.yml
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
└── CHANGELOG.md
```

## 4. Public API

All functions are named exports from the package root.

```ts
formatIndian(value: number | string, options?: FormatOptions): string
toWords(value: number | string, options?: WordsOptions): string
toCurrency(value: number | string, options?: CurrencyOptions): string
toCurrencyWords(value: number | string, options?: WordsOptions): string
toCompact(value: number | string, options?: CompactOptions): string
parseIndian(input: string): number
```

### Options

```ts
interface FormatOptions {
  decimals?: number;      // default: keep input decimals
  separator?: string;     // default: ","
}

interface CurrencyOptions extends FormatOptions {
  symbol?: string | false; // default: "₹"
  decimals?: number;       // default: 2
}

interface WordsOptions {
  casing?: 'title' | 'lower' | 'upper'; // default: 'title'
  suffix?: string;                      // e.g. "Only"
}

interface CompactOptions {
  decimals?: number;                    // default: 2, trailing zeros trimmed
  style?: 'short' | 'long';             // "Cr" vs "Crore"
}
```

### Example calls and outputs

| Call | Output |
| --- | --- |
| `formatIndian(1234567)` | `"12,34,567"` |
| `formatIndian(-1234567.891, { decimals: 2 })` | `"-12,34,567.89"` |
| `toCurrency(1234567.5)` | `"₹12,34,567.50"` |
| `toWords(1234567)` | `"Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven"` |
| `toCurrencyWords(150.5)` | `"One Hundred Fifty Rupees and Fifty Paise Only"` |
| `toCompact(12500000)` | `"1.25 Cr"` |
| `parseIndian("₹12,34,567.50")` | `1234567.5` |

## 5. Design and Algorithms

### 5.1 Input normalisation (validate.ts)

Every public function first passes its input through one shared normaliser so behaviour is consistent:

1. Accept `number` or `string`. For strings, strip whitespace, commas, and a leading ₹ or "Rs".
2. Reject `NaN`, `Infinity` and empty or non-numeric strings by throwing `TypeError('indian-number-kit: expected a finite number, received <value>')`.
3. Split into `sign`, `integerPart` (string of digits) and `fractionPart` (string of digits, possibly empty).
4. Numbers are converted with `String(value)`; if the result uses exponent notation (e.g. `1e21`), expand it to plain digits. Working on digit strings avoids floating-point drift.

### 5.2 Digit grouping (format.ts)

The Indian system groups the last 3 digits, then every 2 digits moving left.

1. Take the `integerPart` string.
2. If its length is 3 or fewer, return it unchanged.
3. Split off the last 3 digits as `tail`; the remaining digits are `head`.
4. Insert a separator every 2 digits in `head`, counting from the right (a regex such as `/\B(?=(\d{2})+(?!\d))/g` does this).
5. Join as `head + separator + tail`, then append the fraction and sign.

Example: `1234567` → tail `567`, head `1234` → `12,34` → `12,34,567`.

### 5.3 Rounding

When `decimals` is smaller than the input's fraction length, round half away from zero on the digit string (not with `Math.round` or `toFixed`, which can misround values like 1.005). Carry into the integer part if needed (e.g. 99.999 at 2 decimals → 100.00).

### 5.4 Number to words (words.ts)

Units in the Indian system, from largest to smallest: Crore (10,000,000), Lakh (100,000), Thousand (1,000), Hundred (100).

1. Define arrays for `ones` (zero to nineteen) and `tens` (twenty to ninety).
2. Write a helper `belowHundred(n)` that returns words for 0 to 99, joining tens and ones with a hyphen (e.g. "Thirty-Four").
3. Write `belowThousand(n)` that returns "X Hundred" plus `belowHundred(remainder)`.
4. Break the integer using divisions: `crore = floor(n / 10^7)`, `lakh = floor((n % 10^7) / 10^5)`, `thousand = floor((n % 10^5) / 10^3)`, `rest = n % 10^3`.
5. Join the non-zero parts with their unit names. Because a crore count can itself exceed 99, call the routine recursively on the crore part (for example, 1,00,00,00,000 is "One Hundred Crore", and 100 Crore is read as "One Hundred Crore").
6. Use `BigInt` for the arithmetic so inputs above `Number.MAX_SAFE_INTEGER` work when passed as strings.
7. Prefix "Minus" for negatives; return "Zero" for 0.

For `toCurrencyWords`, convert the integer part as rupees and the first two fraction digits (after rounding) as paise: "... Rupees and ... Paise Only". Use the singular "Rupee" and "Paisa" when the value is exactly 1.

### 5.5 Compact format

| Absolute value | Suffix (short) | Suffix (long) | Divisor |
| --- | --- | --- | --- |
| 1,000 and above | K | Thousand | 10^3 |
| 1,00,000 and above | L | Lakh | 10^5 |
| 1,00,00,000 and above | Cr | Crore | 10^7 |

Pick the largest threshold not exceeding the value, divide, round to `decimals`, and trim trailing zeros (so "1.50 Cr" becomes "1.5 Cr"). Values below 1,000 are returned as plain numbers.

### 5.6 Parsing (parse.ts)

Strip the currency symbol, whitespace and separators, validate with `/^-?\d+(\.\d+)?$/`, then convert with `Number()`. Throw a `TypeError` on failure. A compact-suffix parser ("1.5 Cr" → 15000000) can be added as a stretch goal.

## 6. package.json Configuration

```json
{
  "name": "indian-number-kit",
  "version": "1.0.0",
  "description": "Format, convert and parse numbers in the Indian numbering system (lakh, crore).",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "sideEffects": false,
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --clean",
    "test": "vitest run --coverage",
    "lint": "eslint src test",
    "prepublishOnly": "npm run lint && npm test && npm run build"
  },
  "keywords": ["indian", "lakh", "crore", "number-format", "currency", "rupee", "number-to-words"],
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/<username>/indian-number-kit.git" }
}
```

The `prepublishOnly` script makes sure lint, tests and the build all pass before anything is published.

## 7. Testing Strategy

- **Unit tests** for every public function, with table-driven cases.
- **Boundary values:** 0, 1, 9, 10, 19, 20, 99, 100, 999, 1,000, 99,999, 1,00,000, 99,99,999, 1,00,00,000, and `Number.MAX_SAFE_INTEGER`.
- **Negative numbers and decimals,** including rounding cases such as 1.005, 0.1 + 0.2 and 99.999.
- **Invalid input:** NaN, Infinity, null, undefined, "abc", empty string; each must throw a `TypeError`.
- **Round trip:** `parseIndian(formatIndian(x)) === x` for a set of random numbers.
- **Coverage target:** 95% or more for lines and branches.
- **Package check:** after building, run `npm pack` and install the tarball in a fresh folder to confirm both `import` and `require` work.

## 8. CI and Release Process

1. **CI workflow:** on every push and pull request, run install, lint, test and build on Node 18, 20 and 22.
2. **Pre-release checks:** run `npm pack --dry-run` and confirm only `dist`, `README.md`, `LICENSE` and `package.json` are included.
3. **Versioning:** follow semantic versioning. Use `npm version patch | minor | major`, which updates `package.json` and creates a git tag.
4. **Publishing:** `npm login`, then `npm publish` (add `--access public` for a scoped name). Two-factor authentication is required.
5. **Post-release:** install the published version in a clean folder, update `CHANGELOG.md`, and push the tag to GitHub.

## 9. Documentation Requirements

The README should contain: a one-line description, badges (npm version, downloads, licence, CI status), installation, quick-start examples for each function, the full API reference with options, supported environments, contribution notes and the licence.

## 10. Security and Quality Considerations

- No `eval`, no dynamic code execution, no network or file-system access.
- No runtime dependencies, so no supply-chain exposure from third-party packages.
- Inputs are validated strictly; there is no ReDoS risk because all regular expressions are simple and run on length-bounded strings (reject inputs longer than 100 characters).
- Enable npm provenance (`npm publish --provenance`) if publishing from GitHub Actions.

## 11. Risks and Technical Decisions

| Decision or risk | Choice |
| --- | --- |
| Float precision | Work on digit strings and `BigInt`, never on floating-point arithmetic for formatting |
| ESM and CJS support | Dual build with an `exports` map |
| Very large numbers | Accept strings; document that `number` inputs are limited to safe integers |
| Bundle size | No dependencies; verify with `npm pack` and a bundle-size check in CI |
| Name collision | Check `npm view` early and fall back to a scoped name |

## 12. Implementation Checklist

- [ ] Initialise repo, TypeScript, tsup, Vitest, ESLint
- [ ] Implement the input normaliser
- [ ] Implement `formatIndian` and rounding
- [ ] Implement `toCurrency`
- [ ] Implement `toWords` and `toCurrencyWords`
- [ ] Implement `toCompact`
- [ ] Implement `parseIndian`
- [ ] Write tests and reach the coverage target
- [ ] Write README and CHANGELOG
- [ ] Configure GitHub Actions
- [ ] Run `npm pack --dry-run`, publish and verify the install
