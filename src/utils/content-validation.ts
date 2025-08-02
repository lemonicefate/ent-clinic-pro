/**
 * 內容驗證工具
 * 用於驗證醫療內容的完整性和準確性
 */

import type { Calculator, EducationContent, Flowchart, MedicalSpecialty } from '../content/config';
import type { SupportedLocale } from '../env.d.ts';

/**
 * 驗證結果介面
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * 多語言字串驗證
 */
export function validateMultiLangString(
  obj: Record<string, string> | undefined,
  fieldName: string,
  requiredLocales: SupportedLocale[] = ['zh-TW', 'en', 'ja'],
  isRequired = true
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  if (!obj) {
    if (isRequired) {
      result.isValid = false;
      result.errors.push(`${fieldName} is required`);
    }
    return result;
  }

  // 檢查必要語言
  for (const locale of requiredLocales) {
    if (!obj[locale] || obj[locale].trim() === '') {
      result.warnings.push(`${fieldName} missing translation for ${locale}`);
    }
  }

  // 檢查內容長度一致性
  const lengths = Object.values(obj).map(text => text.length);
  const maxLength = Math.max(...lengths);
  const minLength = Math.min(...lengths);
  
  if (maxLength > minLength * 2) {
    result.warnings.push(`${fieldName} has significant length differences between languages`);
  }

  return result;
}

/**
 * 計算機內容驗證
 */
export function validateCalculator(calculator: Calculator): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // 基本欄位驗證
  if (!calculator.id || calculator.id.trim() === '') {
    result.isValid = false;
    result.errors.push('Calculator ID is required');
  }

  if (!calculator.slug || calculator.slug.trim() === '') {
    result.isValid = false;
    result.errors.push('Calculator slug is required');
  }

  // 多語言欄位驗證
  const nameValidation = validateMultiLangString(calculator.name, 'name');
  result.errors.push(...nameValidation.errors);
  result.warnings.push(...nameValidation.warnings);

  const descValidation = validateMultiLangString(calculator.description, 'description');
  result.errors.push(...descValidation.errors);
  result.warnings.push(...descValidation.warnings);

  // 計算欄位驗證
  if (!calculator.fields || calculator.fields.length === 0) {
    result.isValid = false;
    result.errors.push('Calculator must have at least one field');
  } else {
    calculator.fields.forEach((field, index) => {
      if (!field.id || field.id.trim() === '') {
        result.isValid = false;
        result.errors.push(`Field ${index} missing ID`);
      }

      if (!field.type) {
        result.isValid = false;
        result.errors.push(`Field ${field.id} missing type`);
      }

      const labelValidation = validateMultiLangString(field.label, `field ${field.id} label`);
      result.errors.push(...labelValidation.errors);
      result.warnings.push(...labelValidation.warnings);

      // 選項驗證
      if (['select', 'radio'].includes(field.type) && (!field.options || field.options.length === 0)) {
        result.isValid = false;
        result.errors.push(`Field ${field.id} of type ${field.type} must have options`);
      }
    });
  }

  // 計算函數驗證
  if (!calculator.calculationFunction || calculator.calculationFunction.trim() === '') {
    result.isValid = false;
    result.errors.push('Calculator must specify a calculation function');
  }

  // 解釋驗證
  if (!calculator.interpretation || calculator.interpretation.length === 0) {
    result.isValid = false;
    result.errors.push('Calculator must have interpretation rules');
  } else {
    calculator.interpretation.forEach((interp, index) => {
      if (!interp.range || interp.range.length !== 2) {
        result.isValid = false;
        result.errors.push(`Interpretation ${index} must have valid range [min, max]`);
      }

      if (interp.range && interp.range[0] > interp.range[1]) {
        result.isValid = false;
        result.errors.push(`Interpretation ${index} range min cannot be greater than max`);
      }

      const recValidation = validateMultiLangString(interp.recommendation, `interpretation ${index} recommendation`);
      result.errors.push(...recValidation.errors);
      result.warnings.push(...recValidation.warnings);
    });
  }

  // 醫療內容特定驗證
  if (!calculator.evidenceLevel) {
    result.warnings.push('Consider adding evidence level for medical credibility');
  }

  if (!calculator.references || calculator.references.length === 0) {
    result.warnings.push('Consider adding references for medical validation');
  }

  if (!calculator.clinicalGuidelines) {
    result.suggestions.push('Adding clinical guidelines would enhance medical context');
  }

  return result;
}

/**
 * 教育內容驗證
 */
export function validateEducationContent(content: EducationContent): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // 基本欄位驗證
  if (!content.slug || content.slug.trim() === '') {
    result.isValid = false;
    result.errors.push('Education content slug is required');
  }

  // 多語言欄位驗證
  const titleValidation = validateMultiLangString(content.title, 'title');
  result.errors.push(...titleValidation.errors);
  result.warnings.push(...titleValidation.warnings);

  // 內容長度檢查
  if (content.readingTime && content.readingTime < 2) {
    result.warnings.push('Very short reading time may indicate insufficient content');
  }

  if (content.readingTime && content.readingTime > 30) {
    result.warnings.push('Very long reading time may affect patient engagement');
  }

  // 醫療內容特定驗證
  if (content.patientFriendly && !content.medicalDisclaimer) {
    result.warnings.push('Patient-friendly content should include medical disclaimer');
  }

  if (!content.lastReviewDate) {
    result.warnings.push('Medical content should have review date for accuracy');
  } else {
    const reviewDate = new Date(content.lastReviewDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (reviewDate < oneYearAgo) {
      result.warnings.push('Medical content may need review (last reviewed over 1 year ago)');
    }
  }

  if (content.professionalLevel && !content.evidenceLevel) {
    result.suggestions.push('Professional-level content would benefit from evidence level rating');
  }

  // 流程圖驗證
  if (content.hasFlowchart && !content.flowchartCode) {
    result.isValid = false;
    result.errors.push('Content marked as having flowchart but no flowchart code provided');
  }

  if (content.flowchartCode && !content.hasFlowchart) {
    result.warnings.push('Flowchart code provided but hasFlowchart flag is false');
  }

  return result;
}

