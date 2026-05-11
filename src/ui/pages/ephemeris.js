// 星曆分頁：指定時刻、地理位置與天體，輸出視位置、距離、方位高度、恆星時。

import { J2000 } from '../../astro/constants.js';
import { gregorianToJD } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { parseTimeToHours } from '../../utils/time.js';
import { planetEphemeris } from '../../astro/planet-events.js';

// 可選天體：xt 編號對應 planetEphemeris 內部派發。
const BODIES = [
  { xt: 9,  name: '太陽' },
  { xt: 10, name: '月亮' },
  { xt: 1,  name: '水星' },
  { xt: 2,  name: '金星' },
  { xt: 3,  name: '火星' },
  { xt: 4,  name: '木星' },
  { xt: 5,  name: '土星' },
  { xt: 6,  name: '天王星' },
  { xt: 7,  name: '海王星' },
  { xt: 8,  name: '冥王星' },
];

export class EphemerisPage {
  mount(container) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();

    const bodyOptions = BODIES.map((b) => `<option value="${b.xt}">${b.name}</option>`).join('');

    const root = document.createElement('section');
    root.className = 'page-ephemeris';
    root.innerHTML = `
      <h2 style="margin-top:0">星曆</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        指定時刻（格林尼治）與地理位置，計算任一天體的視座標、距離與方位高度。
      </p>
      <form class="page-card" id="ep-form">
        <div class="form-row">
          <label>年 <input type="number" id="ep-y" value="${y}" min="-4712" max="9999" /></label>
          <label>月 <input type="number" id="ep-m" value="${m}" min="1" max="12" /></label>
          <label>日 <input type="number" id="ep-d" value="${d}" min="1" max="31" /></label>
          <label>時間 <input type="text" id="ep-t" value="12:00:00" size="10" /></label>
        </div>
        <div class="form-row">
          <label>時標
            <select id="ep-scale">
              <option value="UT">UTC</option>
              <option value="TD" selected>TD（力學時）</option>
            </select>
          </label>
          <label>經度 <input type="number" id="ep-lon" value="121.5" step="0.001" /> °</label>
          <label>緯度 <input type="number" id="ep-lat" value="25.0"  step="0.001" /> °</label>
          <label>天體
            <select id="ep-xt">${bodyOptions}</select>
          </label>
          <button class="btn btn-primary" type="submit">計算</button>
        </div>
      </form>
      <div class="page-card" id="ep-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#ep-form').addEventListener('submit', (e) => {
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
    const y = Number(q('ep-y').value);
    const m = Number(q('ep-m').value);
    const d = Number(q('ep-d').value);
    const t = q('ep-t').value;
    const scale = q('ep-scale').value;
    const lon = Number(q('ep-lon').value);
    const lat = Number(q('ep-lat').value);
    const xt  = Number(q('ep-xt').value);

    const day = d + parseTimeToHours(t) / 24;
    let jdTD = gregorianToJD(y, m, day) - J2000;
    if (scale === 'UT') jdTD += deltaT(jdTD);

    const lonRad = lon * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const text = planetEphemeris(xt, jdTD, lonRad, latRad);

    const bodyName = BODIES.find((b) => b.xt === xt)?.name || '?';
    q('ep-output').innerHTML = `
      <h3>${bodyName}（力學時 JD ${jdTD.toFixed(6)}）</h3>
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
