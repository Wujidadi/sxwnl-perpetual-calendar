// 紀年系統轉換。本專案並用兩套紀年：
//   - 普通紀年：以「B」字首表示公元前（B1 = 公元前 1 年），無公元 0 年。
//   - 天文紀年：含公元 0 年；公元前 n 年表示為 1 - n。
// 所有對外輸入經 civilToAstroYear 正規化為天文紀年；輸出時以 astroToCivilYear 還原。

const ASTRO_YEAR_MIN = -4712;
const ASTRO_YEAR_MAX = 9999;
const INVALID_SENTINEL = -10000;

export function civilToAstroYear(c) {
  let y = String(c).replace(/[^0-9Bb\*-]/g, '');
  const q = y.substr(0, 1);
  if (q === 'B' || q === 'b' || q === '*') {
    y = 1 - y.substr(1, y.length);
    if (y > 0) {
      console.warn('通用紀法的公元前紀法從 B.C.1 年開始，並且沒有公元 0 年');
      return INVALID_SENTINEL;
    }
  } else {
    y -= 0;
  }
  if (y < ASTRO_YEAR_MIN) console.warn('超過 B.C. 4713 不準');
  if (y > ASTRO_YEAR_MAX) console.warn('超過 9999 年的農曆計算很不準');
  return y;
}

export function astroToCivilYear(y) {
  y -= 0;
  if (y <= 0) return 'B' + (-y + 1);
  return '' + y;
}
