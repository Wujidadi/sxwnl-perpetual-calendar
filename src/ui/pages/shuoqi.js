// 氣朔分頁：指定年份的 24 節氣與合朔時刻。

import { J2000 } from '../../astro/constants.js';
import { gregorianToJD, jdToGregorian } from '../../astro/julian-day.js';
import {
  SOLAR_TERM_NAMES,
  preciseSolarTermFromJD,
  preciseNewMoonFromJD,
} from '../../lunar/chinese-base.js';
import { shuoQiCalculator } from '../../lunar/ssq.js';

// 將 J2000 起算的儒略日（+8 時區）格式化為 YYYY-MM-DD HH:MM:SS。
function formatBeijingTime(jdJ2000) {
  const g = jdToGregorian(jdJ2000 + J2000);
  return `${g.year}-${pad2(g.month)}-${pad2(g.day)} ${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
}

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

export class ShuoQiPage {
  mount(container) {
    const y = new Date().getFullYear();
    const root = document.createElement('section');
    root.className = 'page-shuoqi';
    root.innerHTML = `
      <h2 style="margin-top:0">節氣與合朔</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        指定公曆年份，列出該年的 24 節氣與所有合朔（含閏月）精確時刻（北京時 UTC+8）。
      </p>
      <form class="page-card" id="sq-form">
        <div class="form-row">
          <label>年份 <input type="number" id="sq-y" value="${y}" min="-4712" max="9999" step="1" /></label>
          <button class="btn btn-primary" type="submit">查詢</button>
        </div>
      </form>
      <div id="sq-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#sq-form').addEventListener('submit', (e) => {
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
    const y = Number(this.el.querySelector('#sq-y').value);
    // 以該年中央位置（約 7 月 1 日）起算
    const seed = Math.floor((y - 2000) * 365.2422 + 180);
    shuoQiCalculator.calcYear(seed);

    const qi = shuoQiCalculator.centralQiList;
    const hs = shuoQiCalculator.newMoonList;
    const ym = shuoQiCalculator.monthNames;
    const dx = shuoQiCalculator.monthLengths;
    const leap = shuoQiCalculator.leapMonth;

    // 節氣：centralQiList[0..24] 對應冬至…下一冬至（25 個）；
    // 顯示在該年內者：根據 G 曆年份判定。實務上 25 個都列出（含跨年冬至）。
    const qiRows = [];
    for (let i = 0; i < 25; i++) {
      const name = SOLAR_TERM_NAMES[i % 24];
      const precise = preciseSolarTermFromJD(qi[i]);
      const time = formatBeijingTime(precise);
      qiRows.push(`<tr><td>${name}</td><td class="mono">${time}</td></tr>`);
    }

    // 合朔：newMoonList[0..14]
    const moonRows = [];
    for (let i = 0; i < 14; i++) {
      if (hs[i + 1] > qi[24]) break; // 已過跨年冬至
      const monthLabel = (leap && i === leap ? '閏' : '') + ym[i] + '月';
      const big = dx[i] > 29 ? '大' : '小';
      const precise = preciseNewMoonFromJD(hs[i]);
      const time = formatBeijingTime(precise);
      moonRows.push(`<tr><td>${monthLabel}${big}</td><td class="mono">${time}</td></tr>`);
    }

    const out = this.el.querySelector('#sq-output');
    out.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="sq-grid">
        <div class="page-card">
          <h3>24 節氣（含跨年冬至）</h3>
          <table class="data-table">
            <thead><tr><th>節氣</th><th>時刻（北京時）</th></tr></thead>
            <tbody>${qiRows.join('')}</tbody>
          </table>
        </div>
        <div class="page-card">
          <h3>合朔（${moonRows.length} 個）</h3>
          <table class="data-table">
            <thead><tr><th>農曆月</th><th>合朔時刻（北京時）</th></tr></thead>
            <tbody>${moonRows.join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  }
}
