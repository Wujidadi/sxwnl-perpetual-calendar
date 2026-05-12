# Copilot Instructions

## 專案概觀

這個專案是壽星萬年曆的現代化前端改寫版：維持核心天文／曆法演算法的數值流程不變，把舊版單檔腳本整理為 ES Modules、字典式 i18n、單入口響應式介面。

- 純前端、無框架、無 TypeScript、無執行期依賴；`esbuild` 只用於打包。
- `package.json` 設為 `"type": "module"`，所有程式碼都使用 ES Modules。
- Node 需求為 20+。

## 建置與測試指令

```bash
npm install
npm run dev
npm test
node --test tests/lunar.test.js
npm run build
npm run build:watch
npm run build:meta
npm run preview
```

如果需要更新文件化原始碼或 golden 樣本，另有：

```bash
npm run docify
npm run golden
```

`docify` 與 `golden` 都預期 `../sxwnl/` 存在原始版本的本機 clone。

## 高階架構

主要依賴方向固定為：

```text
astro → lunar → data → i18n → ui
```

不要引入反向 import，尤其不要讓 `astro/` 或 `lunar/` 依賴 UI 或 DOM。

- `src/main.js` 只負責建立 `App` 並掛到 `#app`。
- `src/ui/app.js` 是單頁應用外殼：處理標頭、分頁導覽、hash routing、主題切換、語系切換、目前頁面切換。
- `src/ui/pages.js` 是 13 個分頁的註冊表。每個分頁都要提供 `create()`，回傳具備 `{ mount(container), unmount() }` 的元件物件。
- `src/astro/*` 與 `src/lunar/*` 是核心計算層；回歸測試以 `tests/fixtures/golden.json` 驗證其輸出必須 bit-exact。
- `src/i18n/index.js` 提供 `t`、`tFestival`、`tCity`、`tTimezone`、`tStar`、`setLocale`、`onLocaleChange` 等 API；切換語系時目前分頁會重新 `navigate()` 以完整重繪。
- `src/i18n/locales/zh-TW-cities.js` 走 dynamic import；`zh-TW` 大量地名不在初始主 bundle 內。
- `src/utils/storage.js` 封裝持久化邏輯，頁面表單狀態透過 `saveFormState(pageId, fields)` / `loadFormState(pageId)` 儲存於 `pc.formState.<pageId>`。
- `scripts/build.mjs` 會打包 `src/main.js`、複製 `src/styles/main.css` 為 `dist/app.css`，並改寫 `index.html` 指向 `dist` 產物。

需要更完整脈絡時，優先看：

- `docs/architecture.md`
- `docs/glossary.md`
- `docs/i18n.md`
- `docs/build.md`

## 關鍵慣例

- **不要改動核心演算法的算式、係數、流程。** `astro/`、`lunar/` 內許多短局部變數（如 `t`、`jd`、`L`、`fa`）是刻意保留的文獻記法，不要為了風格統一而重寫。
- 任何會影響演算法輸出、既有字串輸出、或 golden 樣本的變更，都要先確認是否真的有意變更 bit-exact 結果。
- 新增或調整英文識別字前，先查 `docs/glossary.md` 的既有命名對映，不要自行發明另一套翻譯規則。
- zh-CN 是基準語系，zh-TW 走條目式字典覆蓋；**不要使用自動簡繁轉換** 取代現有字典。
- UI 頁面切換、主題、語系與表單記憶都有既定 storage key 與 wire 方式，改動時要維持現有行為：`pc.activePageId`、`pc.theme`、`perpetual-calendar.locale`、`pc.formState.<pageId>`。
- 日月食命名已定案：使用 `solarEclipseBesselian`、`solarEclipseLocal`、`lunarEclipse`，不要再引入舊名稱如 `solarEclipseBatch`。
- 不要在程式碼或文件中加入階段／批次術語，也不要額外新增變更摘要型 markdown 檔案，除非需求明確要求。
- 若需要提交 commit，沿用既有規範：commit message 使用繁體中文（台灣）與 Conventional Commits；較大的變更可在標題後補充條列摘要。
