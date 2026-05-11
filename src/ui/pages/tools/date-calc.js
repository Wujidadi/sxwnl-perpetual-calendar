// 工具：日期換算（JD ↔ 公曆、日期偏移、年內積日、兩日期相減）。

import { gregorianToJD, formatJD } from '../../../astro/julian-day.js';
import { civilToAstroYear } from '../../../utils/year-conv.js';
import { parseTimeToHours } from '../../../utils/time.js';

// 將儒略日轉為公曆字串。
export function convertJDToDate(jd) {
  if (jd < 0) return '不能為負';
  return formatJD(jd);
}

// 將公曆 (y, m, d, time) 轉為儒略日。y 可為字串（含「B」字首的普通紀年）或數值。
export function gregorianToJDInput(y, m, d, time) {
  const ay = civilToAstroYear(y);
  const day = Number(d) + parseTimeToHours(time) / 24;
  return gregorianToJD(ay, Number(m), day);
}

// 日期偏移計算：傳入起算 JD 與 (y, m, d, time)，回傳偏移後的儒略日字串。
export function calculateDateOffset(baseJD, y, m, d, time) {
  const jd = gregorianToJDInput(y, m, d, time);
  const result = jd - Number(baseJD);
  if (result >= 0) return result + ' (' + formatJD(result) + ')';
  return String(result);
}

// 年內積日：傳入 (y, m, d, time)，回傳該日為當年第幾天。
export function dayOfYear(y, m, d, time) {
  const jd = gregorianToJDInput(y, m, d, time);
  const ay = civilToAstroYear(y);
  return jd - gregorianToJD(ay, 1, 1.5) + 1;
}

// 兩個日期相減（JD 差）。
export function dateDiff(y1, m1, d1, t1, y2, m2, d2, t2) {
  const jd1 = gregorianToJDInput(y1, m1, d1, t1);
  const jd2 = gregorianToJDInput(y2, m2, d2, t2);
  return jd1 - jd2;
}
