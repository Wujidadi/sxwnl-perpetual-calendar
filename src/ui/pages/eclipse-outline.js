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
import { t } from '../../i18n/index.js';

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

function formatBJ(jdTD) {
  if (jdTD === undefined || jdTD === null || isNaN(jdTD)) return t('ui.common.none');
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
      <h2 style="margin-top:0">${t('ui.eclipseOutlinePage.title')}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        ${t('ui.eclipseOutlinePage.hint')}
      </p>
      <form class="page-card" id="eo-form">
        <div class="form-row">
          <label>${t('ui.labels.year')} <input type="number" id="eo-y" value="${y}" min="-4712" max="9999" /></label>
          <label>${t('ui.labels.month')} <input type="number" id="eo-m" value="${m}" min="1" max="12" /></label>
          <label>${t('ui.labels.day')} <input type="number" id="eo-d" value="${d}" min="1" max="31" /></label>
          <button class="btn btn-primary" type="submit">${t('ui.buttons.search')}</button>
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
        <div class="page-card"><p>${t('ui.eclipseOutlinePage.notFoundIn14')}</p></div>
      `;
      return;
    }

    solarEclipseBesselian.init(found.jd, 7);
    const re = solarEclipseBesselian.feature(found.jd);

    const lxLabel = t('eclipse.solar.' + re.lx) || re.lx;
    const eo = t('ui.eclipseOutlinePage');
    q('eo-output').innerHTML = `
      <div class="page-card">
        <h3>${lxLabel}（${formatBJ(re.jd)}）</h3>
        <table class="data-table">
          <tbody>
            <tr><td>${eo.typeRow}</td><td class="mono">${re.lx} / ${lxLabel}</td></tr>
            <tr><td>${eo.maxTimeRow}</td><td class="mono">${formatBJ(re.jd)}</td></tr>
            <tr><td>${eo.maxLocRow}</td><td class="mono">${t('ui.labels.longitude')} ${radToDeg(re.zxJ).toFixed(3)}°，${t('ui.labels.latitude')} ${radToDeg(re.zxW).toFixed(3)}°</td></tr>
            <tr><td>${eo.magRow}</td><td class="mono">${re.sf.toFixed(4)}</td></tr>
            <tr><td>${eo.deltaTRow}</td><td class="mono">${(re.dT * 86400).toFixed(1)} ${t('ui.common.secUnit')}</td></tr>
            <tr><td>${eo.bandRow}</td><td class="mono">${re.dw ? re.dw.toFixed(0) + ' ' + t('ui.common.kmUnit') : t('ui.common.none')}</td></tr>
            <tr><td>${eo.centralDurRow}</td><td class="mono">${re.tt ? (re.tt * 86400).toFixed(0) + ' ' + t('ui.common.secUnit') : t('ui.common.none')}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="page-card">
        <h3>${eo.keyPointsTitle}</h3>
        <table class="data-table">
          <thead><tr><th>${eo.colPoint}</th><th>${eo.colLon}</th><th>${eo.colLat}</th><th>${eo.colKeyTime}</th></tr></thead>
          <tbody>
            ${this.renderKey(re.gk1, eo.pointCenterStart)}
            ${this.renderKey(re.gk2, eo.pointCenterEnd)}
            ${this.renderKey(re.gk3, eo.pointPartialStart)}
            ${this.renderKey(re.gk4, eo.pointPartialEnd)}
            ${this.renderKey(re.gk5, eo.pointNoonMax)}
          </tbody>
        </table>
      </div>
      <div class="page-card">
        <h3>${eo.mapTitle}</h3>
        <canvas id="eo-canvas" width="720" height="360"
          style="background:#0d1116;border-radius:8px;display:block;width:100%;max-width:720px;margin:0 auto"></canvas>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px;text-align:center">
          ${eo.mapHint}
        </p>
      </div>
      <div class="page-card">
        <h3>${eo.timelineTitle}</h3>
        <canvas id="eo-timeline" width="720" height="160"
          style="background:#0d1116;border-radius:8px;display:block;width:100%;max-width:720px;margin:0 auto"></canvas>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px;text-align:center">
          ${eo.timelineHint}
        </p>
      </div>
    `;
    this.drawMap(re);
    this.drawTimeline(re);
  }

  renderKey(gk, label) {
    const noneCell = t('ui.eclipseOutlinePage.none');
    if (!gk || (gk[0] === 0 && gk[1] === 0 && gk[2] === 0)) {
      return `<tr><td>${label}</td><td colspan="3" style="color:var(--color-text-soft)">${noneCell}</td></tr>`;
    }
    const J = radToDeg(gk[0]);
    const W = radToDeg(gk[1]);
    const time = gk[2] ? formatBJ(gk[2]) : t('ui.common.none');
    return `<tr><td>${label}</td><td class="mono">${J.toFixed(2)}°</td><td class="mono">${W.toFixed(2)}°</td><td class="mono">${time}</td></tr>`;
  }

  drawMap(re) {
    const canvas = this.el.querySelector('#eo-canvas');
    if (!canvas) return;
    const map = createWorldMap(canvas);
    map.drawBackground();
    const ctx = map.ctx;
    const eo = t('ui.eclipseOutlinePage');

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
    ctx.fillText(eo.pointMaxEclipse, zxX + 14, zxY - 6);

    markPoint(re.gk1, '#ffa040', eo.pointCenterStart);
    markPoint(re.gk2, '#ffa040', eo.pointCenterEnd);
    markPoint(re.gk3, '#4ea0ff', eo.pointPartialStart);
    markPoint(re.gk4, '#4ea0ff', eo.pointPartialEnd);
    markPoint(re.gk5, '#5dd96a', eo.pointNoonMax);
  }

  drawTimeline(re) {
    const canvas = this.el.querySelector('#eo-timeline');
    if (!canvas) return;
    const p = t('eclipse.phases');
    const eo = t('ui.eclipseOutlinePage');
    const events = [];
    const push = (gk, key, label) => {
      if (gk && gk[2] && !(gk[0] === 0 && gk[1] === 0)) {
        events.push({ jd: gk[2], key, label });
      }
    };
    push(re.gk3, 'P1', eo.pointPartialStart);
    push(re.gk1, 'U1', eo.pointCenterStart);
    events.push({ jd: re.jd, key: 'Max', label: p.Max });
    push(re.gk2, 'U4', eo.pointCenterEnd);
    push(re.gk4, 'P4', eo.pointPartialEnd);
    drawEclipseTimeline(canvas, events);
  }
}
