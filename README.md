# 萬年曆（Perpetual Calendar）

純前端 JavaScript 萬年曆。涵蓋西曆／農曆／回曆換算、二十四節氣、日月升降、行星與恆星星曆、日月食預報、八字命理等天文與曆法功能。

## 特色

- 純前端，無框架（不導入 React／Vue／TypeScript）。
- ES Modules 模組化架構，零執行期依賴；`esbuild` 僅用於打包。
- 響應式單頁 UI；可離線部署（靜態檔）。
- 繁／簡中文字典式切換，臺灣慣用詞已逐條繫譯（約 4000+ 條地名／節日／天文名）。
- 深色／淺色主題切換，依 `prefers-color-scheme` 初始。
- 鍵盤導覽（←／→ 切換分頁）、表單值記憶（每頁獨立）。

## 功能分頁

| 分頁     | 內容                                                                 |
| -------- | -------------------------------------------------------------------- |
| 月曆     | 三合曆（西／農／回）月格；節氣、月相、節日；可切換上下月／上下年     |
| 年曆     | 列出指定年度所有合朔／節氣精確時刻；含日干支版本                     |
| 日月食   | 列出指定年度所有日食／月食事件；可展開單次月食食程時間軸             |
| 地方食   | 給定站點計算站心日食（含初虧／食既／食甚／生光／復圓 + 放大圖）      |
| 日食概略 | 全球視角的最大食地標、五個關鍵點與食帶寬度；含世界地圖背景           |
| 朔氣     | 24 節氣 + 所有合朔（含閏月）精確時刻                                 |
| 升降     | 日月升中天降時刻表（含民用晨昏與晝長），多日表格                     |
| 八字     | 給定時刻與經度計算四柱八字（含當日 12 時辰干支）                     |
| 星曆     | 計算太陽、月亮、行星的視位置、距離、方位高度                         |
| 天象     | 月亮近遠點／升降交點、地球近遠日點、水金大距、行星合月／合日／衝／留 |
| 恆星     | 88 星座與恆星庫關鍵字檢索（視位置／站心位置／平位置三模式）          |
| 常數     | 物理與天文常數一覽                                                   |
| 工具     | 儒略日與西曆換算、年內積日、兩日期相減、π 值精算示範                 |

## 開發

需要 Node 20+。

```bash
npm install            # 安裝 devDependencies（僅 esbuild）

npm run dev            # 開發伺服器（靜態服務）
npm test               # 跑回歸測試（10 個 golden 樣本）
npm run build          # 打包到 dist/（minify + sourcemap + chunk splitting）
npm run build:watch    # 監看 src/ 自動重打包
npm run build:meta     # 打包並輸出 chunk 內最大輸入模組摘要
npm run preview        # 以 npx serve dist 預覽打包結果

npm run docify         # 自 ../sxwnl/src/ 產出 docs/original/*.md
npm run golden         # 自 ../sxwnl/src/ 產出 tests/fixtures/golden.json
```

## 目錄結構

```
src/
├── astro/         天文計算（VSOP87、ELP、章動、視差、日食貝塞爾元素 等）
├── lunar/         農曆基礎、實朔實氣、年曆、八字、節日表
├── data/          壓縮資料表（城市、時區、年號、恆星、世界海岸線）
├── i18n/          字典式繁簡切換（API + zh-CN／zh-TW 字典）
├── ui/            介面元件（13 分頁、canvas、common components）
├── utils/         通用工具（時間、年號、持久化）
├── styles/        CSS
└── main.js        應用入口

tests/             回歸測試（Node 內建 test runner）
docs/              設計、架構、識別字對映、i18n 設計、build 說明
scripts/           開發輔助腳本（build、docify、generate-golden）
```

## 文件

| 文件                                             | 內容                              |
| ------------------------------------------------ | --------------------------------- |
| [`docs/architecture.md`](./docs/architecture.md) | 模組架構與設計原則                |
| [`docs/glossary.md`](./docs/glossary.md)         | 拼音／中文縮寫 → 英文識別字對映表 |
| [`docs/i18n.md`](./docs/i18n.md)                 | 繁簡切換 API、字典結構、wire 位置 |
| [`docs/build.md`](./docs/build.md)               | 開發、打包、輸出大小說明          |
| [`docs/original/`](./docs/original/)             | 原 sxwnl 5.10.3 程式碼文件化副本  |

## 致謝

核心演算法來自壽星萬年曆作者許劍偉。
