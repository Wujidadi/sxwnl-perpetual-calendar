# 萬年曆（Perpetual Calendar）

壽星天文曆 [sxwnl](https://github.com/sxwnl/sxwnl) 5.10.3 的現代化改寫版。

## 目標

- 保留原作的天文與曆法核心演算法（VSOP87 行星週期項、ELP 月球週期項、實朔實氣 SSQ、日月食等）。
- 翻新架構：ES Modules、目錄分層、無全域汙染。
- 支援繁體中文（臺灣）與簡體中文切換。
- 純前端、無框架（不導入 React／Vue／TypeScript）。
- 響應式單頁 UI（取代原 PC／行動版雙頁）。

> 核心演算法不在本次改寫範圍。涉及天文公式或古曆朔閏資料的優化需另案處理。

## 目錄結構

```
src/                  新版原始碼（ES Modules）
tests/                回歸測試（黃金樣本對照）
docs/                 改寫期間參考文件（Markdown）
docs/original/        原 sxwnl 5.10.3 程式碼文件化副本
scripts/              開發輔助腳本（docify、golden、build）
index.html            應用入口（開發直接以瀏覽器開啟）
```

## 開發

需要 Node 20+。

```bash
# 啟動 dev server（靜態服務，原生 ES Modules）
npm run dev

# 由原 sxwnl 倉庫產生原始碼文件
npm run docify

# 由原 sxwnl 倉庫產生回歸用黃金樣本
npm run golden

# 執行回歸測試
npm test

# 生產版打包（單檔內聯 JS／CSS）
npm run build
```

`npm run docify` 與 `npm run golden` 假設原 sxwnl 倉庫位於 `../sxwnl/`。

## 授權

承襲原作 sxwnl。核心演算法與資料的智慧財產屬原作者許劍偉。
