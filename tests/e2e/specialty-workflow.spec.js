/**
 * 專科特定工作流程測試
 * 測試不同醫學專科的特定審核流程和要求
 */

import { test, expect } from '@playwright/test';

const SPECIALTIES_CONFIG = {
  cardiology: {
    name: '心臟科',
    requiredSections: ['症狀識別', '診斷方法', '治療策略', '預防措施'],
    customFields: ['心律分類'],
    reviewerRoles: ['cardiologist', 'medical-editor'],
    requiredApprovals: 2,
    reviewTimeLimit: 7
  },
  pediatrics: {
    name: '小兒科',
    requiredSections: ['年齡分組', '症狀描述', '家長指導', '緊急處理'],
    customFields: ['適用年齡', '體重範圍'],
    reviewerRoles: ['pediatrician', 'medical-editor'],
    requiredApprovals: 2,
    reviewTimeLimit: 5
  },
  neurology: {
    name: '神經科',
    requiredSections: ['神經學檢查', '影像診斷', '治療方案', '復健指導'],
    customFields: ['神經功能評估'],
    reviewerRoles: ['neurologist', 'medical-editor', 'rehabilitation-specialist'],
    requiredApprovals: 3,
    reviewTimeLimit: 10
  }
};

test.describe('專科特定工作流程測試', () => {
  
  test('心臟科文章工作流程測試', async ({ browser }) => {
    const specialty = SPECIALTIES_CONFIG.cardiology;
    await testSpecialtyWorkflow(browser, 'cardiology', specialty);
  });

  test('小兒科文章工作流程測試', async ({ browser }) => {
    const specialty = SPECIALTIES_CONFIG.pediatrics;
    await testSpecialtyWorkflow(browser, 'pediatrics', specialty);
  });

  test('神經科文章工作流程測試', async ({ browser }) => {
    const specialty = SPECIALTIES_CONFIG.neurology;
    await testSpecialtyWorkflow(browser, 'neurology', specialty);
  });

  test('專科模板和檢查清單驗證', async ({ page }) => {
    await test.step('登入 CMS 並測試專科模板', async () => {
      await page.goto('http://localhost:3000/admin');
      await page.fill('[name="email"]', 'test-writer@example.com');
      await page.fill('[name="password"]', 'test-password-123');
      await page.click('button[type="submit"]');
      
      await page.click('[data-testid="nav-education-articles"]');
      await page.click('[data-testid="create-new-article"]');
    });

    // 測試每個專科的模板
    for (const [specialtyKey, specialtyConfig] of Object.entries(SPECIALTIES_CONFIG)) {
      await test.step(`測試 ${specialtyConfig.name} 專科模板`, async () => {
        // 選擇專科
        await page.selectOption('[name="specialty"]', specialtyKey);
        
        // 等待模板載入
        await page.waitForTimeout(1000);
        
        // 驗證必要章節是否出現
        for (const section of specialtyConfig.requiredSections) {
          await expect(page.locator(`[data-testid="required-section-${section}"]`))
            .toBeVisible();
        }
        
        // 驗證自定義欄位
        for (const field of specialtyConfig.customFields) {
          await expect(page.locator(`[data-testid="custom-field-${field}"]`))
            .toBeVisible();
        }
        
        // 驗證審核者資訊顯示
        await expect(page.locator('[data-testid="reviewer-info"]'))
          .toContainText(`需要 ${specialtyConfig.requiredApprovals} 位審核者批准`);
        
        await expect(page.locator('[data-testid="review-timeline"]'))
          .toContainText(`審核時限：${specialtyConfig.reviewTimeLimit} 天`);
      });
    }
  });

  test('專科特定品質檢查測試', async ({ page }) => {
    await test.step('測試心臟科特定品質檢查', async () => {
      await page.goto('http://localhost:3000/admin');
      await page.fill('[name="email"]', 'test-admin@example.com');
      await page.fill('[name="password"]', 'admin-password-123');
      await page.click('button[type="submit"]');
      
      // 建立心臟科測試文章
      await page.click('[data-testid="nav-education-articles"]');
      await page.click('[data-testid="create-new-article"]');
      
      await page.fill('[name="title.zh_TW"]', '心房顫動診斷與治療指南');
      await page.selectOption('[name="specialty"]', 'cardiology');
      
      // 填寫心臟科特定內容
      const cardiologyContent = `
# 心房顫動診斷與治療指南

## 症狀識別
- 心悸、胸悶
- 呼吸困難
- 疲勞感

## 診斷方法
- 心電圖檢查
- 24小時心電圖監測
- 心臟超音波

## 治療策略
- 抗凝血治療
- 心律控制
- 心室率控制

## 預防措施
- 定期追蹤
- 生活型態調整
- 藥物遵從性
      `;
      
      await page.fill('[data-testid="content-editor"]', cardiologyContent);
      
      // 填寫心臟科特定欄位
      await page.selectOption('[name="heart-rhythm-classification"]', '心房顫動');
      
      // 提交審核
      await page.selectOption('[name="status"]', 'in-review');
      await page.click('[data-testid="save-changes"]');
      
      // 等待品質檢查完成
      await page.waitForSelector('[data-testid="quality-check-completed"]', { timeout: 30000 });
      
      // 驗證心臟科特定檢查項目
      const cardiologyChecks = [
        'guideline-compliance-check',
        'evidence-level-check',
        'drug-interaction-check',
        'contraindication-check'
      ];
      
      for (const check of cardiologyChecks) {
        await expect(page.locator(`[data-testid="${check}"]`))
          .toHaveAttribute('data-status', 'passed');
      }
    });
  });

  test('多專科審核者分配測試', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    try {
      await test.step('測試神經科多重審核者分配', async () => {
        await adminPage.goto('http://localhost:3000/admin');
        await adminPage.fill('[name="email"]', 'test-admin@example.com');
        await adminPage.fill('[name="password"]', 'admin-password-123');
        await adminPage.click('button[type="submit"]');
        
        // 建立神經科文章
        await adminPage.click('[data-testid="nav-education-articles"]');
        await adminPage.click('[data-testid="create-new-article"]');
        
        await adminPage.fill('[name="title.zh_TW"]', '腦中風急性期處理');
        await adminPage.selectOption('[name="specialty"]', 'neurology');
        
        const neurologyContent = `
# 腦中風急性期處理

## 神經學檢查
- NIHSS 評估
- 意識狀態評估
- 肢體功能檢查

## 影像診斷
- 電腦斷層掃描
- 磁振造影檢查
- 血管攝影

## 治療方案
- 血栓溶解治療
- 血管內治療
- 抗血小板治療

## 復健指導
- 早期復健介入
- 語言治療
- 職能治療
        `;
        
        await adminPage.fill('[data-testid="content-editor"]', neurologyContent);
        
        // 提交審核
        await adminPage.selectOption('[name="status"]', 'in-review');
        await adminPage.click('[data-testid="save-changes"]');
        
        // 驗證已分配 3 位審核者（神經科醫師、醫學編輯、復健專家）
        await expect(adminPage.locator('[data-testid="assigned-reviewers"]'))
          .toContainText('3 位審核者');
        
        // 驗證審核者角色
        const expectedRoles = ['neurologist', 'medical-editor', 'rehabilitation-specialist'];
        for (const role of expectedRoles) {
          await expect(adminPage.locator(`[data-testid="reviewer-role-${role}"]`))
            .toBeVisible();
        }
        
        // 驗證審核時限
        await expect(adminPage.locator('[data-testid="review-deadline"]'))
          .toContainText('10 天');
      });
      
    } finally {
      await adminContext.close();
    }
  });

  test('專科間文章轉移測試', async ({ page }) => {
    await test.step('測試文章專科分類變更', async () => {
      await page.goto('http://localhost:3000/admin');
      await page.fill('[name="email"]', 'test-admin@example.com');
      await page.fill('[name="password"]', 'admin-password-123');
      await page.click('button[type="submit"]');
      
      // 建立一篇心臟科文章
      await page.click('[data-testid="nav-education-articles"]');
      await page.click('[data-testid="create-new-article"]');
      
      await page.fill('[name="title.zh_TW"]', '胸痛評估指南');
      await page.selectOption('[name="specialty"]', 'cardiology');
      await page.fill('[data-testid="content-editor"]', '心臟科胸痛評估內容...');
      await page.click('[data-testid="save-draft"]');
      
      // 變更專科分類為急診科
      await page.selectOption('[name="specialty"]', 'emergency');
      
      // 驗證模板和欄位已更新
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="specialty-template-emergency"]')).toBeVisible();
      
      // 驗證審核者已重新分配
      await expect(page.locator('[data-testid="reviewer-reassignment-notice"]'))
        .toContainText('專科變更，審核者將重新分配');
      
      await page.click('[data-testid="save-changes"]');
      
      // 驗證變更已生效
      await expect(page.locator('[data-testid="current-specialty"]')).toContainText('急診科');
    });
  });
});

