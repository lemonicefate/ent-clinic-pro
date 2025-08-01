import mermaid from 'mermaid';

// 定義一個函數來執行渲染
const renderMermaid = () => {
  // 初始化 Mermaid 的設定
  mermaid.initialize({
    startOnLoad: false, // 我們將手動觸發渲染
    theme: 'default', // 您可以換成 'dark', 'neutral', 'forest' 等不同主題
    themeVariables: {
      // 自定義醫療主題色彩
      primaryColor: '#2563eb',
      primaryTextColor: '#1e293b',
      primaryBorderColor: '#1d4ed8',
      lineColor: '#64748b',
      sectionBkgColor: '#f8fafc',
      altSectionBkgColor: '#e2e8f0',
      gridColor: '#cbd5e1',
      secondaryColor: '#0ea5e9',
      tertiaryColor: '#22c55e'
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      bottomMarginAdj: 1,
      useMaxWidth: true,
      rightAngles: false,
      showSequenceNumbers: false
    },
    gantt: {
      titleTopMargin: 25,
      barHeight: 20,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 11,
      fontWeight: 'normal',
      gridLineStartPadding: 35,
      leftPadding: 75,
      topPadding: 50,
      rightPadding: 75,
      bottomPadding: 25
    }
  });

  try {
    // 找到所有 Astro 產生的 mermaid 程式碼區塊
    const mermaidCodeBlocks = document.querySelectorAll('pre code.language-mermaid');
    
    mermaidCodeBlocks.forEach((block, index) => {
      // 取得父層的 <pre> 元素
      const preElement = block.parentElement;
      
      // 將 class="mermaid" 加到父層元素上
      if (preElement) {
        preElement.classList.add('mermaid');
        preElement.classList.add('mermaid-diagram');
        
        // 為每個圖表添加唯一 ID
        const diagramId = `mermaid-diagram-${index}`;
        preElement.id = diagramId;
        
        // 將原始的程式碼直接放進去，這是 mermaid.run() 需要的格式
        const mermaidCode = block.textContent || '';
        preElement.innerHTML = mermaidCode;
        
        // 添加一些樣式類別以便後續美化
        preElement.style.textAlign = 'center';
        preElement.style.margin = '2rem 0';
        preElement.style.padding = '1rem';
        preElement.style.backgroundColor = '#f8fafc';
        preElement.style.borderRadius = '0.5rem';
        preElement.style.border = '1px solid #e2e8f0';
      }
    });

    // 呼叫 mermaid 來渲染所有我們剛剛標記好的元素
    mermaid.run();
    
    // 渲染完成後的後處理
    setTimeout(() => {
      const renderedDiagrams = document.querySelectorAll('.mermaid-diagram svg');
      renderedDiagrams.forEach(svg => {
        // 確保 SVG 響應式
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
        
        // 添加醫療主題樣式
        svg.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      });
    }, 100);
    
    console.log(`Successfully rendered ${mermaidCodeBlocks.length} Mermaid diagrams`);
    
  } catch (error) {
    console.error('Error rendering Mermaid diagrams:', error);
  }
};

// 使用 astro:page-load 事件，這對初次載入和後續的頁面轉換都有效
document.addEventListener('astro:page-load', renderMermaid);

// 也監聽 DOMContentLoaded 事件，確保在非 Astro 環境下也能工作
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderMermaid);
} else {
  // 如果 DOM 已經載入完成，直接執行
  renderMermaid();
}