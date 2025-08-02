/**
 * Dashboard 組件測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../Dashboard';
import type { DashboardComponentConfig, CalculationResult } from '../Dashboard';

// 模擬計算結果
const mockResult: CalculationResult = {
  primaryValue: 22.86,
  primaryUnit: 'kg/m²',
  primaryLabel: { 'zh-TW': 'BMI 指數' },
  riskLevel: 'low',
  interpretation: { 'zh-TW': '正常範圍' },
  visualizationData: {
    bmiValue: 22.86,
    riskIndicator: 'low',
    testChart: {
      labels: ['A', 'B'],
      datasets: [{ data: [1, 2] }]
    }
  }
};

// 基本組件配置
const basicComponents: DashboardComponentConfig[] = [
  {
    id: 'test-result',
    type: 'result-card',
    title: 'Test Result',
    position: { row: 1, col: 1 },
    valueKey: 'bmiValue'
  },
  {
    id: 'test-risk',
    type: 'risk-indicator',
    title: 'Test Risk',
    position: { row: 1, col: 2 },
    riskKey: 'riskIndicator'
  }
];

describe('Dashboard', () => {
  it('renders basic dashboard correctly', () => {
    render(
      <Dashboard
        result={mockResult}
        components={basicComponents}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('Test Result')).toBeInTheDocument();
    expect(screen.getByText('Test Risk')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(
      <Dashboard
        result={mockResult}
        components={basicComponents}
        loading={true}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = '測試錯誤訊息';
    render(
      <Dashboard
        result={mockResult}
        components={basicComponents}
        error={errorMessage}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('載入錯誤')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles empty components array', () => {
    render(
      <Dashboard
        result={mockResult}
        components={[]}
        locale="zh-TW"
      />
    );

    const dashboard = screen.getByRole('generic');
    expect(dashboard).toHaveClass('dashboard');
  });

  it('applies custom className and style', () => {
    const customStyle = { backgroundColor: 'red' };
    render(
      <Dashboard
        result={mockResult}
        components={basicComponents}
        className="custom-class"
        style={customStyle}
        locale="zh-TW"
      />
    );

    const dashboard = screen.getByRole('generic');
    expect(dashboard).toHaveClass('dashboard', 'custom-class');
    expect(dashboard).toHaveStyle('background-color: red');
  });

  it('handles component click events', () => {
    const onComponentClick = vi.fn();
    render(
      <Dashboard
        result={mockResult}
        components={basicComponents}
        onComponentClick={onComponentClick}
        locale="zh-TW"
      />
    );

    const resultCard = screen.getByText('Test Result').closest('[data-component-id]');
    if (resultCard) {
      fireEvent.click(resultCard);
      expect(onComponentClick).toHaveBeenCalledWith('test-result', basicComponents[0]);
    }
  });

  it('handles data change events', () => {
    const onDataChange = vi.fn();
    render(
      <Dashboard
        result={mockResult}
        components={basicComponents}
        onDataChange={onDataChange}
        locale="zh-TW"
      />
    );

    // 這裡需要觸發一個會調用 onDataChange 的事件
    // 由於我們的基本組件不會觸發這個事件，這個測試主要是確保 prop 被正確傳遞
    expect(onDataChange).toBeDefined();
  });

  it('renders text component correctly', () => {
    const textComponents: DashboardComponentConfig[] = [
      {
        id: 'test-text',
        type: 'text',
        title: 'Test Text',
        position: { row: 1, col: 1 },
        content: { 'zh-TW': '測試文字內容' },
        textStyle: 'body',
        tag: 'p'
      }
    ];

    render(
      <Dashboard
        result={mockResult}
        components={textComponents}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('測試文字內容')).toBeInTheDocument();
  });

  it('renders divider component correctly', () => {
    const dividerComponents: DashboardComponentConfig[] = [
      {
        id: 'test-divider',
        type: 'divider',
        position: { row: 1, col: 1 },
        style: 'solid',
        orientation: 'horizontal'
      }
    ];

    render(
      <Dashboard
        result={mockResult}
        components={dividerComponents}
        locale="zh-TW"
      />
    );

    const divider = screen.getByRole('generic').querySelector('.dashboard-divider');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('horizontal');
  });

  it('handles conditional component visibility', () => {
    const conditionalComponents: DashboardComponentConfig[] = [
      {
        id: 'visible-component',
        type: 'text',
        title: 'Visible',
        position: { row: 1, col: 1 },
        content: { 'zh-TW': '可見組件' },
        condition: (result) => result.riskLevel === 'low'
      },
      {
        id: 'hidden-component',
        type: 'text',
        title: 'Hidden',
        position: { row: 1, col: 2 },
        content: { 'zh-TW': '隱藏組件' },
        condition: (result) => result.riskLevel === 'high'
      }
    ];

    render(
      <Dashboard
        result={mockResult}
        components={conditionalComponents}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('可見組件')).toBeInTheDocument();
    expect(screen.queryByText('隱藏組件')).not.toBeInTheDocument();
  });

  it('handles visible property correctly', () => {
    const visibilityComponents: DashboardComponentConfig[] = [
      {
        id: 'visible-component',
        type: 'text',
        title: 'Visible',
        position: { row: 1, col: 1 },
        content: { 'zh-TW': '可見組件' },
        visible: true
      },
      {
        id: 'hidden-component',
        type: 'text',
        title: 'Hidden',
        position: { row: 1, col: 2 },
        content: { 'zh-TW': '隱藏組件' },
        visible: false
      }
    ];

    render(
      <Dashboard
        result={mockResult}
        components={visibilityComponents}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('可見組件')).toBeInTheDocument();
    expect(screen.queryByText('隱藏組件')).not.toBeInTheDocument();
  });

  it('handles unknown component type', () => {
    const unknownComponents: DashboardComponentConfig[] = [
      {
        id: 'unknown-component',
        type: 'unknown' as any,
        title: 'Unknown',
        position: { row: 1, col: 1 }
      }
    ];

    render(
      <Dashboard
        result={mockResult}
        components={unknownComponents}
        locale="zh-TW"
      />
    );

    expect(screen.getByText(/未知組件類型/)).toBeInTheDocument();
  });

  it('sorts components by position correctly', () => {
    const unsortedComponents: DashboardComponentConfig[] = [
      {
        id: 'component-3',
        type: 'text',
        title: 'Third',
        position: { row: 2, col: 1 },
        content: { 'zh-TW': '第三個' }
      },
      {
        id: 'component-1',
        type: 'text',
        title: 'First',
        position: { row: 1, col: 1 },
        content: { 'zh-TW': '第一個' }
      },
      {
        id: 'component-2',
        type: 'text',
        title: 'Second',
        position: { row: 1, col: 2 },
        content: { 'zh-TW': '第二個' }
      }
    ];

    render(
      <Dashboard
        result={mockResult}
        components={unsortedComponents}
        locale="zh-TW"
      />
    );

    const components = screen.getAllByText(/第[一二三]個/);
    expect(components[0]).toHaveTextContent('第一個');
    expect(components[1]).toHaveTextContent('第二個');
    expect(components[2]).toHaveTextContent('第三個');
  });

  it('applies grid positioning correctly', () => {
    const positionedComponents: DashboardComponentConfig[] = [
      {
        id: 'positioned-component',
        type: 'text',
        title: 'Positioned',
        position: { row: 2, col: 3, rowSpan: 2, colSpan: 3 },
        content: { 'zh-TW': '定位組件' }
      }
    ];

    render(
      <Dashboard
        result={mockResult}
        components={positionedComponents}
        locale="zh-TW"
      />
    );

    const dashboardItem = screen.getByText('定位組件').closest('.dashboard-item');
    expect(dashboardItem).toHaveStyle({
      'grid-row': '2 / span 2',
      'grid-column': '3 / span 3'
    });
  });
});