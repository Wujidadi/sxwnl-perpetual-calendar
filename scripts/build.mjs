// 生產打包：esbuild 將 src/main.js 打包為 dist/app.js（含 splitting／minify／sourcemap），
// 把 main.css 複製到 dist/app.css，並改寫 index.html 中的相對路徑。

import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT    = process.cwd();
const OUT_DIR = path.join(ROOT, 'dist');
const META    = process.argv.includes('--meta');
const WATCH   = process.argv.includes('--watch');

async function clean() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
}

async function buildJS() {
  const opts = {
    entryPoints: ['src/main.js'],
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: OUT_DIR,
    entryNames: 'app',
    chunkNames: 'chunks/[name]-[hash]',
    minify: true,
    sourcemap: true,
    metafile: true,
    target: ['es2020'],
    logLevel: 'info',
  };
  if (WATCH) {
    const ctx = await esbuild.context(opts);
    await ctx.watch();
    console.log('watching for changes...');
    return null;
  }
  return await esbuild.build(opts);
}

async function copyCSS() {
  await fs.copyFile(path.join(ROOT, 'src/styles/main.css'), path.join(OUT_DIR, 'app.css'));
}

async function copyFavicon() {
  await fs.copyFile(path.join(ROOT, 'favicon.svg'), path.join(OUT_DIR, 'favicon.svg'));
}

async function emitHTML() {
  const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  const out = html
    .replace('./src/styles/main.css', './app.css')
    .replace('./src/main.js', './app.js');
  await fs.writeFile(path.join(OUT_DIR, 'index.html'), out);
}

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

async function emitReport(result) {
  if (!result || !result.metafile) return;
  const outputs = result.metafile.outputs;
  await fs.writeFile(path.join(OUT_DIR, 'metafile.json'), JSON.stringify(result.metafile, null, 2));

  const rows = Object.entries(outputs)
    .filter(([name]) => !name.endsWith('.map'))
    .map(([name, info]) => ({ name, bytes: info.bytes }))
    .sort((a, b) => b.bytes - a.bytes);

  const total = rows.reduce((s, r) => s + r.bytes, 0);
  console.log('\nBundle size:');
  for (const r of rows) {
    const rel = path.relative(ROOT, path.join(ROOT, r.name));
    console.log('  ' + formatBytes(r.bytes).padStart(9) + '  ' + rel);
  }
  console.log('  ' + '─'.repeat(50));
  console.log('  ' + formatBytes(total).padStart(9) + '  total');

  if (META) {
    // 依輸出 chunk 列出最大的輸入模組來源
    console.log('\nTop input modules per output chunk:');
    for (const [outName, info] of Object.entries(outputs)) {
      if (outName.endsWith('.map')) continue;
      const inputs = Object.entries(info.inputs || {})
        .map(([name, v]) => ({ name, bytes: v.bytesInOutput }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 5);
      if (!inputs.length) continue;
      console.log('  → ' + outName);
      for (const i of inputs) {
        console.log('       ' + formatBytes(i.bytes).padStart(8) + '  ' + i.name);
      }
    }
  }
}

await clean();
const result = await buildJS();
await copyCSS();
await copyFavicon();
await emitHTML();
await emitReport(result);
console.log('\nBuild complete: ' + path.relative(ROOT, OUT_DIR) + '/');
