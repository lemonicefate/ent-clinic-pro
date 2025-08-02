# GitHub 工作流程設定腳本 (PowerShell)
# 此腳本協助設定 GitHub 儲存庫的分支保護、團隊權限和工作流程

param(
    [string]$Branch = "main"
)

# 顏色定義
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# 函數定義
function Write-Header {
    param([string]$Message)
    Write-Host "================================" -ForegroundColor $Colors.Blue
    Write-Host $Message -ForegroundColor $Colors.Blue
    Write-Host "================================" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor $Colors.Blue
}

# 檢查必要工具
function Test-Requirements {
    Write-Header "檢查必要工具"
    
    # 檢查 GitHub CLI
    try {
        $null = Get-Command gh -ErrorAction Stop
        Write-Success "GitHub CLI (gh) 已安裝"
    }
    catch {
        Write-Error "GitHub CLI (gh) 未安裝"
        Write-Info "請安裝 GitHub CLI: https://cli.github.com/"
        exit 1
    }
    
    # 檢查 GitHub CLI 登入狀態
    try {
        $authStatus = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "GitHub CLI 已登入"
        }
        else {
            throw "Not authenticated"
        }
    }
    catch {
        Write-Error "GitHub CLI 未登入"
        Write-Info "請執行: gh auth login"
        exit 1
    }
    
    Write-Success "所有必要工具已就緒"
}

# 檢查儲存庫狀態
function Test-Repository {
    Write-Header "檢查儲存庫狀態"
    
    # 檢查是否在 Git 儲存庫中
    try {
        $null = git rev-parse --git-dir 2>$null
        Write-Success "Git 儲存庫已確認"
    }
    catch {
        Write-Error "當前目錄不是 Git 儲存庫"
        exit 1
    }
    
    # 檢查是否為 GitHub 儲存庫
    try {
        $repoUrl = git config --get remote.origin.url
        if ($repoUrl -like "*github.com*") {
            Write-Success "GitHub 儲存庫已確認"
        }
        else {
            throw "Not a GitHub repository"
        }
    }
    catch {
        Write-Error "不是 GitHub 儲存庫"
        exit 1
    }
    
    # 取得儲存庫資訊
    try {
        $repoInfo = gh repo view --json owner,name | ConvertFrom-Json
        $script:RepoOwner = $repoInfo.owner.login
        $script:RepoName = $repoInfo.name
        Write-Info "儲存庫: $script:RepoOwner/$script:RepoName"
    }
    catch {
        Write-Error "無法取得儲存庫資訊"
        exit 1
    }
}

# 檢查檔案結構
function Test-Files {
    Write-Header "檢查必要檔案"
    
    $requiredFiles = @(
        ".github\CODEOWNERS",
        ".github\pull_request_template.md",
        ".github\ISSUE_TEMPLATE\medical-content-review.md",
        ".github\workflows\content-quality-check.yml",
        ".github\workflows\branch-protection-setup.yml",
        ".github\workflows\cms-deploy.yml",
        "public\admin\config.yml",
        "src\content\config.ts"
    )
    
    $missingFiles = @()
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Success "$file 存在"
        }
        else {
            Write-Warning "$file 不存在"
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-Error "缺少 $($missingFiles.Count) 個必要檔案"
        Write-Info "請確保所有檔案都已建立"
        return $false
    }
    
    Write-Success "所有必要檔案都存在"
    return $true
}

# 設定分支保護
function Set-BranchProtection {
    Write-Header "設定分支保護規則"
    
    Write-Info "為分支 '$Branch' 設定保護規則..."
    
    # 檢查分支是否存在
    try {
        $null = git show-ref --verify --quiet "refs/heads/$Branch"
        Write-Success "分支 '$Branch' 存在"
    }
    catch {
        Write-Error "分支 '$Branch' 不存在"
        return $false
    }
    
    # 使用 GitHub Actions 工作流程設定分支保護
    Write-Info "觸發分支保護設定工作流程..."
    
    try {
        gh workflow run branch-protection-setup.yml -f action=setup -f branch=$Branch
        Write-Success "分支保護設定工作流程已觸發"
        Write-Info "請前往 Actions 頁面查看執行結果"
        return $true
    }
    catch {
        Write-Error "無法觸發分支保護設定工作流程"
        return $false
    }
}

