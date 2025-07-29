# Storybook 安裝配置總結

## 概述

本文檔記錄了 Astro Clinical Platform 項目中 Storybook 的完整安裝和配置過程。

## 已安裝的依賴項

### 核心依賴
- `storybook@^9.0.18` - Storybook 核心
- `@storybook/react-vite@^9.0.18` - React + Vite 框架支援

### 插件和擴展
- `@chromatic-com/storybook@^4.0.1` - Chromatic 視覺測試
- `@storybook/addon-docs@^9.0.18` - 文檔生成
- `@storybook/addon-onboarding@^9.0.18` - 新手引導
- `@storybook/addon-a11y@^9.0.18` - 無障礙測試
- `@storybook/addon-vitest@^9.0.18` - Vitest 測試集成

## 配置文件

### 1. `.storybook/main.ts`
```typescript
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  async viteFinal(config) {
    // 動態導入 Tailwind CSS v4 Vite 插件
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    
    return mergeConfig(config, {
      plugins: [
        tailwindcss()
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
        },
      },
    });
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;
```

### 2. `.storybook/preview.tsx`
```typescript
import type { Preview } from '@storybook/react-vite';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'medical-neutral-50', value: '#f8fafc' },
        { name: 'medical-primary-50', value: '#eff6ff' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
    docs: {
      theme: {
        base: 'light',
        brandTitle: 'Astro Clinical Platform',
        brandUrl: 'https://astro-clinical-platform.vercel.app',
        colorPrimary: '#2563eb',
        colorSecondary: '#0ea5e9',
      },
    },
    a11y: {
      test: 'todo',
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'focus-order-semantics', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
        ],
      },
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1024px', height: '768px' } },
        largeDesktop: { name: 'Large Desktop', styles: { width: '1440px', height: '900px' } },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      return (
        <div 
          className={`storybook-wrapper ${theme === 'dark' ? 'dark' : ''}`}
          style={{
            minHeight: '100vh',
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            padding: '1rem',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
```

### 3. `.storybook/vitest.setup.ts`
```typescript
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.tsx';

setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
```

## 特殊配置說明

### Tailwind CSS v4 集成
- 使用動態導入 `@tailwindcss/vite` 插件
- 移除了 PostCSS 配置文件以避免衝突
- 在 `viteFinal` 中配置 Tailwind CSS 插件

### TypeScript 配置
- 禁用類型檢查以提高構建速度
- 使用 `react-docgen-typescript` 生成組件文檔
- 配置了 prop 過濾器以排除 node_modules

### 無障礙測試
- 集成 `@storybook/addon-a11y`
- 配置了顏色對比度、焦點順序和鍵盤導航檢查

## 可用的 NPM 腳本

```json
{
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

## 已創建的組件示例

### 1. Button 組件
- 位置：`src/components/visualization/Button.stories.tsx`
- 包含多種尺寸和顏色變體

### 2. MedicalCard 組件
- 位置：`src/components/medical/MedicalCard.tsx`
- 醫療專用卡片組件，支援多種變體和交互狀態

### 3. MedicalButton 組件
- 位置：`src/components/medical/MedicalButton.tsx`
- 醫療專用按鈕組件，包含載入狀態和圖標支援

## 運行 Storybook

### 開發模式
```bash
npm run storybook
```
訪問：http://localhost:6006

### 構建靜態版本
```bash
npm run build-storybook
```
輸出目錄：`storybook-static/`

## 解決的問題

1. **版本衝突**：確保所有 Storybook 相關包使用相同版本 (9.0.18)
2. **Tailwind CSS v4 集成**：使用動態導入解決 ES modules 問題
3. **PostCSS 配置衝突**：移除不必要的 PostCSS 配置
4. **JSX 語法錯誤**：將 preview.ts 重命名為 preview.tsx
5. **缺失依賴**：移除對不存在的 `@storybook/test` 的依賴

## 功能特性

- ✅ React + Vite 支援
- ✅ Tailwind CSS v4 集成
- ✅ TypeScript 支援
- ✅ 自動文檔生成
- ✅ 無障礙測試
- ✅ 多主題支援
- ✅ 響應式視窗測試
- ✅ Vitest 測試集成
- ✅ 醫療專用組件庫

## 下一步

1. 添加更多醫療專用組件
2. 集成 Chromatic 進行視覺回歸測試
3. 添加更多無障礙測試規則
4. 創建組件使用指南文檔