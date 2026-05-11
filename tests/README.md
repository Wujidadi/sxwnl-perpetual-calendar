# 回歸測試

以 Node 原生 test runner 執行（`npm test`）。

## 黃金樣本

`tests/fixtures/golden.json` 由 `scripts/generate-golden.mjs` 對固定輸入計算後產出，作為回歸基準。新模組以同樣輸入求值，要求 bit-exact。樣本來源與產生方式詳見 [`docs/`](../docs/)。

重新產生：

```bash
npm run golden
```

> 第一次 commit 時 `golden.json` 一同提交，後續若黃金樣本擴充再重新生成。
