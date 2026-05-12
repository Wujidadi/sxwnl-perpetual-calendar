// 恆星分頁：依關鍵字檢索恆星庫／88 星座，計算視位置／站心／平位置。

import { J2000 } from '../../astro/constants.js';
import { gregorianToJD } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { parseTimeToHours } from '../../utils/time.js';
import { computeStarEphemeris } from '../../astro/stellar.js';
import { searchStarCatalog, parseStarCatalog } from '../../data/stars.js';
import { t } from '../../i18n/index.js';

function buildModes() {
  const s = t('ui.stars');
  return [
    { value: 0, label: s.modeApparent },
    { value: 1, label: s.modeTopocentric },
    { value: 2, label: s.modeMean },
  ];
}

export class StarsPage {
  mount(container) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const st = t('ui.stars');
    const modes = buildModes();
    const modeOptions = modes.map((mo) => `<option value="${mo.value}">${mo.label}</option>`).join('');

    const root = document.createElement('section');
    root.className = 'page-stars';
    root.innerHTML = `
      <h2 style="margin-top:0">${st.title}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">${st.hint}</p>
      <form class="page-card" id="st-form">
        <div class="form-row">
          <label>${st.keyLabel} <input type="text" id="st-key" value="Lyr" size="12" /></label>
          <button class="btn btn-primary" type="submit">${st.btnSearch}</button>
        </div>
        <div class="form-row">
          <label>${t('ui.labels.year')} <input type="number" id="st-y" value="${y}" min="-4712" max="9999" /></label>
          <label>${t('ui.labels.month')} <input type="number" id="st-m" value="${m}" min="1" max="12" /></label>
          <label>${t('ui.labels.day')} <input type="number" id="st-d" value="${d}" min="1" max="31" /></label>
          <label>${t('ui.labels.time_')} <input type="text" id="st-t" value="20:00:00" size="10" /></label>
        </div>
        <div class="form-row">
          <label>${st.timeScale}
            <select id="st-scale">
              <option value="UT" selected>UTC</option>
              <option value="TD">TD</option>
            </select>
          </label>
          <label>${t('ui.labels.longitude')} <input type="number" id="st-lon" value="121.5" step="0.001" /> °</label>
          <label>${t('ui.labels.latitude')} <input type="number" id="st-lat" value="25.0"  step="0.001" /> °</label>
          <label>${st.mode} <select id="st-mode">${modeOptions}</select></label>
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
    const st = t('ui.stars');
    if (!key) {
      out.innerHTML = `<p style="color:var(--color-text-soft)">${st.pleaseEnter}</p>`;
      return;
    }

    const raw = searchStarCatalog(key);
    if (!raw || !raw.trim()) {
      out.innerHTML = `<p style="color:var(--color-text-soft)">${st.noResult.replace('{key}', escapeHtml(key))}</p>`;
      return;
    }
    const stars = parseStarCatalog(raw, 1);
    if (!stars.length) {
      out.innerHTML = `<p style="color:var(--color-text-soft)">${st.noParse.replace('{key}', escapeHtml(key))}</p>`;
      return;
    }

    const day = d + parseTimeToHours(t) / 24;
    let jdTD = gregorianToJD(y, m, day) - J2000;
    if (scale === 'UT') jdTD += deltaT(jdTD);
    const jcy = jdTD / 36525;
    const text = computeStarEphemeris(jcy, stars, 0.1, mode, lon * Math.PI / 180, lat * Math.PI / 180);

    out.innerHTML = `
      <h3>${st.resultHead.replace('{key}', escapeHtml(key)).replace('{n}', stars.length / 8)}</h3>
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
