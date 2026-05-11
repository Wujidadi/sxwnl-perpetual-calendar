// 年曆 HTML 產生器（兩種版式）。
// 字串內容含中文，屬 i18n 字典範疇，待後續翻譯抽出。

import { J2000 } from '../astro/constants.js';
import { formatJD } from '../astro/julian-day.js';
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  SOLAR_TERM_NAMES,
  LUNAR_DAY_NAMES,
  preciseNewMoonFromJD,
  preciseSolarTermFromJD,
} from './chinese-base.js';
import { shuoQiCalculator } from './ssq.js';

// 版式 1：含月相時刻、節氣時刻（精確到分）。
export function renderYearCalendarHTML(y, fg) {
  let s = '';
  shuoQiCalculator.calcYear(Math.floor((y - 2000) * 365.2422 + 180));
  for (let i = 0; i < 14; i++) {
    if (shuoQiCalculator.newMoonList[i + 1] > shuoQiCalculator.centralQiList[24]) break;
    let s1 = (shuoQiCalculator.leapMonth && i === shuoQiCalculator.leapMonth) ? '闰' : '·';
    s1 += shuoQiCalculator.monthNames[i];
    if (s1.length < 3) s1 += '月';
    s1 += shuoQiCalculator.monthLengths[i] > 29 ? '大' : '小';
    s1 += ' ' + formatJD(shuoQiCalculator.newMoonList[i] + J2000).substr(6, 5);

    let v = preciseNewMoonFromJD(shuoQiCalculator.newMoonList[i]);
    let s2 = '(' + formatJD(v + J2000).substr(9, 11) + ')';
    if (Math.floor(v + 0.5) !== shuoQiCalculator.newMoonList[i]) s2 = '<font color=red>' + s2 + '</font>';
    s1 += s2 + fg;

    for (let j = -2; j < 24; j++) {
      let qi;
      if (j >= 0)  qi = shuoQiCalculator.centralQiList[j];
      if (j === -1) qi = shuoQiCalculator.centralQiList.pe1;
      if (j === -2) qi = shuoQiCalculator.centralQiList.pe2;

      if (qi < shuoQiCalculator.newMoonList[i] || qi >= shuoQiCalculator.newMoonList[i + 1]) continue;
      s1 += '&nbsp;&nbsp;&nbsp;&nbsp;' + SOLAR_TERM_NAMES[(j + 24) % 24] + ' ' + formatJD(qi + J2000).substr(6, 5);

      v = preciseSolarTermFromJD(qi);
      s2 = '(' + formatJD(v + J2000).substr(9, 11) + ')';
      if (Math.floor(v + 0.5) !== qi) s2 = '<font color=red>' + s2 + '</font>';
      s1 += s2 + fg;
    }
    s += s1 + '<br>';
  }
  return s;
}

// 版式 2：含合朔當日干支與節氣對應日的干支。
export function renderYearCalendarV2HTML(y) {
  let s = '';
  shuoQiCalculator.calcYear(Math.floor((y - 2000) * 365.2422 + 180));
  for (let i = 0; i < 14; i++) {
    if (shuoQiCalculator.newMoonList[i + 1] > shuoQiCalculator.centralQiList[24]) break;
    let s1 = (shuoQiCalculator.leapMonth && i === shuoQiCalculator.leapMonth) ? '闰' : '·';
    s1 += shuoQiCalculator.monthNames[i];
    if (s1.length < 3) s1 += '月';
    s1 += shuoQiCalculator.monthLengths[i] > 29 ? '大' : '小';
    const v = shuoQiCalculator.newMoonList[i] + J2000;
    s1 += ' ' + HEAVENLY_STEMS[(v + 9) % 10] + EARTHLY_BRANCHES[(v + 1) % 12];
    s1 += ' ' + formatJD(v).substr(6, 5);

    for (let j = -2; j < 24; j++) {
      let qi;
      if (j >= 0)  qi = shuoQiCalculator.centralQiList[j];
      if (j === -1) qi = shuoQiCalculator.centralQiList.pe1;
      if (j === -2) qi = shuoQiCalculator.centralQiList.pe2;

      if (qi < shuoQiCalculator.newMoonList[i] || qi >= shuoQiCalculator.newMoonList[i + 1]) continue;
      const v2 = qi + J2000;
      s1 += ' ' + LUNAR_DAY_NAMES[v2 - v] + HEAVENLY_STEMS[(v2 + 9) % 10] + EARTHLY_BRANCHES[(v2 + 1) % 12];
      s1 += SOLAR_TERM_NAMES[(j + 24) % 24] + formatJD(qi + J2000).substr(6, 5);
    }
    s += s1 + '<br>';
  }
  return s;
}
