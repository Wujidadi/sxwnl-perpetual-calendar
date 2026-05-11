// 升降分頁：日月升中天降時刻表，含民用晨昏與晝長。

import { gregorianToJD } from '../../astro/julian-day.js';
import { J2000 } from '../../astro/constants.js';
import { riseTransitSet } from '../../astro/rise-set.js';

export class RiseSetPage {
  mount(container) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();

    const root = document.createElement('section');
    root.className = 'page-rise-set';
    root.innerHTML = `
      <h2 style="margin-top:0">日月升降</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        指定日期、地理座標與時區，計算日月升中天降時刻；含民用晨昏與晝長。
      </p>
      <form class="page-card" id="rs-form">
        <div class="form-row">
          <label>起始年 <input type="number" id="rs-y" value="${y}" min="-4712" max="9999" /></label>
          <label>月 <input type="number" id="rs-m" value="${m}" min="1" max="12" /></label>
          <label>日 <input type="number" id="rs-d" value="${d}" min="1" max="31" /></label>
          <label>天數 <input type="number" id="rs-n" value="7" min="1" max="31" /></label>
        </div>
        <div class="form-row">
          <label>經度 <input type="number" id="rs-lon" value="121.5" step="0.001" /> °（東經為正）</label>
          <label>緯度 <input type="number" id="rs-lat" value="25.0"  step="0.001" /> °（北緯為正）</label>
          <label>UTC 時差 <input type="number" id="rs-tz" value="8" step="0.5" /> 小時</label>
          <button class="btn btn-primary" type="submit">計算</button>
        </div>
      </form>
      <div id="rs-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#rs-form').addEventListener('submit', (e) => {
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
    const root = this.el;
    const num = (id) => Number(root.querySelector('#' + id).value);
    const y = num('rs-y'), m = num('rs-m'), d = num('rs-d'), n = Math.max(1, Math.min(31, num('rs-n')));
    const lon = num('rs-lon'), lat = num('rs-lat'), tz = num('rs-tz');

    // 本地起始正午的 J2000 相對 JD
    const jdLocalNoon = gregorianToJD(y, m, d + 0.5) - J2000;
    const lonRad = lon * Math.PI / 180;
    const latRad = lat * Math.PI / 180;

    riseTransitSet.multiDayRTS(jdLocalNoon, n, lonRad, latRad, tz);
    const rts = riseTransitSet.rts;

    const rows = [];
    for (let i = 0; i < n; i++) {
      // 計算 i 天後的公曆日期顯示
      const date = new Date(Date.UTC(y, m - 1, d));
      date.setUTCDate(date.getUTCDate() + i);
      const dateStr = `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;

      const r = rts[i];
      rows.push(`
        <tr>
          <td>${dateStr}</td>
          <td class="mono">${r.s}</td>
          <td class="mono">${r.z}</td>
          <td class="mono">${r.j}</td>
          <td class="mono">${r.c}</td>
          <td class="mono">${r.h}</td>
          <td class="mono">${r.sj}</td>
          <td class="mono">${r.Ms}</td>
          <td class="mono">${r.Mz}</td>
          <td class="mono">${r.Mj}</td>
        </tr>
      `);
    }

    const out = root.querySelector('#rs-output');
    out.innerHTML = `
      <div class="page-card" style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th rowspan="2">日期</th>
              <th colspan="6" style="text-align:center">太陽</th>
              <th colspan="3" style="text-align:center">月亮</th>
            </tr>
            <tr>
              <th>日出</th><th>中天</th><th>日落</th>
              <th>民用晨</th><th>民用昏</th><th>晝長</th>
              <th>月出</th><th>中天</th><th>月落</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
        <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px">
          時刻為當地時間（UTC${tz >= 0 ? '+' : ''}${tz}）。「--:--:--」表示該日無此事件（極區）。
        </p>
      </div>
    `;
  }
}

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}
