# 原始 sxwnl 5.10.3 程式碼參考

本資料夾為改寫對照用的原版程式碼，附原作者中文註解。由 `scripts/docify-legacy.mjs` 自原 sxwnl 倉庫（`../sxwnl/src`）自動產生，請勿手動編輯。

## 檔案清單（依載入順序）

| #   | 檔案                         | 說明                                                                         | 大小     |
| --- | ---------------------------- | ---------------------------------------------------------------------------- | -------- |
| 1   | [`tools.js`](./tools.md)     | 紀年轉換、時間解析、`storageL`（localStorage + cookie 後援）、`addOp`。      | 2.8 KB   |
| 2   | [`eph0.js`](./eph0.md)       | 常數、儒略日 `JD`、章動／歲差／視差／折射、VSOP87 與月球週期項計算。         | 271.4 KB |
| 3   | [`ephB.js`](./ephB.md)       | 太陽系質心（SSB）位置與速度數值表，供恆星章動／光行差計算。                  | 21.1 KB  |
| 4   | [`eph.js`](./eph.md)         | 日月升中降 `SZJ`、行星天象、日月食 `msc`／`ysPL`／`rsGS`／`rsPL`／`ecFast`。 | 60.5 KB  |
| 5   | [`JW.js`](./JW.md)           | 城市經緯度壓縮資料 `JWv`、皇帝與年號紀年表。                                 | 56.6 KB  |
| 6   | [`lunar.js`](./lunar.md)     | 實朔實氣 `SSQ`、`Lunar()` 月物件、年曆 HTML 產生器。                         | 65.6 KB  |
| 7   | [`vml.js`](./vml.md)         | canvas 繪圖工具 `ht_*` 與三組視圖 `tu1`／`tu2`／`tu3`。                      | 10.3 KB  |
| 8   | [`help.js`](./help.md)       | 浮動說明的 HTML 字串。                                                       | 6.3 KB   |
| 9   | [`page_gj.js`](./page_gj.md) | 工具頁面的計算與輸入處理（`GJ1_*`／`GJ2_*`）。                               | 6.4 KB   |

## 載入順序

原版 `src/index.htm` 依上表順序以 `<script src>` 載入；後者可直接使用前者的全域符號。所有 `.js` 共享同一個全域作用域，沒有模組邊界。

## 重新產生

```bash
npm run docify
```
