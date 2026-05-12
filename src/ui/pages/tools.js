// 工具分頁：日期換算 + 圓周率計算。

import {
  convertJDToDate,
  gregorianToJDInput,
  calculateDateOffset,
  dayOfYear,
  dateDiff,
} from './tools/date-calc.js';
import {
  liuHuiCircleCutting,
  zuChongzhiPI,
  simplePI,
  machinPICalculator,
} from './tools/pi-calc.js';
import { t } from '../../i18n/index.js';

export class ToolsPage {
  constructor() {
    this.activeTab = 'date';
  }

  mount(container) {
    const root = document.createElement('section');
    root.className = 'page-tools';
    const tl = t('ui.tools');
    root.innerHTML = `
      <h2 style="margin-top:0">${tl.title}</h2>
      <div class="subtabs" role="tablist">
        <button class="subtab" type="button" data-tab="date" aria-current="page">${tl.tabDate}</button>
        <button class="subtab" type="button" data-tab="pi">${tl.tabPI}</button>
      </div>
      <div id="tools-pane"></div>
    `;
    container.appendChild(root);
    this.el = root;
    for (const btn of root.querySelectorAll('.subtab')) {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    }
    this.renderTab();
  }

  unmount() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  switchTab(tab) {
    this.activeTab = tab;
    for (const btn of this.el.querySelectorAll('.subtab')) {
      if (btn.dataset.tab === tab) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    }
    this.renderTab();
  }

  renderTab() {
    const pane = this.el.querySelector('#tools-pane');
    pane.innerHTML = '';
    if (this.activeTab === 'date') this.renderDateTab(pane);
    else                            this.renderPITab(pane);
  }

  // ===== 日期換算 =====
  renderDateTab(pane) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const tl = t('ui.tools');
    const noneStr = t('ui.common.none');
    pane.innerHTML = `
      <div class="page-card">
        <h3>${tl.sectionJDToDate}</h3>
        <div class="form-row">
          <label>${tl.jdLabel}<input type="number" id="t-jd" value="0" step="0.001" /></label>
          <button class="btn btn-primary" type="button" id="t-jd-go">${tl.btnConvert}</button>
        </div>
        <div class="mono" id="t-jd-out">${noneStr}</div>
      </div>

      <div class="page-card">
        <h3>${tl.sectionDateToJD}</h3>
        <div class="form-row">
          <label>${t('ui.labels.year')} <input type="text" id="t-d1-y" value="${y}" size="6" /></label>
          <label>${t('ui.labels.month')} <input type="number" id="t-d1-m" value="${m}" min="1" max="12" /></label>
          <label>${t('ui.labels.day')} <input type="number" id="t-d1-d" value="${d}" min="1" max="31" /></label>
          <label>${tl.timeLabel} <input type="text" id="t-d1-t" value="12:00:00" size="10" /></label>
          <button class="btn btn-primary" type="button" id="t-d1-go">${tl.btnConvert}</button>
        </div>
        <p style="color:var(--color-text-soft);font-size:12px;margin:4px 0">
          ${tl.yearBHint}
        </p>
        <div class="mono" id="t-d1-out">${noneStr}</div>
      </div>

      <div class="page-card">
        <h3>${tl.sectionDateDiff}</h3>
        <div class="form-row">
          <label>${tl.dateOne}</label>
          <input type="text"   id="t-d2-y1" value="${y}" size="6" />
          <input type="number" id="t-d2-m1" value="${m}" min="1" max="12" />
          <input type="number" id="t-d2-d1" value="${d}" min="1" max="31" />
          <input type="text"   id="t-d2-t1" value="12:00:00" size="10" />
        </div>
        <div class="form-row">
          <label>${tl.dateTwo}</label>
          <input type="text"   id="t-d2-y2" value="${y - 1}" size="6" />
          <input type="number" id="t-d2-m2" value="${m}" min="1" max="12" />
          <input type="number" id="t-d2-d2" value="${d}" min="1" max="31" />
          <input type="text"   id="t-d2-t2" value="12:00:00" size="10" />
          <button class="btn btn-primary" type="button" id="t-d2-go">${tl.btnCompute}</button>
        </div>
        <div class="mono" id="t-d2-out">${noneStr}</div>
      </div>

      <div class="page-card">
        <h3>${tl.sectionDayOfYear}</h3>
        <div class="form-row">
          <label>${t('ui.labels.year')} <input type="text" id="t-doy-y" value="${y}" size="6" /></label>
          <label>${t('ui.labels.month')} <input type="number" id="t-doy-m" value="${m}" min="1" max="12" /></label>
          <label>${t('ui.labels.day')} <input type="number" id="t-doy-d" value="${d}" min="1" max="31" /></label>
          <label>${tl.timeLabel} <input type="text" id="t-doy-t" value="12:00:00" size="10" /></label>
          <button class="btn btn-primary" type="button" id="t-doy-go">${tl.btnCompute}</button>
        </div>
        <div class="mono" id="t-doy-out">${noneStr}</div>
      </div>
    `;

