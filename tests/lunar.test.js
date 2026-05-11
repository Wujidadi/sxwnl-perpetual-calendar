// 對照 tests/fixtures/golden.json 的 lunar 樣本，
// 驗證 src/lunar/lunar-month.js 的 LunarMonth.calcMonth(2024, 2) 輸出 bit-exact 一致。

import { test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { LunarMonth } from '../src/lunar/lunar-month.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(await readFile(join(__dirname, 'fixtures', 'golden.json'), 'utf-8'));
const expected = golden.samples.lunar['Lunar.yueLiCalc(2024,2)'];

// 新版日物件鍵名與 golden.json 中舊版鍵名的對映。
const DAY_FIELD_MAP = {
  d:       'day',
  di:      'dayIndex',
  week:    'weekday',
  Ldi:     'lunarDayIndex',
  Ldc:     'lunarDayName',
  Lmc:     'lunarMonthName',
  Lleap:   'lunarLeap',
  Lyear:   'lunarYearNum',
  Lyear2:  'lunarYearGanZhi',
  Lmonth:  'lunarMonthNum',
  Lmonth2: 'lunarMonthGanZhi',
  Lday2:   'lunarDayGanZhi',
  XiZ:     'zodiacSign',
  Hyear:   'hijriYear',
  Hmonth:  'hijriMonth',
  Hday:    'hijriDay',
  yxmc:    'moonPhaseName',
  yxsj:    'moonPhaseTimeStr',
  jqmc:    'solarTermName',
  jqsj:    'solarTermTimeStr',
  A:       'holidayA',
  B:       'holidayB',
  C:       'holidayC',
};

function projectDay(day, sampleKeys) {
  const out = {};
  for (const oldKey of sampleKeys) {
    const newKey = DAY_FIELD_MAP[oldKey];
    out[oldKey] = day[newKey];
  }
  return out;
}

test('LunarMonth.calcMonth(2024, 2): 月對象頂層欄位 bit-exact', () => {
  const m = new LunarMonth();
  m.calcMonth(2024, 2);
  strictEqual(m.year,          expected.y);
  strictEqual(m.month,         expected.m);
  strictEqual(m.monthLength,   expected.dn);
  strictEqual(m.firstWeekday,  expected.w0);
  strictEqual(m.yearGanZhi,    expected.Ly);
  strictEqual(m.zodiacAnimal,  expected.ShX);
});

test('LunarMonth.calcMonth(2024, 2): 29 個日物件 bit-exact', () => {
  const m = new LunarMonth();
  m.calcMonth(2024, 2);
  strictEqual(m.monthLength, expected.dn);
  const sampleKeys = Object.keys(expected.days[0]);
  for (let i = 0; i < expected.dn; i++) {
    deepStrictEqual(projectDay(m.days[i], sampleKeys), expected.days[i], `day ${i + 1}`);
  }
});
