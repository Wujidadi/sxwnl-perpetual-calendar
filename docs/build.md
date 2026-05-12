# 開發與打包流程

Node 20+。執行期無 runtime 依賴；`esbuild` 僅打包時使用。

## 開發

```bash
npm run dev          # 以 npx serve . 起靜態伺服器
```

開啟瀏覽器至顯示的位址（通常 `http://localhost:3000`）。ES Modules 不支援 `file://`，務必透過 HTTP。

## 生產打包

```bash
npm run build        # 一次性打包到 dist/
npm run build:watch  # 監看 src/ 變動，自動重打包
npm run build:meta   # 一次打包並輸出 chunk 內最大輸入模組摘要
npm run preview      # 以 npx serve dist 預覽打包結果
```

### 產物結構

```
dist/
├── index.html                     # script／css 路徑改寫為 dist 內相對
├── app.css                        # 由 src/styles/main.css 複製
├── app.js                         # 主 bundle（minified + sourcemap）
├── app.js.map
├── chunks/
│   └── zh-TW-cities-XXXXXXXX.js   # 動態 import 切出的 chunk
└── metafile.json                  # esbuild metafile（chunk 與輸入分析）
```

### 大小（v0.1）

```
544 KB  dist/app.js               主 bundle（minified）
135 KB  dist/chunks/zh-TW-cities  zh-TW 大宗地名（lazy）
─────────
679 KB  total
```

zh-TW-cities chunk 僅在使用者切換為繁體中文時透過 dynamic import 載入；初次以簡體中文進入時不下載。

### 主 bundle 較大的輸入（`npm run build:meta` 可見）

| 模組                        | 約略大小 |
| --------------------------- | -------- |
| `src/astro/vsop87.js`       | 143 KB   |
| `src/data/cities.js`        | 79 KB    |
| `src/i18n/locales/zh-TW.js` | 53 KB    |
| `src/lunar/chinese-base.js` | 40 KB    |
| `src/astro/elp-moon.js`     | 36 KB    |

`vsop87`／`elp-moon` 是行星與月球週期項係數，無法精簡；`cities.js` 為原始壓縮編碼，後續若需可考慮再拆 chunk。

## 開發輔助腳本

```bash
npm run docify   # 自 ../sxwnl/src/ 產生 docs/original/*.md
npm run golden   # 自 ../sxwnl/src/ 產生 tests/fixtures/golden.json
npm test         # 跑回歸測試（Node 內建 test runner）
```

`docify`／`golden` 預期 `../sxwnl/` 為原 sxwnl 5.10.3 的本機 clone。
