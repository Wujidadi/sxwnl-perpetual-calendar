// 對照 tests/fixtures/golden.json 的 tools 樣本，
// 驗證 src/utils/year-conv.js 與 src/utils/time.js 的輸出 bit-exact 一致。

import { test } from 'node:test';
import { strictEqual } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { civilToAstroYear, astroToCivilYear } from '../src/utils/year-conv.js';
import { parseTimeToHours } from '../src/utils/time.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(await readFile(join(__dirname, 'fixtures', 'golden.json'), 'utf-8'));
const samples = golden.samples.tools;

test('civilToAstroYear: 對照 golden.json 樣本', () => {
  for (const [input, expected] of Object.entries(samples.year2Ayear)) {
    const arg = JSON.parse(input);
    strictEqual(civilToAstroYear(arg), expected, `civilToAstroYear(${input})`);
  }
});

test('astroToCivilYear: 對照 golden.json 樣本', () => {
  for (const [input, expected] of Object.entries(samples.Ayear2year)) {
    const arg = Number(input);
    strictEqual(astroToCivilYear(arg), expected, `astroToCivilYear(${input})`);
  }
});

test('parseTimeToHours: 對照 golden.json 樣本', () => {
  for (const [input, expected] of Object.entries(samples.timeStr2hour)) {
    const arg = JSON.parse(input);
    strictEqual(parseTimeToHours(arg), expected, `parseTimeToHours(${input})`);
  }
});
