# ent-clinic-pro Roadmap

**Status**: 🟠 Stalled (停滯 9 個月，分支分裂)
**Last updated**: 2026-04-27
**Last activity**: 2025-08-07 (origin/master)

## ⚠️ Decision needed
**現況**：main 分支僅有 LICENSE 初始 commit，origin/master 有 36 個活躍 commits（耳鼻喉科計算機、衛教文章管理）。停滯 9 個月。

**選項**：
1. 🟢 重啟維護 — 將 master 合併到 main、定期更新計算機與內容
2. 🔴 歸檔 — 工具已整合到 allheart 或 entwebpage，不再維護
3. 🟡 範圍縮減 — 保留特定計算機，遷移到其他 repo

## 🗂️ Last work in progress (origin/master)
- 移除頂部導航流程圖/決策樹按鈕
- 修復計算器重複標題
- 優化藥物顆數卡片設計
- Amoxicillin-Clavulanate 計算邏輯改進

## ✅ Historic milestones (origin/master)
- [x] 完成所有計算機的 Playwright 測試驗證
- [x] 重構 Amoxicillin/Clavulanate 劑量計算機
- [x] 清理計算機組件，優化模組化結構
- [x] 修復 Vite 動態導入警告
- [x] 完全移除所有彈出式視窗，提升用戶體驗
- [x] 建立完整的 Calculator Development SOP 文件
- [x] 統一計算機架構（BMI、CHA₂DS₂-VASc、eGFR）

## ⚠️ Known concerns
- 分支嚴重不同步（main vs master）
- 9 個月無維護
- 與 allheart / entwebpage 功能可能重疊（劑量計算、衛教）
