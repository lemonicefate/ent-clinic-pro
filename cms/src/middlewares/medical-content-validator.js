/**
 * 醫療內容驗證中介軟體
 * 確保醫療內容符合安全和準確性標準
 */

'use strict';

const medicalTermsRegex = /\b(診斷|治療|藥物|劑量|副作用|contraindication|dosage|medication)\b/gi;
const dangerousTermsRegex = /\b(自行診斷|自我治療|替代醫療建議|medical advice|self-diagnosis)\b/gi;

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // 只對醫療內容 API 進行驗證
    if (!ctx.url.includes('/api/') || ctx.method !== 'POST' && ctx.method !== 'PUT') {
      return;
    }

    const isMedicalContent = ctx.url.includes('/calculators') || 
                           ctx.url.includes('/educations') || 
                           ctx.url.includes('/flowcharts');

    if (!isMedicalContent) {
      return;
    }

    try {
      const body = ctx.request.body;
      
      if (body && body.data) {
        const content = JSON.stringify(body.data);
        
        // 檢查是否包含危險的醫療建議
        if (dangerousTermsRegex.test(content)) {
          strapi.log.warn('Medical content validation: Potentially dangerous medical advice detected', {
            url: ctx.url,
            method: ctx.method,
            content: content.substring(0, 200) + '...'
          });
          
          // 可以選擇阻止請求或只是記錄警告
          // ctx.throw(400, 'Content contains potentially dangerous medical advice');
        }

        // 記錄包含醫療術語的內容以供審核
        if (medicalTermsRegex.test(content)) {
          strapi.log.info('Medical content detected for review', {
            url: ctx.url,
            method: ctx.method,
            timestamp: new Date().toISOString()
          });
        }

        // 驗證計算機配置
        if (ctx.url.includes('/calculators') && body.data.fields) {
          validateCalculatorFields(body.data.fields);
        }

        // 驗證教育內容
        if (ctx.url.includes('/educations') && body.data.content) {
          validateEducationalContent(body.data.content);
        }
      }
    } catch (error) {
      strapi.log.error('Medical content validation error:', error);
      // 不阻止請求，只記錄錯誤
    }
  };
};

function validateCalculatorFields(fields) {
  try {
    const parsedFields = typeof fields === 'string' ? JSON.parse(fields) : fields;
    
    if (!Array.isArray(parsedFields)) {
      throw new Error('Calculator fields must be an array');
    }

    parsedFields.forEach((field, index) => {
      if (!field.id || !field.type || !field.label) {
        throw new Error(`Calculator field ${index} missing required properties`);
      }

      // 驗證數值範圍
      if (field.type === 'number' && field.validation) {
        const { min, max } = field.validation;
        if (min !== undefined && max !== undefined && min >= max) {
          throw new Error(`Calculator field ${field.id} has invalid range`);
        }
      }
    });
  } catch (error) {
    strapi.log.warn('Calculator fields validation failed:', error.message);
  }
}

function validateEducationalContent(content) {
  try {
    // 檢查內容長度
    if (content.length < 100) {
      strapi.log.warn('Educational content may be too short for meaningful patient education');
    }

    // 檢查是否包含免責聲明相關內容
    const hasDisclaimer = /免責|disclaimer|consult.*doctor|醫師|professional.*advice/i.test(content);
    if (!hasDisclaimer) {
      strapi.log.warn('Educational content may need medical disclaimer');
    }

    // 檢查可讀性（簡單的指標）
    const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
    const avgSentenceLength = content.length / sentences.length;
    
    if (avgSentenceLength > 150) {
      strapi.log.info('Educational content may have complex sentences, consider simplification');
    }
  } catch (error) {
    strapi.log.warn('Educational content validation failed:', error.message);
  }
}