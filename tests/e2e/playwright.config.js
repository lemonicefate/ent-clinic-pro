/**
 * Playwright 端到端測試配置
 * 用於統一計算機架構和完整工作流程測試
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 測試目錄
  testDir: './tests/e2e',
  
  // 全域測試超時時間 (30 秒)
  timeout: 30000,
  
  // 期望超時時間 (5 秒)
  expect: {
    timeout: 5000
  },
  
  // 測試執行配置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 報告器配置
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // 全域設定
  use: {
    // 基礎 URL
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    
    // 瀏覽器設定
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // 截圖和錄影設定
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // 等待設定
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // 測試專案配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // 行動裝置測試
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // 平板測試
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    }
  ],
  
  // 網頁伺服器配置 (用於本地測試)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 4321,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  
  // 輸出目錄
  outputDir: 'test-results/e2e-artifacts',
  
  // 全域設置和拆除
  globalSetup: require.resolve('./tests/setup/global-setup.ts'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.ts'),
});