// 天象分頁：在指定年份附近查找
//   月亮近遠點／升降交點、地球近遠日點、水金大距、行星合月／合日／衝／順逆留。

import { J2000, AU_KM } from '../../astro/constants.js';
import { RAD_TO_DEG } from '../../astro/constants.js';
import { gregorianToJD, jdToGregorian } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import {
  greatestElongation,
  planetStation,
  planetMoonConjunction,
  planetSunConjunction,
  planetSunOpposition,
} from '../../astro/planet-events.js';
import {
  moonPerigeeApogee,
  moonNode,
  earthPerihelionAphelion,
} from '../../astro/ephemeris.js';
import { t } from '../../i18n/index.js';

const PLANET_XTS = [1, 2, 3, 4, 5, 6, 7]; // 水/金/火/木/土/天/海

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

// 將 J2000 起算的力學時 JD 轉為「北京時 YYYY-MM-DD HH:MM:SS」。
function formatEventTime(jdTD) {
  const jdUT = jdTD - deltaT(jdTD);
  const beijing = jdUT + 8 / 24;
  const g = jdToGregorian(beijing + J2000);
  return `${g.year}-${pad2(g.month)}-${pad2(g.day)} ${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
}

function planetShortName(xt) {
  return t('ui.celestial.planetShort')[xt] || '?';
}

export class CelestialPage {
  constructor() {
    this.events = [];
  }

  mount(container) {
    const y = new Date().getFullYear();
    const ce = t('ui.celestial');
    const root = document.createElement('section');
    root.className = 'page-celestial';
    root.innerHTML = `
      <h2 style="margin-top:0">${ce.title}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        ${ce.hint}
      </p>
      <form class="page-card" id="ce-form">
        <div class="form-row">
          <label>${t('ui.labels.yearOnly')} <input type="number" id="ce-y" value="${y}" min="-4712" max="9999" /></label>
          <button class="btn" type="button" id="ce-clear">${ce.btnClear}</button>
        </div>
      </form>

      <div class="page-card">
        <h3>${ce.sectionMoon}</h3>
        <div class="form-row">
          <button class="btn" data-event="moon-perigee">${ce.moonPerigee}</button>
          <button class="btn" data-event="moon-apogee">${ce.moonApogee}</button>
          <button class="btn" data-event="moon-asc-node">${ce.moonAscNode}</button>
          <button class="btn" data-event="moon-desc-node">${ce.moonDescNode}</button>
        </div>
      </div>

      <div class="page-card">
        <h3>${ce.sectionEarth}</h3>
        <div class="form-row">
          <button class="btn" data-event="earth-perihelion">${ce.earthPerihelion}</button>
          <button class="btn" data-event="earth-aphelion">${ce.earthAphelion}</button>
        </div>
      </div>

      <div class="page-card">
        <h3>${ce.sectionElongation}</h3>
        <div class="form-row">
          <button class="btn" data-event="ge-merc-east">${ce.mercEast}</button>
          <button class="btn" data-event="ge-merc-west">${ce.mercWest}</button>
          <button class="btn" data-event="ge-venus-east">${ce.venusEast}</button>
          <button class="btn" data-event="ge-venus-west">${ce.venusWest}</button>
        </div>
      </div>

      <div class="page-card">
        <h3>${ce.sectionConjMoon}</h3>
        <div class="form-row" id="ce-conj-moon"></div>
      </div>

      <div class="page-card">
        <h3>${ce.sectionConjSun}</h3>
        <div class="form-row" id="ce-conj-sun"></div>
      </div>

      <div class="page-card">
        <h3>${ce.sectionOpposition}</h3>
        <div class="form-row" id="ce-opp"></div>
      </div>

      <div class="page-card">
        <h3>${ce.sectionStation}</h3>
        <div class="form-row">
          <span style="color:var(--color-text-soft);font-size:13px">${ce.forwardLabel}</span>
          <span id="ce-station-forward"></span>
        </div>
        <div class="form-row">
          <span style="color:var(--color-text-soft);font-size:13px">${ce.reverseLabel}</span>
          <span id="ce-station-reverse"></span>
        </div>
      </div>

      <div class="page-card">
        <h3>${t('ui.labels.result')}</h3>
        <div id="ce-output" class="text-output" style="min-height:120px"></div>
      </div>
    `;
    container.appendChild(root);
    this.el = root;

    this.fillPlanetButtons(root.querySelector('#ce-conj-moon'),  'conj-moon');
    this.fillPlanetButtons(root.querySelector('#ce-conj-sun'),   'conj-sun');
    this.fillPlanetButtons(root.querySelector('#ce-opp'),        'opp');
    this.fillPlanetButtons(root.querySelector('#ce-station-forward'), 'station-fwd');
    this.fillPlanetButtons(root.querySelector('#ce-station-reverse'), 'station-rev');

    for (const btn of root.querySelectorAll('button[data-event]')) {
      btn.addEventListener('click', () => this.compute(btn.dataset.event));
    }
    root.querySelector('#ce-clear').addEventListener('click', () => {
      this.events = [];
      this.renderOutput();
    });
  }

  fillPlanetButtons(holder, prefix) {
    holder.innerHTML = PLANET_XTS.map((xt) =>
      `<button class="btn" data-event="${prefix}:${xt}">${planetShortName(xt)}</button>`
    ).join('');
  }

  unmount() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  baseJcy() {
    const y = Number(this.el.querySelector('#ce-y').value);
    return (gregorianToJD(y, 7, 1) - J2000) / 36525;
  }

  compute(eventKey) {
    const t0 = this.baseJcy();
    const ce = t('ui.celestial');
    let label = '', result;

    if (eventKey === 'moon-perigee')   { label = ce.lblMoonPerigee;   result = moonPerigeeApogee(t0, 1); }
    if (eventKey === 'moon-apogee')    { label = ce.lblMoonApogee;    result = moonPerigeeApogee(t0, 0); }
    if (eventKey === 'moon-asc-node')  { label = ce.lblMoonAscNode;   result = moonNode(t0, 1); }
    if (eventKey === 'moon-desc-node') { label = ce.lblMoonDescNode;  result = moonNode(t0, 0); }
    if (eventKey === 'earth-perihelion') { label = ce.lblEarthPerihelion; result = earthPerihelionAphelion(t0, 1); }
    if (eventKey === 'earth-aphelion')   { label = ce.lblEarthAphelion;   result = earthPerihelionAphelion(t0, 0); }
    if (eventKey === 'ge-merc-east')   { label = ce.lblMercEast;  result = greatestElongation(1, t0, 1); }
    if (eventKey === 'ge-merc-west')   { label = ce.lblMercWest;  result = greatestElongation(1, t0, 0); }
    if (eventKey === 'ge-venus-east')  { label = ce.lblVenusEast; result = greatestElongation(2, t0, 1); }
    if (eventKey === 'ge-venus-west')  { label = ce.lblVenusWest; result = greatestElongation(2, t0, 0); }

    if (eventKey.startsWith('conj-moon:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetShortName(xt)}${ce.suffixConjMoon}`;
      result = planetMoonConjunction(xt, t0);
    }
    if (eventKey.startsWith('conj-sun:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetShortName(xt)}${ce.suffixConjSun}`;
      result = planetSunConjunction(xt, t0);
    }
    if (eventKey.startsWith('opp:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetShortName(xt)}${xt <= 2 ? ce.suffixLowerConj : ce.suffixOpposition}`;
      result = planetSunOpposition(xt, t0);
    }
    if (eventKey.startsWith('station-fwd:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetShortName(xt)}${ce.suffixStationFwd}`;
      result = [planetStation(xt, t0, 1)];
    }
    if (eventKey.startsWith('station-rev:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetShortName(xt)}${ce.suffixStationRev}`;
      result = [planetStation(xt, t0, 0)];
    }

    if (!result) return;
    const tEvent = result[0];
    const extra  = result.length > 1 ? result[1] : null;
    const eventJDTD = tEvent * 36525;
    const timeStr = formatEventTime(eventJDTD);

    let extraStr = '';
    if (eventKey === 'moon-perigee' || eventKey === 'moon-apogee') {
      extraStr = ` ${ce.extraDist} ${extra.toFixed(0)} km`;
    } else if (eventKey === 'earth-perihelion' || eventKey === 'earth-aphelion') {
      extraStr = ` ${ce.extraDist} ${extra.toFixed(6)} AU`;
    } else if (eventKey.startsWith('ge-')) {
      extraStr = ` ${ce.extraElong} ${(extra * RAD_TO_DEG).toFixed(2)}°`;
    } else if (eventKey.startsWith('conj-moon:')) {
      extraStr = ` ${ce.extraDecDiff} ${(extra * RAD_TO_DEG).toFixed(3)}°`;
    } else if (eventKey.startsWith('conj-sun:') || eventKey.startsWith('opp:')) {
      extraStr = ` ${ce.extraLonDiff} ${(extra * RAD_TO_DEG).toFixed(3)}°`;
    } else if (eventKey.startsWith('moon-') && eventKey.endsWith('-node')) {
      extraStr = ` ${ce.extraLong} ${(extra * RAD_TO_DEG).toFixed(2)}°`;
    }

    this.events.unshift(`${label}：${timeStr}${extraStr}`);
    if (this.events.length > 30) this.events.length = 30;
    this.renderOutput();
  }

  renderOutput() {
    const out = this.el.querySelector('#ce-output');
    out.textContent = this.events.length ? this.events.join('\n') : t('ui.celestial.noQueryYet');
  }
}
