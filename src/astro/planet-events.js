// 行星天象函式族：距角、大距、留、合月、合日／衝、星曆。

import {
  RAD_TO_ARCSEC,
  AU_KM,
  SPEED_OF_LIGHT_KM_S,
  LIGHT_TIME_PER_AU_JCY,
  TWO_PI,
  SYNODIC_PERIODS,
} from './constants.js';
import {
  normalizeAngle,
  normalizeAngleSigned,
  rotateSpherical,
  angularSeparation,
  heliocentricToGeocentric,
} from './math-utils.js';
import { formatRadian } from './angle-format.js';
import { meanObliquityP03 } from './precession.js';
import { nutationMedium } from './nutation.js';
import { applyParallax, refractionFromTrueAltitude } from './corrections.js';
import { evalVSOP87, planetCoord, earthCoord } from './vsop87.js';
import { moonCoord } from './elp-moon.js';
import { meanSiderealTimeFromTD } from './sidereal-time.js';

// 行星距角；jing 為精度控制（0 低、1 中、≥2 高，補光行時）。
export function planetElongation(xt, t, jing) {
  let a = planetCoord(0,  t, 10, 10, 10);
  let z = planetCoord(xt, t, 10, 10, 10);
  z = heliocentricToGeocentric(z, a);
  if (jing === 1) {
    a = planetCoord(0,  t, 60, 60, 60);
    z = planetCoord(xt, t, 60, 60, 60);
    z = heliocentricToGeocentric(z, a);
  }
  if (jing >= 2) {
    a = planetCoord(0,  t - a[2] * LIGHT_TIME_PER_AU_JCY, -1, -1, -1);
    z = planetCoord(xt, t - z[2] * LIGHT_TIME_PER_AU_JCY, -1, -1, -1);
    z = heliocentricToGeocentric(z, a);
  }
  a[0] += Math.PI; a[1] = -a[1]; // 太陽
  return angularSeparation(z[0], z[1], a[0], a[1]);
}

// 大距（東 dx=1 / 西 dx=0）。僅適用水星（xt=1）、金星（xt=2）。
export function greatestElongation(xt, t, dx) {
  let a, b, c;
  if (xt === 1) { a = 115.8774777586 / 36525; c = [2, 0.2, 0.01, 46,  87]; }
  if (xt === 2) { a = 583.9213708245 / 36525; c = [4, 0.2, 0.01, 382, 521]; }
  b = dx ? c[3] / 36525 : c[4] / 36525;
  t = b + a * Math.floor((t - b) / a + 0.5);
  let r1, r2, r3, dt;
  for (let i = 0; i < 3; i++) {
    dt = c[i] / 36525;
    r1 = planetElongation(xt, t - dt, i);
    r2 = planetElongation(xt, t,      i);
    r3 = planetElongation(xt, t + dt, i);
    t += (r1 - r3) / (r1 + r3 - 2 * r2) * dt / 2;
  }
  r2 += (r1 - r3) / (r1 + r3 - 2 * r2) * (r3 - r1) / 8;
  return [t, r2];
}

// 行星視座標（含可選的章動修正）。gxs 為光行時。
export function planetApparentCoord(xt, t, n, gxs) {
  let a = planetCoord(0,  t - gxs, n, n, n);
  let z = planetCoord(xt, t - gxs, n, n, n);
  z = heliocentricToGeocentric(z, a);
  let E = meanObliquityP03(t);
  if (gxs) {
    const zd = nutationMedium(t);
    z[0] += zd[0];
    E    += zd[1];
  }
  z = rotateSpherical(z, E);
  return z;
}