    const q = (id) => pane.querySelector('#' + id);
    const val = (id) => q(id).value;
    q('t-jd-go').addEventListener('click', () => {
      q('t-jd-out').textContent = convertJDToDate(Number(val('t-jd')));
    });
    q('t-d1-go').addEventListener('click', () => {
      const jd = gregorianToJDInput(val('t-d1-y'), val('t-d1-m'), val('t-d1-d'), val('t-d1-t'));
      q('t-d1-out').textContent = t('ui.tools.jdResult').replace('{jd}', jd);
    });
    q('t-d2-go').addEventListener('click', () => {
      const diff = dateDiff(
        val('t-d2-y1'), val('t-d2-m1'), val('t-d2-d1'), val('t-d2-t1'),
        val('t-d2-y2'), val('t-d2-m2'), val('t-d2-d2'), val('t-d2-t2'),
      );
      q('t-d2-out').textContent = t('ui.tools.diffResult').replace('{d}', diff);
    });
    q('t-doy-go').addEventListener('click', () => {
      const n = dayOfYear(val('t-doy-y'), val('t-doy-m'), val('t-doy-d'), val('t-doy-t'));
      q('t-doy-out').textContent = t('ui.tools.doyResult').replace('{n}', n);
    });
  }

  // ===== 圓周率計算 =====
  renderPITab(pane) {
    const tl = t('ui.tools');
    pane.innerHTML = `
      <div class="page-card">
        <h3>${tl.piSectionLiu}</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          ${tl.piHintLiu}
        </p>
        <div class="form-row">
          <button class="btn" data-liu="0">${tl.piBtn6Cos}</button>
          <button class="btn" data-liu="1">${tl.piBtn4Cos}</button>
          <button class="btn" data-liu="2">${tl.piBtn6Sin}</button>
          <button class="btn" data-liu="3">${tl.piBtn4Sin}</button>
          <button class="btn" data-liu="4">${tl.piBtn6Bu}</button>
          <button class="btn" data-liu="5">${tl.piBtn4Bu}</button>
        </div>
      </div>

      <div class="page-card">
        <h3>${tl.piSectionZu}</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          ${tl.piHintZu}
        </p>
        <div class="form-row">
          <label>R <input type="number" id="t-zu-r" value="10000000000" min="1" /></label>
          <button class="btn btn-primary" type="button" id="t-zu-go">${tl.btnCompute}</button>
        </div>
      </div>

      <div class="page-card">
        <h3>${tl.piSectionSimple}</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          ${tl.piHintSimple}
        </p>
        <div class="form-row">
          <label>${tl.piDigitsLabel} <input type="number" id="t-simple-n" value="200" min="10" max="2000" /></label>
          <button class="btn btn-primary" type="button" id="t-simple-go">${tl.btnCompute}</button>
        </div>
      </div>

      <div class="page-card">
        <h3>${tl.piSectionMachin}</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          ${tl.piHintMachin}
        </p>
        <div class="form-row">
          <label>${tl.piDigitsLabel} <input type="number" id="t-machin-n" value="500" min="10" max="5000" /></label>
          <button class="btn btn-primary" type="button" id="t-machin-go">${tl.btnCompute}</button>
        </div>
      </div>

      <div class="page-card">
        <div class="form-row" style="justify-content:space-between">
          <h3 style="margin:0">${tl.piOutput}</h3>
          <button class="btn" type="button" id="t-pi-clr">${tl.btnClear}</button>
        </div>
        <div id="t-pi-out" class="tools-pi-output"></div>
      </div>
    `;

    const out = pane.querySelector('#t-pi-out');
    const setOut = (html) => { out.innerHTML = html; };
    const formatNumber = (v, fx = -1) => {
      if (typeof v !== 'number') return String(v);
      if (Number.isInteger(v)) return v.toLocaleString();
      return fx >= 0 ? v.toFixed(fx) : String(v);
    };

    const tl2 = t('ui.tools');
    for (const btn of pane.querySelectorAll('[data-liu]')) {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.liu);
        const { title, rows } = liuHuiCircleCutting(id);
        let html = `<p>${title}</p><table class="data-table"><thead><tr>
          <th>${tl2.piColIter}</th><th>${tl2.piColEdges}</th><th class="num">T</th><th class="num">${tl2.piColApprox}</th></tr></thead><tbody>`;
        for (const r of rows) {
          html += `<tr><td>${r.i}</td><td>${r.a}</td><td class="mono num">${r.T}</td><td class="mono num">${r.p}</td></tr>`;
        }
        html += '</tbody></table>';
        setOut(html);
      });
    }

    pane.querySelector('#t-zu-go').addEventListener('click', () => {
      const R = Number(pane.querySelector('#t-zu-r').value);
      const rows = zuChongzhiPI(R);
      let html = `<p>${tl2.piTitleZu.replace('{R}', R)}</p><table class="data-table"><thead><tr>
        <th>i</th><th>${tl2.piColEdges}</th><th>T</th><th>${tl2.piColH}</th><th>${tl2.piColDS}</th><th>${tl2.piColDJ}</th><th>${tl2.piColPR}</th></tr></thead><tbody>`;
      for (const r of rows) {
        html += `<tr><td>${r.i}</td><td>${r.a}</td><td class="mono">${r.T}</td><td class="mono">${r.H}</td><td class="mono">${r.dS}</td><td class="mono">${r.dJ}</td><td class="mono">${r.p}</td></tr>`;
      }
      html += '</tbody></table>';
      setOut(html);
    });

    pane.querySelector('#t-simple-go').addEventListener('click', () => {
      const N = Number(pane.querySelector('#t-simple-n').value);
      const result = simplePI(N);
      setOut(`<pre class="mono pi-block">PI ≈ ${result}</pre>`);
    });

    pane.querySelector('#t-machin-go').addEventListener('click', () => {
      const N = Number(pane.querySelector('#t-machin-n').value);
      const result = machinPICalculator.compute(N);
      setOut(`<pre class="mono pi-block">PI ≈ ${result}</pre>`);
    });

    pane.querySelector('#t-pi-clr').addEventListener('click', () => setOut(''));
  }
}
