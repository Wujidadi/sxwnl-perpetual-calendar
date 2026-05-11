// 高階曆元組合函式（黃經、速度、求時間）、月相與近遠點、太陽升降迭代。
// 原 XL 物件的方法以 named exports 拆解；不再以命名空間呼叫。

import {
  RAD_TO_ARCSEC,
  TWO_PI,
  MOON_RADIUS_FACTOR_PENUMBRA,
  EARTH_EQUATORIAL_RADIUS_KM,
} from './constants.js';
import { normalizeAngleSigned } from './math-utils.js';
import { evalVSOP87 } from './vsop87.js';
import { evalELPMoon } from './elp-moon.js';
import { sunLongitudeAberration, moonLongitudeAberration } from './aberration.js';
import { nutationLongitudeMedium } from './nutation.js';

// === 黃經 ===

// 地球黃經（Date 分點）。
export function earthLongitude(t, n) {
  return evalVSOP87(0, 0, t, n);
}

// 月球黃經（Date 分點）。
export function moonLongitude(t, n) {
  return evalELPMoon(0, t, n);
}

// === 角速度（rad/世紀） ===

// 地球角速度，誤差 < 0.03%。
export function earthAngularVelocity(t) {
  const f = 628.307585 * t;
  return 628.332
    + 21 * Math.sin(1.527 + f)
    + 0.44 * Math.sin(1.48 + f * 2)
    + 0.129 * Math.sin(5.82 + f) * t
    + 0.00055 * Math.sin(4.21 + f) * t * t;
}

// 月球角速度，誤差 < 5%。
export function moonAngularVelocity(t) {
  let v = 8399.71 - 914 * Math.sin(0.7848 + 8328.691425 * t + 0.0001523 * t * t);
  v -= 179 * Math.sin(2.543  + 15542.7543 * t)
    +  160 * Math.sin(0.1874 +  7214.0629 * t)
    +   62 * Math.sin(3.14   + 16657.3828 * t)
    +   34 * Math.sin(4.827  + 16866.9323 * t)
    +   22 * Math.sin(4.9    + 23871.4457 * t)
    +   12 * Math.sin(2.59   + 14914.4523 * t)
    +    7 * Math.sin(0.23   +  6585.7609 * t)
    +    5 * Math.sin(0.9    + 25195.624  * t)
    +    5 * Math.sin(2.32   -  7700.3895 * t)
    +    5 * Math.sin(3.88   +  8956.9934 * t)
    +    5 * Math.sin(0.49   +  7771.3771 * t);
  return v;
}

// === 視黃經差與太陽視黃經 ===

// 月日視黃經差。
export function moonSunApparentLongDiff(t, Mn, Sn) {
  return moonLongitude(t, Mn) + moonLongitudeAberration(t) - (earthLongitude(t, Sn) + sunLongitudeAberration(t) + Math.PI);
}

// 太陽視黃經。
export function sunApparentLongitude(t, n) {
  return earthLongitude(t, n) + nutationLongitudeMedium(t) + sunLongitudeAberration(t) + Math.PI;
}

// === 已知黃經求時間 ===

export function earthLongitudeToTime(W) {
  let v = 628.3319653318;
  let t = (W - 1.75347)          / v; v = earthAngularVelocity(t);
  t += (W - earthLongitude(t, 10)) / v; v = earthAngularVelocity(t);
  t += (W - earthLongitude(t, -1)) / v;
  return t;
}

export function moonLongitudeToTime(W) {
  let v = 8399.70911033384;
  let t = (W - 3.81034)          / v;
  t += (W - moonLongitude(t, 3))  / v; v = moonAngularVelocity(t);
  t += (W - moonLongitude(t, 20)) / v;
  t += (W - moonLongitude(t, -1)) / v;
  return t;
}

export function moonSunDiffToTime(W) {
  let v = 7771.37714500204;
  let t = (W + 1.08472) / v;
  t += (W - moonSunApparentLongDiff(t, 3, 3))   / v; v = moonAngularVelocity(t) - earthAngularVelocity(t);
  t += (W - moonSunApparentLongDiff(t, 20, 10)) / v;
  t += (W - moonSunApparentLongDiff(t, -1, 60)) / v;
  return t;
}

export function sunApparentLongToTime(W) {
  let v = 628.3319653318;
  let t = (W - 1.75347 - Math.PI) / v; v = earthAngularVelocity(t);
  t += (W - sunApparentLongitude(t, 10)) / v; v = earthAngularVelocity(t);
  t += (W - sunApparentLongitude(t, -1)) / v;
  return t;
}

