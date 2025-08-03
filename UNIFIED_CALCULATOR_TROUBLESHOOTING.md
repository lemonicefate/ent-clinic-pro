# 統一計算機架構故障排除指南

本指南幫助開發者診斷和解決統一計算機架構中的常見問題。

## 📋 目錄

- [常見問題](#常見問題)
- [模組載入問題](#模組載入問題)
- [計算錯誤](#計算錯誤)
- [UI 渲染問題](#ui-渲染問題)
- [測試問題](#測試問題)
- [效能問題](#效能問題)
- [部署問題](#部署問題)
- [調試工具](#調試工具)

## 常見問題

### Q1: 計算機模組沒有出現在列表中

**症狀**: 新創建的計算機模組沒有被系統發現

**可能原因**:
1. 模組文件結構不正確
2. `index.tsx` 沒有正確導出模組
3. 模組 ID 重複
4. 文件路徑錯誤

**解決方案**:

```bash
# 1. 檢查文件結構
ls -la src/components/calculators/modules/your-calculator/
# 應該包含: index.tsx, config.ts, calculator.ts, types.ts, Form.tsx, Results.tsx

# 2. 檢查模組導出
cat src/components/calculators/modules/your-calculator/index.tsx
```

確保 `index.tsx` 正確導出模組:

```typescript
// ✅ 正確的導出方式
import { CalculatorModule } from '../../types';
// ... 其他導入

const YourCalculatorModule: CalculatorModule = {
  id: 'your-calculator', // 確保 ID 唯一
  config,
  FormComponent: YourCalculatorForm,
  ResultsComponent: YourCalculatorResults,
  calculator: { calculate, validate },
  metadata: {
    version: '1.0.0',
    author: 'Your Name',
    lastUpdated: new Date().toISOString(),
  }
};

export default YourCalculatorModule; // 必須是 default export
```

**驗證步驟**:

```bash
# 運行開發服務器並檢查控制台
npm run dev

# 查看註冊表初始化日誌
# 應該看到: "✅ Successfully loaded module: your-calculator"
```

### Q2: 計算結果不正確

**症狀**: 計算機返回錯誤的結果或拋出異常

**診斷步驟**:

1. **檢查輸入驗證**:
```typescript
// 在 calculator.ts 中添加調試日誌
export function calculate(inputs: Record<string, any>): CalculationResult {
  console.log('計算輸入:', inputs); // 調試日誌
  
  // 驗證輸入
  const validation = validate(inputs);
  if (!validation.isValid) {
    console.error('輸入驗證失敗:', validation.errors);
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '輸入數據無效'
      }
    };
  }
  
  // 計算邏輯...
}
```

2. **檢查類型轉換**:
```typescript
// ❌ 錯誤：沒有類型轉換
const result = inputs.value1 * inputs.value2;

// ✅ 正確：確保類型正確
const value1 = Number(inputs.value1);
const value2 = Number(inputs.value2);

if (isNaN(value1) || isNaN(value2)) {
  return {
    success: false,
    error: {
      code: 'INVALID_INPUT',
      message: '輸入必須是有效數字'
    }
  };
}

const result = value1 * value2;
```

3. **檢查計算公式**:
```typescript
// 添加計算步驟記錄
const breakdown: CalculationBreakdown[] = [
  {
    step: 1,
    description: { 'zh-TW': '步驟 1: 計算中間值' },
    formula: 'value1 × value2',
    value: value1 * value2
  }
];

console.log('計算步驟:', breakdown); // 調試日誌
```

### Q3: TypeScript 類型錯誤

**症狀**: 編譯時出現類型錯誤

**常見錯誤和解決方案**:

1. **模組導出類型錯誤**:
```typescript
// ❌ 錯誤
export type { CalculatorModule } from '../../types';

// ✅ 正確
import { CalculatorModule } from '../../types';
```

2. **組件 Props 類型錯誤**:
```typescript
// ❌ 錯誤
const MyForm: React.FC = ({ values, onChange }) => {
  // TypeScript 無法推斷 props 類型
};

// ✅ 正確
import { CalculatorFormProps } from '../../types';

const MyForm: React.FC<CalculatorFormProps> = ({ values, onChange }) => {
  // 類型安全
};
```

3. **計算函數類型錯誤**:
```typescript
// ❌ 錯誤
export function calculate(inputs: any): any {
  // 失去類型安全
}

// ✅ 正確
import { CalculationResult } from '../../types';

export function calculate(inputs: Record<string, any>): CalculationResult {
  // 類型安全
}
```

## 模組載入問題

### 動態導入失敗

**症狀**: 模組載入器無法載入模組

**診斷**:
```typescript
// 在 ModuleLoader.ts 中添加詳細日誌
async loadAllModules(): Promise<CalculatorModule[]> {
  const modules: CalculatorModule[] = [];
  
  console.log('🔍 開始載入模組...');
  
  const moduleImports = import.meta.glob('../modules/*/index.tsx');
  console.log('📦 發現模組:', Object.keys(moduleImports));
  
  for (const [path, importFn] of Object.entries(moduleImports)) {
    try {
      console.log(`📦 載入模組: ${path}`);
      const module = await importFn() as { default: CalculatorModule };
      
      if (!module.default) {
        console.error(`❌ 模組沒有 default export: ${path}`);
        continue;
      }
      
      console.log(`✅ 成功載入模組: ${module.default.id}`);
      modules.push(module.default);
    } catch (error) {
      console.error(`❌ 載入模組失敗 ${path}:`, error);
    }
  }
  
  return modules;
}
```

**解決方案**:
1. 確保所有模組都有 `default export`
2. 檢查模組文件語法錯誤
3. 確認文件路徑正確

### 模組註冊失敗

**症狀**: 模組載入成功但註冊失敗

**檢查註冊表**:
```typescript
// 在 CalculatorRegistry.ts 中添加驗證
static async initialize(): Promise<void> {
  if (this.initialized) return;

  const moduleLoader = new ModuleLoader();
  const modules = await moduleLoader.loadAllModules();
  
  console.log(`📊 載入了 ${modules.length} 個模組`);
  
  modules.forEach(module => {
    // 驗證模組結構
    if (!module.id) {
      console.error('❌ 模組缺少 ID:', module);
      return;
    }
    
    if (this.modules.has(module.id)) {
      console.error(`❌ 模組 ID 重複: ${module.id}`);
      return;
    }
    
    this.modules.set(module.id, module);
    console.log(`✅ 註冊模組: ${module.id}`);
  });

  this.initialized = true;
  console.log(`🎉 註冊表初始化完成，共 ${this.modules.size} 個模組`);
}
```

## 計算錯誤

### 數值計算錯誤

**常見問題**:
1. 浮點數精度問題
2. 除零錯誤
3. 數值溢出

**解決方案**:
```typescript
// 處理浮點數精度
function roundToPrecision(value: number, precision: number = 2): number {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

// 安全除法
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) {
    throw new Error('除數不能為零');
  }
  return numerator / denominator;
}

// 檢查數值有效性
function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function calculate(inputs: Record<string, any>): CalculationResult {
  try {
    const value1 = Number(inputs.value1);
    const value2 = Number(inputs.value2);
    
    if (!isValidNumber(value1) || !isValidNumber(value2)) {
      return {
        success: false,
        error: {
          code: 'INVALID_NUMBER',
          message: '輸入必須是有效數字'
        }
      };
    }
    
    const result = safeDivide(value1, value2);
    const roundedResult = roundToPrecision(result);
    
    return {
      success: true,
      result: {
        primaryValue: roundedResult,
        // ...
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: error.message
      }
    };
  }
}
```

### 驗證邏輯錯誤

**檢查驗證函數**:
```typescript
export function validate(inputs: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 詳細的驗證邏輯
  if (!inputs.weight) {
    errors.push({
      field: 'weight',
      message: '體重為必填欄位',
      code: 'REQUIRED'
    });
  } else if (inputs.weight <= 0 || inputs.weight > 1000) {
    errors.push({
      field: 'weight',
      message: '體重必須在 0-1000 kg 之間',
      code: 'OUT_OF_RANGE'
    });
  }
  
  // 記錄驗證結果
  console.log('驗證結果:', { isValid: errors.length === 0, errors });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## UI 渲染問題

### 組件不顯示

**症狀**: 計算機組件沒有渲染或顯示空白

**診斷步驟**:

1. **檢查 React 組件結構**:
```tsx
// ❌ 錯誤：沒有返回 JSX
const MyForm: React.FC<CalculatorFormProps> = (props) => {
  // 沒有 return 語句
};

// ✅ 正確：返回 JSX
const MyForm: React.FC<CalculatorFormProps> = (props) => {
  return (
    <div>
      {/* 組件內容 */}
    </div>
  );
};
```

2. **檢查條件渲染**:
```tsx
// 添加調試信息
const MyForm: React.FC<CalculatorFormProps> = ({ values, errors, onChange }) => {
  console.log('Form props:', { values, errors }); // 調試日誌
  
  return (
    <div>
      <h2>計算機表單</h2>
      {/* 表單內容 */}
    </div>
  );
};
```

3. **檢查 CSS 樣式**:
```tsx
// 確保組件可見
<div className="min-h-[200px] p-4 border border-gray-200">
  {/* 內容 */}
</div>
```

### 樣式問題

**常見問題**:
1. Tailwind CSS 類名不生效
2. 響應式設計問題
3. 組件重疊

**解決方案**:
```tsx
// 使用標準的 Tailwind 類名
<div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold mb-4 text-gray-900">
    計算機標題
  </h2>
  
  <div className="space-y-4">
    {/* 表單欄位 */}
  </div>
  
  <div className="flex flex-col sm:flex-row gap-4 mt-6">
    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
      計算
    </button>
    <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
      重設
    </button>
  </div>
</div>
```

## 測試問題

### 測試環境配置

**症狀**: 測試無法運行或失敗

**檢查測試配置**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom', // 確保使用正確的環境
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts']
  }
});
```

**測試設置文件**:
```typescript
// src/test-utils/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 每個測試後清理
afterEach(() => {
  cleanup();
});
```

### 測試失敗診斷

**常見測試錯誤**:

1. **模組導入錯誤**:
```typescript
// ❌ 錯誤：相對路徑錯誤
import { calculate } from '../calculator';

// ✅ 正確：確認路徑
import { calculate } from '../calculator';
```

2. **異步測試問題**:
```typescript
// ❌ 錯誤：沒有等待異步操作
it('should calculate correctly', () => {
  const result = calculate(inputs);
  expect(result.success).toBe(true);
});

// ✅ 正確：處理異步操作
it('should calculate correctly', async () => {
  const result = await calculate(inputs);
  expect(result.success).toBe(true);
});
```

3. **測試數據問題**:
```typescript
// 使用有效的測試數據
const validInputs = {
  weight: 70,
  height: 170,
  age: 30,
  gender: 'male'
};

const invalidInputs = {
  weight: -1, // 無效值
  height: 0,  // 無效值
};
```

## 效能問題

### 載入速度慢

**診斷工具**:
```bash
# 運行效能分析
node scripts/analyze-calculator-performance.js

# 檢查包大小
npm run build
ls -lh dist/_astro/*.js
```

**優化策略**:

1. **代碼分割**:
```typescript
// 使用動態導入
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// 在組件中使用
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

2. **記憶化**:
```typescript
// 記憶化計算結果
const memoizedCalculation = useMemo(() => {
  return expensiveCalculation(inputs);
}, [inputs]);

// 記憶化組件
const MemoizedForm = React.memo(MyForm);
```

### 記憶體洩漏

**檢查記憶體使用**:
```typescript
// 在組件中監控記憶體
useEffect(() => {
  const checkMemory = () => {
    if (performance.memory) {
      console.log('記憶體使用:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      });
    }
  };
  
  const interval = setInterval(checkMemory, 5000);
  return () => clearInterval(interval);
}, []);
```

**清理資源**:
```typescript
useEffect(() => {
  // 設置資源
  const subscription = someService.subscribe();
  
  // 清理函數
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## 部署問題

### 建置失敗

**常見錯誤**:
1. TypeScript 類型錯誤
2. 模組導入路徑錯誤
3. 環境變數缺失

**診斷步驟**:
```bash
# 檢查 TypeScript 錯誤
npx tsc --noEmit

# 檢查 ESLint 錯誤
npm run lint

# 本地建置測試
npm run build
```

### 生產環境問題

**檢查生產建置**:
```bash
# 建置並預覽
npm run build
npm run preview

# 檢查生成的文件
ls -la dist/
ls -la dist/_astro/
```

**環境變數檢查**:
```typescript
// 在代碼中檢查環境
console.log('環境:', import.meta.env.MODE);
console.log('基礎 URL:', import.meta.env.BASE_URL);
```

## 調試工具

### 開發者工具

1. **瀏覽器控制台**:
   - 檢查 JavaScript 錯誤
   - 查看網路請求
   - 監控效能

2. **React Developer Tools**:
   - 檢查組件狀態
   - 查看 props 傳遞
   - 分析渲染效能

3. **Vue.js devtools** (如果使用 Vue):
   - 組件檢查
   - 狀態管理

### 日誌記錄

**添加調試日誌**:
```typescript
// 開發環境日誌
const isDev = import.meta.env.DEV;

function debugLog(message: string, data?: any) {
  if (isDev) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// 使用
debugLog('計算開始', inputs);
debugLog('計算結果', result);
```

**錯誤追蹤**:
```typescript
// 全局錯誤處理
window.addEventListener('error', (event) => {
  console.error('全局錯誤:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未處理的 Promise 拒絕:', event.reason);
});
```

### 效能監控

```typescript
// 效能標記
performance.mark('calculation-start');
const result = calculate(inputs);
performance.mark('calculation-end');

performance.measure('calculation-time', 'calculation-start', 'calculation-end');

const measures = performance.getEntriesByType('measure');
console.log('計算耗時:', measures[0].duration, 'ms');
```

## 獲取幫助

如果以上解決方案都無法解決問題，請：

1. **檢查現有範例**:
   - 參考 BMI、eGFR、CHA2DS2-VASc 模組
   - 對比工作正常的模組

2. **運行診斷腳本**:
   ```bash
   node scripts/analyze-calculator-performance.js
   node scripts/e2e-calculator-test.js
   ```

3. **查看詳細錯誤**:
   - 開啟瀏覽器開發者工具
   - 檢查控制台錯誤訊息
   - 查看網路請求狀態

4. **創建最小重現範例**:
   - 創建簡化的測試案例
   - 隔離問題範圍
   - 記錄重現步驟

5. **檢查系統狀態**:
   ```bash
   # 檢查 Node.js 版本
   node --version
   
   # 檢查 npm 版本
   npm --version
   
   # 檢查依賴
   npm list
   ```

記住，大多數問題都有解決方案，關鍵是系統性地診斷和測試。保持耐心，逐步排查問題！