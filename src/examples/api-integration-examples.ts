/**
 * API Integration Examples
 * 展示如何使用安全 API 整合框架的各種功能
 */

import { 
  EnhancedApiClient, 
  createEnhancedMedicalApiClient, 
  createEnhancedDrugApiClient,
  isEnhancedApiError,
  getEnhancedErrorMessage
} from '../utils/enhanced-api-client';
import { apiKeyManager } from '../utils/api-key-manager';

// 範例 1: 基本 API 客戶端使用
export async function basicApiUsageExample() {
  console.log('=== 基本 API 使用範例 ===');
  
  try {
    // 創建醫療 API 客戶端
    const medicalClient = createEnhancedMedicalApiClient();
    
    // 執行 GET 請求
    const response = await medicalClient.get('/patients/123');
    console.log('患者資料:', response.data);
    console.log('請求 ID:', response.requestId);
    console.log('回應時間:', response.duration, 'ms');
    console.log('是否來自快取:', response.cached);
    
    // 執行 POST 請求
    const newPatient = {
      name: '張三',
      age: 35,
      gender: 'male',
      medicalHistory: ['高血壓', '糖尿病']
    };
    
    const createResponse = await medicalClient.post('/patients', newPatient);
    console.log('新患者已創建:', createResponse.data);
    
    // 清理資源
    medicalClient.destroy();
    
  } catch (error) {
    if (isEnhancedApiError(error)) {
      console.error('API 錯誤:', error.message);
      console.error('狀態碼:', error.status);
      console.error('重試次數:', error.retryCount);
      console.error('是否為網路錯誤:', error.isNetworkError);
      console.error('是否為超時錯誤:', error.isTimeout);
    } else {
      console.error('未知錯誤:', getEnhancedErrorMessage(error));
    }
  }
}

// 範例 2: 藥物資訊 API 整合
export async function drugApiIntegrationExample() {
  console.log('=== 藥物資訊 API 整合範例 ===');
  
  try {
    const drugClient = createEnhancedDrugApiClient();
    
    // 搜尋藥物資訊
    const drugSearch = await drugClient.get('/drugs/search', {
      params: {
        name: 'aspirin',
        limit: 10
      }
    });
    
    console.log('找到藥物:', drugSearch.data.length, '個');
    
    // 獲取特定藥物詳細資訊
    if (drugSearch.data.length > 0) {
      const drugId = drugSearch.data[0].id;
      const drugDetails = await drugClient.get(`/drugs/${drugId}`);
      
      console.log('藥物詳細資訊:');
      console.log('- 名稱:', drugDetails.data.name);
      console.log('- 成分:', drugDetails.data.activeIngredient);
      console.log('- 劑量:', drugDetails.data.dosage);
      console.log('- 副作用:', drugDetails.data.sideEffects);
    }
    
    // 檢查藥物交互作用
    const interactions = await drugClient.post('/interactions/check', {
      drugs: ['aspirin', 'warfarin']
    });
    
    console.log('藥物交互作用檢查:', interactions.data);
    
    drugClient.destroy();
    
  } catch (error) {
    console.error('藥物 API 錯誤:', getEnhancedErrorMessage(error));
  }
}

// 範例 3: 批次請求處理
export async function batchRequestExample() {
  console.log('=== 批次請求處理範例 ===');
  
  try {
    const client = createEnhancedMedicalApiClient();
    
    // 準備多個請求
    const patientIds = ['123', '456', '789'];
    const requests = patientIds.map(id => 
      () => client.get(`/patients/${id}`)
    );
    
    // 並行執行請求（受併發限制控制）
    const startTime = Date.now();
    const responses = await Promise.allSettled(
      requests.map(request => request())
    );
    const endTime = Date.now();
    
    console.log(`批次請求完成，耗時: ${endTime - startTime}ms`);
    
    // 處理結果
    responses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`患者 ${patientIds[index]}:`, result.value.data.name);
      } else {
        console.error(`患者 ${patientIds[index]} 請求失敗:`, result.reason.message);
      }
    });
    
    client.destroy();
    
  } catch (error) {
    console.error('批次請求錯誤:', getEnhancedErrorMessage(error));
  }
}

