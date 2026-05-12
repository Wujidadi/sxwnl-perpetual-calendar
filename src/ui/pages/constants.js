// 常數分頁：以分組形式列出物理與天文常數。

import * as C from '../../astro/constants.js';
import { t } from '../../i18n/index.js';

function buildGroups() { return [
  {
    title: '地球',
    rows: [
      ['EARTH_EQUATORIAL_RADIUS_KM', '地球赤道半徑', 'km',  C.EARTH_EQUATORIAL_RADIUS_KM],
      ['EARTH_MEAN_RADIUS_KM',       '地球平均半徑', 'km',  C.EARTH_MEAN_RADIUS_KM],
      ['EARTH_POLAR_EQ_RATIO',       '極/赤半徑比',  '',    C.EARTH_POLAR_EQ_RATIO],
      ['EARTH_POLAR_EQ_RATIO_SQ',    '極/赤半徑比平方', '', C.EARTH_POLAR_EQ_RATIO_SQ],
    ],
  },
  {
    title: '太陽與光行',
    rows: [
      ['AU_KM',                  '1 天文單位',         'km',     C.AU_KM],
      ['SIN_SOLAR_PARALLAX',     'sin(太陽視差)',      '',       C.SIN_SOLAR_PARALLAX],
      ['SOLAR_PARALLAX',         '太陽視差角',         'rad',    C.SOLAR_PARALLAX],
      ['SPEED_OF_LIGHT_KM_S',    '光速',               'km/s',   C.SPEED_OF_LIGHT_KM_S],
      ['LIGHT_TIME_PER_AU_JCY',  '每 AU 光行時間',     '儒略世紀', C.LIGHT_TIME_PER_AU_JCY],
      ['SUN_EARTH_RATIO',        '日/地半徑比',        '',       C.SUN_EARTH_RATIO],
      ['SUN_RADIUS_ARCSEC',      '太陽視半徑常數',     '"',      C.SUN_RADIUS_ARCSEC],
    ],
  },
  {
    title: '月球',
    rows: [
      ['MOON_EARTH_RATIO_PENUMBRA',   '月/地半徑比（半影）',  '', C.MOON_EARTH_RATIO_PENUMBRA],
      ['MOON_EARTH_RATIO_UMBRA',      '月/地半徑比（本影）',  '', C.MOON_EARTH_RATIO_UMBRA],
      ['MOON_RADIUS_FACTOR_PENUMBRA', '月亮視半徑常數（半影）', '', C.MOON_RADIUS_FACTOR_PENUMBRA],
      ['MOON_RADIUS_FACTOR_UMBRA',    '月亮視半徑常數（本影）', '', C.MOON_RADIUS_FACTOR_UMBRA],
    ],
  },
  {
    title: '行星',
    rows: [
      ['PLANET_NAMES',     '行星名（含冥王星）', '',     t('astro.planets').join('、')],
      ['SYNODIC_PERIODS',  '行星會合週期',       '日',   C.SYNODIC_PERIODS.join(', ')],
    ],
  },
  {
    title: '角度與時間',
    rows: [
      ['RAD_TO_ARCSEC', '弧度→角秒（每弧度的角秒數）', '"/rad',  C.RAD_TO_ARCSEC],
      ['RAD_TO_DEG',    '弧度→度（每弧度的度數）',     '°/rad',  C.RAD_TO_DEG],
      ['TWO_PI',        '2π',                         'rad',   C.TWO_PI],
      ['HALF_PI',       'π/2',                        'rad',   C.HALF_PI],
      ['J2000',         'J2000 標準曆元（儒略日）',    'JD',    C.J2000],
    ],
  },
]; }

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
    let html = '<h2 style="margin-top:0">物理與天文常數</h2>';
    for (const g of buildGroups()) {
      html += `<h3 style="margin-top:24px;margin-bottom:8px">${g.title}</h3>`;
      html += '<table class="data-table"><thead><tr>'
            + '<th style="width:34%">識別字</th>'
            + '<th style="width:34%">含義</th>'
            + '<th style="width:8%">單位</th>'
            + '<th style="width:24%">值</th>'
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
