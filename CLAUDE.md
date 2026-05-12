# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案性質

這是 **sxwnl 5.10.3（壽星萬年曆）** 的現代化改寫版：把原版的 vanilla JS／全域 `var`／單檔 `.htm`／簡體中文寫死字串，重整為 ES Modules + 字典式 i18n + 單入口 RWD。

**設計鐵則**：核心天文／曆法演算法（VSOP87 行星週期項、ELP 月球週期項、IAU2000B 章動、貝塞爾元素日食、SSQ 古曆表）的算式、係數、流程**一字不動**；只改外層識別字（拼音／中縮 → 英文）並依語意分檔。函式內部短局部變數（`t`、`t2`、`jd`、`L`、`fa`、`dt`、`i`、`g`）刻意沿用，因對應天文文獻記法。

不要為了「讓 code 看起來更現代」改動數值流程或變數名 — bit-exact 回歸測試會抓出來。

## 常用指令

```bash
npm install            # 只裝 esbuild（唯一 devDep）
npm run dev            # npx serve . 開發伺服器（ES Modules 需 HTTP）
npm test               # 跑 10 個 golden 回歸測試（Node 內建 test runner）
node --test tests/lunar.test.js   # 跑單一 test 檔
npm run build          # 打包到 dist/（minify + sourcemap + chunk splitting）
npm run build:meta     # 打包 + 列出 chunk 內最大輸入模組
npm run preview        # npx serve dist 預覽打包結果
npm run golden         # 重新自 ../sxwnl/src/*.js 產 tests/fixtures/golden.json
npm run docify         # 自 ../sxwnl/src/ 產 docs/original/*.md
```

`golden` 與 `docify` 預期 `../sxwnl/` 為原版 5.10.3 的本機 clone。

## 架構

完整細節在 `docs/architecture.md`、`docs/glossary.md`、`docs/i18n.md`、`docs/build.md`。以下是 high-level：

### 層次

```
src/
├── astro/      VSOP87、ELP、章動、視差、日食貝塞爾元素、行星天象、升降
├── lunar/      實朔實氣（古曆 SSQ 表）、農／公曆基礎、八字、節日、年曆
├── data/       壓縮資料表（cities 壓縮編碼、timezones、stars、reign-titles、coastlines）
├── i18n/       公開 t/tFestival/tCity/tTimezone/tStar/setLocale/onLocaleChange
├── ui/         13 分頁（pages/）+ canvas/ + components/（city-picker）+ app.js
├── utils/      persistentStorage、time、year-conv、saveFormState/loadFormState
├── styles/     CSS（含深色模式 `[data-theme="dark"]` 覆寫）
└── main.js     入口
```

依賴方向 **astro → lunar → data → i18n → ui**；不應出現反向 import。

### 識別字命名

原版命名遵循拼音／中縮（`HS`、`ZQ`、`SSQ`、`xingHR`、`rsGS`）；新版改名規則與每批審稿結論記錄在 **`docs/glossary.md`**（B1–B11 批次）。如要新增 / 改名，先讀該檔。常數採 `SCREAMING_SNAKE_CASE`、函式 `camelCase`、類別／物件 `PascalCase`。

### Bit-exact 回歸測試

`tests/fixtures/golden.json` 由 `scripts/generate-golden.mjs` 對固定輸入跑原版產出。`tests/*.test.js` 用同樣輸入跑新版，要求數值與字串完全相符。改 algorithm 流程或字串輸出時要思考：

- **金測會破嗎？** 預設語系是 zh-CN，且 zh-CN 字典值與原版字串等價，故 i18n 抽出不影響金測。
- 若新增 golden 樣本：改 `generate-golden.mjs` 後跑 `npm run golden` 重產，並一併 commit。

### i18n 設計重點

- **不採自動簡繁字符轉換**（會踩「干／乾／幹」「皇后／皇後」「之后／之後」等坑；兩岸術語差異如「悉尼／雪梨」「老挝／寮國」也需條目級對照）。
- 兩個 locale：`zh-CN`（原版 baseline）、`zh-TW`（臺灣慣用詞）。未列入字典的條目 fallback 為 zh-CN 字串。
- 大宗 `zh-TW-cities.js`（3000+ 地名）走 `dynamic import`，esbuild splitting 切為獨立 chunk，初次以 zh-CN 進入時不下載。
- 分頁切換語系後重渲染：每個 page class 的 `mount()` 自管 DOM，`app.js` 監聽 `onLocaleChange` 後對當前分頁重新 `navigate()`。

### UX 行為（已 wire）

- 表單欄位記憶：每頁透過 `saveFormState(pageId, fields)` / `loadFormState(pageId)` 存取，namespace 為 `pc.formState.<pageId>`。
- 鍵盤導覽：`app.js` 全域 `←／→` 切換分頁，避開 input/textarea/select/contentEditable。
- 深色主題：`<html data-theme="...">`，初始依 `prefers-color-scheme`，使用者覆寫存 `pc.theme`。
- 語系切換：header 右上下拉，使用者覆寫存 `perpetual-calendar.locale`。
- 起始頁與 hash routing：`pc.activePageId` + `window.location.hash`。

## 慣例

- **不要新增 README／markdown 摘要檔**，除非使用者明說要。
- **不要在程式碼或文件中提「Phase 1/3/4」「B6/B9」等開發階段／批次術語** — 事過境遷會混淆。改寫流程紀錄留在 `docs/architecture.md`／`glossary.md`。
- **不要寫「原版／搬遷自原 sxwnl 5.10.3／移植」字眼** — README、致謝段已有說明，程式碼註解不需重複。
- commit message 採 Conventional Commits（`feat:` `fix:` `docs:` `chore:` ...），標題用繁體中文敘述。
- 大型異動先擬 commit message 給使用者審，再動手 commit（使用者通常會說「請先擬定…再 commit」）。
- 不要對 docs 內以「TODO／FIXME」標記殘留問題 — 已釐清的就寫結論，未釐清的寫「待釐清」。

## 不變式

- `package.json` 的 `"type": "module"`；所有檔案是 ES Modules。
- `eclipse` 物件命名歷史誤標已修正：`solarEclipseBesselian`（rsGS 引擎，有 `init`／`feature`）、`solarEclipseLocal`（rsPL，有 `secMax`／`nbj`）、`lunarEclipse`（含原 `ysPL` 併入的 `lineT/lecXY/lecMax`）。若看到舊名（如 `solarEclipseBatch`）一律改正。
- 演算法路徑（astro/lunar）禁止打入 UI 概念（DOM、`document.*`）。
