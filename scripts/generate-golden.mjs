#!/usr/bin/env node
// 於 Node vm 沙箱中載入參考來源 JS（提供最簡瀏覽器 stub），
// 對固定輸入計算後輸出 tests/fixtures/golden.json，作為回歸對照基準（要求 bit-exact）。
//
// 使用方式：
//   npm run golden            # 或 node scripts/generate-golden.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const referenceSrcDir = join(projectRoot, '..', 'sxwnl', 'src');
const outDir = join(projectRoot, 'tests', 'fixtures');
const outPath = join(outDir, 'golden.json');

// 載入順序對應參考來源 index.htm 的依賴順序，僅取算法相關，不取 vml/help/page_gj
const LOAD_ORDER = ['tools.js', 'eph0.js', 'ephB.js', 'eph.js', 'JW.js', 'lunar.js'];

function createSandbox() {
  const noop = () => {};
  const Storage = function () {};
  const makeStorage = () => {
    const s = { getItem: () => null, setItem: noop, removeItem: noop };
    Object.setPrototypeOf(s, Storage.prototype);
    return s;
  };
  const fakeElement = () => ({
    style: {},
    appendChild: noop,
    add: noop,
    setAttribute: noop,
    addEventListener: noop,
    innerHTML: '',
  });
  const sandbox = {
    console,
    alert: (msg) => console.warn(`[reference alert] ${msg}`),
    Storage,
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    document: {
      createElement: () => fakeElement(),
      getElementById: () => fakeElement(),
      cookie: '',
    },
    navigator: { userAgent: 'node-vm', language: 'zh-CN' },
    setTimeout, clearTimeout, setInterval, clearInterval,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

async function loadSxwnl() {
  const sandbox = createSandbox();
  vm.createContext(sandbox);
  for (const file of LOAD_ORDER) {
    const src = await readFile(join(referenceSrcDir, file), 'utf-8');
    vm.runInContext(src, sandbox, { filename: file });
    console.log(`[load] ${file}`);
  }
  return sandbox;
}

function pick(obj, fields) {
  const out = {};
  for (const f of fields) if (f in obj) out[f] = obj[f];
  return out;
}

function buildSamples(s) {
  const samples = {};

  // ===== tools.js =====
  samples.tools = {
    year2Ayear: {
      '"2024"': s.year2Ayear('2024'),
      '"B1"':   s.year2Ayear('B1'),
      '"B100"': s.year2Ayear('B100'),
      '"-100"': s.year2Ayear('-100'),
      '"0"':    s.year2Ayear('0'),
      '"1"':    s.year2Ayear('1'),
    },
    Ayear2year: {
      '2024':  s.Ayear2year(2024),
      '1':     s.Ayear2year(1),
      '0':     s.Ayear2year(0),
      '-99':   s.Ayear2year(-99),
      '-4712': s.Ayear2year(-4712),
    },
    timeStr2hour: {
      '"00:00:00"': s.timeStr2hour('00:00:00'),
      '"12:00:00"': s.timeStr2hour('12:00:00'),
      '"12:34:56"': s.timeStr2hour('12:34:56'),
      '"00:30:00"': s.timeStr2hour('00:30:00'),
      '"235959"':   s.timeStr2hour('235959'),
      '"6:30"':     s.timeStr2hour('6:30'),
    },
  };

  // ===== eph0.js: 儒略日 =====
  samples.julianDay = {
    'JD.JD(2000,1,1.5)':  s.JD.JD(2000, 1, 1.5),
    'JD.JD(2024,1,1.0)':  s.JD.JD(2024, 1, 1.0),
    'JD.JD(1582,10,15)':  s.JD.JD(1582, 10, 15),
    'JD.JD(1582,10,4)':   s.JD.JD(1582, 10, 4),
    'JD.JD(-4712,1,1.5)': s.JD.JD(-4712, 1, 1.5),
    'JD.DD(2451545)':     pick(s.JD.DD(2451545), ['Y', 'M', 'D', 'h', 'm', 's']),
    'JD.DD(2460311.5)':   pick(s.JD.DD(2460311.5), ['Y', 'M', 'D', 'h', 'm', 's']),
  };

  // ===== eph0.js: 時差 dt_T =====
  samples.deltaT = {
    'dt_T(0)':       s.dt_T(0),
    'dt_T(8766)':    s.dt_T(8766),     // 約 2024 年初
    'dt_T(-365250)': s.dt_T(-365250),  // 約公元前 1000 年
    'dt_T(365250)':  s.dt_T(365250),   // 約公元 3000 年
  };

  // ===== eph.js: SZJ 日月升中降（北京 2024-01-01）=====
  // 北京 經 116.4°E, 緯 39.9°N
  s.SZJ.L  = (116.4 / 180) * Math.PI;
  s.SZJ.fa = (39.9 / 180) * Math.PI;
  const jdRel = s.JD.JD(2024, 1, 1.5) - 2451545; // J2000 起算
  try {
    const sunR  = s.SZJ.St(jdRel);
    const moonR = s.SZJ.Mt(jdRel);
    samples.riseSet = {
      'SZJ.St(北京,2024-01-01)': pick(sunR, ['s', 'j', 'z', 'x', 'c', 'h', 'c2', 'h2', 'c3', 'h3']),
      'SZJ.Mt(北京,2024-01-01)': pick(moonR, ['s', 'j', 'z', 'x']),
    };
  } catch (err) {
    samples.riseSet = { error: String(err) };
  }

  // ===== lunar.js: yueLiCalc 月對象 =====
  try {
    const L = new s.Lunar();
    L.yueLiCalc(2024, 2);
    const dayKeys = [
      'd', 'di', 'week', 'Ldi', 'Ldc', 'Lmc', 'Lleap',
      'Lyear', 'Lyear2', 'Lmonth', 'Lmonth2', 'Lday2', 'XiZ',
      'Hyear', 'Hmonth', 'Hday',
      'yxmc', 'yxsj', 'jqmc', 'jqsj',
      'A', 'B', 'C', // 節日資訊（若 oba.getDayName 已執行）
    ];
    const days = [];
    for (let i = 0; i < L.dn; i++) days.push(pick(L.lun[i], dayKeys));
    samples.lunar = {
      'Lunar.yueLiCalc(2024,2)': {
        y: L.y, m: L.m, dn: L.dn, w0: L.w0, Ly: L.Ly, ShX: L.ShX,
        days,
      },
    };
  } catch (err) {
    samples.lunar = { error: String(err) };
  }

  return samples;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const s = await loadSxwnl();
  const samples = buildSamples(s);
  const payload = {
    source: '../sxwnl/src (5.10.3)',
    generatedAt: new Date().toISOString(),
    notes: '新模組對相同輸入須產出與此完全一致的數值結果（bit-exact）。',
    samples,
  };
  const json = JSON.stringify(payload, null, 2);
  await writeFile(outPath, json, 'utf-8');
  console.log(`[ok]   ${outPath} (${(json.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('[fail]', err);
  process.exit(1);
});
