# 開發與打包流程

## 開發

需要 Node 20+，因為 dev server 僅需靜態檔案服務，並無執行期依賴。

```bash
npm run dev      # 預設以 npx serve 起靜態伺服器
```

打開瀏覽器至顯示的位址（通常 `http://localhost:3000`）即可。

> ES Modules 不支援 `file://` 協定載入；務必透過 HTTP server。

## 生產打包

```bash
npm run build
```

由 `scripts/build.mjs` 呼叫 `esbuild`，將整個 `src/` 合併為單一 `dist/app.js`，並把 CSS／JS 內聯至 `dist/index.html`，最終產出靜態單檔可直接部署。

> 具體 esbuild 設定於 Phase 5 完成。

## 開發輔助腳本

```bash
npm run docify   # 自原 sxwnl 倉庫產生 docs/original/*.md
npm run golden   # 自原 sxwnl 倉庫產生 tests/fixtures/golden.json
npm test         # 執行回歸測試（Node 內建 test runner）
```

兩個 docify／golden 腳本預期 `../sxwnl/` 為原 sxwnl 倉庫的本機 clone。
