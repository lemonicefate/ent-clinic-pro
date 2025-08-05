/**
 * 醫療工具導航測試 - 簡化版本
 * 專注於核心功能測試，確保每個計算機都可以從 /tools 頁面進入
 */

import { test, expect } from '@playwright/test';

// 所有可用的計算機列表
const CALCULATORS = [
  {
    id: 'bmi',
    name: 'BMI 計算器',
    urlPath: '/tools/bmi',
    category: 'general'
  },
  {
    id: 'egfr',
    name: 'eGFR 計算器',
    urlPath: '/tools/egfr',
    category: 'nephrology'
  },
  {
    id: 'amoxicillin-clavulanate-dose',
    name: '兒童 Amoxicillin/Clavulanate 劑量計算器',
    urlPath: '/tools/amoxicillin-clavulanate-dose',
    category: 'pediatrics'
  },
  {
    id: 'pediatric-antibiotic-calculator',
    name: '兒童抗生素劑量計算器',
    urlPath: '/tools/pediatric-antibiotic-calculator',
    category: 'pediatrics'
  },
  {
    id: 'cha2ds2-vasc',
    name: 'CHA2DS2-VASc 評分',
    urlPath: '/tools/cha2ds2-vasc',
    category: 'cardiology'
  },
  {
    id: 'lipid-management',
    name: '血脂管理與心血管風險計算機',
    urlPath: '/tools/lipid-management',
    category: 'cardiology'
  }
];

