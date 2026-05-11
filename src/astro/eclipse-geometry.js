// 日月食計算用的線／圓／橢圓交點工具。

import {
  EARTH_EQUATORIAL_RADIUS_KM,
  EARTH_POLAR_EQ_RATIO,
  EARTH_POLAR_EQ_RATIO_SQ,
} from './constants.js';
import {
  normalizeAngleSigned,
  sphericalToCartesian,
} from './math-utils.js';

// 空間兩點連線與地球（橢球）的交點，回傳靠近 (x1, y1, z1) 的交點。
// 結果含 D（判別式）；D<0 表無解。
export function lineEllipsoidIntersect(x1, y1, z1, x2, y2, z2, e, r) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
  const e2 = e * e;
  const p = {};
  const A = dx * dx + dy * dy + dz * dz / e2;
  const B = x1 * dx + y1 * dy + z1 * dz / e2;
  const C = x1 * x1 + y1 * y1 + z1 * z1 / e2 - r * r;
  p.D = B * B - A * C;
  if (p.D < 0) return p;
  let D = Math.sqrt(p.D);
  if (B < 0) D = -D;
  const t = (-B + D) / A;
  p.x = x1 + dx * t;
  p.y = y1 + dy * t;
  p.z = z1 + dz * t;
  const R = Math.sqrt(dx * dx + dy * dy + dz * dz);
  p.R1 = R * Math.abs(t);
  p.R2 = R * Math.abs(t - 1);
  return p;
}

// 同上，輸入為貝塞爾座標。I 為貝塞爾座標參數。
export function lineEarthIntersectBessel(x1, y1, z1, x2, y2, z2, e, r, I) {
  const P = Math.cos(I[1]), Q = Math.sin(I[1]);
  const X1 = x1, Y1 = P * y1 - Q * z1, Z1 = Q * y1 + P * z1;
  const X2 = x2, Y2 = P * y2 - Q * z2, Z2 = Q * y2 + P * z2;
  const p = lineEllipsoidIntersect(X1, Y1, Z1, X2, Y2, Z2, e, r);
  p.J = p.W = 100;
  if (p.D < 0) return p;
  p.J = normalizeAngleSigned(Math.atan2(p.y, p.x) + I[0] - I[2]);
  p.W = Math.atan(p.z / e / e / Math.sqrt(p.x * p.x + p.y * p.y));
  return p;
}

// 分點座標中，空間兩點連線與地球的交點，回傳地標。gst 為格林尼治恆星時。
export function lineEarthIntersect(P, Q, gst) {
  const pc = sphericalToCartesian(P);
  const qc = sphericalToCartesian(Q);
  const r = lineEllipsoidIntersect(
    pc[0], pc[1], pc[2],
    qc[0], qc[1], qc[2],
    EARTH_POLAR_EQ_RATIO,
    EARTH_EQUATORIAL_RADIUS_KM,
  );
  if (r.D < 0) { r.J = r.W = 100; return r; }
  r.W = Math.atan(r.z / EARTH_POLAR_EQ_RATIO_SQ / Math.sqrt(r.x * r.x + r.y * r.y));
  r.J = normalizeAngleSigned(Math.atan2(r.y, r.x) - gst);
  return r;
}

// 橢圓與圓的交點。R 為橢圓長半徑、ba 為短長軸比、R2 為圓半徑、(x0, y0) 為圓心。
export function ellipseCircleIntersect(R, ba, R2, x0, y0) {
  const re = {};
  const d = Math.sqrt(x0 * x0 + y0 * y0);
  const sinB = y0 / d, cosB = x0 / d;
  let cosA = (R * R + d * d - R2 * R2) / (2 * d * R);
  if (Math.abs(cosA) > 1) { re.n = 0; return re; }
  let sinA = Math.sqrt(1 - cosA * cosA);

  const ba2 = ba * ba;
  for (let k = -1; k < 2; k += 2) {
    let S = cosA * sinB + sinA * cosB * k;
    const g = R - S * S * (1 / ba2 - 1) / 2;
    cosA = (g * g + d * d - R2 * R2) / (2 * d * g);
    if (Math.abs(cosA) > 1) { re.n = 0; return re; }
    sinA = Math.sqrt(1 - cosA * cosA);
    const C = cosA * cosB - sinA * sinB * k;
    S = cosA * sinB + sinA * cosB * k;
    if (k === 1) re.A = [g * C, g * S];
    else         re.B = [g * C, g * S];
  }
  re.n = 2;
  return re;
}

// 線與橢圓的交點。
export function lineEllipseIntersect(x1, y1, dx, dy, r, ba) {
  const p = {};
  const f = ba * ba;
  const A = dx * dx + dy * dy / f;
  const B = x1 * dx + y1 * dy / f;
  const C = x1 * x1 + y1 * y1 / f - r * r;
  let D = B * B - A * C;
  if (D < 0) { p.n = 0; return p; }
  p.n = D ? 2 : 1;
  D = Math.sqrt(D);
  const t1 = (-B + D) / A, t2 = (-B - D) / A;
  p.A = [x1 + dx * t1, y1 + dy * t1];
  p.B = [x1 + dx * t2, y1 + dy * t2];
  const L = Math.sqrt(dx * dx + dy * dy);
  p.R1 = L * Math.abs(t1);
  p.R2 = L * Math.abs(t2);
  return p;
}
