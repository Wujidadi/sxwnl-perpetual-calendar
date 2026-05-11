// 恆星分頁：依關鍵字檢索恆星庫／88 星座，計算視位置／站心／平位置。

import { J2000 } from '../../astro/constants.js';
import { gregorianToJD } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { parseTimeToHours } from '../../utils/time.js';
import { computeStarEphemeris } from '../../astro/stellar.js';
import { searchStarCatalog, parseStarCatalog } from '../../data/stars.js';

const MODES = [
  { value: 0, label: '視位置（含光行差、章動、岁差）' },
  { value: 1, label: '站心位置（含大氣折射）' },
  { value: 2, label: '平位置（僅含歲差）' },
];

export class StarsPage {
  mount(container) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const modeOptions = MODES.map((mo) => `<option value="${mo.value}">${mo.label}</option>`).join('');

    const root = document.createElement('section');
    root.className = 'page-stars';
    root.innerHTML = `
      <h2 style="margin-top:0">恆星</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        關鍵字檢索內建恆星庫（拉丁名／三字母星座縮寫／光譜均可），計算指定時刻的位置。
        資料以「星 N + 星座縮寫」形式編碼，常用例：<code>Lyr</code>（天琴座）、<code>UMa</code>（大熊座）、
        <code>α</code>（所有 α 星）、<code>And</code>（仙女座）。
      </p>
      <form class="page-card" id="st-form">
        <div class="form-row">
          <label>關鍵字 <input type="text" id="st-key" value="Lyr" size="12" /></label>
          <button class="btn btn-primary" type="submit">檢索並計算</button>
        </div>
        <div class="form-row">
          <label>年 <input type="number" id="st-y" value="${y}" min="-4712" max="9999" /></label>
          <label>月 <input type="number" id="st-m" value="${m}" min="1" max="12" /></label>
          <label>日 <input type="number" id="st-d" value="${d}" min="1" max="31" /></label>
          <label>時間 <input type="text" id="st-t" value="20:00:00" size="10" /></label>
        </div>
        <div class="form-row">
          <label>時標
            <select id="st-scale">
              <option value="UT" selected>UTC</option>
              <option value="TD">TD</option>
            </select>
          </label>
          <label>經度 <input type="number" id="st-lon" value="121.5" step="0.001" /> °</label>
          <label>緯度 <input type="number" id="st-lat" value="25.0"  step="0.001" /> °</label>
          <label>模式 <select id="st-mode">${modeOptions}</select></label>
        </div>
      </form>
      <div class="page-card" id="st-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#st-form').addEventListener('submit', (e) => {
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
    const key = q('st-key').value.trim();
    const y = Number(q('st-y').value);
    const m = Number(q('st-m').value);
    const d = Number(q('st-d').value);
    const t = q('st-t').value;
    const scale = q('st-scale').value;
    const lon = Number(q('st-lon').value);
    const lat = Number(q('st-lat').value);
    const mode = Number(q('st-mode').value);

    const out = q('st-output');
    if (!key) {
      out.innerHTML = '<p style="color:var(--color-text-soft)">請輸入關鍵字。</p>';
      return;
    }

    const raw = searchStarCatalog(key);
    if (!raw || !raw.trim()) {
      out.innerHTML = `<p style="color:var(--color-text-soft)">查無「${escapeHtml(key)}」的資料。</p>`;
      return;
    }
    const stars = parseStarCatalog(raw, 1);
    if (!stars.length) {
      out.innerHTML = `<p style="color:var(--color-text-soft)">關鍵字「${escapeHtml(key)}」未匹配到星表中可解析的項目。</p>`;
      return;
    }

    const day = d + parseTimeToHours(t) / 24;
    let jdTD = gregorianToJD(y, m, day) - J2000;
    if (scale === 'UT') jdTD += deltaT(jdTD);
    const jcy = jdTD / 36525;
    const text = computeStarEphemeris(jcy, stars, 0.1, mode, lon * Math.PI / 180, lat * Math.PI / 180);

    out.innerHTML = `
      <h3>檢索「${escapeHtml(key)}」（${stars.length / 8} 項）</h3>
      <pre class="text-output">${escapeHtml(text)}</pre>
    `;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
