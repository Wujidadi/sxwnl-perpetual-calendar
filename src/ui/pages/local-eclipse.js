// 地方食分頁：指定日期、地理位置，計算站心觀測的日食情況，含放大圖

import { J2000, RAD_TO_ARCSEC } from '../../astro/constants.js';
import { gregorianToJD, jdToGregorian } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { parseTimeToHours } from '../../utils/time.js';
import { fastSolarEclipseSearch, solarEclipseLocal } from '../../astro/solar-eclipse.js';
import { lunarEclipse } from '../../astro/lunar-eclipse.js';
import { createEclipseLocalView } from '../canvas/eclipse-local-view.js';
import { drawEclipseTimeline } from '../canvas/eclipse-timeline.js';
import { createCityPicker } from '../components/city-picker.js';
import { t } from '../../i18n/index.js';
import { saveFormState, loadFormState } from '../../utils/storage.js';

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

// 引擎內部 LX 字符（zh-CN）對應到日食類型碼，用以取當前語系的完整標籤。
const LX_TO_CODE = { '偏':'P', '全':'T', '环':'A', '環':'A', '混合':'H', '全全環':'H2', '環全全':'H3' };
function localizedSolarLabel(lx) {
  const code = LX_TO_CODE[lx] || 'P';
  return t('eclipse.solar.' + code);
}

