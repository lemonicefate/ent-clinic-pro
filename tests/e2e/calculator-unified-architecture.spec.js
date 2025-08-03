/**
 * 統一計算機架構端到端測試
 * 測試新的模組化計算機系統的完整功能
 */

import { test, expect } from '@playwright/test';

// 測試配置
const TEST_CONFIG = {
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4321',
  calculators: [
    {
      id: 'bmi',
      name: 'BMI 計算機',
      url: '/tools/bmi',
      testInputs: {
        height: '170',
        weight: '70',
        age: '30',
        gender: 'male'
      },
      expectedResults: {
        bmi: '24.2',
        category: '正常體重'
      }
    },
    {
      id: 'egfr',
      name: 'eGFR 計算機',
      url: '/tools/egfr',
      testInputs: {
        age: '45',
        gender: 'female',
        creatinine: '1.0'
      },
      expectedResults: {
        egfr: /\d+/,
        stage: /G[1-5]/
      }
    },
    {
      id: 'cha2ds2-vasc',
      name: 'CHA₂DS₂-VASc 計算機',
      url: '/tools/cha2ds2-vasc',
      testInputs: {
        age: '75',
        gender: 'female',
        chf: true,
        hypertension: true,
        diabetes: false,
        stroke: false,
        vascular: false
      },
      expectedResults: {
        score: /[0-9]/,
        risk: /(低|中|高)/
      }
    }
  ]
};

