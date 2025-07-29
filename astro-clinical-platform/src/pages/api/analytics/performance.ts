import type { APIRoute } from 'astro';

// Disable prerendering for this API route
export const prerender = false;

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent?: string;
  connectionType?: string;
}

interface PerformancePayload {
  metrics: PerformanceMetric[];
  timestamp: number;
  userAgent: string;
  url: string;
  referrer: string;
}

// 簡單的記憶體儲存 (生產環境應使用資料庫)
const performanceData: PerformancePayload[] = [];
const MAX_STORED_ENTRIES = 10000;

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload: PerformancePayload = await request.json();
    
    // 驗證資料
    if (!payload.metrics || !Array.isArray(payload.metrics)) {
      return new Response(JSON.stringify({ error: 'Invalid metrics data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 過濾和清理指標
    const cleanedMetrics = payload.metrics
      .filter(metric => 
        metric.name && 
        typeof metric.value === 'number' && 
        metric.timestamp &&
        metric.url
      )
      .map(metric => ({
        ...metric,
        value: Math.round(metric.value * 100) / 100, // 保留兩位小數
        timestamp: Math.floor(metric.timestamp)
      }));

    if (cleanedMetrics.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid metrics found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 儲存效能資料
    const cleanedPayload: PerformancePayload = {
      ...payload,
      metrics: cleanedMetrics,
      timestamp: Math.floor(payload.timestamp)
    };

    performanceData.push(cleanedPayload);

    // 限制儲存的資料量
    if (performanceData.length > MAX_STORED_ENTRIES) {
      performanceData.splice(0, performanceData.length - MAX_STORED_ENTRIES);
    }

    // 在開發環境中記錄效能資料
    if (import.meta.env.DEV) {
      console.log('Performance metrics received:', {
        metricsCount: cleanedMetrics.length,
        url: payload.url,
        timestamp: new Date(payload.timestamp).toISOString()
      });
    }

    // 分析和警報 (如果需要)
    analyzePerformanceMetrics(cleanedMetrics);

    return new Response(JSON.stringify({ 
      success: true, 
      received: cleanedMetrics.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing performance metrics:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const timeRange = searchParams.get('timeRange') || '1h';
    const metricName = searchParams.get('metric');
    const pageUrl = searchParams.get('url');

    // 計算時間範圍
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeLimit = now - (timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['1h']);

    // 過濾資料
    let filteredData = performanceData.filter(entry => entry.timestamp >= timeLimit);

    if (pageUrl) {
      filteredData = filteredData.filter(entry => entry.url.includes(pageUrl));
    }

    // 聚合指標
    const aggregatedMetrics = aggregateMetrics(filteredData, metricName);

    return new Response(JSON.stringify({
      timeRange,
      dataPoints: filteredData.length,
      metrics: aggregatedMetrics,
      summary: generateSummary(aggregatedMetrics)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// 分析效能指標並發送警報
function analyzePerformanceMetrics(metrics: PerformanceMetric[]) {
  const alerts: string[] = [];

  metrics.forEach(metric => {
    // Web Vitals 閾值檢查
    if (metric.name === 'LCP' && metric.value > 2500) {
      alerts.push(`LCP is poor: ${metric.value}ms on ${metric.url}`);
    }
    
    if (metric.name === 'FID' && metric.value > 100) {
      alerts.push(`FID is poor: ${metric.value}ms on ${metric.url}`);
    }
    
    if (metric.name === 'CLS' && metric.value > 0.1) {
      alerts.push(`CLS is poor: ${metric.value} on ${metric.url}`);
    }

    // 自定義指標閾值檢查
    if (metric.name === 'total-load-time' && metric.value > 5000) {
      alerts.push(`Slow page load: ${metric.value}ms on ${metric.url}`);
    }

    if (metric.name === 'calculator-response-time' && metric.value > 1000) {
      alerts.push(`Slow calculator response: ${metric.value}ms on ${metric.url}`);
    }
  });

  // 發送警報 (在實際應用中可能發送到 Slack、Email 等)
  if (alerts.length > 0 && import.meta.env.DEV) {
    console.warn('Performance alerts:', alerts);
  }
}

// 聚合指標資料
function aggregateMetrics(data: PerformancePayload[], metricName?: string | null) {
  const aggregated: Record<string, {
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  }> = {};

  // 收集所有指標
  const allMetrics: Record<string, number[]> = {};
  
  data.forEach(payload => {
    payload.metrics.forEach(metric => {
      if (!metricName || metric.name === metricName) {
        if (!allMetrics[metric.name]) {
          allMetrics[metric.name] = [];
        }
        allMetrics[metric.name].push(metric.value);
      }
    });
  });

  // 計算統計資料
  Object.entries(allMetrics).forEach(([name, values]) => {
    if (values.length === 0) return;

    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    aggregated[name] = {
      count: values.length,
      sum: sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: getPercentile(sorted, 50),
      p95: getPercentile(sorted, 95),
      p99: getPercentile(sorted, 99)
    };
  });

  return aggregated;
}

// 計算百分位數
function getPercentile(sortedArray: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

// 生成摘要報告
function generateSummary(metrics: Record<string, any>) {
  const summary: Record<string, any> = {
    webVitals: {},
    performance: {},
    issues: []
  };

  // Web Vitals 摘要
  ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].forEach(vital => {
    if (metrics[vital]) {
      const metric = metrics[vital];
      summary.webVitals[vital] = {
        avg: Math.round(metric.avg * 100) / 100,
        p95: Math.round(metric.p95 * 100) / 100,
        rating: getWebVitalRating(vital, metric.p95)
      };
    }
  });

  // 效能摘要
  if (metrics['total-load-time']) {
    summary.performance.loadTime = {
      avg: Math.round(metrics['total-load-time'].avg),
      p95: Math.round(metrics['total-load-time'].p95)
    };
  }

  if (metrics['calculator-response-time']) {
    summary.performance.calculatorResponse = {
      avg: Math.round(metrics['calculator-response-time'].avg),
      p95: Math.round(metrics['calculator-response-time'].p95)
    };
  }

  // 問題檢測
  Object.entries(summary.webVitals).forEach(([vital, data]: [string, any]) => {
    if (data.rating === 'poor') {
      summary.issues.push(`${vital} needs improvement: ${data.p95}${getVitalUnit(vital)}`);
    }
  });

  if (summary.performance.loadTime?.p95 > 5000) {
    summary.issues.push(`Slow page load times: ${summary.performance.loadTime.p95}ms`);
  }

  return summary;
}

// 獲取 Web Vital 評級
function getWebVitalRating(vital: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 }
  };

  const threshold = thresholds[vital as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// 獲取 Web Vital 單位
function getVitalUnit(vital: string): string {
  return vital === 'CLS' ? '' : 'ms';
}