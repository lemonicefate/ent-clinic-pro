/**
 * 錯誤處理和回復機制測試
 * 測試系統在各種錯誤情況下的處理和回復能力
 */

import { test, expect } from '@playwright/test';

test.describe('錯誤處理和回復機制測試', () => {

  test('網路中斷時的錯誤處理', async ({ page, context }) => {
    await test.step('模擬網路中斷情況', async () => {
      await page.goto('http://localhost:3000/admin');
      await page.fill('[name="email"]', 'test-writer@example.com');
      await page.fill('[name="password"]', 'test-password-123');
      await page.click('button[type="submit"]');
      
      // 開始撰寫文章
      await page.click('[data-testid="nav-education-articles"]');
      await page.click('[data-testid="create-new-article"]');
      
      await page.fill('[name="title.zh_TW"]', '網路中斷測試文章');
      await page.fill('[data-testid="content-editor"]', '這是測試內容...');
      
      // 模擬網路中斷
      await context.setOffline(true);
      
      // 嘗試儲存
      await page.click('[data-testid="save-draft"]');
      
      // 驗證錯誤訊息顯示
      await expect(page.locator('[data-testid="network-error-message"]'))
        .toContainText('網路連線中斷，內容已自動儲存至本地');
      
      // 驗證本地儲存指示器
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    });

    await test.step('網路恢復後自動同步', async () => {
      // 恢復網路連線
      await context.setOffline(false);
      
      // 等待自動重連
      await page.waitForSelector('[data-testid="online-indicator"]', { timeout: 10000 });
      
      // 驗證自動同步提示
      await expect(page.locator('[data-testid="sync-notification"]'))
        .toContainText('網路已恢復，正在同步資料');
      
      // 等待同步完成
      await page.waitForSelector('[data-testid="sync-completed"]', { timeout: 15000 });
      
      // 驗證資料已成功同步
      await expect(page.locator('[data-testid="save-status"]')).toContainText('已儲存');
    });
  });

  test('伺服器錯誤時的處理機制', async ({ page }) => {
    await test.step('模擬伺服器 500 錯誤', async () => {
      // 攔截 API 請求並返回 500 錯誤
      await page.route('**/api/education-articles', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto('http://localhost:3000/admin');
      await page.fill('[name="email"]', 'test-writer@example.com');
      await page.fill('[name="password"]', 'test-password-123');
      await page.click('button[type="submit"]');
      
      // 嘗試載入文章列表
      await page.click('[data-testid="nav-education-articles"]');
      
      // 驗證錯誤處理
      await expect(page.locator('[data-testid="server-error-message"]'))
        .toContainText('伺服器暫時無法回應，請稍後再試');
      
      // 驗證重試按鈕
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    await test.step('測試自動重試機制', async () => {
      // 移除錯誤攔截，恢復正常回應
      await page.unroute('**/api/education-articles');
      
      // 點擊重試
      await page.click('[data-testid="retry-button"]');
      
      // 驗證重試成功
      await expect(page.locator('[data-testid="articles-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="server-error-message"]')).not.toBeVisible();
    });
  });

  test('資料驗證失敗的錯誤處理', async ({ page }) => {
    await test.step('測試必填欄位驗證', async () => {
      await page.goto('http://localhost:3000/admin');
      await page.fill('[name="email"]', 'test-writer@example.com');
      await page.fill('[name="password"]', 'test-password-123');
      await page.click('button[type="submit"]');
      
      await page.click('[data-testid="nav-education-articles"]');
      await page.click('[data-testid="create-new-article"]');
      
      // 不填寫必填欄位，直接嘗試儲存
      await page.click('[data-testid="save-draft"]');
      
      // 驗證驗證錯誤訊息
      await expect(page.locator('[data-testid="validation-error-title"]'))
        .toContainText('標題為必填欄位');
      
      await expect(page.locator('[data-testid="validation-error-specialty"]'))
        .toContainText('請選擇專科分類');
      
      // 驗證欄位高亮顯示
      await expect(page.locator('[name="title.zh_TW"]')).toHaveClass(/error/);
      await expect(page.locator('[name="specialty"]')).toHaveClass(/error/);
    });

    await test.step('測試內容格式驗證', async () => {
      // 填寫基本資訊
      await page.fill('[name="title.zh_TW"]', '格式驗證測試');
      await page.selectOption('[name="specialty"]', 'cardiology');
      
      // 填寫不符合格式的內容
      await page.fill('[data-testid="content-editor"]', '太短');
      
      await page.click('[data-testid="save-draft"]');
      
      // 驗證內容長度錯誤
      await expect(page.locator('[data-testid="validation-error-content"]'))
        .toContainText('文章內容至少需要 100 個字元');
      
      // 修正內容
      const validContent = '這是一篇符合長度要求的測試文章內容。'.repeat(10);
      await page.fill('[data-testid="content-editor"]', validContent);
      
      await page.click('[data-testid="save-draft"]');
      
      // 驗證儲存成功
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });
  });

  test('檔案上傳失敗的處理', async ({ page }) => {
    await test.step('模擬檔案上傳失敗', async () => {
      // 攔截檔案上傳請求並返回錯誤
      await page.route('**/api/upload', route => {
        route.fulfill({
          status: 413,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'File too large' })
        });
      });
      
      await page.goto('http://localhost:3000/admin');
      await page.fill('[name="email"]', 'test-writer@example.com');
      await page.fill('[name="password"]', 'test-password-123');
      await page.click('button[type="submit"]');
      
      await page.click('[data-testid="nav-education-articles"]');
      await page.click('[data-testid="create-new-article"]');
      
      // 嘗試上傳檔案
      const fileInput = page.locator('[data-testid="file-upload"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image content')
      });
      
      // 驗證上傳失敗訊息
      await expect(page.locator('[data-testid="upload-error"]'))
        .toContainText('檔案過大，請選擇小於 5MB 的檔案');
      
      // 驗證重試選項
      await expect(page.locator('[data-testid="upload-retry"]')).toBeVisible();
    });

    await test.step('測試檔案格式驗證', async () => {
      // 移除上傳錯誤攔截
      await page.unroute('**/api/upload');
      
      // 嘗試上傳不支援的檔案格式
      const fileInput = page.locator('[data-testid="file-upload"]');
      await fileInput.setInputFiles({
        name: 'test-file.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('fake exe content')
      });
      
      // 驗證格式錯誤訊息
      await expect(page.locator('[data-testid="format-error"]'))
        .toContainText('不支援的檔案格式，請上傳 JPG、PNG 或 PDF 檔案');
    });
  });

  test('審核流程中的錯誤處理', async ({ browser }) => {
    const writerContext = await browser.newContext();
    const reviewerContext = await browser.newContext();
    
    const writerPage = await writerContext.newPage();
    const reviewerPage = await reviewerContext.newPage();

    try {
      await test.step('測試審核者不可用時的處理', async () => {
        // 撰寫者建立文章
        await writerPage.goto('http://localhost:3000/admin');
        await writerPage.fill('[name="email"]', 'test-writer@example.com');
        await writerPage.fill('[name="password"]', 'test-password-123');
        await writerPage.click('button[type="submit"]');
        
        await writerPage.click('[data-testid="nav-education-articles"]');
        await writerPage.click('[data-testid="create-new-article"]');
        
        await writerPage.fill('[name="title.zh_TW"]', '審核者不可用測試');
        await writerPage.selectOption('[name="specialty"]', 'cardiology');
        await writerPage.fill('[data-testid="content-editor"]', '測試內容...');
        
        // 模擬所有審核者都不可用的情況
        await writerPage.route('**/api/assign-reviewers', route => {
          route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'No available reviewers',
              message: '目前沒有可用的審核者，請稍後再試或聯繫管理員'
            })
          });
        });
        
        await writerPage.selectOption('[name="status"]', 'in-review');
        await writerPage.click('[data-testid="save-changes"]');
        
        // 驗證錯誤處理
        await expect(writerPage.locator('[data-testid="reviewer-assignment-error"]'))
          .toContainText('目前沒有可用的審核者');
        
        // 驗證文章狀態回復為草稿
        await expect(writerPage.locator('[data-testid="status-indicator"]'))
          .toContainText('草稿');
        
        // 驗證通知管理員選項
        await expect(writerPage.locator('[data-testid="notify-admin-button"]')).toBeVisible();
      });

      await test.step('測試審核超時處理', async () => {
        // 移除審核者分配錯誤攔截
        await writerPage.unroute('**/api/assign-reviewers');
        
        // 模擬審核超時情況
        await writerPage.route('**/api/review-status', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 'review-timeout',
              message: '審核已超時，將自動重新分配審核者'
            })
          });
        });
        
        // 重新提交審核
        await writerPage.selectOption('[name="status"]', 'in-review');
        await writerPage.click('[data-testid="save-changes"]');
        
        // 等待超時處理
        await writerPage.waitForTimeout(5000);
        
        // 驗證超時通知
        await expect(writerPage.locator('[data-testid="review-timeout-notice"]'))
          .toContainText('審核已超時，正在重新分配審核者');
        
        // 驗證自動重新分配
        await expect(writerPage.locator('[data-testid="reviewer-reassignment"]')).toBeVisible();
      });

    } finally {
      await writerContext.close();
      await reviewerContext.close();
    }
  });

  test('資料庫連線失敗的處理', async ({ page }) => {
    await test.step('模擬資料庫連線失敗', async () => {
      // 攔截所有 API 請求並返回資料庫錯誤
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Database connection failed',
            message: '資料庫連線失敗，請稍後再試'
          })
        });
      });
      
      await page.goto('http://localhost:3000/admin');
      
      // 驗證資料庫錯誤頁面
      await expect(page.locator('[data-testid="database-error-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]'))
        .toContainText('系統暫時無法使用');
      
      // 驗證重試和聯繫支援選項
      await expect(page.locator('[data-testid="retry-connection"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
    });

    await test.step('測試降級模式', async () => {
      // 移除資料庫錯誤攔截，但模擬唯讀模式
      await page.unroute('**/api/**');
      
      await page.route('**/api/**', route => {
        if (route.request().method() === 'GET') {
          // GET 請求正常回應
          route.continue();
        } else {
          // 寫入操作返回唯讀模式錯誤
          route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Read-only mode',
              message: '系統目前為唯讀模式，無法進行編輯操作'
            })
          });
        }
      });
      
      await page.reload();
      
      // 驗證唯讀模式通知
      await expect(page.locator('[data-testid="readonly-mode-banner"]'))
        .toContainText('系統目前為唯讀模式');
      
      // 驗證編輯功能被禁用
      await page.click('[data-testid="nav-education-articles"]');
      await expect(page.locator('[data-testid="create-new-article"]')).toBeDisabled();
    });
  });

  test('瀏覽器相容性錯誤處理', async ({ page }) => {
    await test.step('測試不支援功能的降級處理', async () => {
      // 模擬舊版瀏覽器環境
      await page.addInitScript(() => {
        // 移除現代瀏覽器功能
        delete window.fetch;
        delete window.Promise;
      });
      
      await page.goto('http://localhost:3000/admin');
      
      // 驗證瀏覽器不支援警告
      await expect(page.locator('[data-testid="browser-compatibility-warning"]'))
        .toContainText('您的瀏覽器版本過舊');
      
      // 驗證降級功能提示
      await expect(page.locator('[data-testid="upgrade-browser-notice"]'))
        .toContainText('建議升級瀏覽器以獲得最佳體驗');
    });
  });

  test('併發編輯衝突處理', async ({ browser }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    
    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    try {
      await test.step('模擬併發編輯衝突', async () => {
        // 兩個使用者同時登入
        for (const page of [user1Page, user2Page]) {
          await page.goto('http://localhost:3000/admin');
          await page.fill('[name="email"]', 'test-writer@example.com');
          await page.fill('[name="password"]', 'test-password-123');
          await page.click('button[type="submit"]');
        }
        
        // 兩個使用者同時編輯同一篇文章
        const articleId = 'test-article-123';
        
        for (const page of [user1Page, user2Page]) {
          await page.click('[data-testid="nav-education-articles"]');
          await page.click(`[data-testid="edit-article-${articleId}"]`);
        }
        
        // 使用者1 先進行修改
        await user1Page.fill('[name="title.zh_TW"]', '使用者1的修改');
        await user1Page.click('[data-testid="save-changes"]');
        
        // 使用者2 嘗試儲存修改
        await user2Page.fill('[name="title.zh_TW"]', '使用者2的修改');
        await user2Page.click('[data-testid="save-changes"]');
        
        // 驗證衝突警告
        await expect(user2Page.locator('[data-testid="edit-conflict-warning"]'))
          .toContainText('此文章已被其他使用者修改');
        
        // 驗證衝突解決選項
        await expect(user2Page.locator('[data-testid="conflict-resolution-options"]')).toBeVisible();
        await expect(user2Page.locator('[data-testid="view-changes"]')).toBeVisible();
        await expect(user2Page.locator('[data-testid="merge-changes"]')).toBeVisible();
        await expect(user2Page.locator('[data-testid="overwrite-changes"]')).toBeVisible();
      });

    } finally {
      await user1Context.close();
      await user2Context.close();
    }
  });
});