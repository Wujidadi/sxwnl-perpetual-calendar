# 模組架構

## 設計原則

- **核心演算法保留**：`sxwnl 5.10.3` 中 `eph0.js`、`eph.js`、`lunar.js` 內的演算法本體（算式、係數、流程、資料表）一字不動，僅將全域 `var` 改寫為 ES Module 的 `export`／`import`，並依語意分檔。
- **命名英文化**：原拼音／中文縮寫識別字依 [glossary.md](./glossary.md) 對映為英文／英文縮寫。函式內部的短局部變數（`t`、`jd`、`L`、`fa` 等）沿用，因對應天文文獻記法。
- **零執行期依賴**：應用程式不引入任何 runtime 套件。`esbuild` 僅做生產打包。
- **單入口 RWD**：取代原 `index.htm`／`indexmp.htm` 雙頁，以 CSS 媒體查詢處理 PC／行動裝置。

## 目錄草案（將於 Phase 1 起逐步建立）

```
src/
├── main.js                     入口模組
├── astro/                      ←── 拆自 eph0.js / ephB.js / eph.js
│   ├── constants.js            常數（半徑、AU、J2000 等）
│   ├── math-utils.js           三角別名、rad2str/str2rad
│   ├── julian-day.js           JD 換算、deltaT
│   ├── nutation.js             章動／歲差
│   ├── refraction.js           視差／大氣折射
│   ├── vsop87.js               VSOP87 行星週期項
│   ├── moon.js                 ELP 月球週期項
│   ├── ssb.js                  太陽系質心（ephB）
│   ├── coord.js                月／地／行星座標轉換
│   ├── rise-set.js             SZJ → RiseTransitSet
│   ├── eclipse.js              msc/ysPL/rsGS/rsPL/ecFast
│   ├── planet.js               行星天象、合衝、留、大距
│   └── index.js
├── lunar/                      ←── 拆自 lunar.js
│   ├── ssq.js                  實朔實氣（古曆資料 + 演算法）
│   ├── gregorian.js            公曆基礎（原 oba）
│   ├── chinese.js              農曆基礎（原 obb）
│   ├── lunar.js                Lunar() → LunarDay
│   ├── year-calendar.js        nianLiHTML / nianLi2HTML
│   └── index.js
├── data/                       大型資料表
│   ├── cities.js               城市經緯（原 JWv）
│   └── reign-titles.js         皇帝／年號
├── i18n/                       多語系字典
│   ├── locales/zh-CN.js
│   ├── locales/zh-TW.js
│   ├── translations.js
│   └── index.js
├── ui/                         介面元件
│   ├── layout/
│   ├── pages/                  13 個分頁（月曆、年曆、日食…）
│   ├── canvas/                 日月食繪圖（原 vml.js）
│   ├── controls/               共用輸入元件
│   └── help.js
├── utils/                      通用工具
│   ├── year-conv.js
│   ├── time.js
│   └── storage.js
└── styles/                     CSS
```

## 改寫順序

| 階段 | 範圍                                          |
| ---- | --------------------------------------------- |
| 0    | 基礎骨架、`docs/original/` 自動產生、黃金樣本 |
| 0.5  | 對映表分批審閱（B1–B11）                      |
| 1    | `astro/*` — 天文核心模組化                    |
| 2    | `lunar/*`、`data/*`、`utils/*` — 農曆與資料   |
| 3    | `ui/*` — RWD 響應式單頁 + 13 個分頁           |
| 4    | `i18n/*` — 字典式繁簡切換                     |
| 5    | 效能優化、`esbuild` 打包                      |
| 6    | 收尾、文件補完                                |

## 回歸測試策略

- `tests/fixtures/golden.json`：自 `../sxwnl/src/*.js` 載入後對固定輸入產出的固定輸出。
- 每個改寫階段完成後，以新版模組對同樣輸入求值，要求與 golden 完全相符（bit-exact）。
- 換名不影響數值結果，故此門檻全程適用。
