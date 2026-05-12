// 星曆分頁：指定時刻、地理位置與天體，輸出視位置、距離、方位高度、恆星時。

import { J2000 } from '../../astro/constants.js';
import { gregorianToJD } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { parseTimeToHours } from '../../utils/time.js';
import { planetEphemeris } from '../../astro/planet-events.js';
import { t } from '../../i18n/index.js';
import { saveFormState, loadFormState } from '../../utils/storage.js';

// 可選天體：xt 編號對應 planetEphemeris 內部派發。
function buildBodies() {
  const planets = t('astro.planets');
  const eb = t('ui.ephemeris.bodies');
  return [
    { xt: 9,  name: eb.sun },
    { xt: 10, name: eb.moon },
    { xt: 1,  name: planets[1] },
    { xt: 2,  name: planets[2] },
    { xt: 3,  name: planets[3] },
    { xt: 4,  name: planets[4] },
    { xt: 5,  name: planets[5] },
    { xt: 6,  name: planets[6] },
    { xt: 7,  name: planets[7] },
    { xt: 8,  name: planets[8] },
  ];
}

export class EphemerisPage {
  mount(container) {
    const today = new Date();
    const saved = loadFormState('ephemeris') || {};
    const y = saved.y ?? today.getFullYear();
    const m = saved.m ?? today.getMonth() + 1;
    const d = saved.d ?? today.getDate();
    const time = saved.time ?? '12:00:00';
    const scale = saved.scale ?? 'TD';
    const lon = saved.lon ?? 121.5;
    const lat = saved.lat ?? 25.0;
    const xt  = saved.xt  ?? 9;

    const bodies = buildBodies();
    const bodyOptions = bodies.map((b) =>
      `<option value="${b.xt}"${b.xt === xt ? ' selected' : ''}>${b.name}</option>`).join('');
    const ep = t('ui.ephemeris');

    const root = document.createElement('section');
    root.className = 'page-ephemeris';
    root.innerHTML = `
      <h2 style="margin-top:0">${ep.title}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        ${ep.hint}
      </p>
      <form class="page-card" id="ep-form">
        <div class="form-row">
          <label>${t('ui.labels.year')} <input type="number" id="ep-y" value="${y}" min="-4712" max="9999" /></label>
          <label>${t('ui.labels.month')} <input type="number" id="ep-m" value="${m}" min="1" max="12" /></label>
          <label>${t('ui.labels.day')} <input type="number" id="ep-d" value="${d}" min="1" max="31" /></label>
          <label>${t('ui.labels.time_')} <input type="text" id="ep-t" value="${time}" size="10" /></label>
        </div>
        <div class="form-row">
          <label>${ep.timeScale}
            <select id="ep-scale">
              <option value="UT"${scale === 'UT' ? ' selected' : ''}>${ep.timeScaleUT}</option>
              <option value="TD"${scale === 'TD' ? ' selected' : ''}>${ep.timeScaleTD}</option>
            </select>
          </label>
          <label>${t('ui.labels.longitude')} <input type="number" id="ep-lon" value="${lon}" step="0.001" /> °</label>
          <label>${t('ui.labels.latitude')} <input type="number" id="ep-lat" value="${lat}"  step="0.001" /> °</label>
          <label>${ep.bodySel}
            <select id="ep-xt">${bodyOptions}</select>
          </label>
          <button class="btn btn-primary" type="submit">${t('ui.buttons.compute')}</button>
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
    const time = q('ep-t').value;
    const scale = q('ep-scale').value;
    const lon = Number(q('ep-lon').value);
    const lat = Number(q('ep-lat').value);
    const xt  = Number(q('ep-xt').value);
    saveFormState('ephemeris', { y, m, d, time, scale, lon, lat, xt });

    const day = d + parseTimeToHours(time) / 24;
    let jdTD = gregorianToJD(y, m, day) - J2000;
    if (scale === 'UT') jdTD += deltaT(jdTD);

    const lonRad = lon * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const text = planetEphemeris(xt, jdTD, lonRad, latRad);

    const bodies = buildBodies();
    const bodyName = bodies.find((b) => b.xt === xt)?.name || '?';
    q('ep-output').innerHTML = `
      <h3>${bodyName}（${t('ui.ephemeris.tdJDHeader')} ${jdTD.toFixed(6)}）</h3>
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
