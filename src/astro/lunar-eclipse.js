// 月食計算器。

import {
  RAD_TO_ARCSEC,
  TWO_PI,
  AU_KM,
  J2000,
  MOON_RADIUS_FACTOR_PENUMBRA,
  EARTH_MEAN_RADIUS_KM,
} from './constants.js';
import { normalizeAngle, normalizeAngleSigned, rotateSpherical } from './math-utils.js';
import { formatRadian, formatArcSeconds } from './angle-format.js';
import { deltaT } from './delta-t.js';
import { formatTimeOfDay, formatJD } from './julian-day.js';
import { meanObliquityP03 } from './precession.js';
import { nutationMedium } from './nutation.js';
import { applyParallax, refractionFromTrueAltitude } from './corrections.js';
import { earthCoord } from './vsop87.js';
import { moonCoord } from './elp-moon.js';
import { meanSiderealTimeFromUT } from './sidereal-time.js';
import { sunLongitudeAberration, sunLatitudeAberration, moonLongitudeAberration, moonLatitudeAberration } from './aberration.js';
import {
  moonIlluminatedFraction,
  moonSunDiffToTimeFaster,
  moonAngularVelocity,
  earthAngularVelocity,
} from './ephemeris.js';
import { lineEarthIntersect } from './eclipse-geometry.js';