// 範例 4: 錯誤處理和重試機制
export async function errorHandlingExample() {
  console.log('=== 錯誤處理和重試機制範例 ===');
  
  try {
    const client = new EnhancedApiClient({
      keyName: 'medical-api',
      retries: 3,
      retryDelay: 1000,
      enableLogging: true
    });
    
    // 嘗試訪問可能失敗的端點
    const response = await client.get('/unreliable-endpoint');
    console.log('成功獲取資料:', response.data);
    
    client.destroy();
    
  } catch (error) {
    if (isEnhancedApiError(error)) {
      console.log('錯誤處理詳情:');
      console.log('- 錯誤訊息:', error.message);
      console.log('- HTTP 狀態碼:', error.status);
      console.log('- 錯誤代碼:', error.code);
      console.log('- 重試次數:', error.retryCount);
      console.log('- 是否為超時:', error.isTimeout);
      console.log('- 是否為網路錯誤:', error.isNetworkError);
      console.log('- 請求 ID:', error.requestId);
      console.log('- 時間戳:', new Date(error.timestamp).toISOString());
      
      if (error.details) {
        console.log('- 詳細錯誤資訊:', error.details);
      }
    }
  }
}

// 範例 5: 快取使用
export async function cachingExample() {
  console.log('=== 快取使用範例 ===');
  
  try {
    const client = new EnhancedApiClient({
      keyName: 'medical-api',
      enableCache: true,
      cacheTTL: 300000, // 5 分鐘
      enableLogging: true
    });
    
    console.log('第一次請求（應該從伺服器獲取）:');
    const response1 = await client.get('/medical-guidelines/hypertension');
    console.log('- 來自快取:', response1.cached);
    console.log('- 回應時間:', response1.duration, 'ms');
    
    console.log('第二次請求（應該從快取獲取）:');
    const response2 = await client.get('/medical-guidelines/hypertension');
    console.log('- 來自快取:', response2.cached);
    console.log('- 回應時間:', response2.duration, 'ms');
    
    // 獲取快取統計
    const stats = client.getStats();
    console.log('快取統計:');
    console.log('- 快取大小:', stats.cacheSize);
    console.log('- 快取命中率:', stats.performanceMetrics.cacheHitRate.toFixed(2), '%');
    
    client.destroy();
    
  } catch (error) {
    console.error('快取範例錯誤:', getEnhancedErrorMessage(error));
  }
}

// 範例 6: 效能監控
export async function performanceMonitoringExample() {
  console.log('=== 效能監控範例 ===');
  
  try {
    const client = createEnhancedMedicalApiClient();
    
    // 執行多個請求
    for (let i = 0; i < 10; i++) {
      try {
        await client.get(`/test-endpoint/${i}`);
      } catch (error) {
        // 忽略個別請求錯誤，繼續監控
      }
    }
    
    // 獲取效能統計
    const stats = client.getStats();
    
    console.log('效能統計:');
    console.log('- 總請求數:', stats.totalRequests);
    console.log('- 成功率:', stats.performanceMetrics.successRate.toFixed(2), '%');
    console.log('- 錯誤率:', stats.performanceMetrics.errorRate.toFixed(2), '%');
    console.log('- 平均回應時間:', stats.performanceMetrics.averageResponseTime.toFixed(2), 'ms');
    console.log('- 快取命中率:', stats.performanceMetrics.cacheHitRate.toFixed(2), '%');
    
    // 斷路器統計
    if (stats.circuitBreakerStats) {
      console.log('斷路器狀態:', stats.circuitBreakerStats.state);
      console.log('失敗次數:', stats.circuitBreakerStats.failureCount);
    }
    
    // 佇列統計
    console.log('請求佇列:');
    console.log('- 佇列大小:', stats.queueStats.queueSize);
    console.log('- 執行中請求:', stats.queueStats.running);
    console.log('- 最大併發數:', stats.queueStats.maxConcurrent);
    
    client.destroy();
    
  } catch (error) {
    console.error('效能監控錯誤:', getEnhancedErrorMessage(error));
  }
}