// 行星留（順留 sn=1，逆留 sn=0）。
export function planetStation(xt, t, sn) {
  const hh = SYNODIC_PERIODS[xt - 1] / 36525;
  let v = TWO_PI / hh; if (xt > 2) v = -v;
  for (let i = 0; i < 6; i++) {
    t -= normalizeAngleSigned(evalVSOP87(xt, 0, t, 8) - evalVSOP87(0, 0, t, 8)) / v;
  }
  const tt = [5 / 36525, 1 / 36525, 0.5 / 36525, 2e-6, 2e-6];
  const tcArr = [17.4, 28, 52, 82, 86, 88, 89, 90];
  const tc = tcArr[xt - 1] / 36525;
  if (sn) { if (xt > 2) t -= tc; else t += tc; }
  else    { if (xt > 2) t += tc; else t -= tc; }

  let y1, y2, y3;
  for (let i = 0; i < 4; i++) {
    let dt = tt[i], n = 8, g = 0;
    if (i >= 3) {
      g = y2[2] * LIGHT_TIME_PER_AU_JCY;
      n = -1;
    }
    y1 = planetApparentCoord(xt, t - dt, n, g);
    y2 = planetApparentCoord(xt, t,      n, g);
    y3 = planetApparentCoord(xt, t + dt, n, g);
    t += (y1[0] - y3[0]) / (y1[0] + y3[0] - 2 * y2[0]) * dt / 2;
  }
  return t;
}

// 月亮行星視赤經差。g=[gxsMoon, gxsPlanet, dL（章動黃經）, dE（章動交角）]。
export function moonPlanetRADiff(xt, t, n, E, g) {
  let a = planetCoord(0,  t - g[1], n, n, n);
  let p = planetCoord(xt, t - g[1], n, n, n);
  let m = moonCoord(   t - g[0], n, n, n);
  p = heliocentricToGeocentric(p, a);
  m[0] += g[2]; p[0] += g[2];
  m = rotateSpherical(m, E + g[3]);
  p = rotateSpherical(p, E + g[3]);
  return [
    normalizeAngleSigned(m[0] - p[0]),
    m[1] - p[1],
    m[2] / SPEED_OF_LIGHT_KM_S / 86400 / 36525,
    p[2] / SPEED_OF_LIGHT_KM_S / 86400 / 36525 * AU_KM,
  ];
}

// 行星合月（視赤經）。
export function planetMoonConjunction(xt, t) {
  let d;
  let g = [0, 0, 0, 0];
  for (let i = 0; i < 3; i++) {
    d = moonPlanetRADiff(xt, t, 8, 0.4091, g);
    t -= d[0] / 8192;
  }
  const E = meanObliquityP03(t);
  const zd = nutationMedium(t);
  g = [d[2], d[3], zd[0], zd[1]];

  d        = moonPlanetRADiff(xt, t,        8, E, g);
  const d2 = moonPlanetRADiff(xt, t + 1e-6, 8, E, g);
  const v  = (d2[0] - d[0]) / 1e-6;

  d = moonPlanetRADiff(xt, t, 30, E, g); t -= d[0] / v;
  d = moonPlanetRADiff(xt, t, -1, E, g); t -= d[0] / v;
  return [t, d[1]];
}

// 行星太陽視黃經差與 w0 的差。
export function planetSunLongDiffOffset(xt, t, n, w0, ts, tp) {
  let a = planetCoord(0,  t - tp, n, n, n);
  let p = planetCoord(xt, t - tp, n, n, n);
  let s = planetCoord(0,  t - ts, n, n, n);
  s[0] += Math.PI; s[1] = -s[1];
  p = heliocentricToGeocentric(p, a);
  return [
    normalizeAngleSigned(p[0] - s[0] - w0),
    p[1] - s[1],
    s[2] * LIGHT_TIME_PER_AU_JCY,
    p[2] * LIGHT_TIME_PER_AU_JCY,
  ];
}

// 合日 / 衝 共用內部實作。f=1 求衝（或下合），否則求合（或上合）。
function planetSunAspectInternal(xt, t, f) {
  let w0 = Math.PI, w1 = 0;
  if (f) {
    w0 = 0;
    if (xt > 2) w1 = Math.PI;
  }
  let v = TWO_PI / SYNODIC_PERIODS[xt - 1] * 36525;
  if (xt > 2) v = -v;
  for (let i = 0; i < 6; i++) {
    t -= normalizeAngleSigned(evalVSOP87(xt, 0, t, 8) - evalVSOP87(0, 0, t, 8) - w0) / v;
  }
  const dt = 2e-5;
  let a = planetSunLongDiffOffset(xt, t,      8, w1, 0, 0);
  const b = planetSunLongDiffOffset(xt, t + dt, 8, w1, 0, 0);
  v = (b[0] - a[0]) / dt;
  a = planetSunLongDiffOffset(xt, t, 40, w1, a[2], a[3]); t -= a[0] / v;
  a = planetSunLongDiffOffset(xt, t, -1, w1, a[2], a[3]); t -= a[0] / v;
  return [t, a[1]];
}

