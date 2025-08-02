// Decap CMS 模板系統
// 提供專科特定的內容模板和編輯器預設值

// 載入模板配置
let templateConfig = null;

// 初始化模板系統
async function initTemplateSystem() {
  try {
    const response = await fetch('/src/content/templates/template-config.json');
    templateConfig = await response.json();
    console.log('Template system initialized:', templateConfig);
  } catch (error) {
    console.error('Failed to load template config:', error);
  }
}

// 根據專科獲取模板
function getTemplateBySpecialty(specialty) {
  if (!templateConfig || !templateConfig.templates[specialty]) {
    return null;
  }
  return templateConfig.templates[specialty];
}

// 載入模板內容
async function loadTemplateContent(templateFile) {
  try {
    const response = await fetch(`/src/content/templates/${templateFile}`);
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Failed to load template content:', error);
    return null;
  }
}

// 自動填充預設值
function applyTemplateDefaults(specialty, currentData = {}) {
  const template = getTemplateBySpecialty(specialty);
  if (!template) return currentData;

  const defaults = template.defaultValues;
  const merged = { ...currentData };

  // 應用預設值，但不覆蓋已存在的值
  Object.keys(defaults).forEach(key => {
    if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      merged[key] = defaults[key];
    }
  });

  // 特殊處理專科特定欄位
  if (defaults.specialtySpecific && !merged.specialtySpecific) {
    merged.specialtySpecific = { ...defaults.specialtySpecific };
  }

  return merged;
}

// 生成 SEO 建議
function generateSEOSuggestions(specialty, title, excerpt) {
  const template = getTemplateBySpecialty(specialty);
  if (!template) return {};

  const seoDefaults = template.seoDefaults;
  const suggestions = {};

  // 生成 SEO 標題
  if (title && seoDefaults.titleSuffix) {
    const baseTitle = typeof title === 'object' ? title.zh_TW || title.en : title;
    suggestions.seoTitle = {
      zh_TW: baseTitle + seoDefaults.titleSuffix,
      en: baseTitle + ' | Medical Platform',
      ja: baseTitle + ' | 医療プラットフォーム'
    };
  }

  // 生成 SEO 描述
  if (excerpt && seoDefaults.descriptionTemplate) {
    const baseExcerpt = typeof excerpt === 'object' ? excerpt.zh_TW || excerpt.en : excerpt;
    if (baseExcerpt) {
      const description = seoDefaults.descriptionTemplate.replace('{主題}', baseTitle || '相關主題');
      suggestions.seoDescription = {
        zh_TW: description,
        en: `Professional medical information including ${baseTitle || 'relevant topics'}. Reviewed by medical specialists.`,
        ja: `${baseTitle || '関連トピック'}を含む専門的な医療情報。医療専門家による審査。`
      };
    }
  }

  // 建議關鍵字
  if (seoDefaults.keywords) {
    suggestions.keywords = [...seoDefaults.keywords];
  }

  return suggestions;
}

// 內容品質檢查
function performQualityCheck(content, specialty) {
  const template = getTemplateBySpecialty(specialty);
  if (!template) return { valid: true, issues: [] };

  const issues = [];
  const guidelines = template.contentGuidelines;

  // 檢查字數
  if (content && guidelines) {
    const wordCount = content.replace(/\s+/g, '').length;
    if (wordCount < guidelines.minWords) {
      issues.push(`內容過短，建議至少 ${guidelines.minWords} 字（目前：${wordCount} 字）`);
    }
    if (wordCount > guidelines.maxWords) {
      issues.push(`內容過長，建議不超過 ${guidelines.maxWords} 字（目前：${wordCount} 字）`);
    }
  }

  // 檢查必要章節
  if (content && template.requiredSections) {
    const missingSection = template.requiredSections.find(section => 
      !content.toLowerCase().includes(section.toLowerCase())
    );
    if (missingSection) {
      issues.push(`缺少必要章節：${missingSection}`);
    }
  }

  // 檢查圖片替代文字
  if (content) {
    const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g;
    const images = content.match(imageRegex) || [];
    const imagesWithoutAlt = images.filter(img => {
      const altMatch = img.match(/!\[([^\]]*)\]/);
      return !altMatch || !altMatch[1].trim();
    });
    
    if (imagesWithoutAlt.length > 0) {
      issues.push(`發現 ${imagesWithoutAlt.length} 張圖片缺少替代文字`);
    }
  }

  return {
    valid: issues.length === 0,
    issues: issues
  };
}

// 自動標籤建議
function suggestTags(content, specialty) {
  const template = getTemplateBySpecialty(specialty);
  if (!template) return [];

  const defaultTags = template.defaultValues.tags || [];
  const seoKeywords = template.seoDefaults?.keywords || [];
  
  if (!content) return defaultTags;

  const contentLower = content.toLowerCase();
  const suggestedTags = [...defaultTags];

  // 根據內容添加相關標籤
  seoKeywords.forEach(keyword => {
    if (contentLower.includes(keyword.toLowerCase()) && !suggestedTags.includes(keyword)) {
      suggestedTags.push(keyword);
    }
  });

  return suggestedTags.slice(0, 10); // 最多10個標籤
}

