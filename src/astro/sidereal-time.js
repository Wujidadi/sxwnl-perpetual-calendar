// 平恆星時與時差。

import { RAD_TO_ARCSEC, TWO_PI } from './constants.js';
import { normalizeAngleSigned, rotateSpherical } from './math-utils.js';
import { deltaT } from './delta-t.js';
import { meanObliquityP03 } from './precession.js';
import { evalVSOP87 } from './vsop87.js';
import { sunLongitudeAberration } from './aberration.js';

// 平恆星時。T 為 J2000 起算的 UT 日數，dt 為 ΔT（日）；
// 回傳格林尼治平春分點起算的赤經（弧度），不含赤經章動與非多項式部分。
export function meanSiderealTimeFromUT(T, dt) {
  const t = (T + dt) / 36525;
  const t2 = t * t, t3 = t2 * t, t4 = t3 * t;
  return TWO_PI * (0.7790572732640 + 1.00273781191135448 * T)
    + (0.014506 + 4612.15739966 * t + 1.39667721 * t2 - 0.00009344 * t3 + 0.00001882 * t4) / RAD_TO_ARCSEC;
}

// 平恆星時，輸入為力學時 J2000 起算日數。
export function meanSiderealTimeFromTD(jd) {
  const dt = deltaT(jd);
  return meanSiderealTimeFromUT(jd - dt, dt);
}

// 高精度時差，t 為力學時儒略世紀數；回傳單位為周（天）。
export function equationOfTime(t) {
  const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t;
  let L = (1753470142 + 628331965331.8 * t + 5296.74 * t2 + 0.432 * t3 - 0.1124 * t4 - 0.00009 * t5) / 1000000000 + Math.PI - 20.5 / RAD_TO_ARCSEC;

  const dL = -17.2 * Math.sin(2.1824 - 33.75705 * t) / RAD_TO_ARCSEC; // 黃經章動
  const dE =   9.2 * Math.cos(2.1824 - 33.75705 * t) / RAD_TO_ARCSEC; // 交角章動
  const E = meanObliquityP03(t) + dE;                                 // 真黃赤交角

  // 地球座標
  let z = [];
  z[0] = evalVSOP87(0, 0, t, 50) + Math.PI + sunLongitudeAberration(t) + dL;
  z[1] = -(2796 * Math.cos(3.1987 + 8433.46616 * t)
        +  1016 * Math.cos(5.4225 +  550.75532 * t)
        +   804 * Math.cos(3.88   +  522.3694  * t)) / 1000000000;
  z = rotateSpherical(z, E); // z 太陽地心赤道座標
  z[0] -= dL * Math.cos(E);

  L = normalizeAngleSigned(L - z[0]);
  return L / TWO_PI;
}

// 低精度時差，誤差約 1 秒以內。
export function equationOfTimeFast(t) {
  let L = (1753470142 + 628331965331.8 * t + 5296.74 * t * t) / 1000000000 + Math.PI;
  let z = [];
  const E = (84381.4088 - 46.836051 * t) / RAD_TO_ARCSEC;
  z[0] = evalVSOP87(0, 0, t, 5) + Math.PI;
  z[1] = 0;
  z = rotateSpherical(z, E);
  L = normalizeAngleSigned(L - z[0]);
  return L / TWO_PI;
}
