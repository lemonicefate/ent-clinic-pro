/**
 * 流程圖渲染器島嶼組件
 * 使用 Mermaid.js 渲染醫療診療流程圖，支援無障礙功能和響應式設計
 */

import { useEffect, useRef, useState } from 'react';
import type { SupportedLocale } from '../../env.d';
import { t } from '../../utils/i18n';

interface Props {
  code: string;
  title?: string;
  locale: SupportedLocale;
  className?: string;
  showTextAlternative?: boolean;
  theme?: 'default' | 'medical' | 'dark';
}

interface FlowchartState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  showTextVersion: boolean;
  isFullscreen: boolean;
}

export default function FlowchartRenderer({ 
  code, 
  title, 
  locale, 
  className = '',
  showTextAlternative = true,
  theme = 'medical'
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<FlowchartState>({
    isLoading: true,
    hasError: false,
    errorMessage: '',
    showTextVersion: false,
    isFullscreen: false
  });

  // 初始化 Mermaid
  useEffect(() => {
    const initializeMermaid = async () => {
      try {
        // 動態載入 Mermaid
        const mermaid = await import('mermaid');
        
        // 配置 Mermaid
        mermaid.default.initialize({
          startOnLoad: false,
          theme: theme === 'medical' ? 'base' : theme,
          themeVariables: theme === 'medical' ? {
            // 醫療主題配色
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#2563eb',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#ffffff',
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#f8fafc',
            tertiaryBkg: '#f1f5f9',
            // 決策節點
            cScale0: '#ef4444',
            cScale1: '#f59e0b',
            cScale2: '#10b981',
            // 文字
            textColor: '#374151',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px'
          } : {},
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 20
          },
          securityLevel: 'loose', // 允許 HTML 標籤
          fontFamily: 'ui-sans-serif, system-ui, sans-serif'
        });

        // 渲染流程圖
        if (mermaidRef.current) {
          const { svg } = await mermaid.default.render(
            `flowchart-${Date.now()}`, 
            code
          );
          
          mermaidRef.current.innerHTML = svg;
          
          // 添加無障礙屬性
          const svgElement = mermaidRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.setAttribute('role', 'img');
            svgElement.setAttribute('aria-labelledby', 'flowchart-title');
            if (title) {
              const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
              titleElement.id = 'flowchart-title';
              titleElement.textContent = title;
              svgElement.insertBefore(titleElement, svgElement.firstChild);
            }
            
            // 響應式設計
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.maxWidth = '100%';
          }
          
          setState(prev => ({ ...prev, isLoading: false, hasError: false }));
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true,
          errorMessage: error instanceof Error ? error.message : '流程圖渲染失敗'
        }));
      }
    };

    initializeMermaid();
  }, [code, theme, title]);

  // 全螢幕切換
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen?.();
      setState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  // 監聽全螢幕變化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState(prev => ({ 
        ...prev, 
        isFullscreen: !!document.fullscreenElement 
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 生成文字版本的流程圖
  const generateTextAlternative = (mermaidCode: string): string => {
    // 簡化的文字描述生成
    const lines = mermaidCode.split('\n').filter(line => line.trim());
    let textDescription = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('-->')) {
        const [from, to] = trimmed.split('-->').map(s => s.trim());
        const fromText = from.replace(/[A-Z]\[|\]/g, '').trim();
        const toText = to.replace(/[A-Z]\[|\]/g, '').trim();
        textDescription += `${fromText} → ${toText}\n`;
      }
    });
    
    return textDescription || '流程圖的文字描述暫時無法生成';
  };

  // 下載 SVG
  const downloadSVG = () => {
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${title || 'flowchart'}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  // 列印流程圖
  const printFlowchart = () => {
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (svgElement) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title || '醫療流程圖'}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: system-ui, sans-serif; 
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 20px; 
                  border-bottom: 1px solid #ccc; 
                  padding-bottom: 10px; 
                }
                svg { 
                  width: 100%; 
                  height: auto; 
                  max-width: 100%; 
                }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .header { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${title || '醫療流程圖'}</h1>
                <p>列印時間：${new Date().toLocaleString(locale === 'zh-TW' ? 'zh-TW' : locale === 'ja' ? 'ja-JP' : 'en-US')}</p>
              </div>
              ${svgElement.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div ref={containerRef} className={`flowchart-container ${className}`}>
      {/* 工具列 */}
      <div class="flex items-center justify-between mb-4 p-3 bg-medical-neutral-50 rounded-lg">
        <div class="flex items-center space-x-2">
          {title && (
            <h3 class="text-lg font-semibold text-medical-neutral-900">
              {title}
            </h3>
          )}
        </div>
        
        <div class="flex items-center space-x-2">
          {/* 文字版本切換 */}
          {showTextAlternative && (
            <button
              onClick={() => setState(prev => ({ ...prev, showTextVersion: !prev.showTextVersion }))}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-medical-neutral-700 bg-white border border-medical-neutral-300 rounded-md hover:bg-medical-neutral-50 focus:outline-none focus:ring-2 focus:ring-medical-primary-500 transition-colors"
              title={state.showTextVersion ? '顯示圖形版本' : '顯示文字版本'}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {state.showTextVersion ? '圖形' : '文字'}
            </button>
          )}
          
          {/* 下載按鈕 */}
          <button
            onClick={downloadSVG}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-medical-neutral-700 bg-white border border-medical-neutral-300 rounded-md hover:bg-medical-neutral-50 focus:outline-none focus:ring-2 focus:ring-medical-primary-500 transition-colors"
            title="下載 SVG"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下載
          </button>
          
          {/* 列印按鈕 */}
          <button
            onClick={printFlowchart}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-medical-neutral-700 bg-white border border-medical-neutral-300 rounded-md hover:bg-medical-neutral-50 focus:outline-none focus:ring-2 focus:ring-medical-primary-500 transition-colors"
            title="列印流程圖"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            列印
          </button>
          
          {/* 全螢幕按鈕 */}
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-medical-neutral-700 bg-white border border-medical-neutral-300 rounded-md hover:bg-medical-neutral-50 focus:outline-none focus:ring-2 focus:ring-medical-primary-500 transition-colors"
            title={state.isFullscreen ? '退出全螢幕' : '全螢幕顯示'}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {state.isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
            {state.isFullscreen ? '退出' : '全螢幕'}
          </button>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className={`relative ${state.isFullscreen ? 'h-screen p-4' : ''}`}>
        {state.isLoading && (
          <div className="flex items-center justify-center h-64 bg-medical-neutral-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-medical-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-medical-neutral-600">載入流程圖中...</p>
            </div>
          </div>
        )}

        {state.hasError && (
          <div className="bg-medical-error-50 border border-medical-error-200 rounded-lg p-6">
            <div className="flex">
              <svg className="h-5 w-5 text-medical-error-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-medical-error-800 mb-1">
                  流程圖載入失敗
                </h3>
                <p className="text-sm text-medical-error-700">
                  {state.errorMessage}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-medical-error-600 hover:text-medical-error-700 underline"
                >
                  重新載入頁面
                </button>
              </div>
            </div>
          </div>
        )}

        {!state.isLoading && !state.hasError && (
          <>
            {/* 圖形版本 */}
            {!state.showTextVersion && (
              <div 
                ref={mermaidRef}
                className="flowchart-svg bg-white rounded-lg border border-medical-neutral-200 p-4 overflow-auto"
                style={{ minHeight: '300px' }}
              />
            )}

            {/* 文字版本 */}
            {state.showTextVersion && showTextAlternative && (
              <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
                <h4 className="text-lg font-semibold text-medical-neutral-900 mb-4">
                  流程圖文字描述
                </h4>
                <pre className="whitespace-pre-wrap text-sm text-medical-neutral-700 font-mono bg-medical-neutral-50 p-4 rounded-lg overflow-auto">
                  {generateTextAlternative(code)}
                </pre>
                <div className="mt-4 p-3 bg-medical-primary-50 border border-medical-primary-200 rounded-lg">
                  <p className="text-sm text-medical-primary-700">
                    <strong>無障礙說明：</strong>
                    此文字版本提供給使用螢幕閱讀器的使用者，描述了流程圖中各個步驟之間的邏輯關係。
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 鍵盤快捷鍵說明 */}
      <div className="mt-4 text-xs text-medical-neutral-500">
        <details className="cursor-pointer">
          <summary className="hover:text-medical-neutral-700">鍵盤快捷鍵</summary>
          <div className="mt-2 p-3 bg-medical-neutral-50 rounded-lg">
            <ul className="space-y-1">
              <li><kbd className="px-1 py-0.5 bg-white border border-medical-neutral-300 rounded text-xs">F</kbd> - 切換全螢幕</li>
              <li><kbd className="px-1 py-0.5 bg-white border border-medical-neutral-300 rounded text-xs">T</kbd> - 切換文字版本</li>
              <li><kbd className="px-1 py-0.5 bg-white border border-medical-neutral-300 rounded text-xs">P</kbd> - 列印</li>
              <li><kbd className="px-1 py-0.5 bg-white border border-medical-neutral-300 rounded text-xs">D</kbd> - 下載</li>
              <li><kbd className="px-1 py-0.5 bg-white border border-medical-neutral-300 rounded text-xs">Esc</kbd> - 退出全螢幕</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}

// 鍵盤快捷鍵支援
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    // 只在流程圖容器聚焦時啟用快捷鍵
    const flowchartContainer = document.querySelector('.flowchart-container');
    if (!flowchartContainer?.contains(document.activeElement)) return;

    switch (e.key.toLowerCase()) {
      case 'f':
        e.preventDefault();
        flowchartContainer.querySelector('[title*="全螢幕"]')?.click();
        break;
      case 't':
        e.preventDefault();
        flowchartContainer.querySelector('[title*="文字"]')?.click();
        break;
      case 'p':
        e.preventDefault();
        flowchartContainer.querySelector('[title*="列印"]')?.click();
        break;
      case 'd':
        e.preventDefault();
        flowchartContainer.querySelector('[title*="下載"]')?.click();
        break;
    }
  });
}