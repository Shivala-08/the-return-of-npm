# Product Requirements Document: indian-number-kit

*Version 1.0 · Status: Draft · Author: \[Your name\] · Date: November 18, 2026*

## 1. Overview

**indian-number-kit** is a small, dependency-free npm package that formats, converts and parses numbers using the Indian numbering system (lakhs and crores). It gives JavaScript and TypeScript developers one reliable toolkit for showing numbers the way people in India read and write them.

The package name is a working title. Check availability with `npm view indian-number-kit` before publishing, or use a scoped name such as `@yourusername/indian-number-kit`.

## 2. Problem Statement

Indian users read numbers in groups of 2 digits after the first 3 (for example, 12,34,567 and not 1,234,567). Developers building apps for Indian audiences (fintech, e-commerce, invoicing, dashboards) need this often, but the options today are weak:

- `toLocaleString('en-IN')` handles digit grouping but cannot convert numbers to words (needed on cheques and invoices) or produce compact forms such as "1.2 Cr".
- Existing packages are often outdated, large, lack TypeScript types, or solve only one part of the problem.
- Developers end up copy-pasting fragile regex snippets from Stack Overflow.

## 3. Goals and Non-Goals

### Goals

- Provide correct Indian-style digit grouping, number-to-words, currency formatting, compact formatting and parsing.
- Ship with zero runtime dependencies and a tiny bundle size (target under 3 KB minified).
- Include TypeScript type definitions and work in Node.js and modern browsers.
- Provide clear documentation with copy-paste examples.
- Reach high test coverage (target 95% or more).

### Non-Goals (v1)

- Full internationalisation for other locales (only English-language output in v1).
- Number-to-words in Hindi or other Indian languages (candidate for a later version).
- Currency conversion or live exchange rates.
- Date, phone or ID-number utilities.

## 4. Target Users

- **Frontend and full-stack developers** building Indian-market apps who need correct number display.
- **Backend developers** generating invoices, receipts or PDFs that need amounts in words.
- **Students and learners** who want a small, readable open-source library as a reference.

## 5. User Stories

- As a developer, I want to format 1234567 as "12,34,567" so my dashboard looks natural to Indian users.
- As a developer, I want to convert 1234567 into words so I can print amounts on invoices.
- As a developer, I want to show 12500000 as "1.25 Cr" so large numbers stay readable in cards and charts.
- As a developer, I want to add the rupee symbol and paise automatically so I do not write currency logic myself.
- As a developer, I want to parse "12,34,567" back into a number so I can process user input.
- As a TypeScript user, I want built-in types so I get autocomplete and compile-time safety.

## 6. Functional Requirements

| ID | Feature | Description | Example | Priority |
| --- | --- | --- | --- | --- |
| F1 | Digit grouping | Format a number with Indian comma placement | 1234567 → "12,34,567" | Must |
| F2 | Number to words | Convert a number to English words using lakh/crore | 1234567 → "Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven" | Must |
| F3 | Currency format | Add ₹ symbol and 2 decimal places (paise) | 1234567.5 → "₹12,34,567.50" | Must |
| F4 | Compact format | Shorten large numbers to K, L, Cr | 12500000 → "1.25 Cr" | Should |
| F5 | Parse | Convert a formatted string back to a number | "₹12,34,567.50" → 1234567.5 | Should |
| F6 | Currency in words | Rupees and paise in words | 150.50 → "One Hundred Fifty Rupees and Fifty Paise Only" | Should |
| F7 | Options | Control decimals, symbol, casing and separator | `{ decimals: 0, symbol: false }` | Could |

### Behaviour rules

- Negative numbers are supported (-1234567 → "-12,34,567"; in words, prefixed with "Minus").
- Zero is handled correctly ("Zero" in words).
- Decimals are supported in formatting; in words, the decimal part is read digit by digit or as paise for currency.
- Invalid input (NaN, Infinity, non-numeric strings) throws a clear `TypeError` with a helpful message.
- Numeric strings such as "1234567" are accepted as input.

## 7. Non-Functional Requirements

- **Size:** under 3 KB minified, with no runtime dependencies.
- **Compatibility:** Node.js 18 and above; modern browsers; ESM and CommonJS builds.
- **Performance:** each call completes in well under 1 ms for typical inputs.
- **Quality:** automated tests for all features and edge cases; code linted and formatted.
- **Documentation:** README with install steps, API reference, examples and badges.
- **Licence:** MIT.

## 8. Success Metrics

For an assignment, success is mostly about delivery and quality:

- Package is published on npm and installable with `npm install`.
- All must-have features work and are covered by tests.
- README is clear enough that a new user can use the package within 2 minutes.
- Stretch goals: first 50 weekly downloads, one GitHub star, or one external user or issue.

## 9. Milestones

| Milestone | Deliverable | Target |
| --- | --- | --- |
| M1 | Project setup, repo, `package.json`, lint and test tooling | Day 1 |
| M2 | F1, F2, F3 implemented with tests | Day 2 |
| M3 | F4, F5, F6 implemented with tests | Day 3 |
| M4 | README, TypeScript types, build for ESM and CJS | Day 4 |
| M5 | `npm pack --dry-run` review, publish v1.0.0, verify install | Day 5 |

## 10. Risks and Mitigations

- **Name already taken on npm.** Check early; fall back to a scoped name.
- **Scope creep.** Keep v1 limited to the must-have and should-have features.
- **Floating-point errors with decimals.** Handle decimals as strings internally (see the TRD).
- **Incorrect number-to-words output.** Cover boundary values (99, 100, 999, 1000, 99999, 100000, 9999999, 10000000) with tests.

## 11. Open Questions

- Should v1 support numbers beyond `Number.MAX_SAFE_INTEGER` through string or BigInt input?
- Should the "Only" suffix in currency words be configurable?
- Should Hindi number words be a v1.1 feature?