// 高速低精度（誤差 ≤600 秒）。
export function moonSunDiffToTimeFaster(W) {
  let v = 7771.37714500204;
  let t = (W + 1.08472) / v;
  const t2 = t * t;
  t -= (-0.00003309 * t2
        + 0.10976 * Math.cos(0.784758 + 8328.6914246 * t + 0.000152292 * t2)
        + 0.02224 * Math.cos(0.18740  + 7214.0628654 * t - 0.00021848  * t2)
        - 0.03342 * Math.cos(4.669257 +  628.307585  * t)) / v;
  const L = moonLongitude(t, 20) - (4.8950632
        + 628.3319653318 * t
        + 0.000005297 * t * t
        + 0.0334166 * Math.cos(4.669257 + 628.307585 * t)
        + 0.0002061 * Math.cos(2.67823  + 628.307585 * t) * t
        + 0.000349  * Math.cos(4.6261   + 1256.61517 * t)
        - 20.5 / RAD_TO_ARCSEC);
  v = 7771.38
    - 914 * Math.sin(0.7848 + 8328.691425 * t + 0.0001523 * t * t)
    - 179 * Math.sin(2.543  + 15542.7543 * t)
    - 160 * Math.sin(0.1874 +  7214.0629 * t);
  t += (W - L) / v;
  return t;
}

export function sunApparentLongToTimeFaster(W) {
  let v = 628.3319653318;
  let t = (W - 1.75347 - Math.PI) / v;
  t -= (0.000005297 * t * t
        + 0.0334166 * Math.cos(4.669257 + 628.307585 * t)
        + 0.0002061 * Math.cos(2.67823  + 628.307585 * t) * t) / v;
  t += (W - earthLongitude(t, 8) - Math.PI + (20.5 + 17.2 * Math.sin(2.1824 - 33.75705 * t)) / RAD_TO_ARCSEC) / v;
  return t;
}

// === 月相、月亮地球近遠點 ===

// 月亮被照亮部分的比例。
export function moonIlluminatedFraction(t) {
  const t2 = t * t, t3 = t2 * t, t4 = t3 * t;
  const dm = Math.PI / 180;
  const D = (297.8502042 + 445267.1115168 * t - 0.0016300 * t2 + t3 / 545868   - t4 / 113065000) * dm;
  const M = (357.5291092 +  35999.0502909 * t - 0.0001536 * t2 + t3 / 24490000)                  * dm;
  const m = (134.9634114 + 477198.8676313 * t + 0.0089970 * t2 + t3 / 69699    - t4 / 14712000)  * dm;
  const a = Math.PI - D
    + (-6.289 * Math.sin(m) + 2.100 * Math.sin(M)
       - 1.274 * Math.sin(D * 2 - m) - 0.658 * Math.sin(D * 2)
       - 0.214 * Math.sin(m * 2)     - 0.110 * Math.sin(D)) * dm;
  return (1 + Math.cos(a)) / 2;
}

// 月亮站心視半徑（角秒）。r 為地月質心距離，h 為地平緯度。
export function moonAngularRadius(r, h) {
  return MOON_RADIUS_FACTOR_PENUMBRA / r * (1 + Math.sin(h) * EARTH_EQUATORIAL_RADIUS_KM / r);
}

// 月亮近／遠點時間與距離。min=1 求近點，否則遠點。
export function moonPerigeeApogee(t, min) {
  const a = 27.55454988 / 36525;
  const b = min ? -10.3302 / 36525 : 3.4471 / 36525;
  t = b + a * Math.floor((t - b) / a + 0.5);

  let dt = 2 / 36525;
  let r1 = evalELPMoon(2, t - dt, 10);
  let r2 = evalELPMoon(2, t,      10);
  let r3 = evalELPMoon(2, t + dt, 10);
  t += (r1 - r3) / (r1 + r3 - 2 * r2) * dt / 2;

  dt = 0.5 / 36525;
  r1 = evalELPMoon(2, t - dt, 20);
  r2 = evalELPMoon(2, t,      20);
  r3 = evalELPMoon(2, t + dt, 20);
  t += (r1 - r3) / (r1 + r3 - 2 * r2) * dt / 2;

  dt = 1200 / 86400 / 36525;
  r1 = evalELPMoon(2, t - dt, -1);
  r2 = evalELPMoon(2, t,      -1);
  r3 = evalELPMoon(2, t + dt, -1);
  t += (r1 - r3) / (r1 + r3 - 2 * r2) * dt / 2;
  r2 += (r1 - r3) / (r1 + r3 - 2 * r2) * (r3 - r1) / 8;
  return [t, r2];
}

