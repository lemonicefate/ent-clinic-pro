/**
 * 醫療工具導航測試
 * 確保每個計算機都可以從 /tools 頁面的導航卡片進入
 */

import { test, expect } from '@playwright/test';

// 所有可用的計算機列表
const CALCULATORS = [
  {
    id: 'bmi',
    pluginId: 'general.bmi',
    name: 'BMI 計算器',
    urlPath: '/tools/bmi',
    category: 'general'
  },
  {
    id: 'egfr',
    pluginId: 'nephrology.egfr',
    name: 'eGFR 計算器',
    urlPath: '/tools/egfr',
    category: 'nephrology'
  },
  {
    id: 'amoxicillin-clavulanate-dose',
    pluginId: 'pediatrics.amoxicillin-clavulanate-dose',
    name: '兒童 Amoxicillin/Clavulanate 劑量計算器',
    urlPath: '/tools/amoxicillin-clavulanate-dose',
    category: 'pediatrics'
  },
  {
    id: 'pediatric-antibiotic-calculator',
    pluginId: 'pediatrics.pediatric-antibiotic-calculator',
    name: '兒童抗生素劑量計算器',
    urlPath: '/tools/pediatric-antibiotic-calculator',
    category: 'pediatrics'
  },
  {
    id: 'cha2ds2-vasc',
    pluginId: 'cardiology.cha2ds2-vasc',
    name: 'CHA2DS2-VASc 評分',
    urlPath: '/tools/cha2ds2-vasc',
    category: 'cardiology'
  },
  {
    id: 'lipid-management',
    pluginId: 'cardiology.lipid-management',
    name: '血脂管理與心血管風險計算機',
    urlPath: '/tools/lipid-management',
    category: 'cardiology'
  }
];