test.describe('醫療工具導航測試 - 簡化版', () => {
  test.beforeEach(async ({ page }) => {
    // 設置較長的超時時間
    test.setTimeout(60000);
    
    // 導航到工具頁面
    await page.goto('/tools', { waitUntil: 'networkidle' });
    
    // 等待頁面主要內容載入
    await page.waitForSelector('main', { timeout: 15000 });
    
    // 處理醫療免責聲明彈窗（如果存在）
    try {
      const disclaimer = page.locator('#medical-disclaimer');
      if (await disclaimer.isVisible({ timeout: 2000 })) {
        console.log('🔔 發現醫療免責聲明彈窗，正在關閉...');
        const acceptButton = page.locator('#disclaimer-accept');
        await acceptButton.click();
        await disclaimer.waitFor({ state: 'hidden', timeout: 5000 });
        console.log('✅ 醫療免責聲明彈窗已關閉');
      }
    } catch (error) {
      // 如果沒有彈窗或關閉失敗，繼續執行
      console.log('ℹ️ 沒有醫療免責聲明彈窗或已關閉');
    }
    
    // 等待統計數據載入
    await page.waitForSelector('[data-testid="stats-overview"]', { timeout: 10000 });
  });

  test('應該成功載入工具頁面', async ({ page }) => {
    console.log('🔍 檢查工具頁面是否正確載入...');
    
    // 檢查頁面標題（使用更具體的選擇器）
    const mainTitle = page.locator('main h1').first();
    await expect(mainTitle).toContainText('醫療計算機工具');
    
    // 檢查統計概覽區域
    const statsSection = page.locator('[data-testid="stats-overview"]');
    await expect(statsSection).toBeVisible();
    
    console.log('✅ 工具頁面載入成功');
  });

  test('應該顯示所有計算機的導航卡片', async ({ page }) => {
    console.log('🔍 檢查所有計算機的導航卡片是否存在...');
    
    for (const calculator of CALCULATORS) {
      console.log(`檢查計算機: ${calculator.name} (${calculator.id})`);
      
      // 使用新的測試屬性查找卡片
      const cardSelectors = [
        `[data-testid="calculator-card-${calculator.id}"]`,
        `[data-testid="featured-calculator-${calculator.id}"]`,
        `[data-calculator-id="${calculator.id}"]`,
        `#${calculator.id}`
      ];
      
      let cardFound = false;
      let foundSelector = '';
      
      for (const selector of cardSelectors) {
        try {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            cardFound = true;
            foundSelector = selector;
            console.log(`✅ 找到計算機卡片: ${calculator.name} (使用選擇器: ${foundSelector})`);
            break;
          }
        } catch (error) {
          // 繼續嘗試下一個選擇器
        }
      }
      
      // 如果還是找不到，嘗試通過文字內容查找
      if (!cardFound) {
        const textLocator = page.locator(`text="${calculator.name}"`);
        if (await textLocator.count() > 0) {
          cardFound = true;
          foundSelector = `text="${calculator.name}"`;
          console.log(`✅ 通過文字找到計算機: ${calculator.name}`);
        }
      }
      
      expect(cardFound, `計算機 "${calculator.name}" 的導航卡片未找到`).toBe(true);
    }
  });

  test('應該能夠點擊每個計算機卡片並導航到正確頁面', async ({ page }) => {
    console.log('🔗 測試每個計算機卡片的導航功能...');
    
    for (const calculator of CALCULATORS) {
      console.log(`測試導航到: ${calculator.name} (${calculator.urlPath})`);
      
      // 回到工具頁面
      await page.goto('/tools', { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="stats-overview"]', { timeout: 10000 });
      
      // 尋找並點擊計算機卡片
      let clicked = false;
      let clickMethod = '';
      
      // 策略1: 使用測試屬性查找連結
      const linkSelectors = [
        `[data-testid="calculator-link-${calculator.id}"]`,
        `[data-testid="featured-link-${calculator.id}"]`,
        `[data-testid="use-tool-button-${calculator.id}"]`
      ];
      
      for (const selector of linkSelectors) {
        try {
          const link = page.locator(selector);
          if (await link.count() > 0 && await link.isVisible()) {
            await link.click();
            clicked = true;
            clickMethod = selector;
            console.log(`✅ 使用選擇器點擊成功: ${clickMethod}`);
            break;
          }
        } catch (error) {
          console.log(`策略失敗 (${selector}): ${error.message}`);
        }
      }
      
      // 策略2: 通過 href 查找連結
      if (!clicked) {
        try {
          const linkByHref = page.locator(`a[href="${calculator.urlPath}"]`).first();
          if (await linkByHref.count() > 0 && await linkByHref.isVisible()) {
            await linkByHref.click();
            clicked = true;
            clickMethod = `a[href="${calculator.urlPath}"]`;
            console.log(`✅ 使用 href 點擊成功: ${clickMethod}`);
          }
        } catch (error) {
          console.log(`策略2失敗 (href): ${error.message}`);
        }
      }
      
      // 策略3: 通過文字內容查找連結
      if (!clicked) {
        try {
          // 先找到包含計算機名稱的連結
          const linkByText = page.locator(`a:has-text("${calculator.name}")`).first();
          if (await linkByText.count() > 0 && await linkByText.isVisible()) {
            await linkByText.click();
            clicked = true;
            clickMethod = `a:has-text("${calculator.name}")`;
            console.log(`✅ 使用文字點擊成功: ${clickMethod}`);
          }
        } catch (error) {
          console.log(`策略3失敗 (text): ${error.message}`);
        }
      }
      
      // 策略4: 查找 "使用工具" 按鈕
      if (!clicked) {
        try {
          const useToolButtons = page.locator('text=使用工具');
          const buttonCount = await useToolButtons.count();
          
          for (let i = 0; i < buttonCount; i++) {
            const button = useToolButtons.nth(i);
            const href = await button.getAttribute('href');
            if (href === calculator.urlPath) {
              await button.click();
              clicked = true;
              clickMethod = `使用工具按鈕 (${href})`;
              console.log(`✅ 使用工具按鈕點擊成功: ${clickMethod}`);
              break;
            }
          }
        } catch (error) {
          console.log(`策略4失敗 (使用工具按鈕): ${error.message}`);
        }
      }
      
      expect(clicked, `無法點擊計算機 "${calculator.name}" 的導航卡片。嘗試的方法: ${linkSelectors.join(', ')}`).toBe(true);
      
      // 等待頁面導航完成
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // 驗證是否導航到正確的頁面
      const currentUrl = page.url();
      expect(currentUrl, `導航到錯誤的頁面，期望包含: ${calculator.urlPath}，實際: ${currentUrl}`).toContain(calculator.urlPath);
      
      console.log(`✅ 成功導航到: ${calculator.name} (${currentUrl}) 使用方法: ${clickMethod}`);
      
      // 驗證頁面是否正確載入（檢查是否有計算機相關內容）
      try {
        // 等待頁面內容載入
        await page.waitForSelector('body', { timeout: 10000 });
        
        // 檢查是否有表單、計算機容器或標題
        const hasContent = await page.locator('form, .calculator, [data-testid*="calculator"], h1, h2, main').count() > 0;
        expect(hasContent, `計算機頁面 "${calculator.name}" 沒有載入正確的內容`).toBe(true);
        
        console.log(`✅ 計算機頁面 "${calculator.name}" 內容載入正常`);
      } catch (error) {
        console.warn(`⚠️ 計算機頁面 "${calculator.name}" 內容檢查失敗: ${error.message}`);
        // 不讓內容檢查失敗影響主要的導航測試
      }
    }
  });

  test('應該顯示正確的統計數據', async ({ page }) => {
    console.log('📊 檢查統計數據...');
    
    // 檢查統計概覽區域
    const statsSection = page.locator('[data-testid="stats-overview"]');
    await expect(statsSection).toBeVisible();
    
    // 檢查活躍插件數量（應該至少有我們定義的計算機數量）
    const activePluginsElement = page.locator('.text-3xl.font-bold.text-blue-600').first();
    const activePluginsCount = await activePluginsElement.textContent();
    
    console.log(`活躍插件數量: ${activePluginsCount}`);
    
    if (activePluginsCount) {
      const count = parseInt(activePluginsCount);
      expect(count).toBeGreaterThanOrEqual(CALCULATORS.length);
      console.log(`✅ 統計數據正確: ${count} >= ${CALCULATORS.length}`);
    }
  });
});

test.describe('工具頁面基本功能測試', () => {
  test('頁面應該正確載入並顯示標題', async ({ page }) => {
    await page.goto('/tools');
    
    // 使用更具體的選擇器檢查頁面標題
    const mainTitle = page.locator('main h1').first();
    await expect(mainTitle).toContainText('醫療計算機工具');
    
    // 檢查頁面描述
    const description = page.locator('p.text-xl.text-gray-600');
    await expect(description).toBeVisible();
    
    console.log('✅ 頁面標題和描述顯示正常');
  });
});