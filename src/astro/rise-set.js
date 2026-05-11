// 日月升中天降計算（不考慮氣溫與氣壓的影響）。
// 維持單例物件形式，包含可變狀態欄位（longitude／latitude／deltaT／obliquity）。

import { RAD_TO_ARCSEC, TWO_PI, EARTH_EQUATORIAL_RADIUS_KM } from './constants.js';
import { normalizeAngleSigned, rotateSpherical, balancedMod } from './math-utils.js';
import { deltaT } from './delta-t.js';
import { formatTimeOfDay } from './julian-day.js';
import { meanObliquityP03 } from './precession.js';
import { moonCoord } from './elp-moon.js';
import { meanSiderealTimeFromUT } from './sidereal-time.js';
import { earthLongitude } from './ephemeris.js';

export const riseTransitSet = {
  longitude: 0,
  latitude: 0,
  deltaT: 0,
  obliquity: 0.409092614,

  // 給定地平緯度 h、赤緯 w，求時角。
  getHourAngle(h, w) {
    const c = (Math.sin(h) - Math.sin(this.latitude) * Math.sin(w)) / Math.cos(this.latitude) / Math.cos(w);
    if (Math.abs(c) > 1) return Math.PI;
    return Math.acos(c);
  },

  // 月亮座標。章動同時影響恆星時與天體座標，故此處不計章動。將結果存入 r。
  moonCoord(jd, H0, r) {
    let z = moonCoord((jd + this.deltaT) / 36525, 40, 30, 8);
    z = rotateSpherical(z, this.obliquity); // 黃→赤
    r.H = normalizeAngleSigned(meanSiderealTimeFromUT(jd, this.deltaT) + this.longitude - z[0]);
    if (H0) r.H0 = this.getHourAngle(0.7275 * EARTH_EQUATORIAL_RADIUS_KM / z[2] - 34 * 60 / RAD_TO_ARCSEC, z[1]);
  },

  // 月亮升中降時刻。
  moonRTS(jd) {
    this.deltaT = deltaT(jd);
    this.obliquity = meanObliquityP03(jd / 36525);
    // 找最靠近當日中午的月上中天；balancedMod 第 1 參數為本地時角近似值
    jd -= balancedMod(0.1726222 + 0.966136808032357 * jd - 0.0366 * this.deltaT + this.longitude / TWO_PI, 1);

    const r = {};
    const sv = TWO_PI * 0.966;
    r.z = r.x = r.s = r.j = r.c = r.h = jd;
    this.moonCoord(jd, 1, r);
    r.s += (-r.H0 - r.H) / sv;
    r.j += (r.H0  - r.H) / sv;
    r.z += (    0 - r.H) / sv;
    r.x += (Math.PI - r.H) / sv;
    this.moonCoord(r.s, 1, r); r.s += normalizeAngleSigned(-r.H0 - r.H) / sv;
    this.moonCoord(r.j, 1, r); r.j += normalizeAngleSigned(+r.H0 - r.H) / sv;
    this.moonCoord(r.z, 0, r); r.z += normalizeAngleSigned(    0 - r.H) / sv;
    this.moonCoord(r.x, 0, r); r.x += normalizeAngleSigned(Math.PI - r.H) / sv;
    return r;
  },

  // 太陽座標。將結果存入 r。
  sunCoord(jd, xm, r) {
    let z = [
      earthLongitude((jd + this.deltaT) / 36525, 5) + Math.PI - 20.5 / RAD_TO_ARCSEC,
      0,
      1,
    ];
    z = rotateSpherical(z, this.obliquity);
    r.H = normalizeAngleSigned(meanSiderealTimeFromUT(jd, this.deltaT) + this.longitude - z[0]);
    if (xm === 10 || xm === 1) r.H1 = this.getHourAngle(-50 * 60 / RAD_TO_ARCSEC,    z[1]); // 地平以下 50 分
    if (xm === 10 || xm === 2) r.H2 = this.getHourAngle(-6  * 3600 / RAD_TO_ARCSEC,  z[1]); // 地平以下 6 度
    if (xm === 10 || xm === 3) r.H3 = this.getHourAngle(-12 * 3600 / RAD_TO_ARCSEC,  z[1]); // 地平以下 12 度
    if (xm === 10 || xm === 4) r.H4 = this.getHourAngle(-18 * 3600 / RAD_TO_ARCSEC,  z[1]); // 地平以下 18 度
  },

  // 太陽升中降時刻（含民用／航海／天文晨昏）。
  sunRTS(jd) {
    this.deltaT = deltaT(jd);
    this.obliquity = meanObliquityP03(jd / 36525);
    // 找最靠近當日中午的日上中天
    jd -= balancedMod(jd + this.longitude / TWO_PI, 1);

    const r = {};
    const sv = TWO_PI;
    r.z = r.x = r.s = r.j = r.c = r.h = r.c2 = r.h2 = r.c3 = r.h3 = jd;
    r.sm = '';
    this.sunCoord(jd, 10, r);
    r.s  += (-r.H1 - r.H) / sv;
    r.j  += ( r.H1 - r.H) / sv;
    r.c  += (-r.H2 - r.H) / sv;
    r.h  += ( r.H2 - r.H) / sv;
    r.c2 += (-r.H3 - r.H) / sv;
    r.h2 += ( r.H3 - r.H) / sv;
    r.c3 += (-r.H4 - r.H) / sv;
    r.h3 += ( r.H4 - r.H) / sv;
    r.z  += (    0 - r.H) / sv;
    r.x  += (Math.PI - r.H) / sv;
    this.sunCoord(r.s, 1, r); r.s += normalizeAngleSigned(-r.H1 - r.H) / sv; if (r.H1 === Math.PI) r.sm += '无升起.';
    this.sunCoord(r.j, 1, r); r.j += normalizeAngleSigned( r.H1 - r.H) / sv; if (r.H1 === Math.PI) r.sm += '无降落.';
    this.sunCoord(r.c,  2, r); r.c  += normalizeAngleSigned(-r.H2 - r.H) / sv; if (r.H2 === Math.PI) r.sm += '无民用晨.';
    this.sunCoord(r.h,  2, r); r.h  += normalizeAngleSigned( r.H2 - r.H) / sv; if (r.H2 === Math.PI) r.sm += '无民用昏.';
    this.sunCoord(r.c2, 3, r); r.c2 += normalizeAngleSigned(-r.H3 - r.H) / sv; if (r.H3 === Math.PI) r.sm += '无航海晨.';
    this.sunCoord(r.h2, 3, r); r.h2 += normalizeAngleSigned( r.H3 - r.H) / sv; if (r.H3 === Math.PI) r.sm += '无航海昏.';
    this.sunCoord(r.c3, 4, r); r.c3 += normalizeAngleSigned(-r.H4 - r.H) / sv; if (r.H4 === Math.PI) r.sm += '无天文晨.';
    this.sunCoord(r.h3, 4, r); r.h3 += normalizeAngleSigned( r.H4 - r.H) / sv; if (r.H4 === Math.PI) r.sm += '无天文昏.';
    this.sunCoord(r.z, 0, r); r.z += (    0 - r.H) / sv;
    this.sunCoord(r.x, 0, r); r.x += normalizeAngleSigned(Math.PI - r.H) / sv;
    return r;
  },

  // 多日升中降。jd 為起始儒略日（中午時刻），sq 為時區。
  rts: [],
  multiDayRTS(jd, n, Jdl, Wdl, sq) {
    if (!this.rts.length) {
      for (let i = 0; i < 31; i++) this.rts[i] = {};
    }
    this.longitude = Jdl;
    this.latitude = Wdl;
    sq /= 24;
    for (let i = 0; i < n; i++) {
      const row = this.rts[i];
      row.Ms = row.Mz = row.Mj = '--:--:--';
    }
    for (let i = -1; i <= n; i++) {
      let r;
      if (i >= 0 && i < n) {
        r = this.sunRTS(jd + i + sq);
        this.rts[i].s  = formatTimeOfDay(r.s - sq);
        this.rts[i].z  = formatTimeOfDay(r.z - sq);
        this.rts[i].j  = formatTimeOfDay(r.j - sq);
        this.rts[i].c  = formatTimeOfDay(r.c - sq);
        this.rts[i].h  = formatTimeOfDay(r.h - sq);
        this.rts[i].ch = formatTimeOfDay(r.h - r.c - 0.5);
        this.rts[i].sj = formatTimeOfDay(r.j - r.s - 0.5);
      }
      r = this.moonRTS(jd + i + sq);
      let c;
      c = Math.floor(r.s - sq + 0.5) - jd; if (c >= 0 && c < n) this.rts[c].Ms = formatTimeOfDay(r.s - sq);
      c = Math.floor(r.z - sq + 0.5) - jd; if (c >= 0 && c < n) this.rts[c].Mz = formatTimeOfDay(r.z - sq);
      c = Math.floor(r.j - sq + 0.5) - jd; if (c >= 0 && c < n) this.rts[c].Mj = formatTimeOfDay(r.j - sq);
    }
    this.rts.dn = n;
  },
};
