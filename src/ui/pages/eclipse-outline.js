// 日食概略分頁：給定日期附近找日食，呈現全球路徑概覽。
//
// 簡化版：使用等距矩形（equirectangular）座標系，標出最大食地標與五個關鍵點
// （中心始、中心終、偏食始、偏食終、地方視午），不繪世界地圖背景。

import { J2000, RAD_TO_DEG, EARTH_EQUATORIAL_RADIUS_KM } from '../../astro/constants.js';
import { gregorianToJD, jdToGregorian } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { fastSolarEclipseSearch, solarEclipseBesselian } from '../../astro/solar-eclipse.js';
import {
  drawLine,
  drawCircleFilled,
  drawCircleOutline,
  drawText,
  clearCanvas,
} from '../canvas/draw-helpers.js';

const SOLAR_TYPE_LABEL = {
  N: '無食',  P: '偏食',  T: '全食',  A: '環食',
  T0: '全食（無中心線）',  A0: '環食（無中心線）',
  T1: '全食（中心未完全進入）', A1: '環食（中心未完全進入）',
  H: '混合食',  H2: '全環食（全始）',  H3: '全環食（全終）',
};

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

function formatBJ(jdTD) {
  if (jdTD === undefined || jdTD === null || isNaN(jdTD)) return '—';
  const jdUT = jdTD - deltaT(jdTD);
  const g = jdToGregorian(jdUT + 8 / 24 + J2000);
  return `${g.year}-${pad2(g.month)}-${pad2(g.day)} ${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
}

function radToDeg(r) { return r * RAD_TO_DEG; }

export class EclipseOutlinePage {
  mount(container) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const root = document.createElement('section');
    root.className = 'page-eclipse-outline';
    root.innerHTML = `
      <h2 style="margin-top:0">日食概略</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        以指定日期向後搜尋第一個日食事件，呈現全球視角的關鍵地理座標。
        圖示為等距矩形投影（簡化版）的世界座標格，標出最大食地標與五個關鍵點。
      </p>
      <form class="page-card" id="eo-form">
        <div class="form-row">
          <label>起始年 <input type="number" id="eo-y" value="${y}" min="-4712" max="9999" /></label>
          <label>月 <input type="number" id="eo-m" value="${m}" min="1" max="12" /></label>
          <label>日 <input type="number" id="eo-d" value="${d}" min="1" max="31" /></label>
          <button class="btn btn-primary" type="submit">尋找日食</button>
        </div>
      </form>
      <div id="eo-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#eo-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.compute();
    });
    this.compute();
  }

  unmount() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  compute() {
    const q = (id) => this.el.querySelector('#' + id);
    const y = Number(q('eo-y').value);
    const m = Number(q('eo-m').value);
    const d = Number(q('eo-d').value);
    const startJD = gregorianToJD(y, m, d + 0.5) - J2000;

    // 向後搜尋 14 個合朔，找到首個日食
    let found = null;
    for (let step = 0; step < 14; step++) {
      const re = fastSolarEclipseSearch(startJD + step * 29.5306);
      if (re.lx !== 'N') { found = re; break; }
    }
    if (!found) {
      q('eo-output').innerHTML = `
        <div class="page-card"><p>從指定日期向後 14 個合朔內未找到日食事件。</p></div>
      `;
      return;
    }

    // 使用 solarEclipseBesselian.feature 取得全球特徵
    solarEclipseBesselian.init(found.jd, 7);
    const re = solarEclipseBesselian.feature(found.jd);

    const lxLabel = SOLAR_TYPE_LABEL[re.lx] || re.lx;
    q('eo-output').innerHTML = `
      <div class="page-card">
        <h3>${lxLabel}（${formatBJ(re.jd)}）</h3>
        <table class="data-table">
          <tbody>
            <tr><td>食類型</td><td class="mono">${re.lx} / ${lxLabel}</td></tr>
            <tr><td>食甚（中點）時刻</td><td class="mono">${formatBJ(re.jd)}</td></tr>
            <tr><td>最大食地標</td><td class="mono">經 ${radToDeg(re.zxJ).toFixed(3)}°，緯 ${radToDeg(re.zxW).toFixed(3)}°</td></tr>
            <tr><td>食分</td><td class="mono">${re.sf.toFixed(4)}</td></tr>
            <tr><td>ΔT</td><td class="mono">${(re.dT * 86400).toFixed(1)} 秒</td></tr>
            <tr><td>食帶寬度</td><td class="mono">${re.dw ? re.dw.toFixed(0) + ' km' : '—'}</td></tr>
            <tr><td>中心食持續時間</td><td class="mono">${re.tt ? (re.tt * 86400).toFixed(0) + ' 秒' : '—'}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="page-card">
        <h3>五個關鍵點（地表）</h3>
        <table class="data-table">
          <thead><tr><th>點</th><th>經度</th><th>緯度</th><th>時刻</th></tr></thead>
          <tbody>
            ${this.renderKey(re.gk1, '中心始')}
            ${this.renderKey(re.gk2, '中心終')}
            ${this.renderKey(re.gk3, '偏食始')}
            ${this.renderKey(re.gk4, '偏食終')}
            ${this.renderKey(re.gk5, '地方視午食')}
          </tbody>
        </table>
      </div>
      <div class="page-card">
        <h3>全球分布圖（等距矩形）</h3>
        <canvas id="eo-canvas" width="720" height="360"
          style="background:#0d1116;border-radius:8px;display:block;width:100%;max-width:720px;margin:0 auto"></canvas>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px;text-align:center">
          紅：最大食；藍：偏食始終；橙：中心食始終；綠：地方視午食點。經度軸 −180°~+180°，緯度軸 +90°~−90°。
        </p>
      </div>
    `;
    this.drawMap(re);
  }

  renderKey(gk, label) {
    if (!gk || (gk[0] === 0 && gk[1] === 0 && gk[2] === 0)) {
      return `<tr><td>${label}</td><td colspan="3" style="color:var(--color-text-soft)">（無）</td></tr>`;
    }
    const J = radToDeg(gk[0]);
    const W = radToDeg(gk[1]);
    const time = gk[2] ? formatBJ(gk[2]) : '—';
    return `<tr><td>${label}</td><td class="mono">${J.toFixed(2)}°</td><td class="mono">${W.toFixed(2)}°</td><td class="mono">${time}</td></tr>`;
  }

  drawMap(re) {
    const canvas = this.el.querySelector('#eo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    clearCanvas(canvas);
    const W = canvas.width, H = canvas.height;

    // 經度 −180 ~ +180 對應 0 ~ W
    // 緯度 +90 ~ −90 對應 0 ~ H
    const x = (lonRad) => ((radToDeg(lonRad) + 180) / 360) * W;
    const y = (latRad) => ((90 - radToDeg(latRad)) / 180) * H;

    // 經緯網格（每 30 度一條）
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) {
      const px = ((lon + 180) / 360) * W;
      drawLine(ctx, px, 0, px, H, lon === 0 ? '#555' : '#2a3038');
      drawText(ctx, px + 2, 2, lon + '°', '#555', '10px sans-serif');
    }
    for (let lat = -90; lat <= 90; lat += 30) {
      const py = ((90 - lat) / 180) * H;
      drawLine(ctx, 0, py, W, py, lat === 0 ? '#555' : '#2a3038');
      drawText(ctx, 2, py + 2, lat + '°', '#555', '10px sans-serif');
    }

    // 標記點
    const markPoint = (gk, color, label) => {
      if (!gk || (gk[0] === 0 && gk[1] === 0)) return;
      const px = x(gk[0]);
      const py = y(gk[1]);
      drawCircleFilled(ctx, px, py, 5, color);
      drawText(ctx, px + 8, py - 6, label, color, 'bold 11px sans-serif');
    };

    // 最大食點
    drawCircleOutline(ctx, x(re.zxJ), y(re.zxW), 10, '#ff5252');
    drawCircleFilled(ctx, x(re.zxJ), y(re.zxW), 6, '#ff5252');
    drawText(ctx, x(re.zxJ) + 12, y(re.zxW) - 6, '最大食', '#ff5252', 'bold 12px sans-serif');

    markPoint(re.gk1, '#ffa040', '中心始');
    markPoint(re.gk2, '#ffa040', '中心終');
    markPoint(re.gk3, '#4ea0ff', '偏食始');
    markPoint(re.gk4, '#4ea0ff', '偏食終');
    markPoint(re.gk5, '#5dd96a', '視午');
  }
}
