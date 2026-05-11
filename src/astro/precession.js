// 歲差表與計算（IAU1976／IAU2000／P03）。
// 歲差量名稱：fi、w、P、Q、E、x、pi、II、p、th、Z、z。

import { RAD_TO_ARCSEC } from './constants.js';
import { normalizeAngle, rotateSpherical } from './math-utils.js';

export const PRECESSION_TABLE_IAU1976 = [
       0,     5038.7784, -1.07259, -0.001147, // fi
   84381.448,    0,      +0.05127, -0.007726, // w
       0,       +4.1976, +0.19447, -0.000179, // P
       0,      -46.8150, +0.05059, +0.000344, // Q
   84381.448,  -46.8150, -0.00059, +0.001813, // E
       0,      +10.5526, -2.38064, -0.001125, // x
       0,       47.0028, -0.03301, +0.000057, // pi（自導出）
  629554.886, -869.8192, +0.03666, -0.001504, // II（自導出）
       0,     5029.0966, +1.11113, +0.000006, // p
       0,     2004.3109, -0.42665, -0.041833, // th
       0,     2306.2181, +0.30188, +0.017998, // Z
       0,     2306.2181, +1.09468, +0.018203, // z
];

export const PRECESSION_TABLE_IAU2000 = [
       0,         5038.478750,  -1.07259,   -0.001147,   0,          0,         // fi
   84381.448,       -0.025240,  +0.05127,   -0.007726,   0,          0,         // w
       0,           +4.1976,    +0.19447,   -0.000179,   0,          0,         // P
       0,          -46.8150,    +0.05059,   +0.000344,   0,          0,         // Q
   84381.448,      -46.84024,   -0.00059,   +0.001813,   0,          0,         // E
       0,          +10.5526,    -2.38064,   -0.001125,   0,          0,         // x
       0,           47.0028,    -0.03301,   +0.000057,   0,          0,         // pi
  629554.886,     -869.8192,    +0.03666,   -0.001504,   0,          0,         // II
       0,         5028.79695,   +1.11113,   +0.000006,   0,          0,         // p
       0,         2004.1917476, -0.4269353, -0.0418251, -0.0000601, -0.0000001, // th
      +2.5976176, 2306.0809506, +0.3019015, +0.0179663, -0.0000327, -0.0000002, // Z
      -2.5976176, 2306.0803226, +1.0947790, +0.0182273, +0.0000470, -0.0000003, // z
];

export const PRECESSION_TABLE_P03 = [
       0,        5038.481507, -1.0790069, -0.00114045, +0.000132851, -9.51e-8,  // fi
   84381.406000,   -0.025754, +0.0512623, -0.00772503, -4.67e-7,     +3.337e-7, // w
       0,           4.199094, +0.1939873, -0.00022466, -9.12e-7,     +1.20e-8,  // P
       0,         -46.811015, +0.0510283, +0.00052413, -6.46e-7,     -1.72e-8,  // Q
   84381.406000,  -46.836769, -0.0001831, +0.00200340, -5.76e-7,     -4.34e-8,  // E
       0,          10.556403, -2.3814292, -0.00121197, +0.000170663, -5.60e-8,  // x
       0,          46.998973, -0.0334926, -0.00012559, +1.13e-7,     -2.2e-9,   // pi
  629546.7936,   -867.95758,  +0.157992,  -0.0005371,  -0.00004797,  +7.2e-8,   // II
       0,        5028.796195, +1.1054348, +0.00007964, -0.000023857, +3.83e-8,  // p
       0,        2004.191903, -0.4294934, -0.04182264, -7.089e-6,    -1.274e-7, // th
       2.650545, 2306.083227, +0.2988499, +0.01801828, -5.971e-6,    -3.173e-7, // Z
      -2.650545, 2306.077181, +1.0927348, +0.01826837, -0.000028596, -2.904e-7, // z
];

// 取得指定歲差量（弧度），t 為儒略世紀數，quantity 為歲差量名稱字串，model 為 'IAU1976'/'IAU2000'/'P03'。
export function precessionQuantity(t, quantity, model) {
  let n, p;
  if (model === 'IAU1976') { n = 4; p = PRECESSION_TABLE_IAU1976; }
  if (model === 'IAU2000') { n = 6; p = PRECESSION_TABLE_IAU2000; }
  if (model === 'P03')     { n = 6; p = PRECESSION_TABLE_P03; }
  const sc = String('fi w  P  Q  E  x  pi II p  th Z  z ').indexOf(quantity + ' ') / 3;
  let tn = 1, c = 0;
  for (let i = 0; i < n; i++, tn *= t) c += p[sc * n + i] * tn;
  return c / RAD_TO_ARCSEC;
}

// P03 黃赤交角（弧度），t 為儒略世紀數。
export function meanObliquityP03(t) {
  const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t;
  return (84381.4060 - 46.836769 * t - 0.0001831 * t2 + 0.00200340 * t3 - 5.76e-7 * t4 - 4.34e-8 * t5) / RAD_TO_ARCSEC;
}

// 赤道球面座標：J2000 → Date 分點。
export function equatorialJ2000ToDate(t, llr, model) {
  const Z = precessionQuantity(t, 'Z', model) + llr[0];
  const z = precessionQuantity(t, 'z', model);
  const th = precessionQuantity(t, 'th', model);
  const cosW = Math.cos(llr[1]), cosH = Math.cos(th);
  const sinW = Math.sin(llr[1]), sinH = Math.sin(th);
  const A = cosW * Math.sin(Z);
  const B = cosH * cosW * Math.cos(Z) - sinH * sinW;
  const C = sinH * cosW * Math.cos(Z) + cosH * sinW;
  return [normalizeAngle(Math.atan2(A, B) + z), Math.asin(C), llr[2]];
}

// 赤道球面座標：Date 分點 → J2000。
export function equatorialDateToJ2000(t, llr, model) {
  const Z = -precessionQuantity(t, 'z', model) + llr[0];
  const z = -precessionQuantity(t, 'Z', model);
  const th = -precessionQuantity(t, 'th', model);
  const cosW = Math.cos(llr[1]), cosH = Math.cos(th);
  const sinW = Math.sin(llr[1]), sinH = Math.sin(th);
  const A = cosW * Math.sin(Z);
  const B = cosH * cosW * Math.cos(Z) - sinH * sinW;
  const C = sinH * cosW * Math.cos(Z) + cosH * sinW;
  return [normalizeAngle(Math.atan2(A, B) + z), Math.asin(C), llr[2]];
}

// 黃道球面座標：J2000 → Date 分點。
export function eclipticJ2000ToDate(t, llr, model) {
  let r = [llr[0], llr[1], llr[2]];
  r[0] += precessionQuantity(t, 'fi', model); r = rotateSpherical(r, precessionQuantity(t, 'w', model));
  r[0] -= precessionQuantity(t, 'x', model);  r = rotateSpherical(r, -precessionQuantity(t, 'E', model));
  return r;
}

// 黃道球面座標：Date 分點 → J2000。
export function eclipticDateToJ2000(t, llr, model) {
  let r = [llr[0], llr[1], llr[2]];
  r = rotateSpherical(r, precessionQuantity(t, 'E', model));  r[0] += precessionQuantity(t, 'x', model);
  r = rotateSpherical(r, -precessionQuantity(t, 'w', model)); r[0] -= precessionQuantity(t, 'fi', model);
  r[0] = normalizeAngle(r[0]);
  return r;
}
