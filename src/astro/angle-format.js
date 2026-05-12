// 弧度⇄字串：度分秒（°′″）與時分秒（h m s）。
// 單位字符以 i18n 字典提供（astro.angle.*）。

import { RAD_TO_ARCSEC } from './constants.js';
import { t } from '../i18n/index.js';

// 弧度→字串，可指定小數位 ext。tim=1 採時分秒，否則度分秒。
export function formatRadianFull(d, tim, ext) {
  const u = t('astro.angle');
  let s = ' ';
  let w1 = u.deg, w2 = u.arcmin, w3 = u.arcsec;
  if (d < 0) { d = -d; s = '-'; }
  if (tim) { d *= 12 / Math.PI; w1 = u.hour; w2 = u.min; w3 = u.sec; }
  else d *= 180 / Math.PI;
  let a = Math.floor(d); d = (d - a) * 60;
  let b = Math.floor(d); d = (d - b) * 60;
  let c = Math.floor(d);
  const Q = Math.pow(10, ext);
  d = Math.floor((d - c) * Q + 0.5);
  if (d >= Q) { d -= Q; c++; }
  if (c >= 60) { c -= 60; b++; }
  if (b >= 60) { b -= 60; a++; }
  const aStr = '   ' + a, bStr = '0' + b, cStr = '0' + c, dStr = '00000' + d;
  s += aStr.substr(aStr.length - 3, 3) + w1;
  s += bStr.substr(bStr.length - 2, 2) + w2;
  s += cStr.substr(cStr.length - 2, 2);
  if (ext) s += '.' + dStr.substr(dStr.length - ext, ext) + w3;
  return s;
}

export function formatRadian(d, tim) {
  return formatRadianFull(d, tim, 2);
}

// 弧度→字串，精確到分。
export function formatRadianToMinute(d) {
  const u = t('astro.angle');
  let s = '+';
  const w1 = u.deg, w2 = u.arcmin;
  if (d < 0) { d = -d; s = '-'; }
  d *= 180 / Math.PI;
  let a = Math.floor(d);
  let b = Math.floor((d - a) * 60 + 0.5);
  if (b >= 60) { b -= 60; a++; }
  const aStr = '   ' + a, bStr = '0' + b;
  s += aStr.substr(aStr.length - 3, 3) + w1;
  s += bStr.substr(bStr.length - 2, 2) + w2;
  return s;
}

// 角秒→分秒。style=0 角度分秒、1 中文分秒、2 英文 m/s。
export function formatArcSeconds(v, fx, fs) {
  const u = t('astro.angle');
  let gn = '';
  if (v < 0) { v = -v; gn = '-'; }
  const f = Math.floor(v / 60);
  const m = v - f * 60;
  if (!fs)      return gn + f + u.arcmin + m.toFixed(fx) + u.arcsec;
  if (fs === 1) return gn + f + u.cnMin  + m.toFixed(fx) + u.cnSec;
  if (fs === 2) return gn + f + 'm'      + m.toFixed(fx) + 's';
}

// 字串→弧度。f=1 表示輸入是時分秒（會乘 15 轉換為度）。
export function parseAngleToRadian(s, f) {
  let fh = 1;
  f = f ? 15 : 1;
  if (s.indexOf('-') !== -1) fh = -1;
  s = s.replace(/h|m|s|(-)|(°)|\'|\"/g, ' ');
  s = s.replace(/ +/g, ' ');
  s = s.replace(/(^\s*)|(\s*$)/g, '');
  const parts = s.split(' ');
  return fh * (parts[0] * 3600 + parts[1] * 60 + parts[2] * 1) / RAD_TO_ARCSEC * f;
}