// 範例 7: API 金鑰管理
export async function apiKeyManagementExample() {
  console.log('=== API 金鑰管理範例 ===');
  
  try {
    // 添加新的 API 金鑰
    apiKeyManager.addKey({
      name: 'example-api',
      key: 'example-api-key-abcdefghijklmnopqrstuvwxyz123456',
      baseURL: 'https://api.example.com',
      permissions: ['/patients/*', '/medications/*'],
      rateLimit: {
        requests: 100,
        window: 60000
      }
    });
    
    // 獲取金鑰狀態
    const keyStatuses = apiKeyManager.exportConfig();
    console.log('API 金鑰狀態:');
    keyStatuses.forEach(config => {
      console.log(`- ${config.name}: ${config.baseURL}`);
      console.log(`  權限: ${config.permissions.join(', ')}`);
      if (config.rateLimit) {
        console.log(`  速率限制: ${config.rateLimit.requests} 請求/分鐘`);
      }
    });
    
    // 獲取健康狀態
    const healthStatus = apiKeyManager.getHealthStatus();
    console.log('API 金鑰健康狀態:');
    console.log('- 總金鑰數:', healthStatus.totalKeys);
    console.log('- 活躍金鑰數:', healthStatus.activeKeys);
    console.log('- 過期金鑰數:', healthStatus.expiredKeys);
    console.log('- 需要輪換的金鑰數:', healthStatus.needingRotation);
    console.log('- 總請求數:', healthStatus.totalRequests);
    console.log('- 總錯誤數:', healthStatus.totalErrors);
    
  } catch (error) {
    console.error('API 金鑰管理錯誤:', getEnhancedErrorMessage(error));
  }
}

// 範例 8: 健康檢查和監控
export async function healthCheckExample() {
  console.log('=== 健康檢查和監控範例 ===');
  
  try {
    const clients = [
      { name: 'Medical API', client: createEnhancedMedicalApiClient() },
      { name: 'Drug API', client: createEnhancedDrugApiClient() }
    ];
    
    // 檢查所有 API 的健康狀態
    for (const { name, client } of clients) {
      console.log(`檢查 ${name} 健康狀態...`);
      
      const startTime = Date.now();
      const isHealthy = await client.healthCheck();
      const checkTime = Date.now() - startTime;
      
      console.log(`- ${name}: ${isHealthy ? '健康' : '不健康'} (${checkTime}ms)`);
      
      if (isHealthy) {
        // 獲取詳細統計
        const stats = client.getStats();
        console.log(`  - 總請求數: ${stats.totalRequests}`);
        console.log(`  - 成功率: ${stats.performanceMetrics.successRate.toFixed(1)}%`);
        console.log(`  - 平均回應時間: ${stats.performanceMetrics.averageResponseTime.toFixed(1)}ms`);
      }
      
      client.destroy();
    }
    
  } catch (error) {
    console.error('健康檢查錯誤:', getEnhancedErrorMessage(error));
  }
}

// 主要範例執行函數
export async function runAllExamples() {
  console.log('🚀 開始執行 API 整合範例...\n');
  
  const examples = [
    { name: '基本 API 使用', fn: basicApiUsageExample },
    { name: '藥物資訊 API 整合', fn: drugApiIntegrationExample },
    { name: '批次請求處理', fn: batchRequestExample },
    { name: '錯誤處理和重試機制', fn: errorHandlingExample },
    { name: '快取使用', fn: cachingExample },
    { name: '效能監控', fn: performanceMonitoringExample },
    { name: 'API 金鑰管理', fn: apiKeyManagementExample },
    { name: '健康檢查和監控', fn: healthCheckExample }
  ];
  
  for (const example of examples) {
    try {
      console.log(`\n📋 執行範例: ${example.name}`);
      console.log('─'.repeat(50));
      await example.fn();
      console.log('✅ 範例執行完成');
    } catch (error) {
      console.error(`❌ 範例執行失敗: ${getEnhancedErrorMessage(error)}`);
    }
  }
  
  console.log('\n🎉 所有範例執行完成！');
}

// 如果直接執行此文件，則運行所有範例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}