/**
 * 通用專科工作流程測試函數
 */
async function testSpecialtyWorkflow(browser, specialtyKey, specialtyConfig) {
  const writerContext = await browser.newContext();
  const reviewerContext = await browser.newContext();
  
  const writerPage = await writerContext.newPage();
  const reviewerPage = await reviewerContext.newPage();
  
  const articleTitle = `${specialtyConfig.name}測試文章 ${Date.now()}`;
  
  try {
    // 撰寫者建立專科特定文章
    await test.step(`建立${specialtyConfig.name}文章`, async () => {
      await writerPage.goto('http://localhost:3000/admin');
      await writerPage.fill('[name="email"]', 'test-writer@example.com');
      await writerPage.fill('[name="password"]', 'test-password-123');
      await writerPage.click('button[type="submit"]');
      
      await writerPage.click('[data-testid="nav-education-articles"]');
      await writerPage.click('[data-testid="create-new-article"]');
      
      await writerPage.fill('[name="title.zh_TW"]', articleTitle);
      await writerPage.selectOption('[name="specialty"]', specialtyKey);
      
      // 等待專科模板載入
      await writerPage.waitForTimeout(1000);
      
      // 填寫必要章節
      for (const section of specialtyConfig.requiredSections) {
        await writerPage.fill(`[data-testid="section-${section}"]`, `${section}的測試內容`);
      }
      
      // 填寫自定義欄位
      for (const field of specialtyConfig.customFields) {
        await writerPage.fill(`[data-testid="field-${field}"]`, '測試值');
      }
      
      await writerPage.click('[data-testid="save-draft"]');
      await writerPage.selectOption('[name="status"]', 'in-review');
      await writerPage.click('[data-testid="save-changes"]');
    });
    
    // 驗證審核者分配
    await test.step(`驗證${specialtyConfig.name}審核者分配`, async () => {
      await expect(writerPage.locator('[data-testid="assigned-reviewers"]'))
        .toContainText(`${specialtyConfig.requiredApprovals} 位審核者`);
      
      // 驗證審核時限
      await expect(writerPage.locator('[data-testid="review-deadline"]'))
        .toContainText(`${specialtyConfig.reviewTimeLimit} 天`);
    });
    
    // 模擬審核過程
    await test.step(`模擬${specialtyConfig.name}審核過程`, async () => {
      await reviewerPage.goto('http://localhost:3000/admin');
      await reviewerPage.fill('[name="email"]', 'test-reviewer@example.com');
      await reviewerPage.fill('[name="password"]', 'reviewer-password-123');
      await reviewerPage.click('button[type="submit"]');
      
      await reviewerPage.click('[data-testid="nav-review-dashboard"]');
      
      // 找到待審核文章
      await reviewerPage.click(`text=${articleTitle}`);
      
      // 檢查專科特定檢查清單
      const specialtyChecks = getSpecialtySpecificChecks(specialtyKey);
      for (const check of specialtyChecks) {
        await reviewerPage.check(`[data-testid="check-${check}"]`);
      }
      
      await reviewerPage.fill('[data-testid="review-comments"]', 
        `${specialtyConfig.name}專科審核通過，內容符合專科要求。`);
      
      await reviewerPage.click('[data-testid="approve-article"]');
      await reviewerPage.click('[data-testid="confirm-approval"]');
    });
    
    // 驗證專科特定品質檢查
    await test.step(`驗證${specialtyConfig.name}品質檢查`, async () => {
      // 等待品質檢查完成
      await writerPage.waitForSelector('[data-testid="quality-check-completed"]', { timeout: 60000 });
      
      // 驗證專科特定檢查項目
      const qualityChecks = getSpecialtyQualityChecks(specialtyKey);
      for (const check of qualityChecks) {
        await expect(writerPage.locator(`[data-testid="quality-${check}"]`))
          .toHaveAttribute('data-status', 'passed');
      }
    });
    
  } finally {
    await writerContext.close();
    await reviewerContext.close();
  }
}

/**
 * 取得專科特定檢查項目
 */
function getSpecialtySpecificChecks(specialty) {
  const checks = {
    cardiology: [
      'guideline-compliance',
      'drug-interactions',
      'contraindications',
      'evidence-level'
    ],
    pediatrics: [
      'age-appropriateness',
      'dosage-accuracy',
      'safety-warnings',
      'parent-guidance'
    ],
    neurology: [
      'neurological-accuracy',
      'imaging-interpretation',
      'rehabilitation-protocols',
      'emergency-procedures'
    ]
  };
  
  return checks[specialty] || [];
}

/**
 * 取得專科特定品質檢查項目
 */
function getSpecialtyQualityChecks(specialty) {
  const checks = {
    cardiology: [
      'cardiac-terminology',
      'ecg-interpretation',
      'medication-accuracy',
      'risk-stratification'
    ],
    pediatrics: [
      'age-specific-content',
      'growth-charts',
      'vaccination-schedule',
      'developmental-milestones'
    ],
    neurology: [
      'neuroanatomy-accuracy',
      'diagnostic-criteria',
      'treatment-protocols',
      'prognosis-information'
    ]
  };
  
  return checks[specialty] || [];
}