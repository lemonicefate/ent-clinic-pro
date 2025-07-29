import type { APIRoute } from 'astro';

// Disable prerendering for this API route
export const prerender = false;

interface UserFeedback {
  id: string;
  timestamp: number;
  type: 'bug' | 'feature' | 'improvement' | 'complaint';
  rating: number; // 1-5
  message: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  screenshot?: string;
}

interface FeedbackPayload {
  feedback: UserFeedback[];
  sessionId: string;
  timestamp: number;
}

// 簡單的記憶體儲存 (生產環境應使用資料庫)
const userFeedback: UserFeedback[] = [];
const MAX_STORED_FEEDBACK = 2000;

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload: FeedbackPayload = await request.json();
    
    // 驗證資料
    if (!payload.feedback || !Array.isArray(payload.feedback)) {
      return new Response(JSON.stringify({ error: 'Invalid feedback data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 過濾和清理回饋
    const cleanedFeedback = payload.feedback
      .filter(feedback => 
        feedback.id && 
        feedback.message && 
        feedback.type && 
        feedback.rating >= 1 && feedback.rating <= 5 &&
        feedback.timestamp &&
        feedback.url &&
        feedback.sessionId
      )
      .map(feedback => ({
        ...feedback,
        timestamp: Math.floor(feedback.timestamp),
        message: feedback.message.substring(0, 2000), // 限制訊息長度
        rating: Math.max(1, Math.min(5, Math.floor(feedback.rating))) // 確保評分在 1-5 範圍內
      }));

    if (cleanedFeedback.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid feedback found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 儲存回饋
    userFeedback.push(...cleanedFeedback);

    // 限制儲存的回饋數量
    if (userFeedback.length > MAX_STORED_FEEDBACK) {
      userFeedback.splice(0, userFeedback.length - MAX_STORED_FEEDBACK);
    }

    // 分析回饋
    await analyzeFeedback(cleanedFeedback);

    // 在開發環境中記錄回饋
    if (import.meta.env.DEV) {
      console.log('User feedback received:', {
        count: cleanedFeedback.length,
        sessionId: payload.sessionId,
        types: cleanedFeedback.map(f => f.type),
        avgRating: cleanedFeedback.reduce((sum, f) => sum + f.rating, 0) / cleanedFeedback.length
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      received: cleanedFeedback.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing user feedback:', error);
    
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
    const timeRange = searchParams.get('timeRange') || '7d';
    const type = searchParams.get('type');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');

    // 計算時間範圍
    const now = Date.now();
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const timeLimit = now - (timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['7d']);

    // 過濾回饋
    let filteredFeedback = userFeedback.filter(feedback => feedback.timestamp >= timeLimit);

    if (type) {
      filteredFeedback = filteredFeedback.filter(feedback => feedback.type === type);
    }

    if (minRating) {
      filteredFeedback = filteredFeedback.filter(feedback => feedback.rating >= parseInt(minRating));
    }

    if (maxRating) {
      filteredFeedback = filteredFeedback.filter(feedback => feedback.rating <= parseInt(maxRating));
    }

    // 生成統計資料
    const stats = generateFeedbackStats(filteredFeedback);

    // 分析情感
    const sentimentAnalysis = analyzeSentiment(filteredFeedback);

    // 提取關鍵主題
    const themes = extractThemes(filteredFeedback);

    return new Response(JSON.stringify({
      timeRange,
      totalFeedback: filteredFeedback.length,
      stats,
      sentimentAnalysis,
      themes,
      recentFeedback: filteredFeedback
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20)
        .map(feedback => ({
          ...feedback,
          // 移除敏感資訊
          userAgent: undefined,
          sessionId: feedback.sessionId.substring(0, 8) + '...'
        }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error retrieving user feedback:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// 分析回饋
async function analyzeFeedback(feedback: UserFeedback[]) {
  const alerts: string[] = [];
  
  // 檢查低評分回饋
  const lowRatingFeedback = feedback.filter(f => f.rating <= 2);
  if (lowRatingFeedback.length > 0) {
    alerts.push(`${lowRatingFeedback.length} low-rating feedback received`);
  }

  // 檢查錯誤報告
  const bugReports = feedback.filter(f => f.type === 'bug');
  if (bugReports.length > 0) {
    alerts.push(`${bugReports.length} bug reports received`);
  }

  // 檢查投訴
  const complaints = feedback.filter(f => f.type === 'complaint');
  if (complaints.length > 0) {
    alerts.push(`${complaints.length} complaints received`);
  }

  // 發送警報
  if (alerts.length > 0) {
    await sendFeedbackAlerts(alerts, feedback);
  }
}

// 發送回饋警報
async function sendFeedbackAlerts(alerts: string[], feedback: UserFeedback[]) {
  if (import.meta.env.DEV) {
    console.warn('Feedback alerts:', alerts);
    console.warn('Critical feedback:', feedback.filter(f => f.rating <= 2 || f.type === 'bug' || f.type === 'complaint'));
  }

  // 在生產環境中，這裡會發送到實際的警報系統
}

// 生成回饋統計
function generateFeedbackStats(feedback: UserFeedback[]) {
  const stats = {
    total: feedback.length,
    averageRating: 0,
    byType: {
      bug: 0,
      feature: 0,
      improvement: 0,
      complaint: 0
    },
    byRating: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    },
    byDay: {} as Record<string, number>,
    topPages: {} as Record<string, number>,
    ratingTrend: [] as Array<{ date: string; rating: number; count: number }>
  };

  if (feedback.length === 0) return stats;

  let totalRating = 0;

  feedback.forEach(f => {
    // 計算平均評分
    totalRating += f.rating;
    
    // 按類型統計
    stats.byType[f.type]++;
    
    // 按評分統計
    stats.byRating[f.rating as keyof typeof stats.byRating]++;
    
    // 按日期統計
    const day = new Date(f.timestamp).toISOString().substring(0, 10);
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    
    // 熱門頁面
    const urlPath = new URL(f.url).pathname;
    stats.topPages[urlPath] = (stats.topPages[urlPath] || 0) + 1;
  });

  stats.averageRating = totalRating / feedback.length;

  // 生成評分趨勢
  const dailyRatings = new Map<string, { total: number; count: number }>();
  feedback.forEach(f => {
    const day = new Date(f.timestamp).toISOString().substring(0, 10);
    const existing = dailyRatings.get(day);
    if (existing) {
      existing.total += f.rating;
      existing.count++;
    } else {
      dailyRatings.set(day, { total: f.rating, count: 1 });
    }
  });

  stats.ratingTrend = Array.from(dailyRatings.entries())
    .map(([date, data]) => ({
      date,
      rating: data.total / data.count,
      count: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return stats;
}

// 分析情感
function analyzeSentiment(feedback: UserFeedback[]) {
  const sentiment = {
    positive: 0,
    neutral: 0,
    negative: 0,
    keywords: {
      positive: [] as Array<{ word: string; count: number }>,
      negative: [] as Array<{ word: string; count: number }>
    }
  };

  const positiveWords = ['好', '棒', '優秀', '滿意', '喜歡', '推薦', '完美', '方便', '快速', '準確', '有用', '清楚'];
  const negativeWords = ['差', '爛', '糟糕', '不滿', '討厭', '問題', '錯誤', '慢', '困難', '複雜', '不準', '無用'];

  const positiveWordCount = new Map<string, number>();
  const negativeWordCount = new Map<string, number>();

  feedback.forEach(f => {
    const message = f.message.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    // 計算正面詞彙
    positiveWords.forEach(word => {
      const count = (message.match(new RegExp(word, 'g')) || []).length;
      if (count > 0) {
        positiveScore += count;
        positiveWordCount.set(word, (positiveWordCount.get(word) || 0) + count);
      }
    });

    // 計算負面詞彙
    negativeWords.forEach(word => {
      const count = (message.match(new RegExp(word, 'g')) || []).length;
      if (count > 0) {
        negativeScore += count;
        negativeWordCount.set(word, (negativeWordCount.get(word) || 0) + count);
      }
    });

    // 結合評分判斷情感
    const ratingWeight = f.rating >= 4 ? 1 : f.rating <= 2 ? -1 : 0;
    const totalScore = positiveScore - negativeScore + ratingWeight;

    if (totalScore > 0) {
      sentiment.positive++;
    } else if (totalScore < 0) {
      sentiment.negative++;
    } else {
      sentiment.neutral++;
    }
  });

  // 轉換關鍵字統計
  sentiment.keywords.positive = Array.from(positiveWordCount.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  sentiment.keywords.negative = Array.from(negativeWordCount.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return sentiment;
}

// 提取主題
function extractThemes(feedback: UserFeedback[]) {
  const themes = new Map<string, number>();
  
  // 醫療相關主題關鍵字
  const medicalThemes = {
    '計算機': ['計算', '計算機', '工具', '計算器'],
    '介面': ['介面', '界面', '設計', '版面', '佈局'],
    '功能': ['功能', '特色', '選項', '設定'],
    '準確性': ['準確', '正確', '精確', '結果'],
    '速度': ['速度', '快', '慢', '載入', '反應'],
    '易用性': ['容易', '困難', '簡單', '複雜', '直觀'],
    '內容': ['內容', '資訊', '說明', '解釋', '文章'],
    '搜尋': ['搜尋', '查找', '尋找', '搜索'],
    '行動版': ['手機', '行動', '平板', '響應式'],
    '無障礙': ['無障礙', '輔助', '可及性', '視障', '聽障']
  };

  feedback.forEach(f => {
    const message = f.message.toLowerCase();
    
    Object.entries(medicalThemes).forEach(([theme, keywords]) => {
      const matches = keywords.filter(keyword => message.includes(keyword));
      if (matches.length > 0) {
        themes.set(theme, (themes.get(theme) || 0) + matches.length);
      }
    });
  });

  return Array.from(themes.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}