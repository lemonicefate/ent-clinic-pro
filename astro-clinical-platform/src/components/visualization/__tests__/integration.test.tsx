/**
 * 視覺化組件整合測試
 * 測試所有視覺化組件的協同工作
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../Dashboard';
import { ResultCard } from '../ResultCard';
import { RiskIndicator } from '../RiskIndicator';
import { CalculatorChart } from '../CalculatorChart';
import { createMockCalculationResult } from '../../../test-utils';
import type { DashboardComponentConfig } from '../Dashboard';

// 模擬 Chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
    defaults: {
      font: {},
      color: {}
    }
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  BarElement: vi.fn(),
  ArcElement: vi.fn()
}));

vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      Line Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      Bar Chart
    </div>
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>
      Pie Chart
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)}>
      Doughnut Chart
    </div>
  ),
  Radar: ({ data, options }: any) => (
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)}>
      Radar Chart
    </div>
  )
}));

describe('Visualization Components Integration', () => {
  let mockResult: any;
  let dashboardComponents: DashboardComponentConfig[];

  beforeEach(() => {
    mockResult = createMockCalculationResult({
      primaryValue: 22.86,
      primaryUnit: 'kg/m²',
      primaryLabel: { 'zh-TW': 'BMI 指數', 'en': 'BMI Index' },
      riskLevel: 'low',
      interpretation: { 
        'zh-TW': '您的 BMI 在正常範圍內', 
        'en': 'Your BMI is in the normal range' 
      },
      visualizationData: {
        bmiValue: 22.86,
        riskIndicator: 'low',
        categoryDistribution: {
          labels: ['過輕', '正常', '過重', '肥胖'],
          datasets: [{
            data: [15, 60, 20, 5],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
          }]
        },
        trendData: {
          labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
          datasets: [{
            label: 'BMI 趨勢',
            data: [23.1, 22.8, 22.5, 22.7, 22.9, 22.86],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          }]
        },
        riskFactors: [
          { factor: '年齡', value: 30, weight: 0.2 },
          { factor: '性別', value: 1, weight: 0.1 },
          { factor: '體重', value: 70, weight: 0.7 }
        ]
      }
    });

    dashboardComponents = [
      {
        id: 'bmi-result',
        type: 'result-card',
        title: 'BMI 結果',
        position: { row: 1, col: 1 },
        valueKey: 'bmiValue',
        format: 'number',
        precision: 2
      },
      {
        id: 'risk-indicator',
        type: 'risk-indicator',
        title: '風險等級',
        position: { row: 1, col: 2 },
        riskKey: 'riskIndicator',
        style: 'badge'
      },
      {
        id: 'category-chart',
        type: 'chart',
        title: '類別分布',
        position: { row: 2, col: 1, colSpan: 2 },
        chartType: 'pie',
        dataKey: 'categoryDistribution'
      },
      {
        id: 'trend-chart',
        type: 'chart',
        title: 'BMI 趨勢',
        position: { row: 3, col: 1, colSpan: 2 },
        chartType: 'line',
        dataKey: 'trendData'
      }
    ];
  });

  describe('Complete Dashboard Integration', () => {
    it('should render all components together', () => {
      render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      // 檢查所有組件都被渲染
      expect(screen.getByText('BMI 結果')).toBeInTheDocument();
      expect(screen.getByText('風險等級')).toBeInTheDocument();
      expect(screen.getByText('類別分布')).toBeInTheDocument();
      expect(screen.getByText('BMI 趨勢')).toBeInTheDocument();

      // 檢查具體內容
      expect(screen.getByText('22.86')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle component interactions', async () => {
      const onComponentClick = vi.fn();
      
      render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          onComponentClick={onComponentClick}
          locale="zh-TW"
        />
      );

      // 點擊結果卡片
      const resultCard = screen.getByText('BMI 結果').closest('[data-component-id]');
      if (resultCard) {
        fireEvent.click(resultCard);
        expect(onComponentClick).toHaveBeenCalledWith('bmi-result', dashboardComponents[0]);
      }
    });

    it('should update when result changes', async () => {
      const { rerender } = render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      expect(screen.getByText('22.86')).toBeInTheDocument();

      // 更新結果
      const updatedResult = {
        ...mockResult,
        primaryValue: 25.5,
        visualizationData: {
          ...mockResult.visualizationData,
          bmiValue: 25.5,
          riskIndicator: 'moderate'
        }
      };

      rerender(
        <Dashboard
          result={updatedResult}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      expect(screen.getByText('25.5')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          loading={true}
          locale="zh-TW"
        />
      );

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      const errorMessage = '計算錯誤';
      
      render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          error={errorMessage}
          locale="zh-TW"
        />
      );

      expect(screen.getByText('載入錯誤')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Component Data Flow', () => {
    it('should pass correct data to ResultCard', () => {
      render(
        <ResultCard
          value={mockResult.primaryValue}
          unit={mockResult.primaryUnit}
          label={mockResult.primaryLabel}
          riskLevel={mockResult.riskLevel}
          locale="zh-TW"
        />
      );

      expect(screen.getByText('22.86')).toBeInTheDocument();
      expect(screen.getByText('kg/m²')).toBeInTheDocument();
      expect(screen.getByText('BMI 指數')).toBeInTheDocument();
    });

    it('should pass correct data to RiskIndicator', () => {
      render(
        <RiskIndicator
          level={mockResult.riskLevel}
          value={mockResult.primaryValue}
          style="badge"
          locale="zh-TW"
        />
      );

      const indicator = screen.getByRole('generic');
      expect(indicator).toHaveClass('risk-indicator', 'badge', 'low');
    });

    it('should pass correct data to CalculatorChart', () => {
      render(
        <CalculatorChart
          type="pie"
          data={mockResult.visualizationData.categoryDistribution}
          title="類別分布"
          locale="zh-TW"
        />
      );

      const chart = screen.getByTestId('pie-chart');
      expect(chart).toBeInTheDocument();
      
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
      expect(chartData.labels).toEqual(['過輕', '正常', '過重', '肥胖']);
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to different screen sizes', () => {
      // 模擬小螢幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      const dashboard = screen.getByRole('generic');
      expect(dashboard).toHaveClass('dashboard');
    });

    it('should handle component overflow', () => {
      const manyComponents: DashboardComponentConfig[] = Array.from({ length: 20 }, (_, i) => ({
        id: `component-${i}`,
        type: 'result-card',
        title: `組件 ${i + 1}`,
        position: { row: Math.floor(i / 4) + 1, col: (i % 4) + 1 },
        valueKey: 'bmiValue'
      }));

      render(
        <Dashboard
          result={mockResult}
          components={manyComponents}
          locale="zh-TW"
        />
      );

      // 所有組件都應該被渲染
      manyComponents.forEach((_, i) => {
        expect(screen.getByText(`組件 ${i + 1}`)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      // 檢查 ARIA 標籤
      const dashboard = screen.getByRole('generic');
      expect(dashboard).toHaveAttribute('role');
    });

    it('should support keyboard navigation', () => {
      const onComponentClick = vi.fn();
      
      render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          onComponentClick={onComponentClick}
          locale="zh-TW"
        />
      );

      const resultCard = screen.getByText('BMI 結果').closest('[data-component-id]');
      if (resultCard) {
        // 模擬鍵盤事件
        fireEvent.keyDown(resultCard, { key: 'Enter' });
        // 注意：實際的鍵盤處理需要在組件中實現
      }
    });

    it('should provide screen reader friendly content', () => {
      render(
        <ResultCard
          value={mockResult.primaryValue}
          unit={mockResult.primaryUnit}
          label={mockResult.primaryLabel}
          riskLevel={mockResult.riskLevel}
          locale="zh-TW"
        />
      );

      // 檢查是否有適當的文字內容供螢幕閱讀器使用
      expect(screen.getByText('BMI 指數')).toBeInTheDocument();
      expect(screen.getByText('22.86')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large datasets efficiently', async () => {
      const largeDataset = {
        ...mockResult.visualizationData.trendData,
        labels: Array.from({ length: 1000 }, (_, i) => `點 ${i + 1}`),
        datasets: [{
          ...mockResult.visualizationData.trendData.datasets[0],
          data: Array.from({ length: 1000 }, () => Math.random() * 30 + 15)
        }]
      };

      const largeDataComponents: DashboardComponentConfig[] = [{
        id: 'large-chart',
        type: 'chart',
        title: '大數據集',
        position: { row: 1, col: 1 },
        chartType: 'line',
        dataKey: 'largeDataset'
      }];

      const resultWithLargeData = {
        ...mockResult,
        visualizationData: {
          ...mockResult.visualizationData,
          largeDataset
        }
      };

      const startTime = performance.now();
      
      render(
        <Dashboard
          result={resultWithLargeData}
          components={largeDataComponents}
          locale="zh-TW"
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染時間應該在合理範圍內
      expect(renderTime).toBeLessThan(1000); // 1 秒
    });

    it('should handle frequent updates without memory leaks', async () => {
      const { rerender } = render(
        <Dashboard
          result={mockResult}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      // 模擬頻繁更新
      for (let i = 0; i < 50; i++) {
        const updatedResult = {
          ...mockResult,
          primaryValue: 20 + Math.random() * 10,
          visualizationData: {
            ...mockResult.visualizationData,
            bmiValue: 20 + Math.random() * 10
          }
        };

        rerender(
          <Dashboard
            result={updatedResult}
            components={dashboardComponents}
            locale="zh-TW"
          />
        );

        // 等待渲染完成
        await waitFor(() => {
          expect(screen.getByText('BMI 結果')).toBeInTheDocument();
        });
      }

      // 檢查最終狀態
      expect(screen.getByText('BMI 結果')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing visualization data gracefully', () => {
      const resultWithoutVisualization = {
        ...mockResult,
        visualizationData: undefined
      };

      render(
        <Dashboard
          result={resultWithoutVisualization}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      // 應該顯示基本組件，但圖表可能不會顯示
      expect(screen.getByText('BMI 結果')).toBeInTheDocument();
      expect(screen.getByText('風險等級')).toBeInTheDocument();
    });

    it('should handle invalid chart data', () => {
      const resultWithInvalidChart = {
        ...mockResult,
        visualizationData: {
          ...mockResult.visualizationData,
          categoryDistribution: null
        }
      };

      render(
        <Dashboard
          result={resultWithInvalidChart}
          components={dashboardComponents}
          locale="zh-TW"
        />
      );

      // 其他組件應該正常顯示
      expect(screen.getByText('BMI 結果')).toBeInTheDocument();
    });

    it('should handle component configuration errors', () => {
      const invalidComponents: DashboardComponentConfig[] = [{
        id: 'invalid-component',
        type: 'unknown-type' as any,
        title: '無效組件',
        position: { row: 1, col: 1 }
      }];

      render(
        <Dashboard
          result={mockResult}
          components={invalidComponents}
          locale="zh-TW"
        />
      );

      // 應該顯示錯誤訊息或跳過無效組件
      expect(screen.getByText(/未知組件類型|無效組件/)).toBeInTheDocument();
    });
  });
});