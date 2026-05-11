// 地方食分頁：指定日期、地理位置，計算站心觀測的日食情況，含放大圖

import { J2000, RAD_TO_ARCSEC } from '../../astro/constants.js';
import { gregorianToJD, jdToGregorian } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { parseTimeToHours } from '../../utils/time.js';
import { fastSolarEclipseSearch, solarEclipseLocal } from '../../astro/solar-eclipse.js';
import { lunarEclipse } from '../../astro/lunar-eclipse.js';
import { createEclipseLocalView } from '../canvas/eclipse-local-view.js';

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

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
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();

    const root = document.createElement('section');
    root.className = 'page-local-eclipse';
    root.innerHTML = `
      <h2 style="margin-top:0">地方食</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        指定日期附近的合朔與地理位置，計算站心觀測的日食情況。
        點擊「自動找近期日食」會在輸入日期前後的合朔中尋找最近的一次日食。
      </p>
      <form class="page-card" id="le-form">
        <div class="form-row">
          <label>年 <input type="number" id="le-y" value="${y}" min="-4712" max="9999" /></label>
          <label>月 <input type="number" id="le-m" value="${m}" min="1" max="12" /></label>
          <label>日 <input type="number" id="le-d" value="${d}" min="1" max="31" /></label>
          <label>時間（北京時）<input type="text" id="le-t" value="12:00:00" size="10" /></label>
        </div>
        <div class="form-row">
          <label>經度 <input type="number" id="le-lon" value="121.5" step="0.001" /> °</label>
          <label>緯度 <input type="number" id="le-lat" value="25.0"  step="0.001" /> °</label>
          <label>海拔 <input type="number" id="le-high" value="0" step="0.01" /> km</label>
          <button class="btn btn-primary" type="submit">計算</button>
          <button class="btn" type="button" id="le-find">自動找近期日食</button>
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

    this.compute();
  }

  unmount() {
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
      <div class="page-card"><p>從輸入日期向後 14 個合朔內未找到日食事件。</p></div>
    `;
  }

  compute() {
    const f = this.readForm();
    const jdTD = this.formJDTD(f);
    const lonRad = f.lon * Math.PI / 180;
    const latRad = f.lat * Math.PI / 180;

    // 1. 先以 fastSolarEclipseSearch 確認該朔有無日食
    const fast = fastSolarEclipseSearch(jdTD);
    if (fast.lx === 'N') {
      this.el.querySelector('#le-output').innerHTML = `
        <div class="page-card">
          <h3>結果</h3>
          <p>該合朔週期（${formatBJ(fast.jd)}）未發生日食。</p>
          <p style="color:var(--color-text-soft);font-size:13px">
            可按「自動找近期日食」由此日期向後搜尋下一次日食。
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
      this.el.querySelector('#le-output').innerHTML = `
        <div class="page-card">
          <h3>結果</h3>
          <p>該日（${formatBJ(fast.jd)}）日食在指定地點不可見（食分為 0）。</p>
          <p style="color:var(--color-text-soft);font-size:13px">
            該日食類型：${SOLAR_TYPE_LABEL[fast.lx] || fast.lx}；可嘗試其他經緯度。
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
      view.annotate(`${LX}食 食分 ${sf.toFixed(3)}`);
    };

    this.el.querySelector('#le-output').innerHTML = `
      <div class="page-card">
        <h3>站心觀測結果（${LX}食）</h3>
        <table class="data-table">
          <tbody>
            <tr><td>食分</td><td class="mono">${sf.toFixed(4)}</td></tr>
            <tr><td>初虧</td><td class="mono">${formatBJ(sT[0])}</td></tr>
            <tr><td>食甚</td><td class="mono">${formatBJ(sT[1])}</td></tr>
            <tr><td>復圓</td><td class="mono">${formatBJ(sT[2])}</td></tr>
            ${sT[3] ? `<tr><td>食既</td><td class="mono">${formatBJ(sT[3])}</td></tr>` : ''}
            ${sT[4] ? `<tr><td>生光</td><td class="mono">${formatBJ(sT[4])}</td></tr>` : ''}
            ${dur ? `<tr><td>持續時間</td><td class="mono">${(dur * 86400).toFixed(0)} 秒</td></tr>` : ''}
          </tbody>
        </table>
      </div>
      <div class="page-card">
        <h3>放大圖（食甚時刻）</h3>
        <canvas id="le-canvas" width="480" height="320" style="background:#0d1116;border-radius:8px;display:block;margin:0 auto"></canvas>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px;text-align:center">
          紅色：太陽；黃色：月亮；以食甚時刻日月相對位置呈現。
        </p>
      </div>
    `;
    draw();
  }
}

const SOLAR_TYPE_LABEL = {
  P: '偏', T: '全', A: '環', H: '混合', H2: '全全環', H3: '環全全',
};