export const lunarEclipse = {
  // 主計算。T 為力學時（J2000 起算日），L、fa 為站點經緯，high 為海拔（千米）。
  calc(T, L, fa, high) {
    this.T = T; this.L = L; this.fa = fa;
    this.dt = deltaT(T);
    this.jd = T - this.dt;
    T /= 36525;
    const zd = nutationMedium(T);
    this.dL = zd[0];
    this.dE = zd[1];
    this.E = meanObliquityP03(T) + this.dE;
    this.gst = meanSiderealTimeFromUT(this.jd, this.dt) + this.dL * Math.cos(this.E);

    // ===== 月亮 =====
    let z = moonCoord(T, -1, -1, -1);
    z[0] = normalizeAngle(z[0] + moonLongitudeAberration(T) + this.dL);
    z[1] += moonLatitudeAberration(T);
    this.mHJ = z[0]; this.mHW = z[1]; this.mR = z[2];

    z = rotateSpherical(z, this.E);
    this.mCJ = z[0]; this.mCW = z[1];

    this.mShiJ = normalizeAngle(this.gst + L - z[0]);
    if (this.mShiJ > Math.PI) this.mShiJ -= TWO_PI;

    applyParallax(z, this.mShiJ, fa, high);
    this.mCJ2 = z[0]; this.mCW2 = z[1]; this.mR2 = z[2];

    z[0] += Math.PI / 2 - this.gst - L;
    z = rotateSpherical(z, Math.PI / 2 - fa);
    z[0] = normalizeAngle(-Math.PI / 2 - z[0]);
    this.mDJ = z[0]; this.mDW = z[1];
    if (z[1] > 0) z[1] += refractionFromTrueAltitude(z[1]);
    this.mPJ = z[0]; this.mPW = z[1];

    // ===== 太陽 =====
    z = earthCoord(T, -1, -1, -1);
    z[0] = normalizeAngle(z[0] + Math.PI + sunLongitudeAberration(T) + this.dL);
    z[1] = -z[1] + sunLatitudeAberration(T);
    this.sHJ = z[0]; this.sHW = z[1]; this.sR = z[2];

    z = rotateSpherical(z, this.E);
    this.sCJ = z[0]; this.sCW = z[1];

    this.sShiJ = normalizeAngle(this.gst + L - z[0]);
    if (this.sShiJ > Math.PI) this.sShiJ -= TWO_PI;

    applyParallax(z, this.sShiJ, fa, high);
    this.sCJ2 = z[0]; this.sCW2 = z[1]; this.sR2 = z[2];

    z[0] += Math.PI / 2 - this.gst - L;
    z = rotateSpherical(z, Math.PI / 2 - fa);
    z[0] = normalizeAngle(-Math.PI / 2 - z[0]);
    this.sDJ = z[0]; this.sDW = z[1];
    if (z[1] > 0) z[1] += refractionFromTrueAltitude(z[1]);
    this.sPJ = z[0]; this.sPW = z[1];

    // ===== 時差、視半徑、月相 =====
    const t = T / 10, t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t;
    let Lon = (1753470142 + 6283319653318 * t + 529674 * t2 + 432 * t3 - 1124 * t4 - 9 * t5) / 1000000000 + Math.PI - 20.5 / RAD_TO_ARCSEC;
    Lon = normalizeAngle(Lon - (this.sCJ - this.dL * Math.cos(this.E)));
    if (Lon > Math.PI) Lon -= TWO_PI;
    this.sc = Lon / TWO_PI;

    this.pty = this.jd + L / TWO_PI;
    this.zty = this.jd + L / TWO_PI + this.sc;

    this.mRad   = MOON_RADIUS_FACTOR_PENUMBRA / this.mR2;
    this.sRad   = 959.63 / this.sR2;
    this.e_mRad = MOON_RADIUS_FACTOR_PENUMBRA / this.mR;
    this.eShadow  = (EARTH_MEAN_RADIUS_KM / this.mR * RAD_TO_ARCSEC - (959.63 - 8.794) / this.sR) * 51 / 50;
    this.eShadow2 = (EARTH_MEAN_RADIUS_KM / this.mR * RAD_TO_ARCSEC + (959.63 + 8.794) / this.sR) * 51 / 50;
    this.mIll = moonIlluminatedFraction(T);

    // ===== 中心食 =====
    if (Math.abs(normalizeAngleSigned(this.mCJ - this.sCJ)) < 50 / 180 * Math.PI) {
      const pp = lineEarthIntersect(
        [this.mCJ, this.mCW, this.mR],
        [this.sCJ, this.sCW, this.sR * AU_KM],
        this.gst,
      );
      this.zx_J = pp.J;
      this.zx_W = pp.W;
    } else {
      this.zx_J = this.zx_W = 100;
    }
  },

  // 結果格式化為 HTML。fs 為 1 時附力學時與章動細節。
  toHTML(fs) {
    let s = '<table width="100%" cellspacing=1 cellpadding=0 bgcolor="#FFC0C0">';

    s += '<tr><td bgcolor=white align=center>';
    s += '平太阳 ' + formatTimeOfDay(this.pty) + ' 真太阳 <font color=red>' + formatTimeOfDay(this.zty) + '</font><br>';
    s += '时差 ' + formatArcSeconds(this.sc * 86400, 2, 1) + ' 月亮被照亮 ' + (this.mIll * 100).toFixed(2) + '% ';
    s += '</td></tr>';

    s += '<tr><td bgcolor=white><center><pre style="margin-top: 0; margin-bottom: 0"><font color=blue><b>表一       月亮            太阳</b></font>\r\n';
    s += '视黄经 ' + formatRadian(this.mHJ, 0) + '  ' + formatRadian(this.sHJ, 0) + '\r\n';
    s += '视黄纬 ' + formatRadian(this.mHW, 0) + '  ' + formatRadian(this.sHW, 0) + '\r\n';
    s += '视赤经 ' + formatRadian(this.mCJ, 1) + '  ' + formatRadian(this.sCJ, 1) + '\r\n';
    s += '视赤纬 ' + formatRadian(this.mCW, 0) + '  ' + formatRadian(this.sCW, 0) + '\r\n';
    s += '距离     ' + (this.mR).toFixed(2) + '千米     ' + (this.sR).toFixed(8) + 'AU' + '\r\n';
    s += '</pre></center></td></tr>';

    s += '<tr><td bgcolor=white><center><pre style="margin-top: 0; margin-bottom: 0"><font color=blue><b>表二       月亮            太阳</b></font>\r\n';
    s += '方位角 ' + formatRadian(this.mPJ, 0) + '  ' + formatRadian(this.sPJ, 0) + '\r\n';
    s += '高度角 ' + formatRadian(this.mPW, 0) + '  ' + formatRadian(this.sPW, 0) + '\r\n';
    s += '时角   ' + formatRadian(this.mShiJ, 0) + '  ' + formatRadian(this.sShiJ, 0) + '\r\n';
    s += '视半径(观测点) ' + formatArcSeconds(this.mRad, 2, 0) + '     ' + formatArcSeconds(this.sRad, 2, 0) + '\r\n';
    s += '</pre></center></td></tr>';

    if (fs) {
      s += '<tr><td bgcolor=white align=center>';
      s += '力学时 ' + formatJD(this.T + J2000);
      s += ' ΔT=' + (this.dt * 86400).toFixed(1) + '秒<br>';
      s += '黄经章 ' + (this.dL / TWO_PI * 360 * 3600).toFixed(2) + '" ';
      s += '交角章 ' + (this.dE / TWO_PI * 360 * 3600).toFixed(2) + '" ';
      s += 'ε=' + formatRadian(this.E, 0);
      s += '</td></tr>';
    }
    s += '</table>';
    return s;
  },

  // 已知 t1 時刻星體位置、速度，求 x*x + y*y = r*r 時 t 的值。
  lineT(G, v, u, r, n) {
    const b = G.y * v - G.x * u;
    const A = u * u + v * v;
    const B = u * b;
    const C = b * b - r * r * v * v;
    let D = B * B - A * C;
    if (D < 0) return 0;
    D = Math.sqrt(D);
    if (!n) D = -D;
    return G.t + ((-B + D) / A - G.x) / v;
  },

  // 日月黃經緯差轉為日面中心直角坐標（用於月食）。
  lecXY(jd, re) {
    const T = jd / 36525;
    const zs = earthCoord(T, -1, -1, -1);
    zs[0] = normalizeAngle(zs[0] + Math.PI + sunLongitudeAberration(T));
    zs[1] = -zs[1] + sunLatitudeAberration(T);
    const zm = moonCoord(T, -1, -1, -1);
    zm[0] = normalizeAngle(zm[0] + moonLongitudeAberration(T));
    zm[1] += moonLatitudeAberration(T);

    re.e_mRad  = MOON_RADIUS_FACTOR_PENUMBRA / zm[2];
    re.eShadow  = (EARTH_MEAN_RADIUS_KM / zm[2] * RAD_TO_ARCSEC - (959.63 - 8.794) / zs[2]) * 51 / 50;
    re.eShadow2 = (EARTH_MEAN_RADIUS_KM / zm[2] * RAD_TO_ARCSEC + (959.63 + 8.794) / zs[2]) * 51 / 50;

    re.x = normalizeAngleSigned(zm[0] + Math.PI - zs[0]) * Math.cos((zm[1] - zs[1]) / 2);
    re.y = zm[1] + zs[1];
    re.mr = re.e_mRad  / RAD_TO_ARCSEC;
    re.er = re.eShadow  / RAD_TO_ARCSEC;
    re.Er = re.eShadow2 / RAD_TO_ARCSEC;
    re.t  = jd;
  },

  // 月食食甚計算。jd 為近朔的力學時（誤差數天不影響）。
  // 計算完成後 this.lT[0..6] 為食甚／初虧／復圓／半影食始／半影食終／食既／生光，this.sf 為食分，this.LX 為類型。
  lecMax(jd) {
    this.lT = new Array(7).fill(0);
    this.sf = 0;
    this.LX = '';

    jd = moonSunDiffToTimeFaster(Math.floor((jd - 4) / 29.5306) * Math.PI * 2 + Math.PI) * 36525;

    const G = {}, g = {};
    let u, v;

    // 粗略求極值
    u = -18461 * Math.sin(0.057109 + 0.23089571958 * jd) * 0.23090 / RAD_TO_ARCSEC;
    v = (moonAngularVelocity(jd / 36525) - earthAngularVelocity(jd / 36525)) / 36525;
    this.lecXY(jd, G);
    jd -= (G.y * u + G.x * v) / (u * u + v * v);

    // 精密求極值
    const dt = 60 / 86400;
    this.lecXY(jd, G); this.lecXY(jd + dt, g);
    u = (g.y - G.y) / dt;
    v = (g.x - G.x) / dt;
    const dtFinal = -(G.y * u + G.x * v) / (u * u + v * v);
    jd += dtFinal;

    // 求直線到影子中心的最小距離
    const x = G.x + dtFinal * v;
    const y = G.y + dtFinal * u;
    const rmin = Math.sqrt(x * x + y * y);

    if (rmin <= G.mr + G.er) { // 偏食
      this.lT[1] = jd;
      this.LX = '偏';
      this.sf = (G.mr + G.er - rmin) / G.mr / 2;
      this.lT[0] = this.lineT(G, v, u, G.mr + G.er, 0);
      this.lecXY(this.lT[0], g);
      this.lT[0] = this.lineT(g, v, u, g.mr + g.er, 0);
      this.lT[2] = this.lineT(G, v, u, G.mr + G.er, 1);
      this.lecXY(this.lT[2], g);
      this.lT[2] = this.lineT(g, v, u, g.mr + g.er, 1);
    }
    if (rmin <= G.mr + G.Er) { // 半影食
      this.lT[3] = this.lineT(G, v, u, G.mr + G.Er, 0);
      this.lecXY(this.lT[3], g);
      this.lT[3] = this.lineT(g, v, u, g.mr + g.Er, 0);
      this.lT[4] = this.lineT(G, v, u, G.mr + G.Er, 1);
      this.lecXY(this.lT[4], g);
      this.lT[4] = this.lineT(g, v, u, g.mr + g.Er, 1);
    }
    if (rmin <= G.er - G.mr) { // 全食
      this.LX = '全';
      this.lT[5] = this.lineT(G, v, u, G.er - G.mr, 0);
      this.lecXY(this.lT[5], g);
      this.lT[5] = this.lineT(g, v, u, g.er - g.mr, 0);
      this.lT[6] = this.lineT(G, v, u, G.er - G.mr, 1);
      this.lecXY(this.lT[6], g);
      this.lT[6] = this.lineT(g, v, u, g.er - g.mr, 1);
    }
  },
};
