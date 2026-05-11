// 八字分頁：依出生日期、時間、地理經度計算四柱八字與當日 12 時辰干支。

import { gregorianToJD } from '../../astro/julian-day.js';
import { J2000 } from '../../astro/constants.js';
import { computeBazi } from '../../lunar/chinese-base.js';

export class BaziPage {
  mount(container) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const hh = today.getHours();
    const mm = today.getMinutes();

    const root = document.createElement('section');
    root.className = 'page-bazi';
    root.innerHTML = `
      <h2 style="margin-top:0">八字</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        依出生時刻（當地公曆時間）與經度計算四柱八字。內部會修正真太陽時。
      </p>
      <form class="page-card" id="bz-form">
        <div class="form-row">
          <label>年 <input type="number" id="bz-y" value="${y}" min="-4712" max="9999" step="1" /></label>
          <label>月 <input type="number" id="bz-m" value="${m}" min="1" max="12" step="1" /></label>
          <label>日 <input type="number" id="bz-d" value="${d}" min="1" max="31" step="1" /></label>
        </div>
        <div class="form-row">
          <label>時 <input type="number" id="bz-h" value="${hh}" min="0" max="23" step="1" /></label>
          <label>分 <input type="number" id="bz-mi" value="${mm}" min="0" max="59" step="1" /></label>
          <label>秒 <input type="number" id="bz-s" value="0" min="0" max="59" step="1" /></label>
        </div>
        <div class="form-row">
          <label>經度（東經為正）<input type="number" id="bz-lon" value="120" step="0.001" /> °</label>
          <label>UTC 時差 <input type="number" id="bz-tz" value="8" step="0.5" /> 小時</label>
          <button class="btn btn-primary" type="submit">計算</button>
        </div>
      </form>
      <div id="bz-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#bz-form').addEventListener('submit', (e) => {
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
    const y  = num('bz-y');
    const m  = num('bz-m');
    const d  = num('bz-d');
    const hh = num('bz-h');
    const mi = num('bz-mi');
    const ss = num('bz-s');
    const lon = num('bz-lon');
    const tz  = num('bz-tz');

    // 本地民用時 → 力學日：day 為含小數的日期
    const day = d + (hh + (mi + ss / 60) / 60) / 24;
    const jdLocal = gregorianToJD(y, m, day);
    const jdUT = jdLocal - tz / 24 - J2000; // J2000 起算 UT
    const J = lon * Math.PI / 180;

    const ob = {};
    computeBazi(jdUT, J, ob);

    const out = root.querySelector('#bz-output');
    out.innerHTML = `
      <div class="page-card">
        <h3>四柱</h3>
        <table class="data-table">
          <thead><tr><th>柱</th><th>干支</th></tr></thead>
          <tbody>
            <tr><td>年柱</td><td class="mono">${ob.baziYear}</td></tr>
            <tr><td>月柱</td><td class="mono">${ob.baziMonth}</td></tr>
            <tr><td>日柱</td><td class="mono">${ob.baziDay}</td></tr>
            <tr><td>時柱</td><td class="mono">${ob.baziHour}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="page-card">
        <h3>當地真太陽時</h3>
        <p class="mono">${ob.baziTrueSolarTime}</p>
      </div>
      <div class="page-card">
        <h3>當日 12 時辰干支</h3>
        <p class="bazi-hours">${ob.baziHoursAll}</p>
      </div>
    `;
  }
}
