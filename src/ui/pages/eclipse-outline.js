// 日食概略分頁：給定日期附近找日食，呈現全球路徑概覽。
//
// 採等距矩形（equirectangular）座標系，背景為世界海岸線輪廓，
// 標出最大食地標、五個關鍵點與食甚時刻軸。

import { J2000, RAD_TO_DEG } from '../../astro/constants.js';
import { gregorianToJD, jdToGregorian } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { fastSolarEclipseSearch, solarEclipseBesselian } from '../../astro/solar-eclipse.js';
import { createWorldMap } from '../canvas/world-map.js';
import { drawEclipseTimeline } from '../canvas/eclipse-timeline.js';

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
        圖示為等距矩形投影，背景為世界海岸線輪廓；下方時間軸顯示中心始／食甚／中心終。
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
          <thead><tr><th>點</th><th>經度</th><th>緯度</th><th>時刻（北京時）</th></tr></thead>
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
          紅：最大食；橙：中心食始終；藍：偏食始終；綠：地方視午食點。陸地以海岸線輪廓示意。
        </p>
      </div>
      <div class="page-card">
        <h3>食程時間軸</h3>
        <canvas id="eo-timeline" width="720" height="160"
          style="background:#0d1116;border-radius:8px;display:block;width:100%;max-width:720px;margin:0 auto"></canvas>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px;text-align:center">
          時間軸涵蓋偏食始至偏食終；橙色為中心食始終，紅色為食甚（最大食）。
        </p>
      </div>
    `;
    this.drawMap(re);
    this.drawTimeline(re);
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
    const map = createWorldMap(canvas);
    map.drawBackground();
    const ctx = map.ctx;

    const markPoint = (gk, color, label) => {
      if (!gk || (gk[0] === 0 && gk[1] === 0)) return;
      const [px, py] = map.lonLatToXY(gk[0] * RAD_TO_DEG, gk[1] * RAD_TO_DEG);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + 8, py - 6);
    };

    // 最大食點（強調）
    const [zxX, zxY] = map.lonLatToXY(re.zxJ * RAD_TO_DEG, re.zxW * RAD_TO_DEG);
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(zxX, zxY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(zxX, zxY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('最大食', zxX + 14, zxY - 6);

    markPoint(re.gk1, '#ffa040', '中心始');
    markPoint(re.gk2, '#ffa040', '中心終');
    markPoint(re.gk3, '#4ea0ff', '偏食始');
    markPoint(re.gk4, '#4ea0ff', '偏食終');
    markPoint(re.gk5, '#5dd96a', '視午');
  }

  drawTimeline(re) {
    const canvas = this.el.querySelector('#eo-timeline');
    if (!canvas) return;
    const events = [];
    const push = (gk, key, label) => {
      if (gk && gk[2] && !(gk[0] === 0 && gk[1] === 0)) {
        events.push({ jd: gk[2], key, label });
      }
    };
    push(re.gk3, 'P1', '偏食始');
    push(re.gk1, 'U1', '中心始');
    events.push({ jd: re.jd, key: 'Max', label: '食甚' });
    push(re.gk2, 'U4', '中心終');
    push(re.gk4, 'P4', '偏食終');
    drawEclipseTimeline(canvas, events);
  }
}
