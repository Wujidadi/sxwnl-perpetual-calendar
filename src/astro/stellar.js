// 恆星修正：引力偏轉、視差／光行差、太陽 J2000 座標、多顆恆星曆計算。

import { AU_KM, SPEED_OF_LIGHT_KM_S, RAD_TO_ARCSEC, J2000 } from './constants.js';
import { normalizeAngle, normalizeAngleSigned, rotateSpherical } from './math-utils.js';
import { formatRadianFull } from './angle-format.js';
import { formatJD } from './julian-day.js';
import { meanObliquityP03, equatorialJ2000ToDate, eclipticDateToJ2000 } from './precession.js';
import { nutation, applyEquatorialNutation } from './nutation.js';
import { refractionFromTrueAltitude } from './corrections.js';
import { earthCoord } from './vsop87.js';
import { meanSiderealTimeFromTD } from './sidereal-time.js';
import { earthSSBVelocity, earthSSBPosition } from './ssb.js';

// 引力偏轉。z 為天體赤道座標，a 為太陽赤道座標。
export function gravitationalDeflection(z, a) {
  const r = [z[0], z[1], z[2]];
  const d = z[0] - a[0];
  let D = Math.sin(z[1]) * Math.sin(a[1]) + Math.cos(z[1]) * Math.cos(a[1]) * Math.cos(d);
  D = 0.00407 * (1 / (1 - D) + D / 2) / RAD_TO_ARCSEC;
  r[0] += D * (Math.cos(a[1]) * Math.sin(d) / Math.cos(z[1]));
  r[1] += D * (Math.sin(z[1]) * Math.cos(a[1]) * Math.cos(d) - Math.sin(a[1]) * Math.cos(z[1]));
  r[0] = normalizeAngle(r[0]);
  return r;
}

// 嚴格的恆星視差或光行差改正。
//   z 為某時刻天體赤道球面座標（含自行但不含章動和光行差）。
//   v 為同時刻地球赤道直角座標。
//   f=0 進行光行差改正（v 須為 SSB 速度，函式回傳 z+v 向量，z 向徑為光速）。
//   f=1 進行周年視差改正（v 須為 SSB 位置，函式回傳 z−v 向量，z 向徑為距離）。
//   z 與 v 應統一使用 J2000 赤道座標系。
export function rigorousStellarCorrection(z, v, f) {
  const r = [z[0], z[1], z[2]];
  let c = SPEED_OF_LIGHT_KM_S / AU_KM * 86400 * 36525; // 光速，AU 每儒略世紀
  if (f) c = -z[2];
  const sinJ = Math.sin(z[0]), cosJ = Math.cos(z[0]);
  const sinW = Math.sin(z[1]), cosW = Math.cos(z[1]);
  r[0] += normalizeAngle((v[1] * cosJ - v[0] * sinJ) / cosW / c);
  r[1] += (v[2] * cosW - (v[0] * cosJ + v[1] * sinJ) * sinW) / c;
  return r;
}

// 太陽 J2000 球面座標。n 為地球座標各分量的取項數。
export function sunCoordJ2000(t, n) {
  let a = earthCoord(t, n, n, n);
  a[0] += Math.PI;
  a[1] = -a[1]; // 太陽 Date 黃道座標
  a = eclipticDateToJ2000(t, a, 'P03'); // 轉到 J2000 座標
  return a;
}

// 多顆恆星曆計算。
//   t 為儒略世紀 TD；F 為星表項目陣列（每 8 個元素一組）；Q 為章動週期門檻（天），0 表不限制；
//   lx 模式：0=視位置、1=站心、2=平位置；L、fa 為站點經緯（lx=1 時用）。
// 回傳格式化字串。
export function computeStarEphemeris(t, F, Q, lx, L, fa) {
  let s = '';
  let s0;
  if (lx === 0) s0 = '视赤经 视赤纬';
  if (lx === 1) s0 = '站心坐标';
  if (lx === 2) s0 = '平赤经 平赤纬';

  let d, E, v, p, a, gst;
  if (lx === 0 || lx === 1) {
    d = nutation(t, Q);
    E = meanObliquityP03(t);
    v = earthSSBVelocity(t);
    p = earthSSBPosition(t);
    a = sunCoordJ2000(t, 20);
    a = rotateSpherical(a, 84381.406 / RAD_TO_ARCSEC); // 太陽赤道座標
    const gstP = meanSiderealTimeFromTD(t * 36525);
    gst = gstP + d[0] * Math.cos(E); // 真恆星時
  }
  for (let i = 0; i < F.length; i += 8) {
    s += F[i + 6] + ' ' + F[i + 7] + ' ' + F[i + 5] + ' ';

    let z = [];
    z[0] = F[i + 0] + F[i + 2] * t * 100; // J2000 赤經（含自行）
    z[1] = F[i + 1] + F[i + 3] * t * 100; // J2000 赤緯（含自行）
    z[2] = 1 / F[i + 4];
    z[0] = normalizeAngle(z[0]);
    if (!z[2]) z[2] = 1e11;

    if (lx === 0 || lx === 1) {
      z = gravitationalDeflection(z, a);
      z = rigorousStellarCorrection(z, p, 1);
      z = rigorousStellarCorrection(z, v, 0);
      z = equatorialJ2000ToDate(t, z, 'P03');
      z = applyEquatorialNutation(z, E, d[0], d[1]);
      if (lx === 1) {
        z[0] += Math.PI / 2 - gst - L;
        z = rotateSpherical(z, Math.PI / 2 - fa);
        z[0] = normalizeAngle(-Math.PI / 2 - z[0]);
        if (z[1] > 0) z[1] += refractionFromTrueAltitude(z[1]);
      }
    }
    if (lx === 2) {
      z = equatorialJ2000ToDate(t, z, 'P03');
    }
    if (lx === 0 || lx === 2) s += formatRadianFull(z[0], 1, 3) + ' ' + formatRadianFull(z[1], 0, 2) + '\r\n';
    else                      s += formatRadianFull(z[0], 0, 2) + ' ' + formatRadianFull(z[1], 0, 2) + '\r\n';
  }
  return formatJD(t * 36525 + J2000) + ' TD ' + s0 + '\r\n' + s + '\r\n';
}
