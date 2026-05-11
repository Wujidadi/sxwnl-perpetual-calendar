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

const PLANETS_AFTER_VENUS = [
  { xt: 1, name: '水' },
  { xt: 2, name: '金' },
  { xt: 3, name: '火' },
  { xt: 4, name: '木' },
  { xt: 5, name: '土' },
  { xt: 6, name: '天' },
  { xt: 7, name: '海' },
];

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

// 將 J2000 起算的力學時 JD 轉為「北京時 YYYY-MM-DD HH:MM:SS」。
function formatEventTime(jdTD) {
  const jdUT = jdTD - deltaT(jdTD);
  const beijing = jdUT + 8 / 24;
  const g = jdToGregorian(beijing + J2000);
  return `${g.year}-${pad2(g.month)}-${pad2(g.day)} ${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
}

export class CelestialPage {
  constructor() {
    this.events = [];
  }

  mount(container) {
    const y = new Date().getFullYear();
    const root = document.createElement('section');
    root.className = 'page-celestial';
    root.innerHTML = `
      <h2 style="margin-top:0">天象</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        指定年份後點擊各天象按鈕，計算該年附近最接近的天象時刻（顯示為北京時 UTC+8）。
      </p>
      <form class="page-card" id="ce-form">
        <div class="form-row">
          <label>年份 <input type="number" id="ce-y" value="${y}" min="-4712" max="9999" /></label>
          <button class="btn" type="button" id="ce-clear">清空結果</button>
        </div>
      </form>

      <div class="page-card">
        <h3>月亮</h3>
        <div class="form-row">
          <button class="btn" data-event="moon-perigee">近點</button>
          <button class="btn" data-event="moon-apogee">遠點</button>
          <button class="btn" data-event="moon-asc-node">升交點</button>
          <button class="btn" data-event="moon-desc-node">降交點</button>
        </div>
      </div>

      <div class="page-card">
        <h3>地球</h3>
        <div class="form-row">
          <button class="btn" data-event="earth-perihelion">近日點</button>
          <button class="btn" data-event="earth-aphelion">遠日點</button>
        </div>
      </div>

      <div class="page-card">
        <h3>水星／金星 大距</h3>
        <div class="form-row">
          <button class="btn" data-event="ge-merc-east">水東大距</button>
          <button class="btn" data-event="ge-merc-west">水西大距</button>
          <button class="btn" data-event="ge-venus-east">金東大距</button>
          <button class="btn" data-event="ge-venus-west">金西大距</button>
        </div>
      </div>

      <div class="page-card">
        <h3>行星合月</h3>
        <div class="form-row" id="ce-conj-moon"></div>
      </div>

      <div class="page-card">
        <h3>行星合日（外行星：上合；內行星：上合）</h3>
        <div class="form-row" id="ce-conj-sun"></div>
      </div>

      <div class="page-card">
        <h3>行星衝（外行星）／下合（內行星）</h3>
        <div class="form-row" id="ce-opp"></div>
      </div>

      <div class="page-card">
        <h3>行星留</h3>
        <div class="form-row">
          <span style="color:var(--color-text-soft);font-size:13px">順留：</span>
          <span id="ce-station-forward"></span>
        </div>
        <div class="form-row">
          <span style="color:var(--color-text-soft);font-size:13px">逆留：</span>
          <span id="ce-station-reverse"></span>
        </div>
      </div>

      <div class="page-card">
        <h3>結果</h3>
        <div id="ce-output" class="text-output" style="min-height:120px"></div>
      </div>
    `;
    container.appendChild(root);
    this.el = root;

    // 動態填入行星按鈕
    this.fillPlanetButtons(root.querySelector('#ce-conj-moon'),  'conj-moon');
    this.fillPlanetButtons(root.querySelector('#ce-conj-sun'),   'conj-sun');
    this.fillPlanetButtons(root.querySelector('#ce-opp'),        'opp');
    this.fillPlanetButtons(root.querySelector('#ce-station-forward'), 'station-fwd');
    this.fillPlanetButtons(root.querySelector('#ce-station-reverse'), 'station-rev');

    // 綁定事件
    for (const btn of root.querySelectorAll('button[data-event]')) {
      btn.addEventListener('click', () => this.compute(btn.dataset.event));
    }
    root.querySelector('#ce-clear').addEventListener('click', () => {
      this.events = [];
      this.renderOutput();
    });
  }

  fillPlanetButtons(holder, prefix) {
    holder.innerHTML = PLANETS_AFTER_VENUS.map((p) =>
      `<button class="btn" data-event="${prefix}:${p.xt}">${p.name}</button>`
    ).join('');
  }

  unmount() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  // 取得當年年中對應的儒略世紀 TD（找事件用的基準時間）。
  baseJcy() {
    const y = Number(this.el.querySelector('#ce-y').value);
    return (gregorianToJD(y, 7, 1) - J2000) / 36525;
  }

  compute(eventKey) {
    const t0 = this.baseJcy();
    let label = '', result;

    if (eventKey === 'moon-perigee')   { label = '月亮近點'; result = moonPerigeeApogee(t0, 1); }
    if (eventKey === 'moon-apogee')    { label = '月亮遠點'; result = moonPerigeeApogee(t0, 0); }
    if (eventKey === 'moon-asc-node')  { label = '月亮升交點'; result = moonNode(t0, 1); }
    if (eventKey === 'moon-desc-node') { label = '月亮降交點'; result = moonNode(t0, 0); }
    if (eventKey === 'earth-perihelion') { label = '地球近日點'; result = earthPerihelionAphelion(t0, 1); }
    if (eventKey === 'earth-aphelion')   { label = '地球遠日點'; result = earthPerihelionAphelion(t0, 0); }
    if (eventKey === 'ge-merc-east')   { label = '水星東大距'; result = greatestElongation(1, t0, 1); }
    if (eventKey === 'ge-merc-west')   { label = '水星西大距'; result = greatestElongation(1, t0, 0); }
    if (eventKey === 'ge-venus-east')  { label = '金星東大距'; result = greatestElongation(2, t0, 1); }
    if (eventKey === 'ge-venus-west')  { label = '金星西大距'; result = greatestElongation(2, t0, 0); }

    if (eventKey.startsWith('conj-moon:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetName(xt)}合月`;
      result = planetMoonConjunction(xt, t0);
    }
    if (eventKey.startsWith('conj-sun:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetName(xt)}合日`;
      result = planetSunConjunction(xt, t0);
    }
    if (eventKey.startsWith('opp:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetName(xt)}${xt <= 2 ? '下合' : '衝'}`;
      result = planetSunOpposition(xt, t0);
    }
    if (eventKey.startsWith('station-fwd:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetName(xt)}順留`;
      result = [planetStation(xt, t0, 1)];
    }
    if (eventKey.startsWith('station-rev:')) {
      const xt = Number(eventKey.split(':')[1]);
      label = `${planetName(xt)}逆留`;
      result = [planetStation(xt, t0, 0)];
    }

    if (!result) return;
    const tEvent = result[0];
    const extra  = result.length > 1 ? result[1] : null;
    const eventJDTD = tEvent * 36525;
    const timeStr = formatEventTime(eventJDTD);

    let extraStr = '';
    if (eventKey === 'moon-perigee' || eventKey === 'moon-apogee') {
      // result[1] 為月地距離（千米）
      extraStr = ` 距離 ${extra.toFixed(0)} km`;
    } else if (eventKey === 'earth-perihelion' || eventKey === 'earth-aphelion') {
      extraStr = ` 距離 ${extra.toFixed(6)} AU`;
    } else if (eventKey.startsWith('ge-')) {
      extraStr = ` 距角 ${(extra * RAD_TO_DEG).toFixed(2)}°`;
    } else if (eventKey.startsWith('conj-moon:')) {
      extraStr = ` 赤緯差 ${(extra * RAD_TO_DEG).toFixed(3)}°`;
    } else if (eventKey.startsWith('conj-sun:') || eventKey.startsWith('opp:')) {
      extraStr = ` 黃緯差 ${(extra * RAD_TO_DEG).toFixed(3)}°`;
    } else if (eventKey.startsWith('moon-') && eventKey.endsWith('-node')) {
      extraStr = ` 黃經 ${(extra * RAD_TO_DEG).toFixed(2)}°`;
    }

    this.events.unshift(`${label}：${timeStr}${extraStr}`);
    if (this.events.length > 30) this.events.length = 30;
    this.renderOutput();
  }

  renderOutput() {
    const out = this.el.querySelector('#ce-output');
    out.textContent = this.events.length ? this.events.join('\n') : '（尚未查詢）';
  }
}

function planetName(xt) {
  return PLANETS_AFTER_VENUS.find((p) => p.xt === xt)?.name || '?';
}
