// 恆星分頁：依關鍵字檢索恆星庫／88 星座，計算視位置／站心／平位置。

import { J2000 } from '../../astro/constants.js';
import { gregorianToJD } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';
import { parseTimeToHours } from '../../utils/time.js';
import { computeStarEphemeris } from '../../astro/stellar.js';
import { searchStarCatalog, parseStarCatalog } from '../../data/stars.js';
import { t, tStar } from '../../i18n/index.js';
import { saveFormState, loadFormState } from '../../utils/storage.js';

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
    const saved = loadFormState('stars') || {};
    const y = saved.y ?? today.getFullYear();
    const m = saved.m ?? today.getMonth() + 1;
    const d = saved.d ?? today.getDate();
    const key = saved.key ?? 'Lyr';
    const time = saved.time ?? '20:00:00';
    const scale = saved.scale ?? 'UT';
    const lon = saved.lon ?? 121.5;
    const lat = saved.lat ?? 25.0;
    const mode = saved.mode ?? 0;
    const st = t('ui.stars');
    const modes = buildModes();
    const modeOptions = modes.map((mo) =>
      `<option value="${mo.value}"${Number(mo.value) === Number(mode) ? ' selected' : ''}>${mo.label}</option>`).join('');

    const root = document.createElement('section');
    root.className = 'page-stars';
    root.innerHTML = `
      <h2 style="margin-top:0">${st.title}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">${st.hint}</p>
      <form class="page-card" id="st-form">
        <div class="form-row">
          <label>${st.keyLabel} <input type="text" id="st-key" value="${key}" size="12" /></label>
          <button class="btn btn-primary" type="submit">${st.btnSearch}</button>
        </div>
        <div class="form-row">
          <label>${t('ui.labels.year')} <input type="number" id="st-y" value="${y}" min="-4712" max="9999" /></label>
          <label>${t('ui.labels.month')} <input type="number" id="st-m" value="${m}" min="1" max="12" /></label>
          <label>${t('ui.labels.day')} <input type="number" id="st-d" value="${d}" min="1" max="31" /></label>
          <label>${t('ui.labels.time_')} <input type="text" id="st-t" value="${time}" size="10" /></label>
        </div>
        <div class="form-row">
          <label>${st.timeScale}
            <select id="st-scale">
              <option value="UT"${scale === 'UT' ? ' selected' : ''}>UTC</option>
              <option value="TD"${scale === 'TD' ? ' selected' : ''}>TD</option>
            </select>
          </label>
          <label>${t('ui.labels.longitude')} <input type="number" id="st-lon" value="${lon}" step="0.001" /> °</label>
          <label>${t('ui.labels.latitude')} <input type="number" id="st-lat" value="${lat}"  step="0.001" /> °</label>
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
    const time = q('st-t').value;
    const scale = q('st-scale').value;
    const lon = Number(q('st-lon').value);
    const lat = Number(q('st-lat').value);
    const mode = Number(q('st-mode').value);
    saveFormState('stars', { key, y, m, d, time, scale, lon, lat, mode });

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

    const day = d + parseTimeToHours(time) / 24;
    let jdTD = gregorianToJD(y, m, day) - J2000;
    if (scale === 'UT') jdTD += deltaT(jdTD);
    const jcy = jdTD / 36525;
    const rawText = computeStarEphemeris(jcy, stars, 0.1, mode, lon * Math.PI / 180, lat * Math.PI / 180);
    const text = localizeStarsText(rawText);

    out.innerHTML = `
      <h3>${st.resultHead.replace('{key}', escapeHtml(key)).replace('{n}', stars.length / 8)}</h3>
      <pre class="text-output">${escapeHtml(text)}</pre>
    `;
  }
}

// 輸出文字中含 88 個星座名（如「天鹰座」）與族名（如「黄道」），
// 對 stars 字典已收錄的中文短語做替換，未收錄者保留原字。
function localizeStarsText(s) {
  // 為避免「天鹅座」「天鸽座」等部分重疊匹配，依字串長度降冪替換。
  const dict = STARS_REPLACE_KEYS;
  let out = s;
  for (const key of dict) {
    const tr = tStar(key);
    if (tr !== key) out = out.split(key).join(tr);
  }
  return out;
}

// 預先排序：3 字星座名（皆 3 字）+ 族名（2 字／3 字）。
const STARS_REPLACE_KEYS = [
  '幻之水', '拉卡伊',
  '仙女座', '唧筒座', '天燕座', '宝瓶座', '天鹰座', '天坛座', '白羊座', '御夫座',
  '牧夫座', '雕具座', '鹿豹座', '巨蟹座', '猎犬座', '大犬座', '小犬座', '摩羯座',
  '船底座', '仙后座', '半人马', '仙王座', '鲸鱼座', '堰蜒座', '圆规座', '天鸽座',
  '后发座', '南冕座', '北冕座', '乌鸦座', '巨爵座', '南十字', '天鹅座', '海豚座',
  '剑鱼座', '天龙座', '小马座', '波江座', '天炉座', '双子座', '天鹤座', '武仙座',
  '时钟座', '长蛇座', '水蛇座', '印第安', '蝎虎座', '狮子座', '小狮座', '天兔座',
  '天秤座', '豺狼座', '天猫座', '天琴座', '山案座', '显微镜', '麒麟座', '苍蝇座',
  '矩尺座', '南极座', '蛇夫座', '猎户座', '孔雀座', '飞马座', '英仙座', '凤凰座',
  '绘架座', '双鱼座', '南鱼座', '船尾座', '罗盘座', '网罟座', '天箭座', '人马座',
  '天蝎座', '玉夫座', '盾牌座', '巨蛇座', '六分仪', '金牛座', '望远镜', '三角座',
  '南三角', '杜鹃座', '大熊座', '小熊座', '船帆座', '室女座', '飞鱼座', '狐狸座',
  '英仙', '拜耳', '黄道', '武仙', '大熊', '猎户',
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
