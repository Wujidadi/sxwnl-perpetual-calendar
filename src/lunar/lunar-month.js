// LunarMonth：公曆某月的三合曆（公／農／回）月物件。
//
// 用法：
//   const m = new LunarMonth();
//   m.calcMonth(2024, 2);
//   m.days[0].lunarMonthName, m.days[0].lunarDayName, ...
//
// 月物件（this）欄位：
//   year/month        公曆年／月
//   firstJD           月首儒略日（J2000 起算，北京中午）
//   monthLength       公曆月天數
//   firstWeekday      月首星期
//   yearGanZhi        該年干支紀年
//   zodiacAnimal      該年生肖
//   reignTitle        該年年號
//   days[]            各日物件
//
// 日物件欄位定義詳見實作中的設定處。

import { J2000, TWO_PI } from '../astro/constants.js';
import { deltaT } from '../astro/delta-t.js';
import { gregorianToJD, jdToGregorian, formatTimeOfDay } from '../astro/julian-day.js';
import {
  sunApparentLongitude,
  moonSunApparentLongDiff,
} from '../astro/ephemeris.js';
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  ZODIAC_ANIMALS,
  WESTERN_ZODIAC_SIGNS,
  LUNAR_PHASE_NAMES,
  SOLAR_TERM_NAMES,
  LUNAR_DAY_NAMES,
  getReignTitle,
  getLunarDayName,
  preciseSolarTermFromLongitude,
  preciseNewMoonFromLongitude,
} from './chinese-base.js';
import { getDayName as getGregorianDayName, getHijriDate } from './gregorian-base.js';
import { shuoQiCalculator } from './ssq.js';

// 取得月首儒略日（北京中午 12:00:00.1，以原始實作的浮點精度為準）。
function firstDayJD(year, month) {
  const day = 1 + (12 + (0 / 60 + 0.1 / 60) / 60) / 24; // 對應 h=12, m=0, s=0.1
  return Math.floor(gregorianToJD(year, month, day)) - J2000;
}

export class LunarMonth {
  constructor() {
    this.days = new Array(31);
    for (let i = 0; i < 31; i++) this.days[i] = {};
  }

  // 截斷過長文字（網頁顯示用）。
  static truncate(s, n, end) {
    s = s.replace(/(^\s*)|(\s*$)/g, '');
    if (s.length > n + 1) return s.substr(0, n) + end;
    return s;
  }