// 模板選擇器 UI
function createTemplateSelector() {
  if (!templateConfig) return null;

  const selector = document.createElement('div');
  selector.className = 'template-selector';
  selector.innerHTML = `
    <div class="template-selector-header">
      <h3>選擇內容模板</h3>
      <p>根據醫療專科選擇適合的內容模板</p>
    </div>
    <div class="template-options">
      ${Object.entries(templateConfig.templates).map(([key, template]) => `
        <div class="template-option" data-specialty="${key}">
          <h4>${template.name}</h4>
          <p>目標字數: ${template.contentGuidelines.minWords}-${template.contentGuidelines.maxWords}字</p>
          <p>目標讀者: ${template.contentGuidelines.targetAudience}</p>
          <ul class="required-sections">
            ${template.requiredSections.map(section => `<li>${section}</li>`).join('')}
          </ul>
          <button class="apply-template-btn" data-specialty="${key}">使用此模板</button>
        </div>
      `).join('')}
    </div>
  `;

  // 添加事件監聽器
  selector.addEventListener('click', (e) => {
    if (e.target.classList.contains('apply-template-btn')) {
      const specialty = e.target.dataset.specialty;
      applyTemplate(specialty);
    }
  });

  return selector;
}

// 應用模板
async function applyTemplate(specialty) {
  const template = getTemplateBySpecialty(specialty);
  if (!template) return;

  try {
    // 載入模板內容
    const templateContent = await loadTemplateContent(template.templateFile);
    if (!templateContent) return;

    // 應用預設值到表單
    const currentData = getCurrentFormData();
    const mergedData = applyTemplateDefaults(specialty, currentData);
    
    // 更新表單欄位
    updateFormFields(mergedData);
    
    // 設定內容
    if (templateContent) {
      updateContentField(templateContent);
    }

    // 生成 SEO 建議
    const seoSuggestions = generateSEOSuggestions(specialty, mergedData.title, mergedData.excerpt);
    if (Object.keys(seoSuggestions).length > 0) {
      showSEOSuggestions(seoSuggestions);
    }

    // 顯示成功訊息
    showNotification(`已應用 ${template.name} 模板`, 'success');
    
  } catch (error) {
    console.error('Failed to apply template:', error);
    showNotification('模板應用失敗', 'error');
  }
}

// 獲取當前表單資料
function getCurrentFormData() {
  // 這裡需要根據實際的 CMS 表單結構來實現
  // 暫時返回空物件
  return {};
}

// 更新表單欄位
function updateFormFields(data) {
  // 這裡需要根據實際的 CMS 表單結構來實現
  console.log('Updating form fields with:', data);
}

// 更新內容欄位
function updateContentField(content) {
  // 這裡需要根據實際的 CMS 編輯器來實現
  console.log('Updating content field with template');
}

// 顯示 SEO 建議
function showSEOSuggestions(suggestions) {
  const suggestionPanel = document.createElement('div');
  suggestionPanel.className = 'seo-suggestions';
  suggestionPanel.innerHTML = `
    <div class="seo-suggestions-header">
      <h4>SEO 建議</h4>
      <button class="close-suggestions">×</button>
    </div>
    <div class="seo-suggestions-content">
      ${suggestions.seoTitle ? `
        <div class="suggestion-item">
          <label>建議 SEO 標題:</label>
          <p>${suggestions.seoTitle.zh_TW}</p>
          <button class="apply-suggestion" data-field="seoTitle" data-value='${JSON.stringify(suggestions.seoTitle)}'>套用</button>
        </div>
      ` : ''}
      ${suggestions.seoDescription ? `
        <div class="suggestion-item">
          <label>建議 SEO 描述:</label>
          <p>${suggestions.seoDescription.zh_TW}</p>
          <button class="apply-suggestion" data-field="seoDescription" data-value='${JSON.stringify(suggestions.seoDescription)}'>套用</button>
        </div>
      ` : ''}
      ${suggestions.keywords ? `
        <div class="suggestion-item">
          <label>建議關鍵字:</label>
          <p>${suggestions.keywords.join(', ')}</p>
          <button class="apply-suggestion" data-field="keywords" data-value='${JSON.stringify(suggestions.keywords)}'>套用</button>
        </div>
      ` : ''}
    </div>
  `;

  // 添加到頁面
  document.body.appendChild(suggestionPanel);

  // 添加事件監聽器
  suggestionPanel.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-suggestions')) {
      suggestionPanel.remove();
    } else if (e.target.classList.contains('apply-suggestion')) {
      const field = e.target.dataset.field;
      const value = JSON.parse(e.target.dataset.value);
      applySEOSuggestion(field, value);
      e.target.textContent = '已套用';
      e.target.disabled = true;
    }
  });
}

