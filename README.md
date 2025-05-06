# CubTEK 程式碼規範擴充套件

一個為 C/C++ 程式碼提供格式化和檢查功能的 Visual Studio Code 擴充套件，遵循 CubTEK 的編碼標準。

## 概述

CubTEK 程式碼規範擴充套件提供了一套工具，確保您的 C/C++ 程式碼符合 CubTEK 的編碼標準，特別適用於嵌入式系統開發。透過整合業界標準工具和自訂規則系統，這個擴充套件能夠自動化格式化和靜態分析流程。

## 主要功能

- **自動程式碼格式化**：使用 clang-format 根據 CubTEK 標準格式化 C/C++ 程式碼
- **靜態分析檢查**：結合 clang-tidy 和自訂規則，確保程式碼品質和安全性
- **即時診斷**：在您編寫程式碼時即時顯示違規標記
- **專案範圍分析**：能夠檢查整個專案的編碼標準合規性
- **合規報告**：為您的程式碼庫生成詳細的合規報告
- **快速修復建議**：自動提供常見問題的修正建議

### 命令

擴充套件提供了幾個可透過命令面板訪問的命令：

- `CubTEK: Check Current File` - 檢查目前開啟的檔案是否符合編碼標準
- `CubTEK: Check Entire Project` - 對整個專案執行合規檢查
- `CubTEK: Show Compliance Report` - 生成和顯示編碼標準合規報告

## 系統需求

- Visual Studio Code ^1.98.0
- clang-format（用於程式碼格式化）
- clang-tidy（用於靜態分析）
- 工作區中的 C/C++ 檔案

## 安裝方法

1. 安裝 Visual Studio Code 1.98.0 或更高版本
2. 在您的系統上安裝 clang-format 和 clang-tidy
3. 從 VS Code 市集安裝此擴充套件

## 擴充套件設定

此擴充套件提供以下設定選項：

- `cubtek.formatOnSave`：啟用/停用儲存時自動格式化（預設：`true`）
- `cubtek.checkOnSave`：啟用/停用儲存時編碼標準檢查（預設：`true`）
- `cubtek.severity`：設定診斷的嚴重性級別（`"error"`、`"warning"`、`"information"`、`"hint"`）（預設：`"warning"`）
- `cubtek.configPath`：指定自訂配置檔案的路徑

## 規則系統

擴充套件包含多個規則類別，用於檢查不同方面的編碼標準：

1. **函數長度規則** (`FunctionLengthRule`)：

   - 確保函數不超過指定長度（預設 50 行）
   - 在 `cubtek-config.json` 中可自訂限制

2. **命名規則** (`NamingConventionRule`)：
   - 確保全局變數有 `g_` 前綴
   - 確保靜態變數有 `s_` 前綴
   - 確保函數名稱符合 camelBack 風格

自訂規則可通過實現 `Rule` 基類添加到系統中，並通過 `RuleRegistry` 進行註冊。

## 配置檔案

擴充套件使用三個主要的配置檔案：

### 1. `.clang-format`

用於程式碼格式化規則。基本配置範例：

```yaml
BasedOnStyle: LLVM
IndentWidth: 4
UseTab: Never
BreakBeforeBraces: Allman
SpaceBeforeParens: ControlStatements
SpaceAfterCStyleCast: true
SpaceBeforeAssignmentOperators: true
IndentCaseLabels: false
ColumnLimit: 80
AlignTrailingComments: true
```

### 2. `.clang-tidy`

用於靜態分析規則。基本配置範例：

```yaml
Checks: >
  bugprone-*,
  cert-*,
  clang-analyzer-*,
  cppcoreguidelines-*,
  performance-*,
  readability-*,
  -cppcoreguidelines-pro-type-reinterpret-cast,
  -cppcoreguidelines-pro-bounds-pointer-arithmetic

CheckOptions:
  - key: readability-function-size.LineThreshold
    value: "50"
  - key: readability-identifier-naming.GlobalVariablePrefix
    value: "g_"
```

### 3. `cubtek-config.json`

用於擴充套件特定的行為控制：

```json
{
  "version": "2.0",
  "formatOnSave": true,
  "checkOnSave": true,
  "severity": "warning",
  "rules": {
    "CUBTEK-FUNC-001": {
      "enabled": true,
      "severity": "warning",
      "params": {
        "maxLines": 50
      }
    },
    "CUBTEK-NAME-001": {
      "enabled": true,
      "severity": "warning"
    }
  }
}
```

## 快速修復功能

擴充套件提供了自動修復建議，可以幫助解決常見的編碼問題：

- **函數長度違規**：自動提供函數提取建議
- **命名規則違規**：提供符合規範的變數命名建議
- **格式違規**：自動修復格式問題
- **文檔問題**：提供標準文檔結構建議

## 已知問題

- 擴充套件目前僅支援 C/C++ 檔案
- 格式化需要在系統上安裝 clang-format
- 靜態分析需要在系統上安裝 clang-tidy
- 大型專案可能會在分析過程中影響效能

## 版本說明

### 1.1.0（當前版本）

- 加入快速修復功能
- 改進規則註冊系統
- 增強配置管理功能
- 整合 clang-tidy 檢查

### 0.1.0

- 初始版本，提供基本功能：
  - 基本程式碼格式化支援
  - 編碼標準驗證
  - 專案範圍分析功能
  - 格式化和檢查的配置選項

## 貢獻指南

歡迎對此擴充套件提供貢獻。請隨時在我們的儲存庫上提交問題和拉取請求。

## 授權

此擴充套件在 MIT 授權下發布。詳情請見 [LICENSE](./LICENSE) 檔案。

## 支援

如果您遇到任何問題或有建議，請在我們的 [GitHub 儲存庫](https://github.com/allencheng443/cubtek-coding-standard) 上提出問題。

---

**注意**：此擴充套件目前處於開發階段。功能和配置可能會在未來版本中變更。
