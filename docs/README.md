# 改寫期間參考文件

本資料夾收錄改寫期間需要查閱的設計與對照文件，全部為 Markdown 格式，可直接以 VS Code、Typora 或 GitHub 預覽。

## 內容

| 檔案                                   | 用途                                                           |
| -------------------------------------- | -------------------------------------------------------------- |
| [architecture.md](./architecture.md)   | 新版模組架構說明                                               |
| [glossary.md](./glossary.md)           | 拼音／中文縮寫 → 英文 識別字對映表（分批累積）                 |
| [i18n.md](./i18n.md)                   | 語系切換設計                                                   |
| [build.md](./build.md)                 | 開發與打包流程                                                 |
| [original/](./original/)               | 原 sxwnl 5.10.3 程式碼文件化副本（自 `../sxwnl/src` 自動產生） |
| [algorithm-notes/](./algorithm-notes/) | 各演算法主題的筆記                                             |

## 重新產生原始碼文件

```bash
npm run docify
```

讀取 `../sxwnl/src/*.js`，輸出到 `docs/original/`。