// 套用 SEO 建議
function applySEOSuggestion(field, value) {
  // 這裡需要根據實際的 CMS 表單結構來實現
  console.log(`Applying SEO suggestion for ${field}:`, value);
}

// 顯示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 內容品質檢查器
function createQualityChecker() {
  const checker = document.createElement('div');
  checker.className = 'quality-checker';
  checker.innerHTML = `
    <div class="quality-checker-header">
      <h4>內容品質檢查</h4>
      <button class="run-quality-check">執行檢查</button>
    </div>
    <div class="quality-results"></div>
  `;

  checker.addEventListener('click', (e) => {
    if (e.target.classList.contains('run-quality-check')) {
      runQualityCheck();
    }
  });

  return checker;
}

// 執行品質檢查
function runQualityCheck() {
  const content = getCurrentContent();
  const specialty = getCurrentSpecialty();
  
  if (!content || !specialty) {
    showNotification('請先選擇專科並輸入內容', 'warning');
    return;
  }

  const result = performQualityCheck(content, specialty);
  displayQualityResults(result);
}

// 顯示品質檢查結果
function displayQualityResults(result) {
  const resultsContainer = document.querySelector('.quality-results');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `
    <div class="quality-status ${result.valid ? 'valid' : 'invalid'}">
      ${result.valid ? '✅ 內容品質良好' : '⚠️ 發現品質問題'}
    </div>
    ${result.issues.length > 0 ? `
      <ul class="quality-issues">
        ${result.issues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
    ` : ''}
  `;
}

// 獲取當前內容
function getCurrentContent() {
  // 這裡需要根據實際的 CMS 編輯器來實現
  return '';
}

// 獲取當前專科
function getCurrentSpecialty() {
  // 這裡需要根據實際的 CMS 表單來實現
  return '';
}

// 初始化模板系統樣式
function initTemplateStyles() {
  const styles = `
    <style>
    .template-selector {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .template-selector-header h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }
    
    .template-selector-header p {
      margin: 0 0 20px 0;
      color: #6c757d;
    }
    
    .template-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }
    
    .template-option {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 16px;
      transition: border-color 0.2s;
    }
    
    .template-option:hover {
      border-color: #007bff;
    }
    
    .template-option h4 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }
    
    .template-option p {
      margin: 4px 0;
      font-size: 14px;
      color: #6c757d;
    }
    
    .required-sections {
      margin: 12px 0;
      padding-left: 20px;
    }
    
    .required-sections li {
      font-size: 13px;
      color: #495057;
      margin: 2px 0;
    }
    
    .apply-template-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .apply-template-btn:hover {
      background: #0056b3;
    }
    
    .seo-suggestions {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 500px;
      width: 90%;
      z-index: 1000;
    }
    
    .seo-suggestions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #dee2e6;
    }
    
    .seo-suggestions-header h4 {
      margin: 0;
      color: #2c3e50;
    }
    
    .close-suggestions {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6c757d;
    }
    
    .seo-suggestions-content {
      padding: 20px;
    }
    
    .suggestion-item {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f3f4;
    }
    
    .suggestion-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .suggestion-item label {
      display: block;
      font-weight: bold;
      margin-bottom: 4px;
      color: #2c3e50;
    }
    
    .suggestion-item p {
      margin: 0 0 8px 0;
      color: #495057;
      font-size: 14px;
    }
    
    .apply-suggestion {
      background: #28a745;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .apply-suggestion:hover {
      background: #218838;
    }
    
    .apply-suggestion:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 1001;
    }
    
    .notification-success {
      background: #28a745;
    }
    
    .notification-error {
      background: #dc3545;
    }
    
    .notification-warning {
      background: #ffc107;
      color: #212529;
    }
    
    .notification-info {
      background: #17a2b8;
    }
    
    .quality-checker {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .quality-checker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .quality-checker-header h4 {
      margin: 0;
      color: #2c3e50;
    }
    
    .run-quality-check {
      background: #17a2b8;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .run-quality-check:hover {
      background: #138496;
    }
    
    .quality-status {
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      font-weight: bold;
    }
    
    .quality-status.valid {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .quality-status.invalid {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .quality-issues {
      margin: 0;
      padding-left: 20px;
    }
    
    .quality-issues li {
      color: #721c24;
      margin: 4px 0;
    }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initTemplateSystem();
  initTemplateStyles();
});

// 匯出功能供外部使用
window.TemplateSystem = {
  init: initTemplateSystem,
  getTemplate: getTemplateBySpecialty,
  applyDefaults: applyTemplateDefaults,
  generateSEO: generateSEOSuggestions,
  qualityCheck: performQualityCheck,
  suggestTags: suggestTags,
  createSelector: createTemplateSelector,
  createQualityChecker: createQualityChecker
};