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

export class ToolsPage {
  constructor() {
    this.activeTab = 'date';
  }

  mount(container) {
    const root = document.createElement('section');
    root.className = 'page-tools';
    root.innerHTML = `
      <h2 style="margin-top:0">工具</h2>
      <div class="subtabs" role="tablist">
        <button class="subtab" type="button" data-tab="date" aria-current="page">日期換算</button>
        <button class="subtab" type="button" data-tab="pi">圓周率計算</button>
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
    pane.innerHTML = `
      <div class="page-card">
        <h3>儒略日 → 公曆日期</h3>
        <div class="form-row">
          <label>JD（J2000 起算）<input type="number" id="t-jd" value="0" step="0.001" /></label>
          <button class="btn btn-primary" type="button" id="t-jd-go">轉換</button>
        </div>
        <div class="mono" id="t-jd-out">—</div>
      </div>

      <div class="page-card">
        <h3>公曆日期 → 儒略日</h3>
        <div class="form-row">
          <label>年 <input type="text" id="t-d1-y" value="${y}" size="6" /></label>
          <label>月 <input type="number" id="t-d1-m" value="${m}" min="1" max="12" /></label>
          <label>日 <input type="number" id="t-d1-d" value="${d}" min="1" max="31" /></label>
          <label>時間 <input type="text" id="t-d1-t" value="12:00:00" size="10" /></label>
          <button class="btn btn-primary" type="button" id="t-d1-go">轉換</button>
        </div>
        <p style="color:var(--color-text-soft);font-size:12px;margin:4px 0">
          年份可輸入「B」字首表示公元前（如 B1=公元前 1 年），無公元 0 年；天文紀年直接輸入負數。
        </p>
        <div class="mono" id="t-d1-out">—</div>
      </div>

      <div class="page-card">
        <h3>兩日期相減（單位：日）</h3>
        <div class="form-row">
          <label>日期一</label>
          <input type="text"   id="t-d2-y1" value="${y}" size="6" />
          <input type="number" id="t-d2-m1" value="${m}" min="1" max="12" />
          <input type="number" id="t-d2-d1" value="${d}" min="1" max="31" />
          <input type="text"   id="t-d2-t1" value="12:00:00" size="10" />
        </div>
        <div class="form-row">
          <label>日期二</label>
          <input type="text"   id="t-d2-y2" value="${y - 1}" size="6" />
          <input type="number" id="t-d2-m2" value="${m}" min="1" max="12" />
          <input type="number" id="t-d2-d2" value="${d}" min="1" max="31" />
          <input type="text"   id="t-d2-t2" value="12:00:00" size="10" />
          <button class="btn btn-primary" type="button" id="t-d2-go">計算</button>
        </div>
        <div class="mono" id="t-d2-out">—</div>
      </div>

      <div class="page-card">
        <h3>年內積日</h3>
        <div class="form-row">
          <label>年 <input type="text" id="t-doy-y" value="${y}" size="6" /></label>
          <label>月 <input type="number" id="t-doy-m" value="${m}" min="1" max="12" /></label>
          <label>日 <input type="number" id="t-doy-d" value="${d}" min="1" max="31" /></label>
          <label>時間 <input type="text" id="t-doy-t" value="12:00:00" size="10" /></label>
          <button class="btn btn-primary" type="button" id="t-doy-go">計算</button>
        </div>
        <div class="mono" id="t-doy-out">—</div>
      </div>
    `;

    const q = (id) => pane.querySelector('#' + id);
    const val = (id) => q(id).value;
    q('t-jd-go').addEventListener('click', () => {
      q('t-jd-out').textContent = convertJDToDate(Number(val('t-jd')));
    });
    q('t-d1-go').addEventListener('click', () => {
      const jd = gregorianToJDInput(val('t-d1-y'), val('t-d1-m'), val('t-d1-d'), val('t-d1-t'));
      q('t-d1-out').textContent = `JD（J2000 起算）= ${jd}`;
    });
    q('t-d2-go').addEventListener('click', () => {
      const diff = dateDiff(
        val('t-d2-y1'), val('t-d2-m1'), val('t-d2-d1'), val('t-d2-t1'),
        val('t-d2-y2'), val('t-d2-m2'), val('t-d2-d2'), val('t-d2-t2'),
      );
      q('t-d2-out').textContent = `日期一 − 日期二 = ${diff} 日`;
    });
    q('t-doy-go').addEventListener('click', () => {
      const n = dayOfYear(val('t-doy-y'), val('t-doy-m'), val('t-doy-d'), val('t-doy-t'));
      q('t-doy-out').textContent = `當年第 ${n} 日`;
    });
  }

  // ===== 圓周率計算 =====
  renderPITab(pane) {
    pane.innerHTML = `
      <div class="page-card">
        <h3>劉徽割圓術（6 種公式）</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          以正多邊形邊長迭代逼近 π。
        </p>
        <div class="form-row">
          <button class="btn" data-liu="0">6 邊 餘弦</button>
          <button class="btn" data-liu="1">4 邊 餘弦</button>
          <button class="btn" data-liu="2">6 邊 正弦</button>
          <button class="btn" data-liu="3">4 邊 正弦</button>
          <button class="btn" data-liu="4">6 邊 補弧田</button>
          <button class="btn" data-liu="5">4 邊 補弧田</button>
        </div>
      </div>

      <div class="page-card">
        <h3>祖沖之模擬</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          模擬古人保留 3 位有效數字的人工計算過程。R 為圓半徑（精度基準）。
        </p>
        <div class="form-row">
          <label>R <input type="number" id="t-zu-r" value="10000000000" min="1" /></label>
          <button class="btn btn-primary" type="button" id="t-zu-go">計算</button>
        </div>
      </div>

      <div class="page-card">
        <h3>連分式 PI（簡易）</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          PI = 2 + (1/3)·(2 + (2/5)·(2 + …)）；位數較大時較慢。
        </p>
        <div class="form-row">
          <label>位數 <input type="number" id="t-simple-n" value="200" min="10" max="2000" /></label>
          <button class="btn btn-primary" type="button" id="t-simple-go">計算</button>
        </div>
      </div>

      <div class="page-card">
        <h3>梅欽（Machin）公式 + 百億進制</h3>
        <p style="color:var(--color-text-soft);font-size:13px;margin:0 0 8px">
          PI = 16·arctan(1/5) − 4·arctan(1/239)。較快，最後 5 位可能有誤差。
        </p>
        <div class="form-row">
          <label>位數 <input type="number" id="t-machin-n" value="500" min="10" max="5000" /></label>
          <button class="btn btn-primary" type="button" id="t-machin-go">計算</button>
        </div>
      </div>

      <div class="page-card">
        <div class="form-row" style="justify-content:space-between">
          <h3 style="margin:0">輸出</h3>
          <button class="btn" type="button" id="t-pi-clr">清空</button>
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

    for (const btn of pane.querySelectorAll('[data-liu]')) {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.liu);
        const { title, rows } = liuHuiCircleCutting(id);
        let html = `<p>${title}</p><table class="data-table"><thead><tr>
          <th>次數 i</th><th>邊數 a</th><th class="num">T</th><th class="num">π 近似</th></tr></thead><tbody>`;
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
      let html = `<p>祖沖之模擬，R = ${R}</p><table class="data-table"><thead><tr>
        <th>i</th><th>邊數 a</th><th>T</th><th>弦長 H</th><th>差冪 ΔS</th><th>精差冪 ΔJ</th><th>π·R</th></tr></thead><tbody>`;
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