test.describe('統一計算機架構端到端測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 設置測試環境
    await page.goto(TEST_CONFIG.frontendUrl);
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
  });

  test('計算機列表頁面顯示所有統一架構計算機', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.frontendUrl}/tools`);
    
    // 驗證頁面標題
    await expect(page.locator('h1')).toContainText('醫療計算工具');
    
    // 驗證所有統一架構計算機都顯示在列表中
    for (const calculator of TEST_CONFIG.calculators) {
      await expect(page.locator(`[data-testid="calculator-card-${calculator.id}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="calculator-title-${calculator.id}"]`)).toContainText(calculator.name);
    }
    
    // 驗證計算機卡片包含必要資訊
    const firstCalculator = TEST_CONFIG.calculators[0];
    const calculatorCard = page.locator(`[data-testid="calculator-card-${firstCalculator.id}"]`);
    
    await expect(calculatorCard.locator('[data-testid="calculator-description"]')).toBeVisible();
    await expect(calculatorCard.locator('[data-testid="calculator-category"]')).toBeVisible();
    await expect(calculatorCard.locator('[data-testid="calculator-link"]')).toBeVisible();
  });

  // 為每個計算機創建獨立的測試
  for (const calculator of TEST_CONFIG.calculators) {
    test(`${calculator.name} - 完整功能測試`, async ({ page }) => {
      await page.goto(`${TEST_CONFIG.frontendUrl}${calculator.url}`);
      
      // 驗證頁面載入
      await expect(page.locator('h1')).toContainText(calculator.name);
      
      // 驗證計算機容器載入
      await expect(page.locator('[data-testid="calculator-container"]')).toBeVisible();
      
      // 驗證表單組件載入
      await expect(page.locator('[data-testid="calculator-form"]')).toBeVisible();
      
      // 填寫測試輸入
      await fillCalculatorInputs(page, calculator);
      
      // 提交計算
      await page.click('[data-testid="calculate-button"]');
      
      // 等待計算完成
      await page.waitForSelector('[data-testid="calculator-results"]', { timeout: 10000 });
      
      // 驗證結果顯示
      await expect(page.locator('[data-testid="calculator-results"]')).toBeVisible();
      
      // 驗證結果內容
      await validateCalculatorResults(page, calculator);
      
      // 測試重置功能
      await page.click('[data-testid="reset-button"]');
      await expect(page.locator('[data-testid="calculator-results"]')).not.toBeVisible();
      
      // 驗證表單已重置
      await validateFormReset(page, calculator);
    });

    test(`${calculator.name} - 錯誤處理測試`, async ({ page }) => {
      await page.goto(`${TEST_CONFIG.frontendUrl}${calculator.url}`);
      
      // 測試空值提交
      await page.click('[data-testid="calculate-button"]');
      
      // 驗證錯誤訊息顯示
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
      
      // 測試無效輸入
      await fillInvalidInputs(page, calculator);
      await page.click('[data-testid="calculate-button"]');
      
      // 驗證特定欄位錯誤訊息
      await expect(page.locator('[data-testid="field-error"]')).toHaveCount({ min: 1 });
      
      // 驗證錯誤邊界功能
      // 注入錯誤來測試錯誤邊界
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('calculator-error', {
          detail: { message: 'Test error for error boundary' }
        }));
      });
      
      // 驗證錯誤邊界顯示
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    });

    test(`${calculator.name} - 多語言支援測試`, async ({ page }) => {
      // 測試中文版本
      await page.goto(`${TEST_CONFIG.frontendUrl}${calculator.url}`);
      await expect(page.locator('h1')).toContainText(calculator.name);
      
      // 切換到英文版本
      await page.goto(`${TEST_CONFIG.frontendUrl}/en${calculator.url}`);
      await expect(page.locator('h1')).toBeVisible();
      
      // 驗證英文介面元素
      await expect(page.locator('[data-testid="calculate-button"]')).toContainText(/Calculate|計算/i);
      
      // 切換到日文版本
      await page.goto(`${TEST_CONFIG.frontendUrl}/ja${calculator.url}`);
      await expect(page.locator('h1')).toBeVisible();
    });

    test(`${calculator.name} - 響應式設計測試`, async ({ page }) => {
      await page.goto(`${TEST_CONFIG.frontendUrl}${calculator.url}`);
      
      // 測試桌面版本
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(page.locator('[data-testid="calculator-container"]')).toBeVisible();
      
      // 測試平板版本
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="calculator-container"]')).toBeVisible();
      
      // 測試手機版本
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="calculator-container"]')).toBeVisible();
      
      // 驗證手機版本的表單佈局
      await expect(page.locator('[data-testid="calculator-form"]')).toHaveCSS('flex-direction', 'column');
    });
  }

  test('計算機模組隔離測試', async ({ page }) => {
    // 測試在一個頁面中載入多個計算機不會互相影響
    await page.goto(`${TEST_CONFIG.frontendUrl}/tools/bmi`);
    
    // 填寫 BMI 計算機
    await page.fill('[name="height"]', '170');
    await page.fill('[name="weight"]', '70');
    
    // 在新標籤頁開啟另一個計算機
    const newPage = await page.context().newPage();
    await newPage.goto(`${TEST_CONFIG.frontendUrl}/tools/egfr`);
    
    // 填寫 eGFR 計算機
    await newPage.fill('[name="age"]', '45');
    await newPage.fill('[name="creatinine"]', '1.0');
    
    // 驗證兩個計算機的狀態互不影響
    await page.bringToFront();
    await expect(page.locator('[name="height"]')).toHaveValue('170');
    await expect(page.locator('[name="weight"]')).toHaveValue('70');
    
    await newPage.bringToFront();
    await expect(newPage.locator('[name="age"]')).toHaveValue('45');
    await expect(newPage.locator('[name="creatinine"]')).toHaveValue('1.0');
    
    await newPage.close();
  });

  test('計算機註冊表功能測試', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.frontendUrl}/tools`);
    
    // 檢查計算機註冊表是否正確載入所有模組
    const registryInfo = await page.evaluate(() => {
      return window.calculatorRegistry ? {
        moduleCount: window.calculatorRegistry.getModuleCount(),
        availableModules: window.calculatorRegistry.getAvailableModules()
      } : null;
    });
    
    if (registryInfo) {
      expect(registryInfo.moduleCount).toBeGreaterThanOrEqual(3);
      expect(registryInfo.availableModules).toContain('bmi');
      expect(registryInfo.availableModules).toContain('egfr');
      expect(registryInfo.availableModules).toContain('cha2ds2-vasc');
    }
  });

  test('效能測試 - 計算機載入時間', async ({ page }) => {
    for (const calculator of TEST_CONFIG.calculators) {
      const startTime = Date.now();
      
      await page.goto(`${TEST_CONFIG.frontendUrl}${calculator.url}`);
      await page.waitForSelector('[data-testid="calculator-container"]');
      
      const loadTime = Date.now() - startTime;
      
      // 驗證載入時間小於 3 秒
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`${calculator.name} 載入時間: ${loadTime}ms`);
    }
  });

  test('無障礙性測試', async ({ page }) => {
    for (const calculator of TEST_CONFIG.calculators) {
      await page.goto(`${TEST_CONFIG.frontendUrl}${calculator.url}`);
      
      // 檢查頁面標題
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // 檢查主要標題的 heading 結構
      await expect(page.locator('h1')).toBeVisible();
      
      // 檢查表單標籤
      const formFields = await page.locator('[data-testid="calculator-form"] input, [data-testid="calculator-form"] select').all();
      for (const field of formFields) {
        const fieldId = await field.getAttribute('id');
        if (fieldId) {
          await expect(page.locator(`label[for="${fieldId}"]`)).toBeVisible();
        }
      }
      
      // 檢查按鈕的可存取性
      await expect(page.locator('[data-testid="calculate-button"]')).toHaveAttribute('type', 'submit');
      
      // 檢查鍵盤導航
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
    }
  });
});

// 輔助函數
async function fillCalculatorInputs(page, calculator) {
  const inputs = calculator.testInputs;
  
  for (const [fieldName, value] of Object.entries(inputs)) {
    if (typeof value === 'boolean') {
      if (value) {
        await page.check(`[name="${fieldName}"]`);
      }
    } else if (typeof value === 'string') {
      const field = page.locator(`[name="${fieldName}"]`);
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await page.selectOption(`[name="${fieldName}"]`, value);
      } else {
        await page.fill(`[name="${fieldName}"]`, value);
      }
    }
  }
}

async function validateCalculatorResults(page, calculator) {
  const expectedResults = calculator.expectedResults;
  
  for (const [resultKey, expectedValue] of Object.entries(expectedResults)) {
    const resultElement = page.locator(`[data-testid="result-${resultKey}"]`);
    
    if (expectedValue instanceof RegExp) {
      await expect(resultElement).toHaveText(expectedValue);
    } else {
      await expect(resultElement).toContainText(expectedValue);
    }
  }
}

async function fillInvalidInputs(page, calculator) {
  // 填寫無效的輸入值來測試驗證
  const invalidInputs = {
    bmi: {
      height: '-10',
      weight: '0',
      age: '200'
    },
    egfr: {
      age: '0',
      creatinine: '-1'
    },
    'cha2ds2-vasc': {
      age: '300'
    }
  };
  
  const inputs = invalidInputs[calculator.id] || {};
  
  for (const [fieldName, value] of Object.entries(inputs)) {
    await page.fill(`[name="${fieldName}"]`, value);
  }
}

async function validateFormReset(page, calculator) {
  const inputs = calculator.testInputs;
  
  for (const fieldName of Object.keys(inputs)) {
    const field = page.locator(`[name="${fieldName}"]`);
    const tagName = await field.evaluate(el => el.tagName.toLowerCase());
    
    if (tagName === 'input') {
      const inputType = await field.getAttribute('type');
      if (inputType === 'checkbox') {
        await expect(field).not.toBeChecked();
      } else {
        await expect(field).toHaveValue('');
      }
    } else if (tagName === 'select') {
      const selectedValue = await field.inputValue();
      expect(selectedValue).toBe('');
    }
  }
}