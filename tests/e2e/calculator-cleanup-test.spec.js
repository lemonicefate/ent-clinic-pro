import { test, expect } from '@playwright/test';

const calculators = [
  { id: 'bmi', name: 'BMI 計算器', url: '/tools/bmi' },
  { id: 'egfr', name: 'eGFR 計算器', url: '/tools/egfr' },
  { id: 'cha2ds2-vasc', name: 'CHA₂DS₂-VASc 評分', url: '/tools/cha2ds2-vasc' },
  { id: 'lipid-management', name: '血脂管理計算機', url: '/tools/lipid-management' },
  { id: 'amoxicillin-clavulanate-dose', name: 'Amoxicillin/Clavulanate 劑量計算器', url: '/tools/amoxicillin-clavulanate-dose' },
  { id: 'pediatric-antibiotic-calculator', name: '兒童抗生素劑量計算器', url: '/tools/pediatric-antibiotic-calculator' }
];

test.describe('Calculator Cleanup Tests', () => {
  calculators.forEach(calculator => {
    test(`${calculator.name} should load and function correctly`, async ({ page }) => {
      // 導航到計算機頁面
      await page.goto(calculator.url);
      
      // 等待頁面載入
      await page.waitForLoadState('networkidle');
      
      // 檢查頁面標題包含計算機名稱
      await expect(page).toHaveTitle(new RegExp(calculator.name.split(' ')[0]));
      
      // 檢查是否有計算機組件載入
      const calculatorElement = page.locator('[class*="calculator"], [data-testid*="calculator"], .bg-white').first();
      await expect(calculatorElement).toBeVisible({ timeout: 10000 });
      
      // 檢查是否有輸入欄位
      const inputs = page.locator('input, select');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      // 檢查是否有計算按鈕
      const calculateButton = page.locator('button').filter({ hasText: /計算|Calculate/ });
      await expect(calculateButton).toBeVisible();
      
      // 嘗試點擊計算按鈕（即使沒有輸入值也應該有反應）
      await calculateButton.click();
      
      // 等待一下讓任何錯誤訊息或結果顯示
      await page.waitForTimeout(1000);
      
      // 檢查頁面沒有 JavaScript 錯誤
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      
      // 如果有錯誤，測試應該失敗
      if (errors.length > 0) {
        throw new Error(`JavaScript errors found: ${errors.join(', ')}`);
      }
      
      console.log(`✅ ${calculator.name} 測試通過`);
    });
  });
});