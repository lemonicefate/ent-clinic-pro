#!/bin/bash

# GitHub 工作流程設定腳本
# 此腳本協助設定 GitHub 儲存庫的分支保護、團隊權限和工作流程

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數定義
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# 檢查必要工具
check_requirements() {
    print_header "檢查必要工具"
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) 未安裝"
        print_info "請安裝 GitHub CLI: https://cli.github.com/"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI 未登入"
        print_info "請執行: gh auth login"
        exit 1
    fi
    
    print_success "所有必要工具已就緒"
}

# 檢查儲存庫狀態
check_repository() {
    print_header "檢查儲存庫狀態"
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "當前目錄不是 Git 儲存庫"
        exit 1
    fi
    
    REPO_URL=$(git config --get remote.origin.url)
    if [[ $REPO_URL == *"github.com"* ]]; then
        print_success "GitHub 儲存庫已確認"
    else
        print_error "不是 GitHub 儲存庫"
        exit 1
    fi
    
    # 取得儲存庫資訊
    REPO_INFO=$(gh repo view --json owner,name)
    REPO_OWNER=$(echo $REPO_INFO | jq -r '.owner.login')
    REPO_NAME=$(echo $REPO_INFO | jq -r '.name')
    
    print_info "儲存庫: $REPO_OWNER/$REPO_NAME"
}

# 檢查檔案結構
check_files() {
    print_header "檢查必要檔案"
    
    local files=(
        ".github/CODEOWNERS"
        ".github/pull_request_template.md"
        ".github/ISSUE_TEMPLATE/medical-content-review.md"
        ".github/workflows/content-quality-check.yml"
        ".github/workflows/branch-protection-setup.yml"
        ".github/workflows/cms-deploy.yml"
        "public/admin/config.yml"
        "src/content/config.ts"
    )
    
    local missing_files=()
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "$file 存在"
        else
            print_warning "$file 不存在"
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        print_error "缺少 ${#missing_files[@]} 個必要檔案"
        print_info "請確保所有檔案都已建立"
        return 1
    fi
    
    print_success "所有必要檔案都存在"
}

# 設定分支保護
setup_branch_protection() {
    print_header "設定分支保護規則"
    
    local branch="main"
    
    print_info "為分支 '$branch' 設定保護規則..."
    
    # 檢查分支是否存在
    if ! git show-ref --verify --quiet refs/heads/$branch; then
        print_error "分支 '$branch' 不存在"
        return 1
    fi
    
    # 使用 GitHub Actions 工作流程設定分支保護
    print_info "觸發分支保護設定工作流程..."
    
    if gh workflow run branch-protection-setup.yml -f action=setup -f branch=$branch; then
        print_success "分支保護設定工作流程已觸發"
        print_info "請前往 Actions 頁面查看執行結果"
    else
        print_error "無法觸發分支保護設定工作流程"
        return 1
    fi
}

# 檢查團隊設定
check_teams() {
    print_header "檢查團隊設定"
    
    local teams=(
        "admin-team"
        "dev-team"
        "medical-content-team"
        "clinical-reviewers"
        "cms-admin-team"
        "cardiology-team"
        "neurology-team"
        "pediatrics-team"
        "emergency-team"
        "orthopedics-team"
        "zh-tw-reviewers"
        "en-reviewers"
    )
    
    local missing_teams=()
    
    for team in "${teams[@]}"; do
        if gh api "orgs/$REPO_OWNER/teams/$team" &> /dev/null; then
            print_success "團隊 '$team' 存在"
        else
            print_warning "團隊 '$team' 不存在"
            missing_teams+=("$team")
        fi
    done
    
    if [[ ${#missing_teams[@]} -gt 0 ]]; then
        print_warning "發現 ${#missing_teams[@]} 個缺少的團隊"
        print_info "請手動建立以下團隊："
        for team in "${missing_teams[@]}"; do
            echo "  - $team"
        done
        print_info "建立團隊指令範例: gh api orgs/$REPO_OWNER/teams -f name='team-name' -f description='Team description'"
    else
        print_success "所有必要團隊都存在"
    fi
}

# 測試工作流程
test_workflows() {
    print_header "測試工作流程"
    
    print_info "檢查工作流程檔案語法..."
    
    # 檢查 YAML 語法
    local workflow_files=(
        ".github/workflows/content-quality-check.yml"
        ".github/workflows/branch-protection-setup.yml"
        ".github/workflows/cms-deploy.yml"
    )
    
    for file in "${workflow_files[@]}"; do
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            print_success "$file 語法正確"
        else
            print_error "$file 語法錯誤"
            return 1
        fi
    done
    
    print_success "所有工作流程檔案語法正確"
}

# 生成設定報告
generate_report() {
    print_header "生成設定報告"
    
    local report_file="github-setup-report.md"
    
    cat > "$report_file" << EOF
# GitHub 工作流程設定報告

生成時間: $(date)
儲存庫: $REPO_OWNER/$REPO_NAME

## 📋 設定狀態

### 檔案檢查
$(check_files 2>&1 | sed 's/^/- /')

### 分支保護
- 主分支: main
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

EOF

    print_success "設定報告已生成: $report_file"
}

# 主要執行流程
main() {
    print_header "GitHub 工作流程設定腳本"
    
    # 檢查必要條件
    check_requirements
    check_repository
    
    # 檢查檔案和設定
    if ! check_files; then
        print_error "檔案檢查失敗，請先建立必要檔案"
        exit 1
    fi
    
    # 測試工作流程
    if ! test_workflows; then
        print_error "工作流程測試失敗"
        exit 1
    fi
    
    # 設定分支保護
    setup_branch_protection
    
    # 檢查團隊
    check_teams
    
    # 生成報告
    generate_report
    
    print_header "設定完成"
    print_success "GitHub 工作流程基本設定已完成"
    print_info "請查看生成的報告檔案了解後續手動設定步驟"
    print_info "執行 'cat github-setup-report.md' 查看詳細報告"
}

# 執行主程式
main "$@"