/**
 * 流程圖驗證
 */
export function validateFlowchart(flowchart: Flowchart): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // 基本欄位驗證
  if (!flowchart.id || flowchart.id.trim() === '') {
    result.isValid = false;
    result.errors.push('Flowchart ID is required');
  }

  if (!flowchart.slug || flowchart.slug.trim() === '') {
    result.isValid = false;
    result.errors.push('Flowchart slug is required');
  }

  // Mermaid 程式碼驗證
  if (!flowchart.mermaidCode || flowchart.mermaidCode.trim() === '') {
    result.isValid = false;
    result.errors.push('Flowchart must have Mermaid code');
  } else {
    // 基本 Mermaid 語法檢查
    const mermaidCode = flowchart.mermaidCode.trim();
    if (!mermaidCode.startsWith('graph') && !mermaidCode.startsWith('flowchart')) {
      result.warnings.push('Mermaid code should start with "graph" or "flowchart"');
    }

    // 檢查是否包含節點和連接
    if (!mermaidCode.includes('-->') && !mermaidCode.includes('---')) {
      result.warnings.push('Flowchart appears to have no connections between nodes');
    }
  }

  // 多語言欄位驗證
  const titleValidation = validateMultiLangString(flowchart.title, 'title');
  result.errors.push(...titleValidation.errors);
  result.warnings.push(...titleValidation.warnings);

  // 無障礙驗證
  if (!flowchart.accessibility) {
    result.isValid = false;
    result.errors.push('Flowchart must have accessibility information');
  } else {
    const altValidation = validateMultiLangString(
      flowchart.accessibility.textAlternative, 
      'accessibility text alternative'
    );
    result.errors.push(...altValidation.errors);
    result.warnings.push(...altValidation.warnings);

    const ariaValidation = validateMultiLangString(
      flowchart.accessibility.ariaLabel, 
      'accessibility ARIA label'
    );
    result.errors.push(...ariaValidation.errors);
    result.warnings.push(...ariaValidation.warnings);
  }

  // 複雜度與內容一致性檢查
  if (flowchart.complexity === 'simple' && flowchart.mermaidCode.split('\n').length > 10) {
    result.warnings.push('Flowchart marked as simple but has many lines of code');
  }

  if (flowchart.complexity === 'complex' && flowchart.mermaidCode.split('\n').length < 5) {
    result.warnings.push('Flowchart marked as complex but appears simple');
  }

  return result;
}

/**
 * 醫療專科驗證
 */
export function validateMedicalSpecialty(specialty: MedicalSpecialty): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // 基本欄位驗證
  if (!specialty.id || specialty.id.trim() === '') {
    result.isValid = false;
    result.errors.push('Medical specialty ID is required');
  }

  if (!specialty.slug || specialty.slug.trim() === '') {
    result.isValid = false;
    result.errors.push('Medical specialty slug is required');
  }

  // 多語言欄位驗證
  const nameValidation = validateMultiLangString(specialty.name, 'name');
  result.errors.push(...nameValidation.errors);
  result.warnings.push(...nameValidation.warnings);

  // 顏色驗證
  if (specialty.color && !specialty.color.match(/^#[0-9A-Fa-f]{6}$/)) {
    result.warnings.push('Color should be a valid hex color code (e.g., #ff0000)');
  }

  // 統計數據一致性檢查
  const totalCount = (specialty.calculatorCount || 0) + 
                    (specialty.educationCount || 0) + 
                    (specialty.flowchartCount || 0);
  
  if (totalCount === 0) {
    result.warnings.push('Medical specialty has no associated content');
  }

  return result;
}

/**
 * 批量驗證工具
 */
export function validateContentBatch<T>(
  items: T[],
  validator: (item: T) => ValidationResult,
  itemType: string
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  items.forEach((item, index) => {
    const itemResult = validator(item);
    
    if (!itemResult.isValid) {
      result.isValid = false;
    }

    // 添加項目索引到錯誤訊息
    itemResult.errors.forEach(error => {
      result.errors.push(`${itemType} ${index}: ${error}`);
    });

    itemResult.warnings.forEach(warning => {
      result.warnings.push(`${itemType} ${index}: ${warning}`);
    });

    itemResult.suggestions.forEach(suggestion => {
      result.suggestions.push(`${itemType} ${index}: ${suggestion}`);
    });
  });

  return result;
}

/**
 * 生成驗證報告
 */
export function generateValidationReport(results: ValidationResult[]): string {
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);

  let report = `# Content Validation Report\n\n`;
  report += `## Summary\n`;
  report += `- Total Errors: ${totalErrors}\n`;
  report += `- Total Warnings: ${totalWarnings}\n`;
  report += `- Total Suggestions: ${totalSuggestions}\n\n`;

  if (totalErrors > 0) {
    report += `## Errors (Must Fix)\n`;
    results.forEach(result => {
      result.errors.forEach(error => {
        report += `- ❌ ${error}\n`;
      });
    });
    report += `\n`;
  }

  if (totalWarnings > 0) {
    report += `## Warnings (Should Fix)\n`;
    results.forEach(result => {
      result.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
    });
    report += `\n`;
  }

  if (totalSuggestions > 0) {
    report += `## Suggestions (Consider)\n`;
    results.forEach(result => {
      result.suggestions.forEach(suggestion => {
        report += `- 💡 ${suggestion}\n`;
      });
    });
  }

  return report;
}