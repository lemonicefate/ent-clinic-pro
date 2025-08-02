/**
 * 完整工作流程端到端測試
 * 測試從 Decap CMS 撰寫文章到最終發布的完整流程
 */

import { test, expect } from '@playwright/test';

// 測試配置
const TEST_CONFIG = {
  cmsUrl: process.env.CMS_URL || 'http://localhost:3000/admin',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4321',
  testUser: {
    email: 'test-writer@example.com',
    password: 'test-password-123'
  },
  testReviewer: {
    email: 'test-reviewer@example.com', 
    password: 'reviewer-password-123'
  },
  testAdmin: {
    email: 'test-admin@example.com',
    password: 'admin-password-123'
  }
};

test.describe('完整衛教文章發布工作流程', () => {
  let articleSlug;
  let articleTitle;

  test.beforeEach(async ({ page }) => {
    // 生成唯一的測試文章標識
    const timestamp = Date.now();
    articleSlug = `e2e-test-article-${timestamp}`;
    articleTitle = `端到端測試文章 ${timestamp}`;
  });

  test('完整工作流程：撰寫 → 審核 → 品質檢查 → 發布', async ({ browser }) => {
    // 建立多個瀏覽器上下文來模擬不同角色
    const writerContext = await browser.newContext();
    const reviewerContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const writerPage = await writerContext.newPage();
    const reviewerPage = await reviewerContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      // === 階段 1: 撰寫者建立文章草稿 ===
      await test.step('撰寫者登入 Decap CMS', async () => {
        await writerPage.goto(TEST_CONFIG.cmsUrl);
        
        // 等待登入頁面載入
        await writerPage.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
        
        // 填寫登入資訊
        await writerPage.fill('[name="email"]', TEST_CONFIG.testUser.email);
        await writerPage.fill('[name="password"]', TEST_CONFIG.testUser.password);
        await writerPage.click('button[type="submit"]');
        
        // 驗證登入成功
        await expect(writerPage.locator('[data-testid="cms-dashboard"]')).toBeVisible();
      });

      await test.step('建立新的衛教文章', async () => {
        // 導航到文章管理頁面
        await writerPage.click('[data-testid="nav-education-articles"]');
        await writerPage.click('[data-testid="create-new-article"]');
        
        // 填寫文章基本資訊
        await writerPage.fill('[name="title.zh_TW"]', articleTitle);
        await writerPage.fill('[name="title.en"]', `E2E Test Article ${Date.now()}`);
        
        // 選擇專科分類
        await writerPage.selectOption('[name="specialty"]', 'cardiology');
        
        // 填寫文章內容
        const articleContent = `
# ${articleTitle}

## 簡介
這是一篇端到端測試文章，用於驗證完整的發布工作流程。

## 主要內容
- 測試項目 1：基本功能驗證
- 測試項目 2：工作流程測試
- 測試項目 3：品質檢查驗證

## 結論
此文章僅用於測試目的，發布後將自動清理。
        `;
        
        await writerPage.fill('[data-testid="content-editor"]', articleContent);
        
        // 設定其他必要欄位
        await writerPage.selectOption('[name="difficulty"]', 'basic');
        await writerPage.fill('[name="tags"]', '測試, 端到端, 工作流程');
        
        // 儲存草稿
        await writerPage.click('[data-testid="save-draft"]');
        
        // 驗證草稿已儲存
        await expect(writerPage.locator('[data-testid="status-indicator"]')).toContainText('草稿');
      });

      await test.step('提交文章進行審核', async () => {
        // 更改狀態為審核中
        await writerPage.selectOption('[name="status"]', 'in-review');
        await writerPage.click('[data-testid="save-changes"]');
        
        // 確認提交審核
        await writerPage.click('[data-testid="confirm-submit-review"]');
        
        // 驗證狀態已更新
        await expect(writerPage.locator('[data-testid="status-indicator"]')).toContainText('審核中');
        
        // 驗證審核者已自動分配
        await expect(writerPage.locator('[data-testid="assigned-reviewers"]')).toBeVisible();
      });

      // === 階段 2: 審核者進行審核 ===
      await test.step('審核者登入並查看待審核文章', async () => {
        await reviewerPage.goto(TEST_CONFIG.cmsUrl);
        
        // 審核者登入
        await reviewerPage.fill('[name="email"]', TEST_CONFIG.testReviewer.email);
        await reviewerPage.fill('[name="password"]', TEST_CONFIG.testReviewer.password);
        await reviewerPage.click('button[type="submit"]');
        
        // 導航到審核工作台
        await reviewerPage.click('[data-testid="nav-review-dashboard"]');
        
        // 找到並點擊待審核的文章
        await reviewerPage.click(`[data-testid="review-article-${articleSlug}"]`);
      });

      await test.step('審核者進行內容審核', async () => {
        // 檢查審核檢查清單
        await reviewerPage.check('[data-testid="check-medical-accuracy"]');
        await reviewerPage.check('[data-testid="check-content-structure"]');
        await reviewerPage.check('[data-testid="check-language-quality"]');
        await reviewerPage.check('[data-testid="check-reference-format"]');
        
        // 填寫審核意見
        await reviewerPage.fill('[data-testid="review-comments"]', 
          '文章內容結構清晰，醫療資訊準確，建議通過審核。');
        
        // 批准文章
        await reviewerPage.click('[data-testid="approve-article"]');
        
        // 確認審核決定
        await reviewerPage.click('[data-testid="confirm-approval"]');
        
        // 驗證審核狀態已更新
        await expect(reviewerPage.locator('[data-testid="review-status"]')).toContainText('已批准');
      });

      // === 階段 3: 系統自動品質檢查 ===
      await test.step('等待自動品質檢查完成', async () => {
        // 切換到管理者頁面監控品質檢查
        await adminPage.goto(TEST_CONFIG.cmsUrl);
        await adminPage.fill('[name="email"]', TEST_CONFIG.testAdmin.email);
        await adminPage.fill('[name="password"]', TEST_CONFIG.testAdmin.password);
        await adminPage.click('button[type="submit"]');
        
        // 導航到品質檢查監控頁面
        await adminPage.click('[data-testid="nav-quality-dashboard"]');
        
        // 等待品質檢查完成（最多等待 2 分鐘）
        await adminPage.waitForSelector(
          `[data-testid="quality-check-${articleSlug}"][data-status="completed"]`,
          { timeout: 120000 }
        );
        
        // 驗證所有品質檢查項目都通過
        const qualityChecks = [
          'structure-check',
          'content-check', 
          'medical-accuracy-check',
          'seo-check',
          'accessibility-check'
        ];
        
        for (const check of qualityChecks) {
          await expect(adminPage.locator(`[data-testid="${check}-${articleSlug}"]`))
            .toHaveAttribute('data-status', 'passed');
        }
      });

      // === 階段 4: 管理者執行發布 ===
      await test.step('管理者執行文章發布', async () => {
        // 導航到發布管理頁面
        await adminPage.click('[data-testid="nav-publish-dashboard"]');
        
        // 找到準備發布的文章
        await adminPage.click(`[data-testid="publish-article-${articleSlug}"]`);
        
        // 確認發布設定
        await adminPage.check('[data-testid="generate-seo-metadata"]');
        await adminPage.check('[data-testid="update-sitemap"]');
        await adminPage.check('[data-testid="notify-subscribers"]');
        
        // 執行發布
        await adminPage.click('[data-testid="execute-publish"]');
        await adminPage.click('[data-testid="confirm-publish"]');
        
        // 等待發布完成
        await adminPage.waitForSelector(
          `[data-testid="publish-status-${articleSlug}"][data-status="published"]`,
          { timeout: 60000 }
        );
        
        // 驗證發布成功
        await expect(adminPage.locator('[data-testid="publish-success-message"]'))
          .toContainText('文章已成功發布');
      });

      // === 階段 5: 驗證前端網站顯示 ===
      await test.step('驗證文章在前端網站正確顯示', async () => {
        // 等待一段時間讓內容同步到前端
        await adminPage.waitForTimeout(10000);
        
        // 導航到前端網站
        await adminPage.goto(TEST_CONFIG.frontendUrl);
        
        // 檢查首頁是否顯示新文章
        await adminPage.goto(`${TEST_CONFIG.frontendUrl}/education`);
        await expect(adminPage.locator(`[data-testid="article-${articleSlug}"]`)).toBeVisible();
        
        // 點擊文章連結
        await adminPage.click(`[data-testid="article-link-${articleSlug}"]`);
        
        // 驗證文章詳細頁面
        await expect(adminPage.locator('h1')).toContainText(articleTitle);
        await expect(adminPage.locator('[data-testid="article-content"]')).toBeVisible();
        await expect(adminPage.locator('[data-testid="specialty-tag"]')).toContainText('心臟科');
        
        // 檢查 SEO 元資料
        const title = await adminPage.title();
        expect(title).toContain(articleTitle);
        
        const metaDescription = await adminPage.getAttribute('meta[name="description"]', 'content');
        expect(metaDescription).toBeTruthy();
      });

      // === 階段 6: 驗證搜尋和分類功能 ===
      await test.step('驗證文章可以被搜尋和分類', async () => {
        // 測試搜尋功能
        await adminPage.goto(`${TEST_CONFIG.frontendUrl}/search`);
        await adminPage.fill('[data-testid="search-input"]', '端到端測試');
        await adminPage.click('[data-testid="search-button"]');
        
        await expect(adminPage.locator(`[data-testid="search-result-${articleSlug}"]`)).toBeVisible();
        
        // 測試專科分類頁面
        await adminPage.goto(`${TEST_CONFIG.frontendUrl}/specialties/cardiology`);
        await expect(adminPage.locator(`[data-testid="article-${articleSlug}"]`)).toBeVisible();
        
        // 驗證文章統計已更新
        await expect(adminPage.locator('[data-testid="specialty-article-count"]'))
          .toContainText(/\d+/); // 確保顯示數字
      });

    } finally {
      // 清理測試資料
      await test.step('清理測試文章', async () => {
        try {
          // 刪除測試文章
          await adminPage.goto(TEST_CONFIG.cmsUrl);
          await adminPage.click('[data-testid="nav-education-articles"]');
          await adminPage.click(`[data-testid="delete-article-${articleSlug}"]`);
          await adminPage.click('[data-testid="confirm-delete"]');
          
          // 驗證文章已刪除
          await expect(adminPage.locator(`[data-testid="article-${articleSlug}"]`)).not.toBeVisible();
        } catch (error) {
          console.warn('清理測試資料時發生錯誤:', error);
        }
      });

      // 關閉所有瀏覽器上下文
      await writerContext.close();
      await reviewerContext.close();
      await adminContext.close();
    }
  });

  test('工作流程錯誤處理：審核不通過情況', async ({ browser }) => {
    const writerContext = await browser.newContext();
    const reviewerContext = await browser.newContext();
    
    const writerPage = await writerContext.newPage();
    const reviewerPage = await reviewerContext.newPage();

    try {
      // 撰寫者建立文章並提交審核
      await test.step('建立文章並提交審核', async () => {
        await writerPage.goto(TEST_CONFIG.cmsUrl);
        await writerPage.fill('[name="email"]', TEST_CONFIG.testUser.email);
        await writerPage.fill('[name="password"]', TEST_CONFIG.testUser.password);
        await writerPage.click('button[type="submit"]');
        
        await writerPage.click('[data-testid="nav-education-articles"]');
        await writerPage.click('[data-testid="create-new-article"]');
        
        await writerPage.fill('[name="title.zh_TW"]', `審核測試文章 ${Date.now()}`);
        await writerPage.fill('[name="title.en"]', `Review Test Article ${Date.now()}`);
        await writerPage.selectOption('[name="specialty"]', 'cardiology');
        await writerPage.fill('[data-testid="content-editor"]', '測試內容，故意包含錯誤資訊');
        
        await writerPage.click('[data-testid="save-draft"]');
        await writerPage.selectOption('[name="status"]', 'in-review');
        await writerPage.click('[data-testid="save-changes"]');
      });

      // 審核者拒絕文章
      await test.step('審核者拒絕文章並提供修改建議', async () => {
        await reviewerPage.goto(TEST_CONFIG.cmsUrl);
        await reviewerPage.fill('[name="email"]', TEST_CONFIG.testReviewer.email);
        await reviewerPage.fill('[name="password"]', TEST_CONFIG.testReviewer.password);
        await reviewerPage.click('button[type="submit"]');
        
        await reviewerPage.click('[data-testid="nav-review-dashboard"]');
        await reviewerPage.click(`[data-testid="review-article-${articleSlug}"]`);
        
        // 填寫審核意見
        await reviewerPage.fill('[data-testid="review-comments"]', 
          '文章內容需要改善：\n1. 醫療資訊不夠準確\n2. 缺少參考文獻\n3. 結構需要調整');
        
        // 拒絕文章
        await reviewerPage.click('[data-testid="reject-article"]');
        await reviewerPage.click('[data-testid="confirm-rejection"]');
        
        // 驗證狀態已更新為需要修改
        await expect(reviewerPage.locator('[data-testid="review-status"]')).toContainText('需要修改');
      });

      // 驗證撰寫者收到通知並可以修改
      await test.step('撰寫者收到通知並進行修改', async () => {
        // 重新整理撰寫者頁面
        await writerPage.reload();
        
        // 檢查通知
        await expect(writerPage.locator('[data-testid="notification-badge"]')).toBeVisible();
        await writerPage.click('[data-testid="notifications"]');
        await expect(writerPage.locator('[data-testid="review-feedback-notification"]')).toBeVisible();
        
        // 查看審核意見
        await writerPage.click(`[data-testid="edit-article-${articleSlug}"]`);
        await expect(writerPage.locator('[data-testid="review-feedback"]')).toContainText('需要改善');
        
        // 修改文章
        await writerPage.fill('[data-testid="content-editor"]', 
          '修改後的測試內容，已根據審核意見進行改善');
        
        // 重新提交審核
        await writerPage.selectOption('[name="status"]', 'in-review');
        await writerPage.click('[data-testid="save-changes"]');
        
        // 驗證狀態已更新
        await expect(writerPage.locator('[data-testid="status-indicator"]')).toContainText('審核中');
      });

    } finally {
      await writerContext.close();
      await reviewerContext.close();
    }
  });

  test('權限控制測試：不同角色的存取限制', async ({ browser }) => {
    const contexts = {
      writer: await browser.newContext(),
      reviewer: await browser.newContext(),
      admin: await browser.newContext(),
      guest: await browser.newContext()
    };

    try {
      // 測試撰寫者權限
      await test.step('測試撰寫者權限限制', async () => {
        const writerPage = await contexts.writer.newPage();
        await writerPage.goto(TEST_CONFIG.cmsUrl);
        await writerPage.fill('[name="email"]', TEST_CONFIG.testUser.email);
        await writerPage.fill('[name="password"]', TEST_CONFIG.testUser.password);
        await writerPage.click('button[type="submit"]');
        
        // 撰寫者應該可以存取文章管理
        await expect(writerPage.locator('[data-testid="nav-education-articles"]')).toBeVisible();
        
        // 但不能存取系統管理功能
        await expect(writerPage.locator('[data-testid="nav-system-admin"]')).not.toBeVisible();
        await expect(writerPage.locator('[data-testid="nav-user-management"]')).not.toBeVisible();
      });

      // 測試審核者權限
      await test.step('測試審核者權限限制', async () => {
        const reviewerPage = await contexts.reviewer.newPage();
        await reviewerPage.goto(TEST_CONFIG.cmsUrl);
        await reviewerPage.fill('[name="email"]', TEST_CONFIG.testReviewer.email);
        await reviewerPage.fill('[name="password"]', TEST_CONFIG.testReviewer.password);
        await reviewerPage.click('button[type="submit"]');
        
        // 審核者應該可以存取審核功能
        await expect(reviewerPage.locator('[data-testid="nav-review-dashboard"]')).toBeVisible();
        
        // 但不能直接編輯文章
        await reviewerPage.click('[data-testid="nav-education-articles"]');
        await expect(reviewerPage.locator('[data-testid="create-new-article"]')).not.toBeVisible();
      });

      // 測試未登入使用者
      await test.step('測試未登入使用者存取限制', async () => {
        const guestPage = await contexts.guest.newPage();
        
        // 嘗試直接存取 CMS 管理頁面
        await guestPage.goto(`${TEST_CONFIG.cmsUrl}/dashboard`);
        
        // 應該被重導向到登入頁面
        await expect(guestPage.locator('[data-testid="login-form"]')).toBeVisible();
        
        // 前端網站應該可以正常存取
        await guestPage.goto(TEST_CONFIG.frontendUrl);
        await expect(guestPage.locator('[data-testid="main-content"]')).toBeVisible();
      });

    } finally {
      for (const context of Object.values(contexts)) {
        await context.close();
      }
    }
  });
});