// 行星合日（或上合 / 下合）。
export function planetSunConjunction(xt, t) {
  return planetSunAspectInternal(xt, t, 0);
}

// 行星衝（或下合）。
export function planetSunOpposition(xt, t) {
  return planetSunAspectInternal(xt, t, 1);
}

// 行星星曆。xt=10 為月亮，xt<10 為行星或太陽。jd 為力學時。
export function planetEphemeris(xt, jd, L, fa) {
  const T = jd / 36525;
  const zd = nutationMedium(T);
  const dL = zd[0], dE = zd[1];
  const E = meanObliquityP03(T) + dE;
  const gstPing = meanSiderealTimeFromTD(jd);
  const gst = gstPing + dL * Math.cos(E);

  let z, a, z2, a2, ra, rb, rc;
  let s = '';
  let rfn = 8;

  if (xt === 10) {
    rfn = 2;
    a = earthCoord(T, 15, 15, 15);
    z = moonCoord(T, 1, 1, -1); ra = z[2];

    let T1 = T - ra * LIGHT_TIME_PER_AU_JCY / AU_KM;

    a2 = earthCoord(T1, 15, 15, 15);
    z  = moonCoord(T1, -1, -1, -1); rc = z[2];

    a2 = heliocentricToGeocentric(a, a2); a2[2] *= AU_KM;
    z2 = heliocentricToGeocentric(z, a2); rb = z2[2];

    z[0] = normalizeAngle(z[0] + dL);
    s += '视黄经 ' + formatRadian(z[0], 0) + ' 视黄纬 ' + formatRadian(z[1], 0) + ' 地心距 ' + ra.toFixed(rfn) + '\r\n';
    z = rotateSpherical(z, E);
    s += '视赤经 ' + formatRadian(z[0], 1) + ' 视赤纬 ' + formatRadian(z[1], 0) + ' 光行距 ' + rb.toFixed(rfn) + '\r\n';
  }
  if (xt < 10) {
    a = planetCoord(0,  T, -1, -1, -1);
    z = planetCoord(xt, T, -1, -1, -1);
    z[0] = normalizeAngle(z[0]);
    s += '黄经一 ' + formatRadian(z[0], 0) + ' 黄纬一 ' + formatRadian(z[1], 0) + ' 向径一 ' + z[2].toFixed(rfn) + '\r\n';

    z = heliocentricToGeocentric(z, a); ra = z[2];
    const T1 = T - ra * LIGHT_TIME_PER_AU_JCY;

    a2 = planetCoord(0,  T1, -1, -1, -1);
    z2 = planetCoord(xt, T1, -1, -1, -1);
    z = heliocentricToGeocentric(z2, a);  rb = z[2];
    z = heliocentricToGeocentric(z2, a2); rc = z[2];
    z[0] = normalizeAngle(z[0] + dL);

    s += '视黄经 ' + formatRadian(z[0], 0) + ' 视黄纬 ' + formatRadian(z[1], 0) + ' 地心距 ' + ra.toFixed(rfn) + '\r\n';
    z = rotateSpherical(z, E);
    s += '视赤经 ' + formatRadian(z[0], 1) + ' 视赤纬 ' + formatRadian(z[1], 0) + ' 光行距 ' + rb.toFixed(rfn) + '\r\n';
  }

  const sj = normalizeAngleSigned(gst + L - z[0]);
  applyParallax(z, sj, fa, 0);
  s += '站赤经 ' + formatRadian(z[0], 1) + ' 站赤纬 ' + formatRadian(z[1], 0) + ' 视距离 ' + rc.toFixed(rfn) + '\r\n';

  z[0] += Math.PI / 2 - gst - L;
  z = rotateSpherical(z, Math.PI / 2 - fa);
  z[0] = normalizeAngle(-Math.PI / 2 - z[0]);
  if (z[1] > 0) z[1] += refractionFromTrueAltitude(z[1]);
  s += '方位角 ' + formatRadian(z[0], 0) + ' 高度角 ' + formatRadian(z[1], 0) + '\r\n';
  s += '恒星时 ' + formatRadian(normalizeAngle(gstPing), 1) + '(平) ' + formatRadian(normalizeAngle(gst), 1) + '(真)\r\n';

  return s;
}
