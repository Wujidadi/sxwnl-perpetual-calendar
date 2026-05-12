// 常數分頁：以分組形式列出物理與天文常數。

import * as C from '../../astro/constants.js';
import { t } from '../../i18n/index.js';

function buildGroups() {
  const s = t('ui.constants.sections');
  const d = t('ui.constants.descs');
  const unitDeg = t('ui.labels.day');
  return [
    {
      title: s.earth,
      rows: [
        ['EARTH_EQUATORIAL_RADIUS_KM', d.EARTH_EQUATORIAL_RADIUS_KM, 'km', C.EARTH_EQUATORIAL_RADIUS_KM],
        ['EARTH_MEAN_RADIUS_KM',       d.EARTH_MEAN_RADIUS_KM,       'km', C.EARTH_MEAN_RADIUS_KM],
        ['EARTH_POLAR_EQ_RATIO',       d.EARTH_POLAR_EQ_RATIO,       '',   C.EARTH_POLAR_EQ_RATIO],
        ['EARTH_POLAR_EQ_RATIO_SQ',    d.EARTH_POLAR_EQ_RATIO_SQ,    '',   C.EARTH_POLAR_EQ_RATIO_SQ],
      ],
    },
    {
      title: s.sun,
      rows: [
        ['AU_KM',                  d.AU_KM,                  'km',           C.AU_KM],
        ['SIN_SOLAR_PARALLAX',     d.SIN_SOLAR_PARALLAX,     '',             C.SIN_SOLAR_PARALLAX],
        ['SOLAR_PARALLAX',         d.SOLAR_PARALLAX,         'rad',          C.SOLAR_PARALLAX],
        ['SPEED_OF_LIGHT_KM_S',    d.SPEED_OF_LIGHT_KM_S,    'km/s',         C.SPEED_OF_LIGHT_KM_S],
        ['LIGHT_TIME_PER_AU_JCY',  d.LIGHT_TIME_PER_AU_JCY,  t('ui.common.jcyUnit'), C.LIGHT_TIME_PER_AU_JCY],
        ['SUN_EARTH_RATIO',        d.SUN_EARTH_RATIO,        '',             C.SUN_EARTH_RATIO],
        ['SUN_RADIUS_ARCSEC',      d.SUN_RADIUS_ARCSEC,      '"',            C.SUN_RADIUS_ARCSEC],
      ],
    },
    {
      title: s.moon,
      rows: [
        ['MOON_EARTH_RATIO_PENUMBRA',   d.MOON_EARTH_RATIO_PENUMBRA,   '', C.MOON_EARTH_RATIO_PENUMBRA],
        ['MOON_EARTH_RATIO_UMBRA',      d.MOON_EARTH_RATIO_UMBRA,      '', C.MOON_EARTH_RATIO_UMBRA],
        ['MOON_RADIUS_FACTOR_PENUMBRA', d.MOON_RADIUS_FACTOR_PENUMBRA, '', C.MOON_RADIUS_FACTOR_PENUMBRA],
        ['MOON_RADIUS_FACTOR_UMBRA',    d.MOON_RADIUS_FACTOR_UMBRA,    '', C.MOON_RADIUS_FACTOR_UMBRA],
      ],
    },
    {
      title: s.planets,
      rows: [
        ['PLANET_NAMES',     d.PLANET_NAMES,    '',         t('astro.planets').join('、')],
        ['SYNODIC_PERIODS',  d.SYNODIC_PERIODS, unitDeg,    C.SYNODIC_PERIODS.join(', ')],
      ],
    },
    {
      title: s.angleTime,
      rows: [
        ['RAD_TO_ARCSEC', d.RAD_TO_ARCSEC, '"/rad', C.RAD_TO_ARCSEC],
        ['RAD_TO_DEG',    d.RAD_TO_DEG,    '°/rad', C.RAD_TO_DEG],
        ['TWO_PI',        d.TWO_PI,        'rad',   C.TWO_PI],
        ['HALF_PI',       d.HALF_PI,       'rad',   C.HALF_PI],
        ['J2000',         d.J2000,         'JD',    C.J2000],
      ],
    },
  ];
}

function formatValue(v) {
  if (typeof v === 'number') {
    if (Number.isInteger(v) && Math.abs(v) < 1e7) return String(v);
    if (Math.abs(v) >= 1e6 || (Math.abs(v) > 0 && Math.abs(v) < 1e-4)) return v.toExponential(9);
    return String(v);
  }
  return String(v);
}

export class ConstantsPage {
  mount(container) {
    const root = document.createElement('section');
    root.className = 'page-constants';
    const h = t('ui.common');
    let html = `<h2 style="margin-top:0">${t('ui.constants.title')}</h2>`;
    for (const g of buildGroups()) {
      html += `<h3 style="margin-top:24px;margin-bottom:8px">${g.title}</h3>`;
      html += '<table class="data-table"><thead><tr>'
            + `<th style="width:34%">${h.tableHeadId}</th>`
            + `<th style="width:34%">${h.tableHeadDesc}</th>`
            + `<th style="width:8%">${h.tableHeadUnit}</th>`
            + `<th style="width:24%">${h.tableHeadValue}</th>`
            + '</tr></thead><tbody>';
      for (const [id, desc, unit, val] of g.rows) {
        html += `<tr><td><code>${id}</code></td><td>${desc}</td><td>${unit}</td><td class="mono">${formatValue(val)}</td></tr>`;
      }
      html += '</tbody></table>';
    }
    root.innerHTML = html;
    container.appendChild(root);
    this.el = root;
  }
  unmount() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }
}
