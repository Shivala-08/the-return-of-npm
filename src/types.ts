/** Options accepted by {@link formatIndian}. */
export interface FormatOptions {
  /**
   * Number of digits after the decimal point. Values are rounded half away
   * from zero. When omitted, the decimals present in the input are kept.
   */
  decimals?: number;
  /** Thousands/lakhs separator. Default: `","`. */
  separator?: string;
}

/** Options accepted by {@link toCurrency}. */
export interface CurrencyOptions extends FormatOptions {
  /** Currency symbol, or `false` to omit it. Default: `"₹"`. */
  symbol?: string | false;
}

/** Options accepted by {@link toWords} and {@link toCurrencyWords}. */
export interface WordsOptions {
  /** Letter casing of the output. Default: `"title"`. */
  casing?: 'title' | 'lower' | 'upper';
  /**
   * Text appended to the end of the result, e.g. `"Only"`. Pass `""` to
   * disable. Default: `"Only"` for {@link toCurrencyWords}, nothing for
   * {@link toWords}.
   */
  suffix?: string;
}

/** Options accepted by {@link toCompact}. */
export interface CompactOptions {
  /** Digits kept after the decimal point, trailing zeros trimmed. Default: `2`. */
  decimals?: number;
  /** `"short"` gives `"1.25 Cr"`, `"long"` gives `"1.25 Crore"`. Default: `"short"`. */
  style?: 'short' | 'long';
}

/** A value that any public function accepts. */
export type IndianNumberInput = number | string;
