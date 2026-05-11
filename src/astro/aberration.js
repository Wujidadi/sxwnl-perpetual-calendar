// 太陽與月球的光行差修正（弧度）。t 為儒略世紀數。

import { RAD_TO_ARCSEC } from './constants.js';

// 太陽黃經光行差。
export function sunLongitudeAberration(t) {
  const v = -0.043126 + 628.301955 * t - 0.000002732 * t * t; // 平近點角
  const e =  0.016708634 - 0.000042037 * t - 0.0000001267 * t * t;
  return (-20.49552 * (1 + e * Math.cos(v))) / RAD_TO_ARCSEC;
}

// 太陽黃緯光行差。
export function sunLatitudeAberration(t) {
  return 0;
}

// 月球經度光行差，誤差 0.07″。
export function moonLongitudeAberration(t) {
  return -3.4e-6;
}

// 月球緯度光行差，誤差 0.006″。
export function moonLatitudeAberration(t) {
  return 0.063 * Math.sin(0.057 + 8433.4662 * t + 0.000064 * t * t) / RAD_TO_ARCSEC;
}
