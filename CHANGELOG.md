# Changelog

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-11-18

### Added

- `./package.json` is exported, so tooling that reads a package manifest
  (`require('indian-number-kit/package.json')`) no longer fails with
  `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- `publishConfig.access` pinned to `public`.

### Changed

- README links are absolute, so they resolve on the npm package page as well
  as on GitHub.

## [1.0.0] - 2026-11-18

### Added

- `formatIndian` — Indian digit grouping (`1234567` → `12,34,567`) with optional
  rounding and custom separators.
- `toWords` — English words in the lakh/crore system, with casing and suffix
  options.
- `toCurrency` — rupee symbol plus paise (`₹12,34,567.50`).
- `toCurrencyWords` — rupees and paise in words for invoices and cheques.
- `toCompact` — compact output in K / L / Cr or Thousand / Lakh / Crore.
- `parseIndian` — parse formatted strings back to numbers, including compact
  suffixes (`1.5 Cr` → `15000000`).
- `groupIndian` and `integerToWords` helpers.
- Dual ESM + CommonJS build with bundled TypeScript declarations.
- Exact decimal handling: values are processed as digit strings and `BigInt`, so
  there is no floating-point drift and inputs above `Number.MAX_SAFE_INTEGER`
  work as strings.