// 月亮升／降交點。asc=1 升交點，否則降交點。
export function moonNode(t, asc) {
  const a = 27.21222082 / 36525;
  const b = asc ? 21 / 36525 : 35 / 36525;
  t = b + a * Math.floor((t - b) / a + 0.5);

  let dt = 0.5 / 36525;
  let w  = evalELPMoon(1, t, 10);
  let w2 = evalELPMoon(1, t + dt, 10);
  let v = (w2 - w) / dt; t -= w / v;

  dt = 0.05 / 36525;
  w  = evalELPMoon(1, t, 40);
  w2 = evalELPMoon(1, t + dt, 40);
  v = (w2 - w) / dt; t -= w / v;

  w = evalELPMoon(1, t, -1); t -= w / v;
  return [t, evalELPMoon(0, t, -1)];
}

// 地球近／遠日點。
export function earthPerihelionAphelion(t, min) {
  const a = 365.25963586 / 36525;
  const b = min ? 1.7 / 36525 : 184.5 / 36525;
  t = b + a * Math.floor((t - b) / a + 0.5);

  let dt = 3 / 36525;
  let r1 = evalVSOP87(0, 2, t - dt, 10);
  let r2 = evalVSOP87(0, 2, t,      10);
  let r3 = evalVSOP87(0, 2, t + dt, 10);
  t += (r1 - r3) / (r1 + r3 - 2 * r2) * dt / 2;

  dt = 0.2 / 36525;
  r1 = evalVSOP87(0, 2, t - dt, 80);
  r2 = evalVSOP87(0, 2, t,      80);
  r3 = evalVSOP87(0, 2, t + dt, 80);
  t += (r1 - r3) / (r1 + r3 - 2 * r2) * dt / 2;

  dt = 0.01 / 36525;
  r1 = evalVSOP87(0, 2, t - dt, -1);
  r2 = evalVSOP87(0, 2, t,      -1);
  r3 = evalVSOP87(0, 2, t + dt, -1);
  t += (r1 - r3) / (r1 + r3 - 2 * r2) * dt / 2;
  r2 += (r1 - r3) / (r1 + r3 - 2 * r2) * (r3 - r1) / 8;
  return [t, r2];
}

// === 朔日編號與太陽升降迭代 ===

// 朔日編號（jd 應在朔日附近，允許誤差數天）。
export function newMoonOrdinal(jd) {
  return Math.floor((jd + 8) / 29.5306);
}

// 太陽升降迭代細化。jd 為儒略日（須接近 L 當地平午 UT），L 經度、fa 緯度，sj=-1 求升、sj=1 求降。
// 回傳格林尼治 UT。
export function findSunRiseOrSet(jd, L, fa, sj) {
  jd = Math.floor(jd + 0.5) - L / TWO_PI;
  for (let i = 0; i < 2; i++) {
    const T = jd / 36525;
    const E = (84381.4060 - 46.836769 * T) / RAD_TO_ARCSEC;
    const t = T + (32 * (T + 1.8) * (T + 1.8) - 20) / 86400 / 36525;
    const J = (48950621.66 + 6283319653.318 * t + 53 * t * t - 994
              + 334166 * Math.cos(4.669257 +  628.307585 * t)
              +   3489 * Math.cos(4.6261   + 1256.61517  * t)
              + 2060.6 * Math.cos(2.67823  +  628.307585 * t) * t) / 10000000;
    const sinJ = Math.sin(J), cosJ = Math.cos(J);
    const gst = (0.7790572732640 + 1.00273781191135448 * jd) * TWO_PI
              + (0.014506 + 4612.15739966 * T + 1.39667721 * T * T) / RAD_TO_ARCSEC;
    const A = Math.atan2(sinJ * Math.cos(E), cosJ);
    const D = Math.asin(Math.sin(E) * sinJ);
    const cosH0 = (Math.sin(-50 * 60 / RAD_TO_ARCSEC) - Math.sin(fa) * Math.sin(D)) / (Math.cos(fa) * Math.cos(D));
    if (Math.abs(cosH0) >= 1) return 0;
    jd += normalizeAngleSigned(sj * Math.acos(cosH0) - (gst + L - A)) / 6.28;
  }
  return jd;
}