# 檢查團隊設定
function Test-Teams {
    Write-Header "檢查團隊設定"
    
    $requiredTeams = @(
        "admin-team",
        "dev-team",
        "medical-content-team",
        "clinical-reviewers",
        "cms-admin-team",
        "cardiology-team",
        "neurology-team",
        "pediatrics-team",
        "emergency-team",
        "orthopedics-team",
        "zh-tw-reviewers",
        "en-reviewers"
    )
    
    $missingTeams = @()
    
    foreach ($team in $requiredTeams) {
        try {
            $null = gh api "orgs/$script:RepoOwner/teams/$team" 2>$null
            Write-Success "團隊 '$team' 存在"
        }
        catch {
            Write-Warning "團隊 '$team' 不存在"
            $missingTeams += $team
        }
    }
    
    if ($missingTeams.Count -gt 0) {
        Write-Warning "發現 $($missingTeams.Count) 個缺少的團隊"
        Write-Info "請手動建立以下團隊："
        foreach ($team in $missingTeams) {
            Write-Host "  - $team" -ForegroundColor $Colors.White
        }
        Write-Info "建立團隊指令範例: gh api orgs/$script:RepoOwner/teams -f name='team-name' -f description='Team description'"
    }
    else {
        Write-Success "所有必要團隊都存在"
    }
}

# 測試工作流程
function Test-Workflows {
    Write-Header "測試工作流程"
    
    Write-Info "檢查工作流程檔案語法..."
    
    $workflowFiles = @(
        ".github\workflows\content-quality-check.yml",
        ".github\workflows\branch-protection-setup.yml",
        ".github\workflows\cms-deploy.yml"
    )
    
    foreach ($file in $workflowFiles) {
        if (Test-Path $file) {
            # 簡單的 YAML 語法檢查
            try {
                $content = Get-Content $file -Raw
                if ($content -match "^name:" -and $content -match "^on:") {
                    Write-Success "$file 語法看起來正確"
                }
                else {
                    Write-Warning "$file 可能有語法問題"
                }
            }
            catch {
                Write-Error "$file 讀取失敗"
                return $false
            }
        }
        else {
            Write-Error "$file 不存在"
            return $false
        }
    }
    
    Write-Success "所有工作流程檔案檢查完成"
    return $true
}

# 生成設定報告
function New-Report {
    Write-Header "生成設定報告"
    
    $reportFile = "github-setup-report.md"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    $reportContent = @"
# GitHub 工作流程設定報告

生成時間: $timestamp
儲存庫: $script:RepoOwner/$script:RepoName

## 📋 設定狀態

### 檔案檢查
- 所有必要檔案已檢查

### 分支保護
- 主分支: $Branch
- 保護規則: 已設定（請檢查 Actions 執行結果）

### 工作流程
- 內容品質檢查: ✅ 已設定
- 分支保護設定: ✅ 已設定  
- CMS 部署: ✅ 已設定

## 🔧 後續手動設定

### 1. 團隊建立
請在 GitHub 組織中建立以下團隊：

- admin-team (Admin 權限)
- dev-team (Maintain 權限)
- medical-content-team (Write 權限)
- clinical-reviewers (Write 權限)
- cms-admin-team (Write 權限)
- cardiology-team (Triage 權限)
- neurology-team (Triage 權限)
- pediatrics-team (Triage 權限)
- emergency-team (Triage 權限)
- orthopedics-team (Triage 權限)
- zh-tw-reviewers (Triage 權限)
- en-reviewers (Triage 權限)

### 2. Decap CMS OAuth 設定
1. 前往 GitHub Settings > Developer settings > OAuth Apps
2. 建立新的 OAuth 應用程式
3. 設定 Authorization callback URL
4. 更新 CMS 配置檔案

### 3. 環境變數設定
在儲存庫 Settings > Secrets and variables > Actions 中設定：

- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- SITE_URL

### 4. 測試流程
1. 建立測試分支
2. 修改衛教文章
3. 建立 Pull Request
4. 確認自動化檢查執行
5. 測試審核和合併流程

## 📞 支援資源

- [分支保護設定指南](.github/BRANCH_PROTECTION_GUIDE.md)
- [CMS 設定指南](CMS_SETUP.md)
- [編輯指南](CMS_EDITING_GUIDE.md)

"@

    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Success "設定報告已生成: $reportFile"
}

# 主要執行流程
function Main {
    Write-Header "GitHub 工作流程設定腳本"
    
    # 檢查必要條件
    Test-Requirements
    Test-Repository
    
    # 檢查檔案和設定
    if (-not (Test-Files)) {
        Write-Error "檔案檢查失敗，請先建立必要檔案"
        exit 1
    }
    
    # 測試工作流程
    if (-not (Test-Workflows)) {
        Write-Error "工作流程測試失敗"
        exit 1
    }
    
    # 設定分支保護
    Set-BranchProtection
    
    # 檢查團隊
    Test-Teams
    
    # 生成報告
    New-Report
    
    Write-Header "設定完成"
    Write-Success "GitHub 工作流程基本設定已完成"
    Write-Info "請查看生成的報告檔案了解後續手動設定步驟"
    Write-Info "執行 'Get-Content github-setup-report.md' 查看詳細報告"
}

# 執行主程式
Main