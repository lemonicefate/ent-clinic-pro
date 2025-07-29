import type { APIRoute } from 'astro';

// Disable prerendering for this API route
export const prerender = false;

interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'javascript' | 'promise' | 'network' | 'calculator' | 'user-feedback';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface ErrorPayload {
  errors: ErrorReport[];
  sessionId: string;
  timestamp: number;
}

// 簡單的記憶體儲存 (生產環境應使用資料庫)
const errorReports: ErrorReport[] = [];
const MAX_STORED_ERRORS = 5000;

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload: ErrorPayload = await request.json();
    
    // 驗證資料
    if (!payload.errors || !Array.isArray(payload.errors)) {
      return new Response(JSON.stringify({ error: 'Invalid error data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 過濾和清理錯誤報告
    const cleanedErrors = payload.errors
      .filter(error => 
        error.id && 
        error.message && 
        error.type && 
        error.severity &&
        error.timestamp &&
        error.url &&
        error.sessionId
      )
      .map(error => ({
        ...error,
        timestamp: Math.floor(error.timestamp),
        message: error.message.substring(0, 1000), // 限制訊息長度
        stack: error.stack?.substring(0, 2000) // 限制堆疊長度
      }));

    if (cleanedErrors.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid errors found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 儲存錯誤報告
    errorReports.push(...cleanedErrors);

    // 限制儲存的錯誤數量
    if (errorReports.length > MAX_STORED_ERRORS) {
      errorReports.splice(0, errorReports.length - MAX_STORED_ERRORS);
    }

    // 分析和警報
    await analyzeErrors(cleanedErrors);

    // 在開發環境中記錄錯誤
    if (import.meta.env.DEV) {
      console.log('Error reports received:', {
        count: cleanedErrors.length,
        sessionId: payload.sessionId,
        criticalErrors: cleanedErrors.filter(e => e.severity === 'critical').length
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      received: cleanedErrors.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing error reports:', error);
    
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
    const timeRange = searchParams.get('timeRange') || '24h';
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const sessionId = searchParams.get('sessionId');

    // 計算時間範圍
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeLimit = now - (timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['24h']);

    // 過濾錯誤報告
    let filteredErrors = errorReports.filter(error => error.timestamp >= timeLimit);

    if (severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === severity);
    }

    if (type) {
      filteredErrors = filteredErrors.filter(error => error.type === type);
    }

    if (sessionId) {
      filteredErrors = filteredErrors.filter(error => error.sessionId === sessionId);
    }

    // 生成統計資料
    const stats = generateErrorStats(filteredErrors);

    // 分組錯誤
    const groupedErrors = groupSimilarErrors(filteredErrors);

    return new Response(JSON.stringify({
      timeRange,
      totalErrors: filteredErrors.length,
      stats,
      groupedErrors: groupedErrors.slice(0, 50), // 限制返回數量
      recentErrors: filteredErrors
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error retrieving error reports:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// 分析錯誤並發送警報
async function analyzeErrors(errors: ErrorReport[]) {
  const alerts: string[] = [];
  
  // 檢查關鍵錯誤
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  if (criticalErrors.length > 0) {
    alerts.push(`${criticalErrors.length} critical errors detected`);
  }

  // 檢查計算機錯誤
  const calculatorErrors = errors.filter(e => e.type === 'calculator');
  if (calculatorErrors.length > 0) {
    alerts.push(`${calculatorErrors.length} calculator errors detected`);
  }

  // 檢查錯誤率
  const errorRate = errors.length / (5 * 60); // 每分鐘錯誤數 (假設 5 分鐘窗口)
  if (errorRate > 1) {
    alerts.push(`High error rate: ${errorRate.toFixed(2)} errors/minute`);
  }

  // 檢查重複錯誤
  const errorGroups = groupSimilarErrors(errors);
  const frequentErrors = errorGroups.filter(group => group.count > 5);
  if (frequentErrors.length > 0) {
    alerts.push(`${frequentErrors.length} frequently occurring errors`);
  }

  // 發送警報 (在實際應用中可能發送到 Slack、Email 等)
  if (alerts.length > 0) {
    await sendAlerts(alerts, errors);
  }
}

// 發送警報
async function sendAlerts(alerts: string[], errors: ErrorReport[]) {
  if (import.meta.env.DEV) {
    console.warn('Error alerts:', alerts);
    console.warn('Error details:', errors.filter(e => e.severity === 'critical' || e.type === 'calculator'));
  }

  // 在生產環境中，這裡會發送到實際的警報系統
  // 例如：Slack webhook、Email、PagerDuty 等
}

// 生成錯誤統計
function generateErrorStats(errors: ErrorReport[]) {
  const stats = {
    total: errors.length,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    byType: {
      javascript: 0,
      promise: 0,
      network: 0,
      calculator: 0,
      'user-feedback': 0
    },
    byHour: {} as Record<string, number>,
    topErrors: [] as Array<{ message: string; count: number; severity: string }>,
    affectedUrls: {} as Record<string, number>,
    affectedSessions: new Set<string>()
  };

  errors.forEach(error => {
    // 按嚴重程度統計
    stats.bySeverity[error.severity]++;
    
    // 按類型統計
    stats.byType[error.type]++;
    
    // 按小時統計
    const hour = new Date(error.timestamp).toISOString().substring(0, 13);
    stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    
    // 受影響的 URL
    stats.affectedUrls[error.url] = (stats.affectedUrls[error.url] || 0) + 1;
    
    // 受影響的會話
    stats.affectedSessions.add(error.sessionId);
  });

  // 轉換受影響會話為數量
  const affectedSessionsCount = stats.affectedSessions.size;
  delete (stats as any).affectedSessions;
  (stats as any).affectedSessionsCount = affectedSessionsCount;

  // 生成熱門錯誤
  const errorCounts = new Map<string, { count: number; severity: string }>();
  errors.forEach(error => {
    const key = error.message.substring(0, 100); // 截取前 100 個字符作為鍵
    const existing = errorCounts.get(key);
    if (existing) {
      existing.count++;
      // 保留最高嚴重程度
      if (getSeverityWeight(error.severity) > getSeverityWeight(existing.severity)) {
        existing.severity = error.severity;
      }
    } else {
      errorCounts.set(key, { count: 1, severity: error.severity });
    }
  });

  stats.topErrors = Array.from(errorCounts.entries())
    .map(([message, data]) => ({ message, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return stats;
}

// 分組相似錯誤
function groupSimilarErrors(errors: ErrorReport[]) {
  const groups = new Map<string, {
    id: string;
    message: string;
    count: number;
    severity: string;
    type: string;
    firstSeen: number;
    lastSeen: number;
    affectedUrls: Set<string>;
    affectedSessions: Set<string>;
    examples: ErrorReport[];
  }>();

  errors.forEach(error => {
    // 使用錯誤訊息的前 100 個字符和類型作為分組鍵
    const groupKey = `${error.type}:${error.message.substring(0, 100)}`;
    
    const existing = groups.get(groupKey);
    if (existing) {
      existing.count++;
      existing.lastSeen = Math.max(existing.lastSeen, error.timestamp);
      existing.affectedUrls.add(error.url);
      existing.affectedSessions.add(error.sessionId);
      
      // 保留最高嚴重程度
      if (getSeverityWeight(error.severity) > getSeverityWeight(existing.severity)) {
        existing.severity = error.severity;
      }
      
      // 保留最多 3 個範例
      if (existing.examples.length < 3) {
        existing.examples.push(error);
      }
    } else {
      groups.set(groupKey, {
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: error.message,
        count: 1,
        severity: error.severity,
        type: error.type,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        affectedUrls: new Set([error.url]),
        affectedSessions: new Set([error.sessionId]),
        examples: [error]
      });
    }
  });

  // 轉換為陣列並排序
  return Array.from(groups.values())
    .map(group => ({
      ...group,
      affectedUrls: Array.from(group.affectedUrls),
      affectedSessions: Array.from(group.affectedSessions),
      affectedUrlsCount: group.affectedUrls.size,
      affectedSessionsCount: group.affectedSessions.size
    }))
    .sort((a, b) => {
      // 先按嚴重程度排序，再按數量排序
      const severityDiff = getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
      return severityDiff !== 0 ? severityDiff : b.count - a.count;
    });
}

// 獲取嚴重程度權重
function getSeverityWeight(severity: string): number {
  switch (severity) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}