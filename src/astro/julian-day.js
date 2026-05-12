// 儒略日換算、日期格式化、星期相關。
//
// 所有函式皆為純函式，呼叫端自管狀態：
//   - `gregorianToJD(year, month, day)`：公曆 → 儒略日；`day` 可含小數天（=時分秒）。
//   - `jdToGregorian(jd)`：儒略日 → `{ year, month, day, hour, minute, second }`。

// 星期名稱透過 i18n 字典提供（weekday.short / weekday.full）。

// 公曆 → 儒略日；day 可含小數天（=時分秒）。
export function gregorianToJD(year, month, day) {
  let y = year, m = month, d = day;
  let n = 0, G = 0;
  // 1582-10-15 為格里曆首日；之前用儒略曆。判斷條件：y*372 + m*31 + floor(d) >= 588829
  if (y * 372 + m * 31 + Math.floor(d) >= 588829) G = 1;
  if (m <= 2) { m += 12; y--; }
  if (G) { n = Math.floor(y / 100); n = 2 - n + Math.floor(n / 4); }
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + n - 1524.5;
}

// 儒略日 → 公曆物件 { year, month, day, hour, minute, second }。
export function jdToGregorian(jd) {
  let D = Math.floor(jd + 0.5);
  let F = jd + 0.5 - D;
  let c;
  if (D >= 2299161) {
    c = Math.floor((D - 1867216.25) / 36524.25);
    D += 1 + c - Math.floor(c / 4);
  }
  D += 1524;
  let year = Math.floor((D - 122.1) / 365.25);
  D -= Math.floor(365.25 * year);
  let month = Math.floor(D / 30.601);
  D -= Math.floor(30.601 * month);
  const day = D;
  if (month > 13) { month -= 13; year -= 4715; }
  else { month -= 1; year -= 4716; }
  F *= 24; const hour = Math.floor(F); F -= hour;
  F *= 60; const minute = Math.floor(F); F -= minute;
  F *= 60; const second = F;
  return { year, month, day, hour, minute, second };
}

// 公曆物件 → 字串（秒精度）。
export function formatGregorian(g) {
  let Y = '     ' + g.year, M = '0' + g.month, D = '0' + g.day;
  let h = g.hour, m = g.minute, s = Math.floor(g.second + 0.5);
  if (s >= 60) { s -= 60; m++; }
  if (m >= 60) { m -= 60; h++; }
  let hs = '0' + h, ms = '0' + m, ss = '0' + s;
  Y = Y.substr(Y.length - 5, 5);
  M = M.substr(M.length - 2, 2);
  D = D.substr(D.length - 2, 2);
  hs = hs.substr(hs.length - 2, 2);
  ms = ms.substr(ms.length - 2, 2);
  ss = ss.substr(ss.length - 2, 2);
  return Y + '-' + M + '-' + D + ' ' + hs + ':' + ms + ':' + ss;
}

// 公曆物件 → 字串（毫秒精度）。
export function formatGregorianPrecise(g) {
  let Y = '     ' + g.year, M = '0' + g.month, D = '0' + g.day;
  let h = g.hour, m = g.minute;
  let s = Math.floor(g.second);
  let ms = Math.round((g.second - s) * 1000);
  if (ms >= 1000) { ms -= 1000; s++; }
  if (s >= 60) { s -= 60; m++; }
  if (m >= 60) { m -= 60; h++; }
  if (h >= 24) { h -= 24; }
  let hs = '0' + h, mins = '0' + m, ss = '0' + s, mss = '00' + ms;
  Y = Y.substr(Y.length - 5, 5);
  M = M.substr(M.length - 2, 2);
  D = D.substr(D.length - 2, 2);
  hs = hs.substr(hs.length - 2, 2);
  mins = mins.substr(mins.length - 2, 2);
  ss = ss.substr(ss.length - 2, 2);
  mss = mss.substr(mss.length - 3, 3);
  return Y + '-' + M + '-' + D + ' ' + hs + ':' + mins + ':' + ss + '.' + mss;
}

// 儒略日 → 字串。
export function formatJD(jd) {
  return formatGregorian(jdToGregorian(jd));
}

// 取 JD 中的時間部分字串 HH:MM:SS。
export function formatTimeOfDay(jd) {
  jd += 0.5;
  jd = jd - Math.floor(jd);
  let s = Math.floor(jd * 86400 + 0.5);
  let h = Math.floor(s / 3600); s -= h * 3600;
  let m = Math.floor(s / 60); s -= m * 60;
  const hs = '0' + h, ms = '0' + m, ss = '0' + s;
  return hs.substr(hs.length - 2, 2) + ':' + ms.substr(ms.length - 2, 2) + ':' + ss.substr(ss.length - 2, 2);
}

// 計算星期（0=日…6=六）。
export function getWeekday(jd) {
  return Math.floor(jd + 1.5 + 7000000) % 7;
}

// 求 year 年 month 月的第 n 個星期 weekday 的儒略日數。
export function jdOfNthWeekday(year, month, n, weekday) {
  let y = year, m = month;
  const jd = gregorianToJD(y, m, 1.5);
  const w0 = (jd + 1 + 7000000) % 7;
  let r = jd - w0 + 7 * n + weekday;
  if (weekday >= w0) r -= 7;
  if (n === 5) {
    m++; if (m > 12) { m = 1; y++; }
    if (r >= gregorianToJD(y, m, 1.5)) r -= 7;
  }
  return r;
}
