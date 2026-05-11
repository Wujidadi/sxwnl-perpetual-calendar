// 角度正規化、球面⇄直角座標、球面三角。

export function normalizeAngle(v) {
  v = v % (2 * Math.PI);
  if (v < 0) return v + 2 * Math.PI;
  return v;
}

export function normalizeAngleSigned(v) {
  v = v % (2 * Math.PI);
  if (v <= -Math.PI) return v + 2 * Math.PI;
  if (v > Math.PI) return v - 2 * Math.PI;
  return v;
}

// 臨界餘數：a 與最近 b 整倍數之差，範圍 [-b/2, b/2]。
export function balancedMod(a, b) {
  let c = (a + b) % b;
  if (c > b / 2.0) c -= b;
  return c;
}

// 球面（黃經 J、黃緯 W、距離 R）→ 直角 (x, y, z)。
export function sphericalToCartesian(JW) {
  const r = new Array();
  const J = JW[0], W = JW[1], R = JW[2];
  r[0] = R * Math.cos(W) * Math.cos(J);
  r[1] = R * Math.cos(W) * Math.sin(J);
  r[2] = R * Math.sin(W);
  return r;
}

// 直角 → 球面 (J, W, R)。
export function cartesianToSpherical(xyz) {
  const r = new Array();
  const x = xyz[0], y = xyz[1], z = xyz[2];
  r[2] = Math.sqrt(x * x + y * y + z * z);
  r[1] = Math.asin(z / r[2]);
  r[0] = normalizeAngle(Math.atan2(y, x));
  return r;
}

// 球面座標旋轉。黃道⇄赤道時：赤→黃取負 E。
export function rotateSpherical(JW, E) {
  const r = new Array();
  const J = JW[0], W = JW[1];
  r[0] = Math.atan2(Math.sin(J) * Math.cos(E) - Math.tan(W) * Math.sin(E), Math.cos(J));
  r[1] = Math.asin(Math.cos(E) * Math.sin(W) + Math.sin(E) * Math.cos(W) * Math.sin(J));
  r[2] = JW[2];
  r[0] = normalizeAngle(r[0]);
  return r;
}

// 赤道座標 → 地平座標。
export function equatorialToHorizon(z, L, fa, gst) {
  let a = new Array(z[0] + Math.PI / 2 - gst - L, z[1], z[2]);
  a = rotateSpherical(a, Math.PI / 2 - fa);
  a[0] = normalizeAngle(-Math.PI / 2 - a[0]);
  return a;
}

// 球面兩點角距。小角度近似走平面公式（避免 acos 在接近 1 處精度損失）。
export function angularSeparation(J1, W1, J2, W2) {
  const dJ = normalizeAngleSigned(J1 - J2);
  const dW = W1 - W2;
  if (Math.abs(dJ) < 1 / 1000 && Math.abs(dW) < 1 / 1000) {
    const adj = dJ * Math.cos((W1 + W2) / 2);
    return Math.sqrt(adj * adj + dW * dW);
  }
  return Math.acos(Math.sin(W1) * Math.sin(W2) + Math.cos(W1) * Math.cos(W2) * Math.cos(dJ));
}

// 日心球面 → 地心球面（通用平移）。z 為星體、a 為地球。
export function heliocentricToGeocentric(z, a) {
  a = sphericalToCartesian(a);
  z = sphericalToCartesian(z);
  z[0] -= a[0]; z[1] -= a[1]; z[2] -= a[2];
  return cartesianToSpherical(z);
}

// 視差角（非視差本身）。
export function parallacticAngle(gst, L, fa, J, W) {
  const H = gst + L - J;
  return normalizeAngle(Math.atan2(Math.sin(H), Math.tan(fa) * Math.cos(W) - Math.sin(W) * Math.cos(H)));
}
