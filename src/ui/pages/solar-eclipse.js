// 日月食分頁：列出指定年份的所有日食與月食事件
//
// 日食：對該年每個合朔呼叫 fastSolarEclipseSearch，過濾無食事件
// 月食：對該年每個合朔加上 ~14.77 日得到滿月近似，再以 moonSunDiffToTime(W + π) 精化，於該時刻計算月地影距離以判定食類型

import { J2000, TWO_PI, RAD_TO_ARCSEC, AU_KM, EARTH_MEAN_RADIUS_KM, MOON_RADIUS_FACTOR_PENUMBRA } from '../../astro/constants.js';
import { jdToGregorian } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { normalizeAngleSigned } from '../../astro/math-utils.js';
import { fastSolarEclipseSearch } from '../../astro/solar-eclipse.js';
import { lunarEclipse } from '../../astro/lunar-eclipse.js';
import { shuoQiCalculator } from '../../lunar/ssq.js';
import { moonSunDiffToTime } from '../../astro/ephemeris.js';
import { drawEclipseTimeline } from '../canvas/eclipse-timeline.js';
import { t } from '../../i18n/index.js';
import { saveFormState, loadFormState } from '../../utils/storage.js';

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

// 把 J2000 起算的力學時 JD 轉為「北京時 YYYY-MM-DD HH:MM:SS」
function formatBJ(jdTD) {
  const jdUT = jdTD - deltaT(jdTD);
  const g = jdToGregorian(jdUT + 8 / 24 + J2000);
  return `${g.year}-${pad2(g.month)}-${pad2(g.day)} ${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
}

// 估算指定 W（月日視黃經差）對應的合朔／滿月力學時 JD（J2000 起算）
function precisePhaseJD(W) {
  return moonSunDiffToTime(W) * 36525;
}

// 計算月食類型；於 lunarEclipse.calc 完成後使用
//   回傳: { lx: 'penumbral'/'partial'/'total'/null, sep, ePenumbra, eUmbra, mr }
function classifyLunarEclipse() {
  // 影子中心 = 太陽地平反射點：RA_sun + π，DEC = −DEC_sun
  const shadowRA  = lunarEclipse.sCJ + Math.PI;
  const shadowDEC = -lunarEclipse.sCW;
  const dRA  = normalizeAngleSigned(lunarEclipse.mCJ - shadowRA);
  const dDEC = lunarEclipse.mCW - shadowDEC;
  const sepArcsec = Math.sqrt(
    (dRA * Math.cos(shadowDEC) * RAD_TO_ARCSEC) ** 2
    + (dDEC * RAD_TO_ARCSEC) ** 2,
  );
  const mr = lunarEclipse.e_mRad; // 月地心視半徑（角秒）
  const eUmbra    = lunarEclipse.eShadow;  // 本影
  const ePenumbra = lunarEclipse.eShadow2; // 半影
  if (sepArcsec >= ePenumbra + mr) return { lx: null, sep: sepArcsec, ePenumbra, eUmbra, mr };
  if (sepArcsec >= eUmbra + mr)    return { lx: 'penumbral', sep: sepArcsec, ePenumbra, eUmbra, mr };
  if (sepArcsec >= eUmbra - mr)    return { lx: 'partial',   sep: sepArcsec, ePenumbra, eUmbra, mr };
  return { lx: 'total', sep: sepArcsec, ePenumbra, eUmbra, mr };
}

function findYearEclipses(year) {
  const solar = [];
  const lunar = [];

  // 該年的合朔與節氣：以 7 月 1 日為中心
  const seed = Math.floor((year - 2000) * 365.2422 + 180);
  shuoQiCalculator.calcYear(seed);

  // 日食：對每個合朔呼叫 fastSolarEclipseSearch
  for (let i = 0; i < 14; i++) {
    const nmJD = shuoQiCalculator.newMoonList[i];
    if (nmJD === undefined) continue;
    const re = fastSolarEclipseSearch(nmJD);
    if (!re || re.lx === 'N') continue;
    const eventJD = re.jd;
    const g = jdToGregorian(eventJD + J2000);
    if (g.year !== year) continue;
    solar.push({ jdTD: eventJD, type: re.lx, gamma: re.gm, ac: re.ac });
  }

  // 月食：對每個合朔的下一個半週期（W += π）求精確滿月
  // 取得 W0 = 2π·n 系列（n 為朔序），加 π 得滿月對應的 W
  for (let i = 0; i < 14; i++) {
    const nmJD = shuoQiCalculator.newMoonList[i];
    if (nmJD === undefined) continue;
    // 朔序 n
    const n = Math.floor((nmJD + 8) / 29.5306);
    const Wfm = 2 * Math.PI * n + Math.PI;
    const T = precisePhaseJD(Wfm);
    const g = jdToGregorian(T + J2000);
    if (g.year !== year) continue;
    lunarEclipse.calc(T, 0, 0, 0); // 任意地點，只關心地心位置
    const c = classifyLunarEclipse();
    if (!c.lx) continue;
    lunar.push({ jdTD: T, type: c.lx, sep: c.sep, ePenumbra: c.ePenumbra, eUmbra: c.eUmbra, mr: c.mr });
  }

  solar.sort((a, b) => a.jdTD - b.jdTD);
  lunar.sort((a, b) => a.jdTD - b.jdTD);
  return { solar, lunar };
}

export class SolarEclipsePage {
  mount(container) {
    const y = (loadFormState('solar-eclipse') || {}).y ?? new Date().getFullYear();
    const root = document.createElement('section');
    root.className = 'page-solar-eclipse';
    root.innerHTML = `
      <h2 style="margin-top:0">${t('ui.solarEclipsePage.title')}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        ${t('ui.solarEclipsePage.hint')}
      </p>
      <form class="page-card" id="se-form">
        <div class="form-row">
          <label>${t('ui.labels.yearOnly')} <input type="number" id="se-y" value="${y}" min="-4712" max="9999" step="1" /></label>
          <button class="btn btn-primary" type="submit">${t('ui.buttons.query')}</button>
        </div>
      </form>
      <div id="se-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#se-form').addEventListener('submit', (e) => {
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
    const y = Number(this.el.querySelector('#se-y').value);
    saveFormState('solar-eclipse', { y });
    const { solar, lunar } = findYearEclipses(y);

    const sp = t('ui.solarEclipsePage');
    const noneStr = t('ui.common.none');

    const solarRows = solar.map((e) => {
      const label = t('eclipse.solar.' + e.type) || e.type;
      return `<tr>
        <td>${formatBJ(e.jdTD)}</td>
        <td>${label}</td>
        <td class="mono">${e.gamma !== undefined ? e.gamma.toFixed(4) : noneStr}</td>
        <td>${e.ac === 0 ? sp.criticalNote : ''}</td>
      </tr>`;
    }).join('');
    const lunarRows = lunar.map((e, idx) => {
      const label = t('eclipse.lunar.' + e.type) || e.type;
      return `<tr>
        <td>${formatBJ(e.jdTD)}</td>
        <td>${label}</td>
        <td class="mono">${sp.colMagnitudeMoon} ${e.mr.toFixed(1)}″</td>
        <td class="mono">${sp.colDistToShadow} ${e.sep.toFixed(1)}″</td>
        <td><button type="button" class="btn" data-le-idx="${idx}">${t('ui.buttons.timeline')}</button></td>
      </tr>`;
    }).join('');

    this.el.querySelector('#se-output').innerHTML = `
      <div class="page-card">
        <h3>${sp.solarSection.replace('{n}', solar.length)}</h3>
        ${solar.length ? `
          <table class="data-table">
            <thead><tr><th>${sp.colDateBJ}</th><th>${t('ui.labels.type')}</th><th>${sp.colGamma}</th><th>${t('ui.labels.note')}</th></tr></thead>
            <tbody>${solarRows}</tbody>
          </table>` : `<p style="color:var(--color-text-soft)">${sp.noSolar}</p>`}
      </div>
      <div class="page-card">
        <h3>${sp.lunarSection.replace('{n}', lunar.length)}</h3>
        ${lunar.length ? `
          <table class="data-table">
            <thead><tr><th>${sp.colLunarDateBJ}</th><th>${t('ui.labels.type')}</th><th>${sp.colMagnitudeMoon}</th><th>${sp.colDistToShadow}</th><th></th></tr></thead>
            <tbody>${lunarRows}</tbody>
          </table>
          <div id="se-lunar-detail" style="margin-top:12px"></div>
          <p style="color:var(--color-text-soft);font-size:12px;margin-top:8px">
            ${sp.lunarNote}
          </p>
          ` : `<p style="color:var(--color-text-soft)">${sp.noLunar}</p>`}
      </div>
    `;

    this.el.querySelectorAll('[data-le-idx]').forEach((btn) => {
      btn.addEventListener('click', () => this.showLunarTimeline(lunar[Number(btn.dataset.leIdx)]));
    });
  }

  showLunarTimeline(ev) {
    if (!ev) return;
    lunarEclipse.lecMax(ev.jdTD);
    const lT = lunarEclipse.lT;
    const LX = lunarEclipse.LX;
    const sf = lunarEclipse.sf;
    const p = t('eclipse.phases');
    const noneStr = t('ui.common.none');
    const events = [];
    const push = (jd, key, label) => {
      if (jd && !isNaN(jd) && jd !== 0) events.push({ jd, key, label });
    };
    push(lT[3], 'Pe1', p.Pe1);
    push(lT[1], 'P1',  p.P1);
    push(lT[5], 'U1',  p.U1);
    push(lT[0], 'Max', p.Max);
    push(lT[6], 'U4',  p.U4);
    push(lT[2], 'P4',  p.P4);
    push(lT[4], 'Pe4', p.Pe4);

    // 月食 LX 為 '偏'／'全' 字符（zh-CN）；對應 eclipse.lunar 的完整類型標籤
    const LX_MAP = { '偏':'partial', '全':'total' };
    const lxLabel = LX_MAP[LX] ? t('eclipse.lunar.' + LX_MAP[LX]) : noneStr;
    const host = this.el.querySelector('#se-lunar-detail');
    host.innerHTML = `
      <div class="page-card" style="margin:0">
        <h4 style="margin:0 0 8px">${lxLabel}（${formatBJ(lT[0] || ev.jdTD)}）${t('eclipse.metrics.magnitude')} ${sf ? sf.toFixed(3) : noneStr}</h4>
        <canvas id="se-lunar-timeline" width="720" height="160"
          style="background:#0d1116;border-radius:8px;display:block;width:100%;max-width:720px;margin:0 auto"></canvas>
      </div>
    `;
    const canvas = host.querySelector('#se-lunar-timeline');
    if (canvas) drawEclipseTimeline(canvas, events);
  }
}
