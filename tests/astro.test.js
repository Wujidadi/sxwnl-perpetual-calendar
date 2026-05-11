// 對照 tests/fixtures/golden.json 的 julianDay 與 deltaT 樣本，
// 驗證 src/astro/julian-day.js 與 src/astro/delta-t.js 的輸出 bit-exact 一致。

import { test } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { gregorianToJD, jdToGregorian } from '../src/astro/julian-day.js';
import { deltaT } from '../src/astro/delta-t.js';
import { riseTransitSet } from '../src/astro/rise-set.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(await readFile(join(__dirname, 'fixtures', 'golden.json'), 'utf-8'));

// golden.json 沿用鍵名 Y/M/D/h/m/s；本檔將 jdToGregorian 輸出映射回該鍵名以比對。
function toGoldenKeys(g) {
  return { Y: g.year, M: g.month, D: g.day, h: g.hour, m: g.minute, s: g.second };
}

test('gregorianToJD: 對照 golden.json 樣本', () => {
  const cases = {
    'JD.JD(2000,1,1.5)':  [2000, 1, 1.5],
    'JD.JD(2024,1,1.0)':  [2024, 1, 1.0],
    'JD.JD(1582,10,15)':  [1582, 10, 15],
    'JD.JD(1582,10,4)':   [1582, 10, 4],
    'JD.JD(-4712,1,1.5)': [-4712, 1, 1.5],
  };
  for (const [key, args] of Object.entries(cases)) {
    const expected = golden.samples.julianDay[key];
    strictEqual(gregorianToJD(...args), expected, key);
  }
});

test('jdToGregorian: 對照 golden.json 樣本', () => {
  const cases = {
    'JD.DD(2451545)':   2451545,
    'JD.DD(2460311.5)': 2460311.5,
  };
  for (const [key, jd] of Object.entries(cases)) {
    const expected = golden.samples.julianDay[key];
    const actual = toGoldenKeys(jdToGregorian(jd));
    deepStrictEqual(actual, expected, key);
  }
});

test('deltaT: 對照 golden.json 樣本', () => {
  const cases = {
    'dt_T(0)':       0,
    'dt_T(8766)':    8766,
    'dt_T(-365250)': -365250,
    'dt_T(365250)':  365250,
  };
  for (const [key, t] of Object.entries(cases)) {
    const expected = golden.samples.deltaT[key];
    strictEqual(deltaT(t), expected, key);
  }
});

// 比對 riseSet 樣本：原樣本鍵為 SZJ.St 與 SZJ.Mt（北京 2024-01-01）。
function pickFields(obj, fields) {
  const out = {};
  for (const f of fields) if (f in obj) out[f] = obj[f];
  return out;
}

test('sunRTS: 對照 golden.json 樣本（北京 2024-01-01）', () => {
  riseTransitSet.longitude = (116.4 / 180) * Math.PI;
  riseTransitSet.latitude  = (39.9  / 180) * Math.PI;
  const jdRel = gregorianToJD(2024, 1, 1.5) - 2451545;
  const r = riseTransitSet.sunRTS(jdRel);
  const expected = golden.samples.riseSet['SZJ.St(北京,2024-01-01)'];
  const fields = ['s', 'j', 'z', 'x', 'c', 'h', 'c2', 'h2', 'c3', 'h3'];
  deepStrictEqual(pickFields(r, fields), expected);
});

test('moonRTS: 對照 golden.json 樣本（北京 2024-01-01）', () => {
  riseTransitSet.longitude = (116.4 / 180) * Math.PI;
  riseTransitSet.latitude  = (39.9  / 180) * Math.PI;
  const jdRel = gregorianToJD(2024, 1, 1.5) - 2451545;
  const r = riseTransitSet.moonRTS(jdRel);
  const expected = golden.samples.riseSet['SZJ.Mt(北京,2024-01-01)'];
  const fields = ['s', 'j', 'z', 'x'];
  deepStrictEqual(pickFields(r, fields), expected);
});