test.describe('醫療工具導航測試', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到工具頁面
    await page.goto('/tools');
    
    // 等待頁面載入完成
    await expect(page.locator('h1')).toContainText('醫療計算機工具');
    
    // 等待統計數據載入
    await page.waitForSelector('[data-testid="stats-overview"], .grid.grid-cols-1.md\\:grid-cols-4', { timeout: 10000 });
  });

  test('應該顯示所有計算機的導航卡片', async ({ page }) => {
    console.log('🔍 檢查所有計算機的導航卡片是否存在...');
    
    for (const calculator of CALCULATORS) {
      console.log(`檢查計算機: ${calculator.name} (${calculator.id})`);
      
      // 檢查計算機卡片是否存在（使用多種選擇器策略）
      const cardSelectors = [
        `#${calculator.id}`,
        `[data-calculator-id="${calculator.id}"]`,
        `a[href="${calculator.urlPath}"]`
      ];
      
      let cardFound = false;
      let foundSelector = '';
      
      for (const selector of cardSelectors) {
        try {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            cardFound = true;
            foundSelector = selector;
            break;
          }
        } catch (error) {
          // 繼續嘗試下一個選擇器
        }
      }
      
      if (!cardFound) {
        // 如果找不到特定的卡片，嘗試通過文字內容查找
        const textLocator = page.locator('text=' + calculator.name);
        if (await textLocator.count() > 0) {
          cardFound = true;
          foundSelector = `text=${calculator.name}`;
        }
      }
      
      expect(cardFound, `計算機 "${calculator.name}" 的導航卡片未找到`).toBe(true);
      console.log(`✅ 找到計算機卡片: ${calculator.name} (使用選擇器: ${foundSelector})`);
    }
  });

  test('應該能夠點擊每個計算機卡片並導航到正確頁面', async ({ page }) => {
    console.log('🔗 測試每個計算機卡片的導航功能...');
    
    for (const calculator of CALCULATORS) {
      console.log(`測試導航到: ${calculator.name} (${calculator.urlPath})`);
      
      // 回到工具頁面
      await page.goto('/tools');
      await page.waitForLoadState('networkidle');
      
      // 尋找並點擊計算機卡片
      let clicked = false;
      
      // 策略1: 通過 ID 查找
      try {
        const cardById = page.locator(`#${calculator.id}`);
        if (await cardById.count() > 0) {
          const link = cardById.locator('a').first();
          if (await link.count() > 0) {
            await link.click();
            clicked = true;
          }
        }
      } catch (error) {
        console.log(`策略1失敗 (ID): ${error.message}`);
      }
      
      // 策略2: 通過 href 查找
      if (!clicked) {
        try {
          const linkByHref = page.locator(`a[href="${calculator.urlPath}"]`).first();
          if (await linkByHref.count() > 0) {
            await linkByHref.click();
            clicked = true;
          }
        } catch (error) {
          console.log(`策略2失敗 (href): ${error.message}`);
        }
      }
      
      // 策略3: 通過文字內容查找
      if (!clicked) {
        try {
          const linkByText = page.locator(`text=${calculator.name}`).first();
          if (await linkByText.count() > 0) {
            // 找到包含此文字的最近的連結
            const parentLink = linkByText.locator('xpath=ancestor-or-self::a').first();
            if (await parentLink.count() > 0) {
              await parentLink.click();
              clicked = true;
            } else {
              // 如果文字本身不在連結中，尋找同一容器中的連結
              const container = linkByText.locator('xpath=ancestor::div[contains(@class, "border") or contains(@class, "card")]').first();
              const containerLink = container.locator('a').first();
              if (await containerLink.count() > 0) {
                await containerLink.click();
                clicked = true;
              }
            }
          }
        } catch (error) {
          console.log(`策略3失敗 (text): ${error.message}`);
        }
      }
      
      // 策略4: 通過 "使用工具" 按鈕查找
      if (!clicked) {
        try {
          // 先找到包含計算機名稱的容器
          const nameElement = page.locator(`text=${calculator.name}`).first();
          if (await nameElement.count() > 0) {
            const container = nameElement.locator('xpath=ancestor::div[contains(@class, "border") or contains(@class, "bg-white")]').first();
            const useToolButton = container.locator('text=使用工具').first();
            if (await useToolButton.count() > 0) {
              await useToolButton.click();
              clicked = true;
            }
          }
        } catch (error) {
          console.log(`策略4失敗 (使用工具按鈕): ${error.message}`);
        }
      }
      
      expect(clicked, `無法點擊計算機 "${calculator.name}" 的導航卡片`).toBe(true);
      
      // 等待頁面導航完成
      await page.waitForLoadState('networkidle');
      
      // 驗證是否導航到正確的頁面
      const currentUrl = page.url();
      expect(currentUrl, `導航到錯誤的頁面，期望: ${calculator.urlPath}，實際: ${currentUrl}`).toContain(calculator.urlPath);
      
      console.log(`✅ 成功導航到: ${calculator.name} (${currentUrl})`);
      
      // 驗證頁面是否正確載入（檢查是否有計算機相關內容）
      const hasCalculatorContent = await page.locator('form, .calculator, [data-testid*="calculator"], h1, h2').count() > 0;
      expect(hasCalculatorContent, `計算機頁面 "${calculator.name}" 沒有載入正確的內容`).toBe(true);
    }
  });

  test('應該顯示正確的統計數據', async ({ page }) => {
    console.log('📊 檢查統計數據...');
    
    // 檢查統計概覽區域
    const statsSection = page.locator('.grid.grid-cols-1.md\\:grid-cols-4').first();
    await expect(statsSection).toBeVisible();
    
    // 檢查活躍插件數量
    const activePluginsCount = await page.locator('.text-3xl.font-bold.text-blue-600').first().textContent();
    const expectedCount = CALCULATORS.length.toString();
    
    console.log(`活躍插件數量: ${activePluginsCount}, 期望: ${expectedCount}`);
    expect(parseInt(activePluginsCount || '0')).toBeGreaterThanOrEqual(CALCULATORS.length);
  });

  test('應該按分類正確分組計算機', async ({ page }) => {
    console.log('🏷️ 檢查分類分組...');
    
    // 檢查每個分類是否存在
    const categories = [...new Set(CALCULATORS.map(calc => calc.category))];
    
    for (const category of categories) {
      console.log(`檢查分類: ${category}`);
      
      // 檢查分類區域是否存在
      const categorySection = page.locator(`#${category}-section, [data-category="${category}"]`).first();
      
      if (await categorySection.count() === 0) {
        // 如果沒有找到特定的分類區域，檢查是否有包含該分類計算機的區域
        const categoryCalculators = CALCULATORS.filter(calc => calc.category === category);
        let foundInCategory = false;
        
        for (const calc of categoryCalculators) {
          const calcElement = page.locator(`text=${calc.name}`);
          if (await calcElement.count() > 0) {
            foundInCategory = true;
            break;
          }
        }
        
        expect(foundInCategory, `分類 "${category}" 中沒有找到任何計算機`).toBe(true);
      } else {
        await expect(categorySection).toBeVisible();
      }
      
      console.log(`✅ 分類 "${category}" 檢查通過`);
    }
  });

  test('應該在每個計算機卡片上顯示必要資訊', async ({ page }) => {
    console.log('ℹ️ 檢查計算機卡片資訊...');
    
    for (const calculator of CALCULATORS) {
      console.log(`檢查計算機資訊: ${calculator.name}`);
      
      // 尋找計算機卡片
      const cardSelectors = [
        `#${calculator.id}`,
        `a[href="${calculator.urlPath}"]`,
        `text=${calculator.name}`
      ];
      
      let cardElement = null;
      for (const selector of cardSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          // 找到包含此元素的卡片容器
          cardElement = element.locator('xpath=ancestor-or-self::div[contains(@class, "border") or contains(@class, "bg-white") or contains(@class, "card")]').first();
          if (await cardElement.count() > 0) {
            break;
          }
          cardElement = element;
          break;
        }
      }
      
      if (cardElement && await cardElement.count() > 0) {
        // 檢查是否包含計算機名稱
        const hasName = await cardElement.locator(`text=${calculator.name}`).count() > 0;
        expect(hasName, `計算機 "${calculator.name}" 的卡片中沒有顯示名稱`).toBe(true);
        
        // 檢查是否有連結到正確的 URL
        const hasCorrectLink = await cardElement.locator(`a[href="${calculator.urlPath}"]`).count() > 0;
        expect(hasCorrectLink, `計算機 "${calculator.name}" 的卡片中沒有正確的連結`).toBe(true);
        
        console.log(`✅ 計算機 "${calculator.name}" 的卡片資訊完整`);
      } else {
        throw new Error(`找不到計算機 "${calculator.name}" 的卡片`);
      }
    }
  });
});

test.describe('工具頁面回歸測試', () => {
  test('頁面應該正確載入並顯示標題', async ({ page }) => {
    await page.goto('/tools');
    
    // 檢查頁面標題
    await expect(page.locator('h1')).toContainText('醫療計算機工具');
    
    // 檢查頁面描述
    const description = page.locator('p.text-xl.text-gray-600');
    await expect(description).toBeVisible();
  });

  test('頁面應該響應式設計正常工作', async ({ page }) => {
    await page.goto('/tools');
    
    // 測試桌面版本
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.container')).toBeVisible();
    
    // 測試平板版本
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.container')).toBeVisible();
    
    // 測試手機版本
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.container')).toBeVisible();
  });
});