  // 計算公曆某月的三合曆。
  calcMonth(year, month) {
    const Bd0 = firstDayJD(year, month);
    let nextYear = year, nextMonth = month + 1;
    if (nextMonth > 12) { nextYear++; nextMonth = 1; }
    const Bdn = firstDayJD(nextYear, nextMonth) - Bd0;

    this.firstWeekday = (Bd0 + J2000 + 1 + 7000000) % 7;
    this.year         = year;
    this.month        = month;
    this.firstJD      = Bd0;
    this.monthLength  = Bdn;

    // 干支紀年與生肖
    const c = year - 1984 + 12000;
    this.yearGanZhi   = HEAVENLY_STEMS[c % 10] + EARTHLY_BRANCHES[c % 12];
    this.zodiacAnimal = ZODIAC_ANIMALS[c % 12];
    this.reignTitle   = getReignTitle(year);

    // 提取各日資訊
    for (let i = 0; i < Bdn; i++) {
      const ob = this.days[i];
      ob.jdNoon         = Bd0 + i;
      ob.dayIndex       = i;
      ob.year           = year;
      ob.month          = month;
      ob.monthLength    = Bdn;
      ob.firstWeekday   = this.firstWeekday;
      ob.weekday        = (this.firstWeekday + i) % 7;
      ob.weekIndex      = Math.floor((this.firstWeekday + i) / 7);
      ob.weekCount      = Math.floor((this.firstWeekday + Bdn - 1) / 7) + 1;
      ob.day            = jdToGregorian(ob.jdNoon + J2000).day;

      // 農曆月曆
      if (!shuoQiCalculator.centralQiList.length
          || ob.jdNoon < shuoQiCalculator.centralQiList[0]
          || ob.jdNoon >= shuoQiCalculator.centralQiList[24]) {
        shuoQiCalculator.calcYear(ob.jdNoon);
      }
      let mk = Math.floor((ob.jdNoon - shuoQiCalculator.newMoonList[0]) / 30);
      if (mk < 13 && shuoQiCalculator.newMoonList[mk + 1] <= ob.jdNoon) mk++;

      ob.lunarDayIndex      = ob.jdNoon - shuoQiCalculator.newMoonList[mk];
      ob.lunarDayName       = LUNAR_DAY_NAMES[ob.lunarDayIndex];
      ob.daysSinceDongzhi   = ob.jdNoon - shuoQiCalculator.centralQiList[0];
      ob.daysSinceXiazhi    = ob.jdNoon - shuoQiCalculator.centralQiList[12];
      ob.daysSinceLiqiu     = ob.jdNoon - shuoQiCalculator.centralQiList[15];
      ob.daysSinceMangzhong = ob.jdNoon - shuoQiCalculator.centralQiList[11];
      ob.daysSinceXiaoshu   = ob.jdNoon - shuoQiCalculator.centralQiList[13];

      if (ob.jdNoon === shuoQiCalculator.newMoonList[mk] || ob.jdNoon === Bd0) {
        ob.lunarMonthName       = shuoQiCalculator.monthNames[mk];
        ob.lunarMonthLength     = shuoQiCalculator.monthLengths[mk];
        ob.lunarLeap            = (shuoQiCalculator.leapMonth && shuoQiCalculator.leapMonth === mk) ? '闰' : '';
        ob.lunarNextMonthName   = mk < 13 ? shuoQiCalculator.monthNames[mk + 1] : '未知';
      } else {
        const prev = this.days[i - 1];
        ob.lunarMonthName     = prev.lunarMonthName;
        ob.lunarMonthLength   = prev.lunarMonthLength;
        ob.lunarLeap          = prev.lunarLeap;
        ob.lunarNextMonthName = prev.lunarNextMonthName;
      }

      let qk = Math.floor((ob.jdNoon - shuoQiCalculator.centralQiList[0] - 7) / 15.2184);
      if (qk < 23 && ob.jdNoon >= shuoQiCalculator.centralQiList[qk + 1]) qk++;
      ob.solarTermLabel = (ob.jdNoon === shuoQiCalculator.centralQiList[qk]) ? SOLAR_TERM_NAMES[qk] : '';

      ob.moonPhaseName = ob.moonPhaseJD = ob.moonPhaseTimeStr = '';
      ob.solarTermName = ob.solarTermJD = ob.solarTermTimeStr = '';

      // 干支紀年（以立春為界）
      let D = shuoQiCalculator.centralQiList[3] + (ob.jdNoon < shuoQiCalculator.centralQiList[3] ? -365 : 0) + 365.25 * 16 - 35;
      ob.lunarYearNum = Math.floor(D / 365.2422 + 0.5); // 1984 起算

      // 以正月初一定年首
      D = shuoQiCalculator.newMoonList[2];
      for (let j = 0; j < 14; j++) {
        if (shuoQiCalculator.monthNames[j] !== '正' || (shuoQiCalculator.leapMonth === j && j)) continue;
        D = shuoQiCalculator.newMoonList[j];
        if (ob.jdNoon < D) { D -= 365; break; }
      }
      D += 5810;
      ob.lunarYearNumNewYear = Math.floor(D / 365.2422 + 0.5);

      D = ob.lunarYearNum        + 12000; ob.lunarYearGanZhi  = HEAVENLY_STEMS[D % 10] + EARTHLY_BRANCHES[D % 12];
      D = ob.lunarYearNumNewYear + 12000; ob.lunarYearGanZhi2 = HEAVENLY_STEMS[D % 10] + EARTHLY_BRANCHES[D % 12];
      ob.lunarYearHuangdi = ob.lunarYearNumNewYear + 1984 + 2698;

      // 紀月（1998-12-7 大雪起算，0 為甲子）
      mk = Math.floor((ob.jdNoon - shuoQiCalculator.centralQiList[0]) / 30.43685);
      if (mk < 12 && ob.jdNoon >= shuoQiCalculator.centralQiList[2 * mk + 1]) mk++;
      D = mk + Math.floor((shuoQiCalculator.centralQiList[12] + 390) / 365.2422) * 12 + 900000;
      ob.lunarMonthNum    = D % 12;
      ob.lunarMonthGanZhi = HEAVENLY_STEMS[D % 10] + EARTHLY_BRANCHES[D % 12];

      // 紀日（2000-1-7 起算）
      D = ob.jdNoon - 6 + 9000000;
      ob.lunarDayGanZhi = HEAVENLY_STEMS[D % 10] + EARTHLY_BRANCHES[D % 12];

      // 星座
      mk = Math.floor((ob.jdNoon - shuoQiCalculator.centralQiList[0] - 15) / 30.43685);
      if (mk < 11 && ob.jdNoon >= shuoQiCalculator.centralQiList[2 * mk + 2]) mk++;
      ob.zodiacSign = WESTERN_ZODIAC_SIGNS[(mk + 12) % 12] + '座';

      // 回曆
      getHijriDate(ob.jdNoon, ob);

      // 節日
      ob.holidayA = ob.holidayB = ob.holidayC = '';
      ob.isHoliday = 0;
      getGregorianDayName(ob, ob);
      getLunarDayName(ob, ob);
    }

    // 月相與節氣處理
    const jd2 = Bd0 + deltaT(Bd0) - 8 / 24;

    // 月相查找
    let w = moonSunApparentLongDiff(jd2 / 36525, 10, 3);
    w = Math.floor((w - 0.78) / Math.PI * 2) * Math.PI / 2;
    do {
      const d = preciseNewMoonFromLongitude(w);
      const D = Math.floor(d + 0.5);
      const xn = Math.floor(w / TWO_PI * 4 + 4000000.01) % 4;
      w += TWO_PI / 4;
      if (D >= Bd0 + Bdn) break;
      if (D < Bd0) continue;
      const ob = this.days[D - Bd0];
      ob.moonPhaseName    = LUNAR_PHASE_NAMES[xn];
      ob.moonPhaseJD      = d;
      ob.moonPhaseTimeStr = formatTimeOfDay(d);
      if (D + 5 >= Bd0 + Bdn) break;
    } while (true);

    // 節氣查找
    w = sunApparentLongitude(jd2 / 36525, 3);
    w = Math.floor((w - 0.13) / TWO_PI * 24) * TWO_PI / 24;
    do {
      const d = preciseSolarTermFromLongitude(w);
      const D = Math.floor(d + 0.5);
      const xn = Math.floor(w / TWO_PI * 24 + 24000006.01) % 24;
      w += TWO_PI / 24;
      if (D >= Bd0 + Bdn) break;
      if (D < Bd0) continue;
      const ob = this.days[D - Bd0];
      ob.solarTermName    = SOLAR_TERM_NAMES[xn];
      ob.solarTermJD      = d;
      ob.solarTermTimeStr = formatTimeOfDay(d);
      if (D + 12 >= Bd0 + Bdn) break;
    } while (true);
  }
}
