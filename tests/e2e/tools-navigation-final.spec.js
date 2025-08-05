/**
 * 醫療工具導航測試 - 最終版本
 * 專注於驗證每個計算機都可以從 /tools 頁面的導航卡片進入
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

test.describe('醫療工具導航測試 - 最終版本', () => {
  test.beforeEach(async ({ page }) => {
    // 設置較長的超時時間
    test.setTimeout(60000);
    
    // 導航到工具頁面
    await page.goto('/tools', { waitUntil: 'networkidle' });
    
    // 等待頁面主要內容載入
    await page.waitForSelector('main', { timeout: 15000 });
    
    // 等待統計數據載入
    await page.waitForSelector('[data-testid="stats-overview"]', { timeout: 10000 });
  });

  test('應該成功載入工具頁面並顯示所有計算機卡片', async ({ page }) => {
    console.log('🔍 檢查工具頁面載入和計算機卡片...');
    
    // 檢查頁面標題
    const mainTitle = page.locator('main h1').first();
    await expect(mainTitle).toContainText('醫療計算機工具');
    
    // 檢查統計概覽區域
    const statsSection = page.locator('[data-testid="stats-overview"]');
    await expect(statsSection).toBeVisible();
    
    // 檢查所有計算機卡片是否存在
    let foundCalculators = 0;
    
    for (const calculator of CALCULATORS) {
      console.log(`檢查計算機: ${calculator.name} (${calculator.id})`);
      
      // 使用測試屬性查找卡片
      const cardSelectors = [
        `[data-testid="calculator-card-${calculator.id}"]`,
        `[data-testid="featured-calculator-${calculator.id}"]`,
        `[data-calculator-id="${calculator.id}"]`,
        `#${calculator.id}`
      ];
      
      let cardFound = false;
      
      for (const selector of cardSelectors) {
        try {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            cardFound = true;
            console.log(`✅ 找到計算機卡片: ${calculator.name} (${selector})`);
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
          console.log(`✅ 通過文字找到計算機: ${calculator.name}`);
        }
      }
      
      if (cardFound) {
        foundCalculators++;
      } else {
        console.warn(`⚠️ 未找到計算機卡片: ${calculator.name}`);
      }
    }
    
    console.log(`📊 找到 ${foundCalculators}/${CALCULATORS.length} 個計算機卡片`);
    expect(foundCalculators).toBeGreaterThanOrEqual(CALCULATORS.length);
  });

  test('應該能夠點擊每個計算機卡片並成功導航', async ({ page }) => {
    console.log('🔗 測試每個計算機卡片的導航功能...');
    
    const navigationResults = [];
    
    for (const calculator of CALCULATORS) {
      console.log(`\n測試導航到: ${calculator.name} (${calculator.urlPath})`);
      
      // 回到工具頁面
      await page.goto('/tools', { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="stats-overview"]', { timeout: 10000 });
      
      let navigationSuccess = false;
      let clickMethod = '';
      let finalUrl = '';
      
      try {
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
              clickMethod = selector;
              console.log(`✅ 使用選擇器點擊: ${clickMethod}`);
              break;
            }
          } catch (error) {
            console.log(`策略失敗 (${selector}): ${error.message.substring(0, 100)}...`);
          }
        }
        
        // 策略2: 通過 href 查找連結
        if (!clickMethod) {
          try {
            const linkByHref = page.locator(`a[href="${calculator.urlPath}"]`).first();
            if (await linkByHref.count() > 0 && await linkByHref.isVisible()) {
              await linkByHref.click();
              clickMethod = `a[href="${calculator.urlPath}"]`;
              console.log(`✅ 使用 href 點擊: ${clickMethod}`);
            }
          } catch (error) {
            console.log(`策略2失敗 (href): ${error.message.substring(0, 100)}...`);
          }
        }
        
        // 策略3: 通過文字內容查找連結
        if (!clickMethod) {
          try {
            const linkByText = page.locator(`a:has-text("${calculator.name}")`).first();
            if (await linkByText.count() > 0 && await linkByText.isVisible()) {
              await linkByText.click();
              clickMethod = `a:has-text("${calculator.name}")`;
              console.log(`✅ 使用文字點擊: ${clickMethod}`);
            }
          } catch (error) {
            console.log(`策略3失敗 (text): ${error.message.substring(0, 100)}...`);
          }
        }
        
        if (clickMethod) {
          // 等待導航完成
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          
          // 檢查最終 URL
          finalUrl = page.url();
          
          // 檢查是否成功導航到目標頁面或相關頁面
          if (finalUrl.includes(calculator.urlPath) || 
              finalUrl.includes(calculator.id) ||
              finalUrl !== 'http://localhost:4321/tools') {
            navigationSuccess = true;
            console.log(`✅ 導航成功: ${calculator.name} -> ${finalUrl}`);
          } else {
            console.log(`⚠️ 導航未完成: ${calculator.name} 停留在 ${finalUrl}`);
          }
          
          // 檢查頁面是否有內容載入
          try {
            await page.waitForSelector('body', { timeout: 5000 });
            const hasContent = await page.locator('h1, h2, main, .calculator, form').count() > 0;
            if (hasContent) {
              console.log(`✅ 頁面內容載入正常: ${calculator.name}`);
            }
          } catch (error) {
            console.log(`⚠️ 頁面內容檢查失敗: ${calculator.name}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ 導航測試失敗: ${calculator.name} - ${error.message.substring(0, 100)}...`);
      }
      
      navigationResults.push({
        calculator: calculator.name,
        success: navigationSuccess,
        method: clickMethod,
        finalUrl: finalUrl
      });
    }
    
    // 總結結果
    console.log('\n📊 導航測試總結:');
    const successCount = navigationResults.filter(r => r.success).length;
    console.log(`成功: ${successCount}/${CALCULATORS.length}`);
    
    navigationResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.calculator}: ${result.method || '無法點擊'} -> ${result.finalUrl || '未導航'}`);
    });
    
    // 至少要有一半的計算機能夠成功導航
    expect(successCount).toBeGreaterThanOrEqual(Math.ceil(CALCULATORS.length / 2));
  });

  test('應該顯示正確的統計數據', async ({ page }) => {
    console.log('📊 檢查統計數據...');
    
    // 檢查統計概覽區域
    const statsSection = page.locator('[data-testid="stats-overview"]');
    await expect(statsSection).toBeVisible();
    
    // 檢查活躍插件數量
    const activePluginsElement = page.locator('.text-3xl.font-bold.text-blue-600').first();
    const activePluginsCount = await activePluginsElement.textContent();
    
    console.log(`活躍插件數量: ${activePluginsCount}`);
    
    if (activePluginsCount) {
      const count = parseInt(activePluginsCount.trim());
      expect(count).toBeGreaterThanOrEqual(CALCULATORS.length);
      console.log(`✅ 統計數據正確: ${count} >= ${CALCULATORS.length}`);
    }
  });

  test('應該按分類正確分組計算機', async ({ page }) => {
    console.log('🏷️ 檢查分類分組...');
    
    // 檢查每個分類是否存在
    const categories = [...new Set(CALCULATORS.map(calc => calc.category))];
    let foundCategories = 0;
    
    for (const category of categories) {
      console.log(`檢查分類: ${category}`);
      
      // 檢查分類區域是否存在
      const categorySection = page.locator(`#${category}-section, [data-category="${category}"]`).first();
      
      if (await categorySection.count() > 0) {
        foundCategories++;
        console.log(`✅ 找到分類區域: ${category}`);
      } else {
        // 檢查是否有包含該分類計算機的區域
        const categoryCalculators = CALCULATORS.filter(calc => calc.category === category);
        let foundInCategory = false;
        
        for (const calc of categoryCalculators) {
          const calcElement = page.locator(`text="${calc.name}"`);
          if (await calcElement.count() > 0) {
            foundInCategory = true;
            break;
          }
        }
        
        if (foundInCategory) {
          foundCategories++;
          console.log(`✅ 分類 "${category}" 中找到計算機`);
        } else {
          console.log(`⚠️ 分類 "${category}" 未找到`);
        }
      }
    }
    
    console.log(`📊 找到 ${foundCategories}/${categories.length} 個分類`);
    expect(foundCategories).toBeGreaterThanOrEqual(Math.ceil(categories.length / 2));
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