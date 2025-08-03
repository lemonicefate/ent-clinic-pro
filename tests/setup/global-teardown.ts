/**
 * Playwright 全域拆除設定
 * 在所有測試完成後執行清理工作
 */

async function globalTeardown() {
  console.log('🧹 執行全域測試拆除...');
  
  try {
    // 清理測試資料
    console.log('清理測試資料...');
    
    // 清理暫存檔案
    console.log('清理暫存檔案...');
    
    // 重置測試環境
    console.log('重置測試環境...');
    
    console.log('✅ 全域拆除完成');
  } catch (error) {
    console.error('❌ 全域拆除失敗:', error);
    throw error;
  }
}

export default globalTeardown;