// i18n 公開 API：字典式繁簡切換。
//
//   t(key)             層級鍵查詢，未命中時回傳鍵本身（便於追蹤遺漏）
//   getLocale()        目前語系
//   setLocale(loc)     切換語系，持久化並通知所有訂閱者
//   onLocaleChange(cb) 訂閱語系變動；回傳取消函式
//   getSupported()     回傳 [{ code, name }, ...]
//
// 預設語系：localStorage 已存 → 採用之；否則依 navigator.language 偵測；
// zh-TW／zh-HK／zh-Hant-* 走 zh-TW，其餘 zh-* 與非 zh-* 走 zh-CN。

import { persistentStorage } from '../utils/storage.js';
import zhCN from './locales/zh-CN.js';
import zhTW from './locales/zh-TW.js';

const STORAGE_KEY = 'perpetual-calendar.locale';
const LOCALES = { 'zh-CN': zhCN, 'zh-TW': zhTW };
const SUPPORTED = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
];

const listeners = new Set();
let current = detectInitial();

// 大宗 zh-TW 地名字典走 dynamic import，避免主 bundle 包含上千條條目。
// 啟動時若當前語系為 zh-TW、或 setLocale('zh-TW') 第一次切換時觸發載入。
const lazyLoaded = new Set();
function ensureLazyCities(locale) {
  if (locale !== 'zh-TW' || lazyLoaded.has(locale)) return;
  lazyLoaded.add(locale);
  import('./locales/zh-TW-cities.js')
    .then((mod) => {
      Object.assign(LOCALES['zh-TW'].cities, mod.default);
      // 通知訂閱者重渲染（cities 既已就緒）
      listeners.forEach((cb) => {
        try { cb(current); } catch (e) { console.error('onLocaleChange callback 錯誤:', e); }
      });
    })
    .catch((e) => console.warn('zh-TW-cities 載入失敗:', e));
}
ensureLazyCities(current);

function detectInitial() {
  let stored = null;
  try { stored = persistentStorage.getItem(STORAGE_KEY); } catch (_) { /* SSR／非瀏覽器環境 */ }
  if (stored && LOCALES[stored]) return stored;
  const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
  if (/^zh-(TW|HK|MO|Hant)/i.test(nav)) return 'zh-TW';
  return 'zh-CN';
}

// 以「a.b.c」路徑深查；未命中回傳 key 本身。
function lookup(dict, key) {
  if (!dict || typeof key !== 'string') return key;
  const parts = key.split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return key;
  }
  return cur;
}

export function t(key) {
  const v = lookup(LOCALES[current], key);
  if (v === key) {
    // 視為遺漏；嘗試 zh-CN fallback 後仍回傳 key
    const f = lookup(LOCALES['zh-CN'], key);
    return f === key ? key : f;
  }
  return v;
}

// 節日字串轉譯：以 zh-CN 原字串為 key 查當前語系版本，未命中回原字串。
export function tFestival(s) {
  if (!s) return s;
  const dict = LOCALES[current] && LOCALES[current].festival;
  return (dict && dict[s]) || s;
}

// 大型資料字典通用查找器：未命中時回原字串。
function lookupOrFallback(category, s) {
  if (!s) return s;
  const dict = LOCALES[current] && LOCALES[current][category];
  return (dict && dict[s]) || s;
}

// 城市／省份／地區名稱轉譯（cities.js 解出的中文短語）。
export function tCity(s)     { return lookupOrFallback('cities', s); }

// 時區國家／城市轉譯（timezones.js 解出的中文短語）。
export function tTimezone(s) { return lookupOrFallback('timezones', s); }

// 恆星附屬中文短語（如「天琴座」等）轉譯。
export function tStar(s)     { return lookupOrFallback('stars', s); }

export function getLocale() {
  return current;
}

export function setLocale(loc) {
  if (!LOCALES[loc] || loc === current) return;
  current = loc;
  try { persistentStorage.setItem(STORAGE_KEY, loc, 365); } catch (_) { /* SSR／非瀏覽器環境 */ }
  ensureLazyCities(loc);
  listeners.forEach((cb) => {
    try { cb(loc); } catch (e) { console.error('onLocaleChange callback 錯誤:', e); }
  });
}

export function onLocaleChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSupported() {
  return SUPPORTED.slice();
}
