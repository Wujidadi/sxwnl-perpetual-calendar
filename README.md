# 萬年曆（Perpetual Calendar）

純前端 JavaScript 萬年曆。支援公曆／農曆／回曆換算、日月升降、二十四節氣、行星與恆星星曆、日月食預報等。

## 特色

- 純前端，無框架（不導入 React／Vue／TypeScript）。
- ES Modules 模組化架構，零執行期依賴。
- 響應式單頁 UI。
- 支援繁體中文（臺灣）與簡體中文切換。

## 目錄結構

```
src/                  原始碼（ES Modules）
tests/                回歸測試
docs/                 設計、架構與參考文件
scripts/              開發輔助腳本
index.html            應用入口
```

## 開發

需要 Node 20+。

```bash
npm run dev      # 啟動 dev server（靜態服務）
npm run docify   # 產生參考文件至 docs/original/
npm run golden   # 產生回歸用黃金樣本
npm test         # 執行回歸測試
npm run build    # 生產版打包
```

## 文件

設計理念、模組架構、識別字對映、演算法說明與相關參考來源請見 [`docs/`](./docs/)。

## 致謝

核心演算法來自壽星萬年曆作者許劍偉。