// 力學時 JD（J2000 起算）→ 北京時字串
function formatBJ(jdTD) {
  if (!jdTD) return '—';
  const jdUT = jdTD - deltaT(jdTD);
  const g = jdToGregorian(jdUT + 8 / 24 + J2000);
  return `${g.year}-${pad2(g.month)}-${pad2(g.day)} ${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
}

export class LocalEclipsePage {
  mount(container) {
    const today = new Date();
    const saved = loadFormState('local-eclipse') || {};
    const y = saved.year  ?? today.getFullYear();
    const m = saved.month ?? today.getMonth() + 1;
    const d = saved.day   ?? today.getDate();
    const time = saved.time ?? '12:00:00';
    const lon  = saved.lon  ?? 121.5;
    const lat  = saved.lat  ?? 25.0;
    const high = saved.high ?? 0;

    const root = document.createElement('section');
    root.className = 'page-local-eclipse';
    root.innerHTML = `
      <h2 style="margin-top:0">${t('ui.localEclipsePage.title')}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        ${t('ui.localEclipsePage.hint')}
      </p>
      <form class="page-card" id="le-form">
        <div class="form-row">
          <label>${t('ui.labels.year')} <input type="number" id="le-y" value="${y}" min="-4712" max="9999" /></label>
          <label>${t('ui.labels.month')} <input type="number" id="le-m" value="${m}" min="1" max="12" /></label>
          <label>${t('ui.labels.day')} <input type="number" id="le-d" value="${d}" min="1" max="31" /></label>
          <label>${t('ui.labels.time')}<input type="text" id="le-t" value="${time}" size="10" /></label>
        </div>
        <div class="form-row">
          <label>${t('ui.labels.longitude')} <input type="number" id="le-lon" value="${lon}" step="0.001" /> °</label>
          <label>${t('ui.labels.latitude')} <input type="number" id="le-lat" value="${lat}"  step="0.001" /> °</label>
          <label>${t('ui.labels.altitude')} <input type="number" id="le-high" value="${high}" step="0.01" /> km</label>
        </div>
        <div class="form-row" id="le-city-row">
          <span id="le-city-host"></span>
          <button class="btn btn-primary" type="submit">${t('ui.buttons.compute')}</button>
          <button class="btn" type="button" id="le-find">${t('ui.buttons.findEclipse')}</button>
        </div>
      </form>
      <div id="le-output"></div>
    `;
    container.appendChild(root);
    this.el = root;

    root.querySelector('#le-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.compute();
    });
    root.querySelector('#le-find').addEventListener('click', () => this.findNearest());

    this.cityPicker = createCityPicker(root.querySelector('#le-city-host'), {
      onSelect: ({ longitudeDeg, latitudeDeg }) => {
        root.querySelector('#le-lon').value = longitudeDeg.toFixed(3);
        root.querySelector('#le-lat').value = latitudeDeg.toFixed(3);
        this.compute();
      },
    });

    this.compute();
  }

  unmount() {
    if (this.cityPicker) { this.cityPicker.unmount(); this.cityPicker = null; }
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  readForm() {
    const q = (id) => this.el.querySelector('#' + id);
    return {
      year:  Number(q('le-y').value),
      month: Number(q('le-m').value),
      day:   Number(q('le-d').value),
      time:  q('le-t').value,
      lon:   Number(q('le-lon').value),
      lat:   Number(q('le-lat').value),
      high:  Number(q('le-high').value),
    };
  }

  // 把表單裡的「北京時」日期換算為 J2000 起算的力學時 JD
  formJDTD(f) {
    const dayFraction = f.day + parseTimeToHours(f.time) / 24;
    const jdUT = gregorianToJD(f.year, f.month, dayFraction) - 8 / 24 - J2000;
    return jdUT + deltaT(jdUT);
  }

  findNearest() {
    // 從輸入時刻往前後共 12 個合朔週期搜尋，找到第一個 lx !== 'N' 的。
    const f = this.readForm();
    const baseJD = this.formJDTD(f);
    // 從 baseJD 向後嘗試 14 個朔週期
    for (let step = 0; step < 14; step++) {
      const guessJD = baseJD + step * 29.5306;
      const re = fastSolarEclipseSearch(guessJD);
      if (re.lx !== 'N') {
        // 找到事件，更新輸入欄位為該日期，並計算
        const jdUT = re.jd - deltaT(re.jd);
        const g = jdToGregorian(jdUT + 8 / 24 + J2000);
        const q = (id) => this.el.querySelector('#' + id);
        q('le-y').value = g.year;
        q('le-m').value = g.month;
        q('le-d').value = g.day;
        q('le-t').value = `${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
        this.compute();
        return;
      }
    }
    this.el.querySelector('#le-output').innerHTML = `
      <div class="page-card"><p>${t('ui.localEclipsePage.notFoundIn14')}</p></div>
    `;
  }

  compute() {
    const f = this.readForm();
    saveFormState('local-eclipse', f);
    const jdTD = this.formJDTD(f);
    const lonRad = f.lon * Math.PI / 180;
    const latRad = f.lat * Math.PI / 180;

    // 1. 先以 fastSolarEclipseSearch 確認該朔有無日食
    const fast = fastSolarEclipseSearch(jdTD);
    if (fast.lx === 'N') {
      this.el.querySelector('#le-output').innerHTML = `
        <div class="page-card">
          <h3>${t('ui.labels.result')}</h3>
          <p>${t('ui.localEclipsePage.noEclipseAt').replace('{t}', formatBJ(fast.jd))}</p>
          <p style="color:var(--color-text-soft);font-size:13px">
            ${t('ui.localEclipsePage.tipFindEclipse')}
          </p>
        </div>
      `;
      return;
    }

    // 2. 對站點計算食甚
    solarEclipseLocal.secMax(fast.jd, lonRad, latRad, f.high);
    const sT  = solarEclipseLocal.sT;  // [0]初虧 [1]食甚 [2]復圓 [3]食既 [4]生光
    const LX  = solarEclipseLocal.LX;
    const sf  = solarEclipseLocal.sf;
    const dur = solarEclipseLocal.dur;

    if (sf <= 0) {
      const lbl = t('eclipse.solar.' + fast.lx) || fast.lx;
      this.el.querySelector('#le-output').innerHTML = `
        <div class="page-card">
          <h3>${t('ui.labels.result')}</h3>
          <p>${t('ui.localEclipsePage.invisibleAt').replace('{t}', formatBJ(fast.jd))}</p>
          <p style="color:var(--color-text-soft);font-size:13px">
            ${t('ui.localEclipsePage.tipTryOther').replace('{label}', lbl)}
          </p>
        </div>
      `;
      return;
    }

    // 3. 取食甚時刻日月位置以繪製放大圖
    lunarEclipse.calc(sT[1], lonRad, latRad, f.high);
    const draw = () => {
      const canvas = this.el.querySelector('#le-canvas');
      if (!canvas) return;
      const view = createEclipseLocalView(canvas);
      view.clear();
      view.drawSolarMagnified(
        lunarEclipse.mCJ2, lunarEclipse.mCW2,
        lunarEclipse.sCJ2, lunarEclipse.sCW2,
        lunarEclipse.mRad, lunarEclipse.sRad,
      );
      view.annotate(`${localizedSolarLabel(LX)} ${t('eclipse.metrics.magnitude')} ${sf.toFixed(3)}`);
    };

    const m = t('eclipse.metrics');
    const p = t('eclipse.phases');
    const fullLabel = localizedSolarLabel(LX);
    this.el.querySelector('#le-output').innerHTML = `
      <div class="page-card">
        <h3>${t('ui.localEclipsePage.resultTitle').replace('{label}', fullLabel)}</h3>
        <table class="data-table">
          <tbody>
            <tr><td>${m.magnitude}</td><td class="mono">${sf.toFixed(4)}</td></tr>
            <tr><td>${p.P1}</td><td class="mono">${formatBJ(sT[0])}</td></tr>
            <tr><td>${p.Max}</td><td class="mono">${formatBJ(sT[1])}</td></tr>
            <tr><td>${p.P4}</td><td class="mono">${formatBJ(sT[2])}</td></tr>
            ${sT[3] ? `<tr><td>${p.U1}</td><td class="mono">${formatBJ(sT[3])}</td></tr>` : ''}
            ${sT[4] ? `<tr><td>${p.U4}</td><td class="mono">${formatBJ(sT[4])}</td></tr>` : ''}
            ${dur ? `<tr><td>${m.duration}</td><td class="mono">${t('ui.localEclipsePage.durationSec').replace('{n}', (dur * 86400).toFixed(0))}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
      <div class="page-card">
        <h3>${t('ui.localEclipsePage.timelineTitle')}</h3>
        <canvas id="le-timeline" width="720" height="160" style="background:#0d1116;border-radius:8px;display:block;width:100%;max-width:720px;margin:0 auto"></canvas>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px;text-align:center">
          ${t('ui.localEclipsePage.timelineHint')}
        </p>
      </div>
      <div class="page-card">
        <h3>${t('ui.localEclipsePage.enlargedTitle')}</h3>
        <canvas id="le-canvas" width="480" height="320" style="background:#0d1116;border-radius:8px;display:block;margin:0 auto"></canvas>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px;text-align:center">
          ${t('ui.localEclipsePage.enlargedHint')}
        </p>
      </div>
    `;
    draw();
    const timelineCanvas = this.el.querySelector('#le-timeline');
    if (timelineCanvas) {
      const events = [
        { jd: sT[0], key: 'P1',  label: p.P1 },
        ...(sT[3] ? [{ jd: sT[3], key: 'U1', label: p.U1 }] : []),
        { jd: sT[1], key: 'Max', label: p.Max },
        ...(sT[4] ? [{ jd: sT[4], key: 'U4', label: p.U4 }] : []),
        { jd: sT[2], key: 'P4',  label: p.P4 },
      ];
      drawEclipseTimeline(timelineCanvas, events);
    }
  }
}
