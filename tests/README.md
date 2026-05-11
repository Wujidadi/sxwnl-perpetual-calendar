# 回歸測試

以 Node 原生 test runner 執行（`npm test`）。

## 黃金樣本

`tests/fixtures/golden.json` 由 `scripts/generate-golden.mjs` 自原 sxwnl 5.10.3 載入並計算固定輸入產生。改寫後的新版模組以同樣輸入求值，要求 bit-exact。

重新產生：

```bash
npm run golden
```

> 第一次 commit 時 `golden.json` 一同提交，後續若黃金樣本擴充再重新生成。
