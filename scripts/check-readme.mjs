import { formatIndian, toCurrency, toWords, toCurrencyWords, toCompact, parseIndian, groupIndian, integerToWords } from 'indian-number-kit';

const cases = [
  ['formatIndian(1234567)', formatIndian(1234567), '12,34,567'],
  ['toCurrency(1234567.5)', toCurrency(1234567.5), '₹12,34,567.50'],
  ['toWords(1234567)', toWords(1234567), 'Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven'],
  ['toCurrencyWords(150.5)', toCurrencyWords(150.5), 'One Hundred Fifty Rupees and Fifty Paise Only'],
  ['toCompact(12500000)', toCompact(12500000), '1.25 Cr'],
  ['parseIndian("₹12,34,567.50")', parseIndian('₹12,34,567.50'), 1234567.5],
  ['formatIndian(-1234567.891)', formatIndian(-1234567.891), '-12,34,567.891'],
  ['formatIndian(-1234567.891,{decimals:2})', formatIndian(-1234567.891, { decimals: 2 }), '-12,34,567.89'],
  ['formatIndian(1234567,{separator:" "})', formatIndian(1234567, { separator: ' ' }), '12 34 567'],
  ['formatIndian("₹12,34,567.50")', formatIndian('₹12,34,567.50'), '12,34,567.50'],
  ['formatIndian(1234,{decimals:2})', formatIndian(1234, { decimals: 2 }), '1,234.00'],
  ['toCurrency(0)', toCurrency(0), '₹0.00'],
  ['toCurrency(-42.5)', toCurrency(-42.5), '-₹42.50'],
  ['toCurrency(1234567.5,{symbol:false})', toCurrency(1234567.5, { symbol: false }), '12,34,567.50'],
  ['toCurrency(1234567.5,{symbol:"Rs. "})', toCurrency(1234567.5, { symbol: 'Rs. ' }), 'Rs. 12,34,567.50'],
  ['toCurrency(1234567.5,{decimals:0})', toCurrency(1234567.5, { decimals: 0 }), '₹12,34,568'],
  ['toWords(-42)', toWords(-42), 'Minus Forty-Two'],
  ['toWords(0)', toWords(0), 'Zero'],
  ['toWords(12.5)', toWords(12.5), 'Twelve Point Five'],
  ['toWords(42,{casing:"lower"})', toWords(42, { casing: 'lower' }), 'forty-two'],
  ['toWords(42,{suffix:"Only"})', toWords(42, { suffix: 'Only' }), 'Forty-Two Only'],
  ['toWords("10000000000000")', toWords('10000000000000'), 'Ten Lakh Crore'],
  ['toCurrencyWords(1)', toCurrencyWords(1), 'One Rupee Only'],
  ['toCurrencyWords(1.01)', toCurrencyWords(1.01), 'One Rupee and One Paisa Only'],
  ['toCurrencyWords(0)', toCurrencyWords(0), 'Zero Rupees Only'],
  ['toCurrencyWords(1,{suffix:""})', toCurrencyWords(1, { suffix: '' }), 'One Rupee'],
  ['toCompact(999)', toCompact(999), '999'],
  ['toCompact(1500)', toCompact(1500), '1.5 K'],
  ['toCompact(150000)', toCompact(150000), '1.5 L'],
  ['toCompact(12500000,{style:"long"})', toCompact(12500000, { style: 'long' }), '1.25 Crore'],
  ['toCompact(12500000,{decimals:0})', toCompact(12500000, { decimals: 0 }), '1 Cr'],
  ['toCompact(-12500000)', toCompact(-12500000), '-1.25 Cr'],
  ['parseIndian("12,34,567")', parseIndian('12,34,567'), 1234567],
  ['parseIndian("Rs 1,000")', parseIndian('Rs 1,000'), 1000],
  ['parseIndian("1.5 Cr")', parseIndian('1.5 Cr'), 15000000],
  ['parseIndian("25 lakh")', parseIndian('25 lakh'), 2500000],
  ['groupIndian("1234567")', groupIndian('1234567'), '12,34,567'],
  ['integerToWords(1234567n)', integerToWords(1234567n), 'Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven'],
];

let bad = 0;
for (const [label, actual, expected] of cases) {
  if (!Object.is(actual, expected)) {
    bad += 1;
    console.error(`MISMATCH ${label}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}
console.log(`${cases.length - bad}/${cases.length} README examples match`);
process.exit(bad ? 1 : 0);
