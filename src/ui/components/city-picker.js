// 兩階城市選單元件：先選省／地區，再選城市；選定後回填經緯度。
//
// 用法：
//   const picker = createCityPicker(container, {
//     onSelect: ({ longitudeDeg, latitudeDeg, name }) => { ... },
//   });
//   picker.unmount();

import { CITY_REGIONS, decodeCityCoord } from '../../data/cities.js';
import { RAD_TO_DEG } from '../../astro/constants.js';

// 拆出單一 entry：4 字元編碼 + 城市名。回傳 null 表示格式不符。
function parseCityEntry(entry) {
  if (!entry || entry.length < 5) return null;
  const code = entry.substring(0, 4);
  const name = entry.substring(4);
  if (!/^[0-9A-Za-z]{4}$/.test(code)) return null;
  return { code, name };
}

export function createCityPicker(container, opts = {}) {
  const wrap = document.createElement('span');
  wrap.className = 'city-picker';
  wrap.innerHTML = `
    <label>城市
      <select class="city-picker-region"></select>
      <select class="city-picker-city"></select>
    </label>
  `;
  container.appendChild(wrap);

  const regionSel = wrap.querySelector('.city-picker-region');
  const citySel = wrap.querySelector('.city-picker-city');

  // 填省／地區
  regionSel.innerHTML = '<option value="">— 省／地區 —</option>'
    + CITY_REGIONS.map((row, idx) => `<option value="${idx}">${row[0]}</option>`).join('');

  function fillCities(regionIdx) {
    citySel.innerHTML = '<option value="">— 城市 —</option>';
    if (regionIdx === '' || regionIdx === null || regionIdx === undefined) return;
    const row = CITY_REGIONS[Number(regionIdx)];
    if (!row) return;
    const items = [];
    for (let i = 1; i < row.length; i++) {
      const e = parseCityEntry(row[i]);
      if (e) items.push(e);
    }
    citySel.innerHTML += items
      .map((e, i) => `<option value="${i}">${e.name}</option>`)
      .join('');
    citySel._items = items;
  }

  regionSel.addEventListener('change', () => fillCities(regionSel.value));
  citySel.addEventListener('change', () => {
    const idx = citySel.value;
    if (idx === '' || !citySel._items) return;
    const item = citySel._items[Number(idx)];
    if (!item) return;
    const c = decodeCityCoord(item.code);
    const regionName = CITY_REGIONS[Number(regionSel.value)][0];
    if (typeof opts.onSelect === 'function') {
      opts.onSelect({
        name:         item.name,
        regionName,
        longitude:    c.longitude,
        latitude:     c.latitude,
        longitudeDeg: c.longitude * RAD_TO_DEG,
        latitudeDeg:  c.latitude * RAD_TO_DEG,
      });
    }
  });

  return {
    element: wrap,
    unmount() {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    },
  };
}
