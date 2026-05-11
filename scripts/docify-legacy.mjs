#!/usr/bin/env node
// 將參考來源（`../sxwnl/src/*.js`）轉為 docs/original/<name>.md，
// 附 frontmatter 與程式碼區塊；大於閾值的檔案以 <details> 摺疊。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const referenceSrcDir = join(projectRoot, '..', 'sxwnl', 'src');
const outDir = join(projectRoot, 'docs', 'original');

const REFERENCE_VERSION = '5.10.3';
const LARGE_FILE_THRESHOLD = 50 * 1024;

const FILES = [
  { name: 'tools.js',    title: '工具函式',           desc: '紀年轉換、時間解析、`storageL`（localStorage + cookie 後援）、`addOp`。' },
  { name: 'eph0.js',     title: '天文常數與基礎算法', desc: '常數、儒略日 `JD`、章動／歲差／視差／折射、VSOP87 與月球週期項計算。' },
  { name: 'ephB.js',     title: '太陽系質心資料',     desc: '太陽系質心（SSB）位置與速度數值表，供恆星章動／光行差計算。' },
  { name: 'eph.js',      title: '高階天文計算',       desc: '日月升中降 `SZJ`、行星天象、日月食 `msc`／`ysPL`／`rsGS`／`rsPL`／`ecFast`。' },
  { name: 'JW.js',       title: '城市與年號資料',     desc: '城市經緯度壓縮資料 `JWv`、皇帝與年號紀年表。' },
  { name: 'lunar.js',    title: '農曆核心',           desc: '實朔實氣 `SSQ`、`Lunar()` 月物件、年曆 HTML 產生器。' },
  { name: 'vml.js',      title: '日月食繪圖',         desc: 'canvas 繪圖工具 `ht_*` 與三組視圖 `tu1`／`tu2`／`tu3`。' },
  { name: 'help.js',     title: '頁面說明文字',       desc: '浮動說明的 HTML 字串。' },
  { name: 'page_gj.js',  title: '工具頁事件',         desc: '工具頁面的計算與輸入處理（`GJ1_*`／`GJ2_*`）。' },
];

function buildMarkdown(file, code, sizeKB, isLarge) {
  const lines = [
    '---',
    `source: sxwnl/${REFERENCE_VERSION}/src/${file.name}`,
    `title: ${file.title}`,
    `size: ${sizeKB} KB`,
    'generated_by: scripts/docify-legacy.mjs',
    '---',
    '',
    `# ${file.title}（\`${file.name}\`）`,
    '',
    file.desc,
    '',
    `> 來源：sxwnl ${REFERENCE_VERSION} \`src/${file.name}\`。檔案大小 ${sizeKB} KB。  `,
    '> 本文件由 `scripts/docify-legacy.mjs` 自動產生，請勿手動編輯——以原始 `.js` 為準。',
    '',
  ];
  if (isLarge) {
    lines.push('<details>', `<summary>展開原始程式碼（${sizeKB} KB）</summary>`, '', '```js', code.trimEnd(), '```', '', '</details>');
  } else {
    lines.push('```js', code.trimEnd(), '```');
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const summary = [];
  const indexLines = [
    `# sxwnl ${REFERENCE_VERSION} 程式碼參考`,
    '',
    '本資料夾為演算法參考來源的程式碼複本，附作者中文註解。由 `scripts/docify-legacy.mjs` 自 `../sxwnl/src` 自動產生，請勿手動編輯。',
    '',
    '## 檔案清單（依載入順序）',
    '',
    '| # | 檔案 | 說明 | 大小 |',
    '|---|---|---|---|',
  ];
  for (const [i, file] of FILES.entries()) {
    const srcPath = join(referenceSrcDir, file.name);
    let code;
    try {
      code = await readFile(srcPath, 'utf-8');
    } catch (err) {
      console.warn(`[skip] 找不到 ${srcPath}：${err.message}`);
      continue;
    }
    const bytes = Buffer.byteLength(code, 'utf-8');
    const sizeKB = (bytes / 1024).toFixed(1);
    const isLarge = bytes > LARGE_FILE_THRESHOLD;
    const md = buildMarkdown(file, code, sizeKB, isLarge);
    const outName = file.name.replace(/\.js$/, '.md');
    await writeFile(join(outDir, outName), md, 'utf-8');
    summary.push({ name: file.name, sizeKB, isLarge });
    indexLines.push(`| ${i + 1} | [\`${file.name}\`](./${outName}) | ${file.desc} | ${sizeKB} KB |`);
    console.log(`[ok]   ${outName} (${sizeKB} KB${isLarge ? ', 摺疊' : ''})`);
  }
  indexLines.push(
    '',
    '## 載入順序',
    '',
    'sxwnl 的 `src/index.htm` 依上表順序以 `<script src>` 載入；後者可直接使用前者的全域符號。所有 `.js` 共享同一個全域作用域，沒有模組邊界。',
    '',
    '## 重新產生',
    '',
    '```bash',
    'npm run docify',
    '```',
    '',
  );
  await writeFile(join(outDir, 'README.md'), indexLines.join('\n'), 'utf-8');
  console.log(`[ok]   README.md (${summary.length} 檔)`);
}

main().catch((err) => {
  console.error('[fail]', err);
  process.exit(1);
});
