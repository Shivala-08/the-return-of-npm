// Fails the build when the package grows past its budget.
//   raw  minified ESM : 6 KB ceiling (regression guard)
//   gzipped ESM       : 3 KB ceiling (what a user actually downloads)
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const file = '.size/index.js';
const raw = statSync(file).size;
const gzip = gzipSync(readFileSync(file)).length;

console.log(`minified: ${raw} B · gzipped: ${gzip} B`);

if (raw > 6144 || gzip > 3072) {
  console.error('bundle size budget exceeded');
  process.exit(1);
}
