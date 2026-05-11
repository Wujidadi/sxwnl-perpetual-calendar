// 大氣折射與視差修正。

import { AU_KM, EARTH_EQUATORIAL_RADIUS_KM, EARTH_POLAR_EQ_RATIO } from './constants.js';
import { sphericalToCartesian, cartesianToSpherical } from './math-utils.js';

// 真高度 h（弧度）的大氣折射量（弧度）。
export function refractionFromTrueAltitude(h) {
  return 0.0002967 / Math.tan(h + 0.003138 / (h + 0.08919));
}

// 視高度 ho（弧度）的大氣折射量（弧度）。
export function refractionFromApparentAltitude(ho) {
  return -0.0002909 / Math.tan(ho + 0.002227 / (ho + 0.07679));
}

// 視差修正（地心 → 站心）。
//   z 赤道座標 [赤經, 赤緯, 距離]；H 時角；fa 地理緯度；high 海拔（km）。
// 距離 z[2] 小於 500 視為以 AU 計，內部換算為 km。函式為 in-place 修改 z。
export function applyParallax(z, H, fa, high) {
  let dw = 1;
  if (z[2] < 500) dw = AU_KM;
  z[2] *= dw;
  const f = EARTH_POLAR_EQ_RATIO;
  const u = Math.atan(f * Math.tan(fa));
  const g = z[0] + H;
  const r0 = EARTH_EQUATORIAL_RADIUS_KM * Math.cos(u)     + high * Math.cos(fa);
  const z0 = EARTH_EQUATORIAL_RADIUS_KM * Math.sin(u) * f + high * Math.sin(fa);
  const x0 = r0 * Math.cos(g);
  const y0 = r0 * Math.sin(g);
  const s = sphericalToCartesian(z);
  s[0] -= x0; s[1] -= y0; s[2] -= z0;
  const out = cartesianToSpherical(s);
  z[0] = out[0]; z[1] = out[1]; z[2] = out[2] / dw;
}
